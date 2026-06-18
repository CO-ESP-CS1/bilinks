import type { MockPlanTarifaire, StatutPlanTarifaire } from "@/lib/mock-data";
import { mapAdminPlanToMockPlan } from "@/lib/api/adapters";
import type {
  AdminPlanApi,
  AdminPlanCreateResponse,
  AdminPlanUpdateResponse,
  AdminPlansListResponse,
} from "@/lib/api/admin-types";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError, SESSION_REQUIRED_MESSAGE } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { buildPlanCreateBody, buildPlanUpdateBody } from "@/lib/admin/validators";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import type { PlanType } from "@/types/admin";

const PLANS_KEY = "bibliotech_plans";

let apiCache: MockPlanTarifaire[] | null = null;

const VALID_PLAN_CODES: PlanType[] = ["HEBDOMADAIRE", "MENSUEL", "ANNUEL"];

export function resetPlansListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readPlans(): MockPlanTarifaire[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockPlanTarifaire[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePlans(plans: MockPlanTarifaire[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function setCache(plans: MockPlanTarifaire[]): void {
  apiCache = plans;
}

export function ensurePlans(): MockPlanTarifaire[] {
  return apiCache ?? [];
}

export function getAllPlans(includeDeleted = false): MockPlanTarifaire[] {
  const plans = ensurePlans();
  return includeDeleted
    ? plans
    : plans.filter((p) => !isSoftDeleted(p.deletedAt));
}

export function getPlanByCode(code: string): MockPlanTarifaire | null {
  return getAllPlans().find((p) => p.code === code) ?? null;
}

export function slugifyPlanCode(nom: string): string {
  return nom
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolvePlanCode(code?: string, nom?: string): PlanType | null {
  const raw = (code?.trim() || slugifyPlanCode(nom ?? "")).toUpperCase();
  if (VALID_PLAN_CODES.includes(raw as PlanType)) {
    return raw as PlanType;
  }
  return null;
}

export function getPlanLabel(code: string): string {
  const plan = getPlanByCode(code);
  if (plan) return plan.nom;
  const fallback: Record<string, string> = {
    HEBDOMADAIRE: "Hebdomadaire",
    MENSUEL: "Mensuel",
    ANNUEL: "Annuel",
  };
  return fallback[code] ?? code;
}

/**
 * Liste admin — GET /admin/plans.
 * Tous statuts (ACTIF, INACTIF). Champs : id, plan, prix, devise, duree_jours, statut.
 */
export async function fetchPlansPersisted(): Promise<MockPlanTarifaire[]> {
  if (!isApiConfigured()) {
    return getAllPlans();
  }
  if (!isAdminListApiReady()) {
    return [];
  }

  try {
    const payload = await apiRequest<AdminPlansListResponse>(
      ADMIN_ROUTES.plans.list
    );
    const rows = unwrapListData<AdminPlanApi>(payload);
    const mapped = rows.map(mapAdminPlanToMockPlan);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function createPlanPersisted(input: {
  nom: string;
  code?: string;
  prix: number;
  dureeJours: number;
  statut?: StatutPlanTarifaire;
}): Promise<
  { ok: true; plan: MockPlanTarifaire } | { ok: false; error: string }
> {
  const planCode = resolvePlanCode(input.code, input.nom);
  if (!planCode) {
    return {
      ok: false,
      error: "Code plan invalide (HEBDOMADAIRE, MENSUEL ou ANNUEL).",
    };
  }
  if (input.prix < 100) {
    return { ok: false, error: "Le prix minimum est de 100 XOF." };
  }

  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return { ok: false, error: SESSION_REQUIRED_MESSAGE };
    }

    try {
      const created = await apiRequest<AdminPlanCreateResponse>(
        ADMIN_ROUTES.plans.create,
        {
          method: "POST",
          body: JSON.stringify(
            buildPlanCreateBody({
              plan: planCode,
              prix: input.prix,
              duree_jours: input.dureeJours,
            })
          ),
        }
      );

      await fetchPlansPersisted();
      const plan =
        getAllPlans().find((p) => p.id === created.id) ??
        mapAdminPlanToMockPlan({
          id: created.id,
          plan: created.plan,
          prix: created.prix,
          devise: created.devise,
          duree_jours: created.duree_jours,
          statut: created.statut ?? "ACTIF",
        });

      return { ok: true, plan };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Création plan impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

/**
 * Mise à jour admin — PATCH /admin/plans/{id}.
 * Corps partiel : prix, duree_jours, statut (non rétroactif sur abonnements en cours).
 */
export async function updatePlanPersisted(
  id: string,
  patch: Partial<
    Pick<MockPlanTarifaire, "nom" | "prix" | "dureeJours" | "statut">
  >
): Promise<
  { ok: true; plan: MockPlanTarifaire } | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return { ok: false, error: SESSION_REQUIRED_MESSAGE };
    }
    if (patch.prix !== undefined && patch.prix < 100) {
      return { ok: false, error: "Le prix minimum est de 100 XOF." };
    }

    const body = buildPlanUpdateBody({
      prix: patch.prix,
      duree_jours: patch.dureeJours,
      statut: patch.statut,
    });
    if (Object.keys(body).length === 0) {
      return { ok: false, error: "Aucune modification à enregistrer." };
    }

    try {
      await apiRequest<AdminPlanUpdateResponse>(ADMIN_ROUTES.plans.byId(id), {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      await fetchPlansPersisted();
      const plan = getAllPlans().find((p) => p.id === id);
      if (!plan) return { ok: false, error: "Plan introuvable." };
      return { ok: true, plan };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Mise à jour plan impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function deletePlanPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    const result = await updatePlanPersisted(id, { statut: "INACTIF" });
    if (!result.ok) return result;
    return { ok: true };
  }
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

/** @deprecated Utiliser deletePlanPersisted */
export function deletePlan(id: string): boolean {
  return false;
}

function createPlanLocal(input: {
  nom: string;
  code?: string;
  prix: number;
  dureeJours: number;
  statut?: StatutPlanTarifaire;
}): MockPlanTarifaire {
  const plans = ensurePlans();
  const code = resolvePlanCode(input.code, input.nom) ?? "MENSUEL";
  if (plans.some((p) => p.code === code && !isSoftDeleted(p.deletedAt))) {
    throw new Error("Un plan avec ce code existe déjà.");
  }
  const plan: MockPlanTarifaire = {
    id: `pl-${Date.now()}`,
    code,
    nom: input.nom.trim(),
    prix: input.prix,
    dureeJours: input.dureeJours,
    statut: input.statut ?? "ACTIF",
    devise: "XOF",
    deletedAt: null,
  };
  setCache([...plans, plan]);
  return plan;
}

function updatePlanLocal(
  id: string,
  patch: Partial<
    Pick<MockPlanTarifaire, "nom" | "prix" | "dureeJours" | "statut">
  >
): MockPlanTarifaire | null {
  const plans = ensurePlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const updated = { ...plans[idx]!, ...patch };
  const next = [...plans];
  next[idx] = updated;
  setCache(next);
  return updated;
}

function deletePlanLocal(id: string): boolean {
  const plans = ensurePlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const next = [...plans];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  setCache(next);
  return true;
}
