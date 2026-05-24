import {
  mockLivres,
  type MockLivre,
  type StatutLivre,
} from "@/lib/mock-data";
import { resolveCategoryName } from "@/lib/categories-store";

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
