import { mockAuteurs, type MockAuteur } from "@/lib/mock-data";
import { mapAdminAuteurToMock } from "@/lib/api/adapters";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import type {
  AdminAuteurApi,
  AdminAuteurDeleteResponse,
  AdminAuteurUpdateResponse,
  AdminAuteursListResponse,
} from "@/lib/api/admin-types";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const AUTEURS_KEY = "bibliotech_auteurs";
const LIST_LIMIT = 100;

let apiCache: MockAuteur[] | null = null;

export function resetAuteursListCache(): void {
  apiCache = null;
}

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
  return { ...a, deletedAt: a.deletedAt ?? null, bio: a.bio ?? "" };
}

function setCache(auteurs: MockAuteur[]): void {
  apiCache = auteurs;
}

export function ensureAuteurs(): MockAuteur[] {
  return apiCache ?? [];
}

export function getAllAuteurs(includeDeleted = false): MockAuteur[] {
  const list = apiCache ?? [];
  return includeDeleted ? list : list.filter((a) => !isSoftDeleted(a.deletedAt));
}

export function getAuteurById(id: string): MockAuteur | null {
  return getAllAuteurs(true).find((a) => a.id === id) ?? null;
}

export async function fetchAuteursPersisted(options?: {
  q?: string;
  page?: number;
}): Promise<MockAuteur[]> {
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
    if (options?.q?.trim()) params.set("q", options.q.trim());

    const payload = await apiRequest<AdminAuteursListResponse>(
      `${ADMIN_ROUTES.auteurs.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminAuteurApi>(payload);
    const mapped = rows.map(mapAdminAuteurToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function createAuteurPersisted(input: {
  prenom: string;
  nom: string;
  bio?: string;
}): Promise<{ ok: true; auteur: MockAuteur } | { ok: false; error: string }> {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };

  if (isApiConfigured()) {
    try {
      const created = await apiRequest<{ id: string; nom: string }>(
        ADMIN_ROUTES.auteurs.create,
        {
          method: "POST",
          body: JSON.stringify({
            nom,
            prenom: input.prenom.trim() || undefined,
            bio: input.bio?.trim() || undefined,
          }),
        }
      );
      const auteur: MockAuteur = {
        id: created.id,
        nom: created.nom,
        prenom: input.prenom.trim(),
        bio: input.bio?.trim() ?? "",
        nbLivres: 0,
        deletedAt: null,
      };
      setCache([...getAllAuteurs(), auteur]);
      return { ok: true, auteur };
    } catch (err) {
      return { ok: false, error: messageFromApiError(err, "Création impossible.") };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function updateAuteurPersisted(
  id: string,
  patch: Pick<MockAuteur, "prenom" | "nom" | "bio">
): Promise<{ ok: true; auteur: MockAuteur } | { ok: false; error: string }> {
  const nom = patch.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };

  if (isApiConfigured()) {
    try {
      await apiRequest<AdminAuteurUpdateResponse>(ADMIN_ROUTES.auteurs.byId(id), {
        method: "PATCH",
        body: JSON.stringify({
          nom,
          prenom: patch.prenom.trim(),
          bio: patch.bio?.trim() ?? "",
        }),
      });
      const existing = getAuteurById(id);
      if (!existing) return { ok: false, error: "Auteur introuvable." };
      const auteur: MockAuteur = {
        ...existing,
        nom,
        prenom: patch.prenom.trim(),
        bio: patch.bio?.trim() ?? "",
      };
      const next = getAllAuteurs(true).map((a) => (a.id === id ? auteur : a));
      setCache(next.filter((a) => !isSoftDeleted(a.deletedAt)));
      return { ok: true, auteur };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Mise à jour impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function softDeleteAuteurPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    try {
      await apiRequest<AdminAuteurDeleteResponse>(ADMIN_ROUTES.auteurs.byId(id), {
        method: "DELETE",
      });
      const next = getAllAuteurs().filter((a) => a.id !== id);
      setCache(next);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Suppression impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

/** @deprecated Préférer createAuteurPersisted */
export function createAuteur(input: {
  prenom: string;
  nom: string;
}): { ok: true; auteur: MockAuteur } | { ok: false; error: string } {
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

function createAuteurLocal(input: {
  prenom: string;
  nom: string;
  bio?: string;
}): { ok: true; auteur: MockAuteur } | { ok: false; error: string } {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  const auteur: MockAuteur = {
    id: `a-${Date.now()}`,
    prenom: input.prenom.trim(),
    nom,
    bio: input.bio?.trim() ?? "",
    nbLivres: 0,
    deletedAt: null,
  };
  const next = [...ensureAuteurs(), auteur];
  writeAuteurs(next);
  apiCache = next;
  return { ok: true, auteur };
}

/** @deprecated Préférer updateAuteurPersisted */
export function updateAuteur(
  id: string,
  patch: Pick<MockAuteur, "prenom" | "nom">
): { ok: true; auteur: MockAuteur } | { ok: false; error: string } {
  const existing = getAuteurById(id);
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

function updateAuteurLocal(
  id: string,
  patch: Pick<MockAuteur, "prenom" | "nom" | "bio">
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
    bio: patch.bio?.trim() ?? "",
  };
  const next = [...auteurs];
  next[idx] = updated;
  writeAuteurs(next);
  apiCache = next;
  return { ok: true, auteur: updated };
}

/** @deprecated Préférer softDeleteAuteurPersisted */
export function softDeleteAuteur(id: string): boolean {
  void id;
  return false;
}

function softDeleteAuteurLocal(id: string): boolean {
  const auteurs = ensureAuteurs();
  const idx = auteurs.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  const next = [...auteurs];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  writeAuteurs(next);
  apiCache = next;
  return true;
}
