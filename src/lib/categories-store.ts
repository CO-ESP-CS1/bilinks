import { mockCategories, type MockCategorie } from "@/lib/mock-data";
import { mapAdminCategorieToMock } from "@/lib/api/adapters";
import { isAdminListApiReady, useDemoDataOnly } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import type {
  AdminCategoriesListResponse,
  AdminCategorieApi,
  AdminCategorieCreateResponse,
  AdminCategorieDeleteResponse,
  AdminCategorieUpdateResponse,
} from "@/lib/api/admin-types";
import { ApiError } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const CATEGORIES_KEY = "bibliotech_categories";
const LIST_LIMIT = 100;
const CATEGORIE_NOM_MAX_LENGTH = 100;

let apiCache: MockCategorie[] | null = null;

export function resetCategoriesListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readCategories(): MockCategorie[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockCategorie[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCategories(categories: MockCategorie[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function normalize(c: MockCategorie): MockCategorie {
  return {
    ...c,
    deletedAt: c.deletedAt ?? null,
  };
}

function setCache(categories: MockCategorie[]): void {
  apiCache = categories;
  writeCategories(categories);
}

export function ensureCategories(): MockCategorie[] {
  if (!useDemoDataOnly()) {
    return apiCache ?? readCategories().map(normalize);
  }
  if (apiCache?.length) return apiCache;
  let categories = readCategories().map(normalize);
  if (categories.length === 0) {
    categories = mockCategories.map((c) => ({ ...c, deletedAt: c.deletedAt ?? null }));
    writeCategories(categories);
  }
  return categories;
}

export function getAllCategories(includeDeleted = false): MockCategorie[] {
  const list = useDemoDataOnly()
    ? (apiCache ?? ensureCategories())
    : (apiCache ?? readCategories().map(normalize));
  return includeDeleted ? list : list.filter((c) => !isSoftDeleted(c.deletedAt));
}

export function getCategoryById(id: string): MockCategorie | null {
  return getAllCategories(true).find((c) => c.id === id) ?? null;
}

export function nomNormaliseCategorie(s: string): string {
  return s.trim().toLowerCase();
}

export function isCategoryNameTaken(
  nom: string,
  excludeId?: string
): boolean {
  const n = nomNormaliseCategorie(nom);
  return getAllCategories().some(
    (c) =>
      c.id !== excludeId &&
      !isSoftDeleted(c.deletedAt) &&
      nomNormaliseCategorie(c.nom) === n
  );
}

/**
 * Charge les catégories depuis l’API admin (Partie 1) ou fallback local.
 */
export async function fetchCategoriesPersisted(options?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<MockCategorie[]> {
  if (!isApiConfigured()) {
    return ensureCategories();
  }
  if (!isAdminListApiReady()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set("limit", String(LIST_LIMIT));
    if (options?.q?.trim()) params.set("q", options.q.trim());

    const payload = await apiRequest<AdminCategoriesListResponse>(
      `${ADMIN_ROUTES.categories.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminCategorieApi>(payload);
    const mapped = rows.map(mapAdminCategorieToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function createCategoryPersisted(input: {
  nom: string;
  description: string;
}): Promise<
  { ok: true; categorie: MockCategorie } | { ok: false; error: string }
> {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  if (nom.length > CATEGORIE_NOM_MAX_LENGTH) {
    return {
      ok: false,
      error: `Le nom ne peut pas dépasser ${CATEGORIE_NOM_MAX_LENGTH} caractères.`,
    };
  }

  if (isApiConfigured()) {
    try {
      const body: { nom: string; description?: string } = { nom };
      const description = input.description.trim();
      if (description) body.description = description;

      const created = await apiRequest<AdminCategorieCreateResponse>(
        ADMIN_ROUTES.categories.create,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      await fetchCategoriesPersisted();
      const categorie = getCategoryById(created.id);
      if (!categorie) {
        return {
          ok: true,
          categorie: {
            id: created.id,
            nom: created.nom,
            description: input.description.trim(),
            nbLivres: 0,
            deletedAt: null,
          },
        };
      }
      return { ok: true, categorie };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return {
          ok: false,
          error: messageFromApiError(err, "Nom déjà utilisé."),
        };
      }
      return { ok: false, error: messageFromApiError(err, "Création impossible.") };
    }
  }

  if (isCategoryNameTaken(nom)) {
    return { ok: false, error: "Ce nom est déjà utilisé." };
  }
  return createCategoryLocal(input);
}

export async function updateCategoryPersisted(
  id: string,
  patch: Pick<MockCategorie, "nom" | "description">
): Promise<
  | { ok: true; categorie: MockCategorie; updatedAt?: string }
  | { ok: false; error: string }
> {
  const nom = patch.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  if (nom.length > CATEGORIE_NOM_MAX_LENGTH) {
    return {
      ok: false,
      error: `Le nom ne peut pas dépasser ${CATEGORIE_NOM_MAX_LENGTH} caractères.`,
    };
  }

  if (isApiConfigured()) {
    try {
      const body: { nom: string; description: string } = {
        nom,
        description: patch.description.trim(),
      };

      const res = await apiRequest<AdminCategorieUpdateResponse>(
        ADMIN_ROUTES.categories.byId(id),
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
      await fetchCategoriesPersisted();
      const categorie = getCategoryById(id);
      if (!categorie) return { ok: false, error: "Catégorie introuvable." };
      return { ok: true, categorie, updatedAt: res.updatedAt };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return {
          ok: false,
          error: messageFromApiError(err, "Nom déjà utilisé."),
        };
      }
      return { ok: false, error: messageFromApiError(err, "Mise à jour impossible.") };
    }
  }

  return updateCategoryLocal(id, patch);
}

export async function softDeleteCategoryPersisted(
  id: string
): Promise<
  { ok: true; deleted_at: string } | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    try {
      const res = await apiRequest<AdminCategorieDeleteResponse>(
        ADMIN_ROUTES.categories.byId(id),
        { method: "DELETE" }
      );
      await fetchCategoriesPersisted();
      return { ok: true, deleted_at: res.deleted_at };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return {
          ok: false,
          error: messageFromApiError(
            err,
            "Catégorie référencée par un défi actif."
          ),
        };
      }
      return {
        ok: false,
        error: messageFromApiError(err, "Suppression impossible."),
      };
    }
  }

  if (!softDeleteCategoryLocal(id)) {
    return { ok: false, error: "Catégorie introuvable." };
  }
  return { ok: true, deleted_at: softDeleteTimestamp() };
}

/** @deprecated Préférer createCategoryPersisted */
export function createCategory(input: {
  nom: string;
  description: string;
}): { ok: true; categorie: MockCategorie } | { ok: false; error: string } {
  return createCategoryLocal(input);
}

function createCategoryLocal(input: {
  nom: string;
  description: string;
}): { ok: true; categorie: MockCategorie } | { ok: false; error: string } {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  if (isCategoryNameTaken(nom)) {
    return { ok: false, error: "Ce nom est déjà utilisé." };
  }
  const categorie: MockCategorie = {
    id: `c-${Date.now()}`,
    nom,
    description: input.description.trim(),
    nbLivres: 0,
    deletedAt: null,
  };
  const next = [...ensureCategories(), categorie];
  writeCategories(next);
  apiCache = next;
  return { ok: true, categorie };
}

/** @deprecated Préférer updateCategoryPersisted */
export function updateCategory(
  id: string,
  patch: Pick<MockCategorie, "nom" | "description">
): { ok: true; categorie: MockCategorie } | { ok: false; error: string } {
  return updateCategoryLocal(id, patch);
}

function updateCategoryLocal(
  id: string,
  patch: Pick<MockCategorie, "nom" | "description">
): { ok: true; categorie: MockCategorie } | { ok: false; error: string } {
  const nom = patch.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  if (isCategoryNameTaken(nom, id)) {
    return { ok: false, error: "Ce nom est déjà utilisé." };
  }
  const categories = ensureCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Catégorie introuvable." };
  if (isSoftDeleted(categories[idx]!.deletedAt)) {
    return { ok: false, error: "Catégorie supprimée." };
  }
  const updated: MockCategorie = {
    ...categories[idx]!,
    nom,
    description: patch.description.trim(),
  };
  const next = [...categories];
  next[idx] = updated;
  writeCategories(next);
  apiCache = next;
  return { ok: true, categorie: updated };
}

/** @deprecated Préférer softDeleteCategoryPersisted — l’API ne propose pas de restore */
export function softDeleteCategory(id: string): boolean {
  return softDeleteCategoryLocal(id);
}

function softDeleteCategoryLocal(id: string): boolean {
  const categories = ensureCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  const next = [...categories];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  writeCategories(next);
  apiCache = next;
  return true;
}

export function restoreCategory(id: string): boolean {
  if (isApiConfigured()) return false;
  const categories = ensureCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  const next = [...categories];
  next[idx] = { ...next[idx]!, deletedAt: null };
  writeCategories(next);
  apiCache = next;
  return true;
}

export function resolveCategoryName(categorieIds: string[]): string {
  for (const id of categorieIds) {
    const cat = getCategoryById(id);
    if (cat && !isSoftDeleted(cat.deletedAt)) return cat.nom;
  }
  return "Non classé";
}
