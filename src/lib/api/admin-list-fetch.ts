import { getApiBearerToken } from "@/lib/api/auth-token";
import { isApiConfigured } from "@/lib/api/client";

export const API_REQUIRED_MESSAGE =
  "Le serveur API n'est pas configuré (NEXT_PUBLIC_API_URL).";

export const SESSION_REQUIRED_MESSAGE =
  "Session expirée ou absente. Reconnectez-vous via /signin.";

/** Toujours false — l'admin utilise exclusivement le backend. */
export function isDemoDataOnly(): boolean {
  return false;
}

/** JWT présent — requis pour les listes admin. */
export function isAdminListApiReady(): boolean {
  return isApiConfigured() && Boolean(getApiBearerToken());
}

export function requireApiConfigured():
  | { ok: true }
  | { ok: false; error: string } {
  if (!isApiConfigured()) {
    return { ok: false, error: API_REQUIRED_MESSAGE };
  }
  return { ok: true };
}

export function requireAdminSession():
  | { ok: true }
  | { ok: false; error: string } {
  const api = requireApiConfigured();
  if (!api.ok) return api;
  if (!isAdminListApiReady()) {
    return { ok: false, error: SESSION_REQUIRED_MESSAGE };
  }
  return { ok: true };
}

/** Supprime les anciennes listes démo en localStorage. */
export function clearDemoPersistedLists(): void {
  if (typeof window === "undefined") return;

  const keys = [
    "bibliotech_livres",
    "bibliotech_auteurs",
    "bibliotech_users",
    "bibliotech_categories",
    "bibliotech_libraries",
    "bibliotech_comments",
    "bibliotech_payments",
    "bibliotech_subscriptions",
    "bibliotech_plans",
    "bibliotech_challenges",
    "bibliotech_badges",
    "bibliotech_admins",
  ];
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
