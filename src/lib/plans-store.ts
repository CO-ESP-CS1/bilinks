import { mockPlans, type MockPlanTarifaire, type StatutPlanTarifaire } from "@/lib/mock-data";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import { apiRequest } from "@/lib/api/client";
import { mapAdminPlanToMockPlan } from "@/lib/api/adapters";

const PLANS_KEY = "bibliotech_plans";

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

function isValidPlan(p: unknown): p is MockPlanTarifaire {
  if (!p || typeof p !== "object") return false;
  const row = p as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.code === "string" &&
    typeof row.nom === "string" &&
    typeof row.prix === "number" &&
    ("deletedAt" in row ? row.deletedAt === null || typeof row.deletedAt === "string" : true)
  );
}

/** Migre l'ancien format `{ plan: "MENSUEL" }` vers `{ code, nom }`. */
function normalizeStoredPlans(raw: unknown[]): MockPlanTarifaire[] {
  return raw
    .map((item) => {
      if (isValidPlan(item)) return item;
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const code =
        typeof row.code === "string"
          ? row.code
          : typeof row.plan === "string"
            ? row.plan
            : null;
      if (!code || typeof row.prix !== "number") return null;
      return {
        id: typeof row.id === "string" ? row.id : `pl-${code}`,
        code,
        nom:
          typeof row.nom === "string"
            ? row.nom
            : slugifyPlanCode(code).replace(/_/g, " ").toLowerCase(),
        prix: row.prix,
        dureeJours: typeof row.dureeJours === "number" ? row.dureeJours : 30,
        statut:
          row.statut === "INACTIF" ? ("INACTIF" as const) : ("ACTIF" as const),
        devise: "XAF" as const,
        deletedAt:
          typeof row.deletedAt === "string" ? row.deletedAt : null,
      };
    })
    .filter((p): p is MockPlanTarifaire => p != null);
}

export function ensurePlans(): MockPlanTarifaire[] {
  const stored = readPlans();
  let plans =
    stored.length > 0 ? normalizeStoredPlans(stored) : [];
  if (plans.length === 0) {
    plans = mockPlans.map((p) => ({ ...p }));
    writePlans(plans);
  } else if (plans.length !== stored.length) {
    writePlans(plans);
  }
  return plans;
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

export function createPlan(input: {
  nom: string;
  code?: string;
  prix: number;
  dureeJours: number;
  statut?: StatutPlanTarifaire;
}): MockPlanTarifaire {
  const plans = ensurePlans();
  const code = input.code?.trim() || slugifyPlanCode(input.nom);
  if (!code) {
    throw new Error("Code plan invalide.");
  }
  if (
    plans.some((p) => p.code === code && !isSoftDeleted(p.deletedAt))
  ) {
    throw new Error("Un plan avec ce code existe déjà.");
  }
  const plan: MockPlanTarifaire = {
    id: `pl-${Date.now()}`,
    code,
    nom: input.nom.trim(),
    prix: input.prix,
    dureeJours: input.dureeJours,
    statut: input.statut ?? "ACTIF",
    devise: "XAF",
    deletedAt: null,
  };
  writePlans([...plans, plan]);
  return plan;
}

export function updatePlan(
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
  writePlans(next);
  return updated;
}

export function deletePlan(id: string): boolean {
  const plans = ensurePlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const next = [...plans];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  writePlans(next);
  return true;
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

type AdminPlansResponse = Array<{
  id: string;
  plan: string;
  prix: number;
  devise: string;
  duree_jours: number;
  statut: "ACTIF" | "INACTIF";
}>;

export async function fetchPlansPersisted(): Promise<MockPlanTarifaire[]> {
  try {
    const rows = await apiRequest<AdminPlansResponse>("/admin/plans");
    if (!Array.isArray(rows)) return getAllPlans();
    const mapped = rows.map(mapAdminPlanToMockPlan);
    if (mapped.length > 0) {
      writePlans(mapped);
      return mapped;
    }
    return getAllPlans();
  } catch {
    return getAllPlans();
  }
}

export async function createPlanPersisted(input: {
  nom: string;
  code?: string;
  prix: number;
  dureeJours: number;
  statut?: StatutPlanTarifaire;
}): Promise<MockPlanTarifaire> {
  try {
    const planCode = input.code?.trim() || slugifyPlanCode(input.nom);
    await apiRequest("/admin/plans", {
      method: "POST",
      body: JSON.stringify({
        plan: planCode,
        prix: input.prix,
        devise: "XAF",
        duree_jours: input.dureeJours,
        statut: input.statut ?? "ACTIF",
      }),
    });
  } catch {
    // fallback local
  }
  return createPlan(input);
}

export async function updatePlanPersisted(
  id: string,
  patch: Partial<
    Pick<MockPlanTarifaire, "nom" | "prix" | "dureeJours" | "statut">
  >
): Promise<MockPlanTarifaire | null> {
  const localUpdated = updatePlan(id, patch);
  if (!localUpdated) return null;
  try {
    await apiRequest(`/admin/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        prix: patch.prix,
        duree_jours: patch.dureeJours,
        statut: patch.statut,
      }),
    });
  } catch {
    // fallback local
  }
  return localUpdated;
}
