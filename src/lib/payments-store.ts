import type { MockPaiement } from "@/lib/mock-data";
import { mapAdminPaymentToMock } from "@/lib/api/adapters";
import type {
  AdminPaymentListItemApi,
  AdminPaymentsListResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { PlanType, StatutPaiement } from "@/types/admin";

const PAYMENTS_KEY = "bibliotech_payments";
const LIST_LIMIT = 100;

let apiCache: MockPaiement[] | null = null;

export function resetPaymentsListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readPayments(): MockPaiement[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockPaiement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePayments(rows: MockPaiement[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(rows));
}

function setCache(rows: MockPaiement[]): void {
  apiCache = rows;
}

function ensurePayments(): MockPaiement[] {
  return apiCache ?? [];
}

export function getAllPayments(): MockPaiement[] {
  return apiCache ?? [];
}

export async function fetchPaymentsPersisted(options?: {
  statut?: StatutPaiement;
  operateur?: string;
  page?: number;
}): Promise<MockPaiement[]> {
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
    if (options?.operateur) params.set("operateur", options.operateur);

    const payload = await apiRequest<AdminPaymentsListResponse>(
      `${ADMIN_ROUTES.payments.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminPaymentListItemApi>(payload);
    const mapped = rows.map(mapAdminPaymentToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export function getPaymentById(id: string): MockPaiement | null {
  return getAllPayments().find((p) => p.id === id) ?? null;
}
