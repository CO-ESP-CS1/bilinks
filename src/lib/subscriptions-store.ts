import { mockAbonnements, type MockAbonnement } from "@/lib/mock-data";
import { mapAdminSubscriptionToMockAbonnement } from "@/lib/api/adapters";
import type {
  AdminSubscriptionListItemApi,
  AdminSubscriptionsListResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { validateSubscriptionCancelRaison } from "@/lib/admin/validators";
import type { PlanType, StatutAbonnement } from "@/types/admin";

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
  writeSubscriptions(rows);
}

function ensureSubscriptions(): MockAbonnement[] {
  if (apiCache !== null) return apiCache;
  let rows = readSubscriptions();
  if (rows.length === 0) {
    rows = mockAbonnements.map((a) => ({
      ...a,
      deletedAt: a.deletedAt ?? null,
    }));
    writeSubscriptions(rows);
  }
  return rows;
}

export function getAllSubscriptions(): MockAbonnement[] {
  if (apiCache !== null) return apiCache;
  return ensureSubscriptions();
}

export async function fetchSubscriptionsPersisted(options?: {
  statut?: StatutAbonnement;
  plan?: PlanType;
  page?: number;
}): Promise<MockAbonnement[]> {
  if (!isApiConfigured()) {
    return ensureSubscriptions();
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
