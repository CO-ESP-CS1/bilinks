import type { MockAbonnement } from "@/lib/mock-data";
import { mapAdminSubscriptionToMockAbonnement } from "@/lib/api/adapters";
import type {
  AdminSubscriptionListItemApi,
  AdminSubscriptionsListResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { validateSubscriptionCancelRaison } from "@/lib/admin/validators";
import type { PlanType, StatutAbonnement, TypeRenouvellement } from "@/types/admin";

const SUBS_KEY = "bibliotech_subscriptions";
const LIST_LIMIT = 100;

let apiCache: MockAbonnement[] | null = null;

export function resetSubscriptionsListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSubscriptions(): MockAbonnement[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockAbonnement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubscriptions(rows: MockAbonnement[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(SUBS_KEY, JSON.stringify(rows));
}

function setCache(rows: MockAbonnement[]): void {
  apiCache = rows;
}

function ensureSubscriptions(): MockAbonnement[] {
  return apiCache ?? [];
}

export function getAllSubscriptions(): MockAbonnement[] {
  return apiCache ?? [];
}

export async function fetchSubscriptionsPersisted(options?: {
  statut?: StatutAbonnement;
  plan?: PlanType;
  type_renouvellement?: TypeRenouvellement;
  page?: number;
}): Promise<MockAbonnement[]> {
  if (!isApiConfigured()) {
    return [];
  }
  if (!isAdminListApiReady()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set("limit", String(LIST_LIMIT));
    if (options?.statut) params.set("statut", options.statut);
    if (options?.plan) params.set("plan", options.plan);
    if (options?.type_renouvellement) {
      params.set("type_renouvellement", options.type_renouvellement);
    }

    const payload = await apiRequest<AdminSubscriptionsListResponse>(
      `${ADMIN_ROUTES.subscriptions.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminSubscriptionListItemApi>(payload);
    const mapped = rows.map(mapAdminSubscriptionToMockAbonnement);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function cancelSubscriptionPersisted(
  id: string,
  raison: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = raison.trim();
  if (!reason) {
    return { ok: false, error: "La raison d’annulation est obligatoire." };
  }
  if (isApiConfigured() && reason.length < 3) {
    return {
      ok: false,
      error: "La raison doit contenir au moins 3 caractères.",
    };
  }

  if (isApiConfigured()) {
    try {
      await apiRequest(ADMIN_ROUTES.subscriptions.cancel(id), {
        method: "PATCH",
        body: JSON.stringify({ raison: reason }),
      });
      const next = getAllSubscriptions().map((a) =>
        a.id === id ? { ...a, statut: "ANNULE" as const } : a
      );
      setCache(next);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Annulation impossible."),
      };
    }
  }

  const rows = ensureSubscriptions();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, error: "Abonnement introuvable." };
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "ANNULE" };
  setCache(next);
  return { ok: true };
}

export async function suspendSubscriptionPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    try {
      await apiRequest(ADMIN_ROUTES.subscriptions.suspend(id), {
        method: "PATCH",
      });
      const next = getAllSubscriptions().map((a) =>
        a.id === id ? { ...a, statut: "SUSPENDU" as const } : a
      );
      setCache(next);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Suspension impossible."),
      };
    }
  }

  const rows = ensureSubscriptions();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, error: "Abonnement introuvable." };
  if (rows[idx]!.statut !== "ACTIF") {
    return {
      ok: false,
      error: "Seul un abonnement actif peut être suspendu.",
    };
  }
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "SUSPENDU" };
  setCache(next);
  writeSubscriptions(next);
  return { ok: true };
}

export async function activateSubscriptionPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    try {
      await apiRequest(ADMIN_ROUTES.subscriptions.activate(id), {
        method: "PATCH",
      });
      const next = getAllSubscriptions().map((a) =>
        a.id === id ? { ...a, statut: "ACTIF" as const } : a
      );
      setCache(next);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Réactivation impossible."),
      };
    }
  }

  const rows = ensureSubscriptions();
  const idx = rows.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, error: "Abonnement introuvable." };
  const row = rows[idx]!;
  if (row.statut === "ANNULE") {
    return {
      ok: false,
      error: "Un abonnement annulé ne peut pas être réactivé.",
    };
  }
  if (row.statut === "ACTIF") {
    return { ok: false, error: "Cet abonnement est déjà actif." };
  }
  const next = [...rows];
  next[idx] = { ...row, statut: "ACTIF" };
  setCache(next);
  writeSubscriptions(next);
  return { ok: true };
}
