import { SUBSCRIBE_MOCK, mockDelay, mockTransactionId } from "@/lib/subscribe/config";
import type { PaymentProvider, SubscribePlanId } from "@/lib/subscribe/plans";
import { getApiBaseUrl, subscribeStorage } from "@/lib/subscribe/storage";

type LoginResponse = {
  access_token: string;
  user?: {
    id: string;
    email: string;
    personne?: { prenom?: string; nom?: string };
  };
};

export type SubscribeMeProfile = {
  id: string;
  email: string;
  statut?: string;
  numero_telephone?: string | null;
  personne?: {
    prenom?: string;
    nom?: string;
  };
  abonnement_actif?: {
    plan: string;
    date_fin: string;
    jours_restants: number;
  } | null;
};

export type ApiPlan = {
  id: string;
  plan: SubscribePlanId;
  prix: number;
  devise: string;
  duree_jours: number;
};

type PaymentInitResponse = {
  payment_url?: string;
  ref_transaction: string;
  paiement_id: string;
  message?: string;
  statut?: string;
};

type PaymentStatusResponse = {
  statut: "EN_ATTENTE" | "SUCCES" | "ECHEC";
  message: string;
  abonnement_actuel?: {
    id: string;
    plan: string;
    date_debut: string;
    date_fin: string;
    jours_restants: number;
  } | null;
};

type MeResponse = SubscribeMeProfile;

const PROVIDER_OPERATORS: Record<PaymentProvider, string> = {
  MTN: "MTN_MOMO_COG",
  AIRTEL: "AIRTEL_COG",
};

// ── Error helpers ──────────────────────────────────────────────────────────────

function extractApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const raw = p.message ?? p.error ?? p.detail;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const parts = raw.filter((s): s is string => typeof s === "string" && !!s.trim());
    if (parts.length) return parts.join(". ");
  }
  return null;
}

function mapHttpError(
  status: number,
  apiMsg: string | null,
  overrides?: Record<number, string>
): string {
  if (overrides?.[status]) return overrides[status];

  if (apiMsg) {
    const m = apiMsg.toLowerCase();
    if (/solde insuffisant|insufficient funds?/i.test(m))
      return "Solde insuffisant sur votre compte mobile.";
    if (/numéro invalide|invalid phone|invalid number|phone.*invalid/i.test(m))
      return "Numéro de téléphone invalide. Vérifiez le format.";
    if (/email.*not found|user.*not found|compte.*introuvable/i.test(m))
      return "Aucun compte trouvé avec cette adresse email.";
    if (/password|credentials|wrong.*pass|invalid.*pass/i.test(m))
      return "Email ou mot de passe incorrect.";
    if (/plan.*not found|plan.*introuvable/i.test(m))
      return "Formule d'abonnement introuvable.";
    if (/already.*subscri|abonnement.*actif/i.test(m))
      return "Vous avez déjà un abonnement actif sur ce compte.";
  }

  switch (status) {
    case 400: return "Informations incorrectes. Vérifiez vos données.";
    case 401: return "Session expirée ou accès refusé. Reconnectez-vous.";
    case 403: return "Votre compte n'est pas autorisé à effectuer cette action.";
    case 404: return "Ressource introuvable.";
    case 409: return "Vous avez déjà un abonnement actif sur ce compte.";
    case 422: return "Informations envoyées non valides.";
    case 429: return "Trop de tentatives. Attendez quelques minutes avant de réessayer.";
    case 500:
    case 502:
    case 503: return "Service temporairement indisponible. Réessayez dans quelques instants.";
    default:  return "Une erreur est survenue. Réessayez.";
  }
}

function mapEchecReason(message: string): string {
  const m = (message ?? "").toLowerCase();
  if (/solde|insuffisant|funds?|insufficient/i.test(m)) return "insufficient_funds";
  if (/timeout|délai|expiré|expired|time.?out/i.test(m)) return "timeout";
  if (/réseau|network|connexion|connection|offline/i.test(m)) return "network_error";
  return "payment_cancelled";
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
  errorOverrides?: Record<number, string>
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("Le serveur n'est pas configuré.");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const bearer = token ?? subscribeStorage.getToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez."
    );
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mapHttpError(res.status, extractApiMessage(payload), errorOverrides));
  }
  return payload as T;
}

// ── Mock helpers ───────────────────────────────────────────────────────────────

function mockSession(email: string, firstName?: string) {
  const session = {
    token: "mock-jwt-token",
    userId: "mock-user-id",
    firstName: firstName?.trim() || email.split("@")[0] || "Lecteur",
  };
  subscribeStorage.setSession(session);
  return session;
}

export function toCongoMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("242")) return digits;
  if (digits.startsWith("0")) return `242${digits.slice(1)}`;
  return `242${digits}`;
}

function mapPaymentStatus(statut: string): "pending" | "success" | "failed" {
  if (statut === "SUCCES") return "success";
  if (statut === "ECHEC") return "failed";
  return "pending";
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function requestOtp(email: string): Promise<{ message: string }> {
  if (SUBSCRIBE_MOCK) {
    await mockDelay();
    return { message: "Code envoyé." };
  }
  return apiFetch<{ message: string }>(
    "/auth/otp/request",
    { method: "POST", body: JSON.stringify({ email: email.trim() }) },
    null,
    {
      404: "Aucun compte trouvé avec cette adresse email.",
      429: "Trop de tentatives. Attendez quelques minutes avant de réessayer.",
    }
  );
}

export async function verifyOtp(email: string, code: string) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay();
    return mockSession(email);
  }
  const res = await apiFetch<LoginResponse>(
    "/auth/otp/verify",
    { method: "POST", body: JSON.stringify({ email: email.trim(), code: code.trim() }) },
    null,
    {
      400: "Code incorrect. Vérifiez le code reçu par email.",
      401: "Code expiré ou invalide. Demandez un nouveau code.",
      404: "Aucun compte trouvé avec cette adresse email.",
    }
  );
  if (!res.access_token) throw new Error("Code invalide. Réessayez.");
  const me = await apiFetch<MeResponse>("/me", { method: "GET" }, res.access_token);
  const firstName = me.personne?.prenom?.trim() || me.email.split("@")[0] || "Lecteur";
  subscribeStorage.setSession({ token: res.access_token, userId: me.id, firstName });
  return { token: res.access_token, userId: me.id, firstName };
}

