import { mockCategories, type MockCategorie } from "@/lib/mock-data";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const CATEGORIES_KEY = "bibliotech_categories";

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

export function ensureCategories(): MockCategorie[] {
  let categories = readCategories().map(normalize);
  if (categories.length === 0) {
    categories = mockCategories.map((c) => ({ ...c, deletedAt: c.deletedAt ?? null }));
    writeCategories(categories);
  }
  return categories;
}

export function getAllCategories(includeDeleted = false): MockCategorie[] {
  const list = ensureCategories();
  return includeDeleted ? list : list.filter((c) => !isSoftDeleted(c.deletedAt));
}

export function getCategoryById(id: string): MockCategorie | null {
  return ensureCategories().find((c) => c.id === id) ?? null;
}

export function nomNormaliseCategorie(s: string): string {
  return s.trim().toLowerCase();
}

export function isCategoryNameTaken(
  nom: string,
  excludeId?: string
): boolean {
  const n = nomNormaliseCategorie(nom);
  return ensureCategories().some(
    (c) =>
      c.id !== excludeId &&
      !isSoftDeleted(c.deletedAt) &&
      nomNormaliseCategorie(c.nom) === n
  );
}

export function createCategory(input: {
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
  return { ok: true, categorie };
}

export function updateCategory(
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
  return { ok: true, categorie: updated };
}

export function softDeleteCategory(id: string): boolean {
  const categories = ensureCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  const next = [...categories];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  writeCategories(next);
  return true;
}

export function restoreCategory(id: string): boolean {
  const categories = ensureCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  const next = [...categories];
  next[idx] = { ...next[idx]!, deletedAt: null };
  writeCategories(next);
  return true;
}

export function resolveCategoryName(categorieIds: string[]): string {
  for (const id of categorieIds) {
    const cat = getCategoryById(id);
    if (cat && !isSoftDeleted(cat.deletedAt)) return cat.nom;
  }
  return "Non classé";
}
