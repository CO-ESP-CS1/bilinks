import {
  mockLivres,
  type MockLivre,
  type StatutLivre,
} from "@/lib/mock-data";
import { resolveCategoryName } from "@/lib/categories-store";
import { mapAdminBookToMockLivre } from "@/lib/api/adapters";
import { apiRequest } from "@/lib/api/client";

const LIVRES_KEY = "bibliotech_livres";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLivres(): MockLivre[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(LIVRES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockLivre[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLivres(livres: MockLivre[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LIVRES_KEY, JSON.stringify(livres));
}

export function ensureLivres(): MockLivre[] {
  let livres = readLivres();
  if (livres.length === 0) {
    livres = mockLivres.map((l) => ({ ...l }));
    writeLivres(livres);
  }
  return livres;
}

export function getAllLivres(): MockLivre[] {
  return ensureLivres();
}

export function getLivreById(id: string): MockLivre | null {
  return ensureLivres().find((l) => l.id === id) ?? null;
}

export function createLivre(input: {
  titre: string;
  auteurs: string[];
  langue: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  statut?: StatutLivre;
  categorieIds?: string[];
  couvertureUrl?: string | null;
}): MockLivre {
  const livre: MockLivre = {
    id: `l-${Date.now()}`,
    titre: input.titre.trim(),
    auteurs: input.auteurs,
    categorie: resolveCategoryName(input.categorieIds ?? []),
    langue: input.langue,
    anneePublication: input.anneePublication ?? new Date().getFullYear(),
    nombrePages: input.nombrePages ?? 0,
    statut: input.statut ?? "PUBLIE",
    nbLectures: 0,
    noteMoyenne: null,
    couvertureUrl: input.couvertureUrl?.trim() ?? "",
  };
  writeLivres([...ensureLivres(), livre]);
  return livre;
}

export function updateLivre(
  id: string,
  patch: Partial<
    Pick<
      MockLivre,
      | "titre"
      | "auteurs"
      | "categorie"
      | "langue"
      | "anneePublication"
      | "nombrePages"
      | "statut"
      | "couvertureUrl"
    >
  > & { categorieIds?: string[] }
): MockLivre | null {
  const livres = ensureLivres();
  const idx = livres.findIndex((l) => l.id === id);
  if (idx < 0) return null;

  const categorie =
    patch.categorieIds && patch.categorieIds.length > 0
      ? resolveCategoryName(patch.categorieIds)
      : patch.categorie;

  const { categorieIds: _ids, ...rest } = patch;
  const updated: MockLivre = {
    ...livres[idx]!,
    ...rest,
    ...(categorie !== undefined ? { categorie } : {}),
  };
  const next = [...livres];
  next[idx] = updated;
  writeLivres(next);
  return updated;
}

export function archiveLivre(id: string): boolean {
  const updated = updateLivre(id, { statut: "ARCHIVE" });
  return updated != null;
}

type AdminBooksListResponse = {
  items: Array<{
    id: string;
    titre: string;
    langue: string;
    statut: "PUBLIE" | "ARCHIVE";
    isbn?: string | null;
    nb_lectures?: number;
    note_moyenne?: number | null;
    auteurs?: Array<{ id: string; nom: string; prenom: string }>;
    categories?: Array<{ id: string; nom: string }>;
  }>;
};

/**
 * API-first: tente le backend, fallback localStorage si indisponible.
 */
export async function fetchLivres(): Promise<MockLivre[]> {
  try {
    const payload = await apiRequest<AdminBooksListResponse>("/admin/books");
    if (!Array.isArray(payload?.items)) {
      return getAllLivres();
    }
    const mapped = payload.items.map(mapAdminBookToMockLivre);
    if (mapped.length > 0) {
      writeLivres(mapped);
      return mapped;
    }
    return getAllLivres();
  } catch {
    return getAllLivres();
  }
}

export async function createLivrePersisted(input: {
  titre: string;
  auteurs: string[];
  langue: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  statut?: StatutLivre;
  categorieIds?: string[];
  couvertureUrl?: string | null;
}): Promise<MockLivre> {
  try {
    const form = new FormData();
    form.set("titre", input.titre.trim());
    form.set("type_livre", "INTERNE");
    form.set("langue", input.langue);
    if (input.anneePublication != null) {
      form.set("annee_publication", String(input.anneePublication));
    }
    if (input.nombrePages != null) {
      form.set("nombre_pages", String(input.nombrePages));
    }
    if (input.statut) {
      form.set("statut", input.statut);
    }
    await apiRequest("/admin/books", { method: "POST", body: form });
    return createLivre(input);
  } catch {
    return createLivre(input);
  }
}

export async function updateLivrePersisted(
  id: string,
  patch: Partial<
    Pick<
      MockLivre,
      | "titre"
      | "auteurs"
      | "categorie"
      | "langue"
      | "anneePublication"
      | "nombrePages"
      | "statut"
      | "couvertureUrl"
    >
  > & { categorieIds?: string[] }
): Promise<MockLivre | null> {
  const localUpdated = updateLivre(id, patch);
  if (!localUpdated) return null;
  try {
    const form = new FormData();
    if (patch.titre !== undefined) form.set("titre", patch.titre);
    if (patch.langue !== undefined) form.set("langue", patch.langue);
    if (patch.anneePublication !== undefined) {
      form.set("annee_publication", String(patch.anneePublication));
    }
    if (patch.nombrePages !== undefined) {
      form.set("nombre_pages", String(patch.nombrePages));
    }
    if (patch.statut !== undefined) form.set("statut", patch.statut);
    await apiRequest(`/admin/books/${id}`, { method: "PATCH", body: form });
  } catch {
    // fallback local already applied
  }
  return localUpdated;
}

export async function archiveLivrePersisted(id: string): Promise<boolean> {
  const localOk = archiveLivre(id);
  if (!localOk) return false;
  try {
    await apiRequest(`/admin/books/${id}/archive`, { method: "PATCH" });
  } catch {
    // fallback local already applied
  }
  return true;
}