export async function loginSubscribeUser(email: string, _password: string) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay();
    return mockSession(email);
  }

  const res = await apiFetch<LoginResponse>(
    "/auth/password/login",
    { method: "POST", body: JSON.stringify({ email: email.trim(), password: _password }) },
    null,
    {
      400: "Email ou mot de passe incorrect.",
      401: "Email ou mot de passe incorrect.",
      403: "Votre compte a été désactivé. Contactez le support BI LINKS.",
      404: "Aucun compte trouvé avec cette adresse email.",
      429: "Trop de tentatives de connexion. Attendez quelques minutes avant de réessayer.",
      500: "Le service de connexion est temporairement indisponible. Réessayez dans quelques instants.",
    }
  );

  if (!res.access_token) throw new Error("Connexion impossible. Réessayez.");

  const userId = res.user?.id ?? email;
  const firstName =
    res.user?.personne?.prenom?.trim() ||
    res.user?.email?.split("@")[0] ||
    email.split("@")[0] ||
    "Lecteur";

  subscribeStorage.setSession({ token: res.access_token, userId, firstName });
  return { token: res.access_token, userId, firstName };
}

export async function registerSubscribeUser(input: {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay();
    return mockSession(input.email, input.prenom);
  }

  await apiFetch(
    "/auth/register/password",
    {
      method: "POST",
      body: JSON.stringify({
        prenom: input.prenom.trim(),
        nom: input.nom.trim() || input.prenom.trim(),
        email: input.email.trim(),
        password: input.password,
      }),
    },
    null,
    {
      400: "Informations d'inscription invalides. Vérifiez tous les champs.",
      409: "Un compte existe déjà avec cette adresse email.",
    }
  );
  return loginSubscribeUser(input.email, input.password);
}

// ── Profile ────────────────────────────────────────────────────────────────────

export async function fetchSubscribeMe(_token?: string) {
  if (SUBSCRIBE_MOCK) {
    const prenom = subscribeStorage.getFirstName() ?? "Lecteur";
    return {
      id: subscribeStorage.getUserId() ?? "mock-user-id",
      email: "lecteur@bilinks.cg",
      statut: "ACTIF",
      personne: { prenom, nom: "Kabila" },
      abonnement_actif: {
        plan: "HEBDOMADAIRE",
        date_fin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        jours_restants: 3,
      },
    } satisfies MeResponse;
  }
  return apiFetch<MeResponse>(
    "/me",
    { method: "GET" },
    _token,
    {
      401: "Votre session a expiré. Retournez à l'étape de connexion.",
      403: "Votre compte a été désactivé. Contactez le support BI LINKS.",
    }
  );
}

// ── Plans ──────────────────────────────────────────────────────────────────────

export async function fetchSubscribePlans(): Promise<ApiPlan[]> {
  if (SUBSCRIBE_MOCK) return [];
  const res = await apiFetch<ApiPlan[] | { data: ApiPlan[] }>("/plans", { method: "GET" });
  const plans = Array.isArray(res) ? res : res.data;
  return plans.map((plan) => ({ ...plan, prix: Number(plan.prix) }));
}

// ── Payment ────────────────────────────────────────────────────────────────────

export async function initiatePayment(input: {
  planApiId: string;
  phone: string;
  provider: PaymentProvider;
}) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay(800);
    return { success: true, transactionId: mockTransactionId() };
  }

  const res = await apiFetch<PaymentInitResponse>(
    "/payments/init",
    {
      method: "POST",
      body: JSON.stringify({
        plan_id: input.planApiId,
        phonenumber: toCongoMsisdn(input.phone),
        operator: PROVIDER_OPERATORS[input.provider],
        country: "CG",
      }),
    },
    undefined,
    {
      400: "Numéro de téléphone invalide. Vérifiez le format (ex : 06XXXXXXXX).",
      401: "Votre session a expiré. Retournez à l'étape de connexion.",
      404: "Formule d'abonnement introuvable. Retournez choisir une formule.",
      409: "Vous avez déjà un abonnement actif sur ce compte.",
      422: "Numéro de téléphone incompatible avec l'opérateur choisi.",
      429: "Trop de tentatives de paiement. Attendez quelques minutes avant de réessayer.",
      500: "Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.",
      502: "Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.",
      503: "Le service de paiement est temporairement indisponible. Réessayez dans quelques instants.",
    }
  );

  return {
    success: true,
    transactionId: res.ref_transaction,
    paymentUrl: res.payment_url,
    message: res.message,
  };
}

export async function fetchPaymentStatus(transactionId: string) {
  if (SUBSCRIBE_MOCK) {
    return { status: "success" as const };
  }

  const res = await apiFetch<PaymentStatusResponse>(
    `/payments/status?transaction_id=${encodeURIComponent(transactionId)}`,
    { method: "GET" }
  );

  return {
    status: mapPaymentStatus(res.statut),
    message: res.message,
    reason: res.statut === "ECHEC" ? mapEchecReason(res.message ?? "") : undefined,
  };
}

export { SUBSCRIBE_MOCK };
