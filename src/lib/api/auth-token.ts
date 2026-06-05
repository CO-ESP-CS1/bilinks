const TOKEN_STORAGE_KEY = "b_links_api_access_token";

/** JWT admin : localStorage (login API) puis variable d'environnement (dev). */
export function getApiBearerToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored?.trim()) return stored.trim();
    } catch {
      /* ignore */
    }
  }
  const env = process.env.NEXT_PUBLIC_ADMIN_BEARER_TOKEN?.trim();
  return env || null;
}

export function setApiBearerToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearApiBearerToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const API_SESSION_EXPIRED_EVENT = "b-links-api-session-expired";

/** JWT absent ou rejeté (401) — déconnecte la session API côté UI. */
export function notifyApiSessionExpired(): void {
  clearApiBearerToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(API_SESSION_EXPIRED_EVENT));
  }
}
