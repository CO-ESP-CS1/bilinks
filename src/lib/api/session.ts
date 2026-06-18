import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { AUTH_ROUTES } from "@/lib/api/routes";
import { clearDemoPersistedLists } from "@/lib/api/admin-list-fetch";
import {
  clearApiBearerToken,
  getApiBearerToken,
  setApiBearerToken,
} from "@/lib/api/auth-token";
import {
  establishLocalSessionFromApiUser,
  type AdminAccount,
} from "@/lib/auth/admin-auth";
import { resetAuteursListCache } from "@/lib/auteurs-store";
import { resetBadgesListCache } from "@/lib/badges-store";
import { resetChallengesListCache } from "@/lib/challenges-store";
import { resetCategoriesListCache } from "@/lib/categories-store";
import { resetLibrariesListCache } from "@/lib/libraries-store";
import { resetLivresListCache } from "@/lib/livres-store";
import { resetCommentsListCache } from "@/lib/comments-store";
import { resetPaymentsListCache } from "@/lib/payments-store";
import { resetPlansListCache } from "@/lib/plans-store";
import { resetSubscriptionsListCache } from "@/lib/subscriptions-store";
import { resetUsersListCache } from "@/lib/users-store";

type PasswordLoginResponse = {
  access_token: string;
  user?: {
    id: string;
    email: string;
    role: string;
    statut: string;
    personne?: { nom: string; prenom: string };
  };
};

function applyApiSessionSideEffects(): void {
  clearDemoPersistedLists();
  resetLivresListCache();
  resetLibrariesListCache();
  resetAuteursListCache();
  resetBadgesListCache();
  resetChallengesListCache();
  resetUsersListCache();
  resetCategoriesListCache();
  resetPlansListCache();
  resetSubscriptionsListCache();
  resetPaymentsListCache();
  resetCommentsListCache();
}

/** Connexion admin via POST /auth/password/login (mode API). */
export async function loginAdminViaApi(
  email: string,
  password: string
): Promise<{ ok: true; admin: AdminAccount } | { ok: false; error: string }> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }

  try {
    const res = await apiRequest<PasswordLoginResponse>(AUTH_ROUTES.login, {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!res.access_token?.trim()) {
      return { ok: false, error: "Réponse API sans access_token." };
    }

    const user = res.user;
    if (!user) {
      return { ok: false, error: "Réponse API sans profil utilisateur." };
    }

    if (user.role !== "ADMIN") {
      return {
        ok: false,
        error: "Ce compte n’a pas le rôle ADMIN.",
      };
    }

    if (user.statut !== "ACTIF") {
      return {
        ok: false,
        error:
          user.statut === "PENDING"
            ? "Compte en attente : validez l’e-mail (OTP) ou activez le compte en base."
            : "Compte non actif ou suspendu.",
      };
    }

    setApiBearerToken(res.access_token.trim());
    applyApiSessionSideEffects();

    const admin = establishLocalSessionFromApiUser({
      id: user.id,
      email: user.email,
      nom: user.personne?.nom ?? "Admin",
      prenom: user.personne?.prenom ?? "",
    });

    return { ok: true, admin };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "E-mail ou mot de passe incorrect."),
    };
  }
}

/** @deprecated Préférer loginAdminViaApi */
export async function syncApiTokenAfterLogin(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await loginAdminViaApi(email, password);
  if (!result.ok) return result;
  return { ok: true };
}

export { API_SESSION_EXPIRED_EVENT } from "@/lib/api/auth-token";

export function hasApiSession(): boolean {
  return isApiConfigured() && Boolean(getApiBearerToken());
}

export function logoutApiSession(): void {
  clearApiBearerToken();
}

export async function changePasswordViaApi(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }
  if (!getApiBearerToken()) {
    return { ok: false, error: "Connectez-vous pour modifier votre mot de passe." };
  }

  try {
    await apiRequest<{ message: string }>(AUTH_ROUTES.changePassword, {
      method: "POST",
      body: JSON.stringify({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible de modifier le mot de passe."),
    };
  }
}
