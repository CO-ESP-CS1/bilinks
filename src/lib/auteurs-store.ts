import { mockAuteurs, type MockAuteur } from "@/lib/mock-data";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const AUTEURS_KEY = "bibliotech_auteurs";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAuteurs(): MockAuteur[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(AUTEURS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockAuteur[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuteurs(auteurs: MockAuteur[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(AUTEURS_KEY, JSON.stringify(auteurs));
}

function normalize(a: MockAuteur): MockAuteur {
  return { ...a, deletedAt: a.deletedAt ?? null };
}

export function ensureAuteurs(): MockAuteur[] {
  let auteurs = readAuteurs().map(normalize);
  if (auteurs.length === 0) {
    auteurs = mockAuteurs.map((a) => ({ ...a, deletedAt: a.deletedAt ?? null }));
    writeAuteurs(auteurs);
  }
  return auteurs;
}

export function getAllAuteurs(includeDeleted = false): MockAuteur[] {
  const list = ensureAuteurs();
  return includeDeleted ? list : list.filter((a) => !isSoftDeleted(a.deletedAt));
}

export function getAuteurById(id: string): MockAuteur | null {
  return ensureAuteurs().find((a) => a.id === id) ?? null;
}

export function createAuteur(input: {
  prenom: string;
  nom: string;
}): { ok: true; auteur: MockAuteur } | { ok: false; error: string } {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  const auteur: MockAuteur = {
    id: `a-${Date.now()}`,
    prenom: input.prenom.trim(),
    nom,
    nbLivres: 0,
    deletedAt: null,
  };
  const next = [...ensureAuteurs(), auteur];
  writeAuteurs(next);
  return { ok: true, auteur };
}

export function updateAuteur(
  id: string,
  patch: Pick<MockAuteur, "prenom" | "nom">
): { ok: true; auteur: MockAuteur } | { ok: false; error: string } {
  const nom = patch.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  const auteurs = ensureAuteurs();
  const idx = auteurs.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, error: "Auteur introuvable." };
  if (isSoftDeleted(auteurs[idx]!.deletedAt)) {
    return { ok: false, error: "Auteur supprimé." };
  }
  const updated: MockAuteur = {
    ...auteurs[idx]!,
    prenom: patch.prenom.trim(),
    nom,
  };
  const next = [...auteurs];
  next[idx] = updated;
  writeAuteurs(next);
  return { ok: true, auteur: updated };
}

export function softDeleteAuteur(id: string): boolean {
  const auteurs = ensureAuteurs();
  const idx = auteurs.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  const next = [...auteurs];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  writeAuteurs(next);
  return true;
}
