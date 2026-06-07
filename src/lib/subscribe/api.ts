import { formatUserFacingError } from "@/lib/api/errors";
import { SUBSCRIBE_MOCK, mockDelay, mockTransactionId } from "@/lib/subscribe/config";
import { getApiBaseUrl, subscribeStorage } from "@/lib/subscribe/storage";

type LoginResponse = {
  access_token: string;
  user?: {
    id: string;
    email: string;
    personne?: { prenom?: string; nom?: string };
  };
};

type MeResponse = {
  id: string;
  email: string;
  personne?: { prenom?: string; nom?: string };
};

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("Le serveur n'est pas configuré.");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const bearer = token ?? subscribeStorage.getToken();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);

  const res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      formatUserFacingError(
        { status: res.status, payload },
        "Une erreur est survenue."
      )
    );
  }
  return payload as T;
}

function mockSession(email: string, firstName?: string) {
  const session = {
    token: "mock-jwt-token",
    userId: "mock-user-id",
    firstName: firstName?.trim() || email.split("@")[0] || "Lecteur",
  };
  subscribeStorage.setSession(session);
  return session;
}

export async function loginSubscribeUser(email: string, _password: string) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay();
    return mockSession(email);
  }

  const res = await apiFetch<LoginResponse>("/auth/password/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password: _password }),
  });
  if (!res.access_token) throw new Error("Connexion impossible.");
  const userId = res.user?.id;
  if (!userId) throw new Error("Profil utilisateur indisponible.");
  const firstName =
    res.user?.personne?.prenom?.trim() ||
    res.user?.email.split("@")[0] ||
    "Lecteur";
  subscribeStorage.setSession({
    token: res.access_token,
    userId,
    firstName,
  });
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

  await apiFetch("/auth/register/password", {
    method: "POST",
    body: JSON.stringify({
      prenom: input.prenom.trim(),
      nom: input.nom.trim() || input.prenom.trim(),
      email: input.email.trim(),
      password: input.password,
    }),
  });
  return loginSubscribeUser(input.email, input.password);
}

export async function fetchSubscribeMe(_token?: string) {
  if (SUBSCRIBE_MOCK) {
    return {
      id: subscribeStorage.getUserId() ?? "mock-user-id",
      email: "test@bilinks.cg",
      personne: { prenom: subscribeStorage.getFirstName() ?? "Lecteur" },
    } satisfies MeResponse;
  }
  return apiFetch<MeResponse>("/me", { method: "GET" }, _token);
}

export async function initiatePayment(_input: {
  userId: string;
  planId: string;
  phone: string;
  provider: string;
}) {
  if (SUBSCRIBE_MOCK) {
    await mockDelay(800);
    return { success: true, transactionId: mockTransactionId() };
  }

  const res = await fetch("/api/payments/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Paiement impossible.");
  return data as { success: boolean; transactionId: string };
}

export async function fetchPaymentStatus(_transactionId: string) {
  if (SUBSCRIBE_MOCK) {
    return { status: "success" as const };
  }

  const res = await fetch(`/api/payments/status/${_transactionId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Statut indisponible.");
  return data as { status: "pending" | "success" | "failed"; reason?: string };
}

export { SUBSCRIBE_MOCK };
