import { getApiBearerToken } from "@/lib/api/auth-token";
import { isApiConfigured } from "@/lib/api/client";

/** Mode démo hors API (pas de NEXT_PUBLIC_API_BASE_URL). */
export function useDemoDataOnly(): boolean {
  return !isApiConfigured();
}

/** JWT présent — requis pour les listes admin. */
export function isAdminListApiReady(): boolean {
  return isApiConfigured() && Boolean(getApiBearerToken());
}

/** Supprime les listes mock persistées en localStorage (mode API). */
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
  ];
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
