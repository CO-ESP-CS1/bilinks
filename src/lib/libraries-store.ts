import type { MockBibliotheque } from "@/lib/mock-data";
import { mapAdminLibraryToMock } from "@/lib/api/adapters";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import type {
  AdminLibrariesListResponse,
  AdminLibraryAddBooksResponse,
  AdminLibraryApi,
  AdminLibraryCreateResponse,
  AdminLibraryRemoveBookResponse,
  AdminLibraryArchiveResponse,
  AdminLibraryUnarchiveResponse,
  AdminLibraryUpdateResponse,
} from "@/lib/api/admin-types";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const LIBRARIES_KEY = "bibliotech_libraries";
const LIST_LIMIT = 100;

let apiCache: MockBibliotheque[] | null = null;

export function resetLibrariesListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLibraries(): MockBibliotheque[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(LIBRARIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockBibliotheque[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLibraries(rows: MockBibliotheque[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LIBRARIES_KEY, JSON.stringify(rows));
}

function normalize(b: MockBibliotheque): MockBibliotheque {
  return { ...b, deletedAt: b.deletedAt ?? null };
}

function setCache(rows: MockBibliotheque[]): void {
  apiCache = rows;
}

function ensureLibraries(): MockBibliotheque[] {
  return apiCache ?? [];
}

export function getAllLibraries(includeDeleted = false): MockBibliotheque[] {
  const list = apiCache ?? [];
  return includeDeleted ? list : list.filter((b) => !isSoftDeleted(b.deletedAt));
}

export function getLibraryById(id: string): MockBibliotheque | null {
  return getAllLibraries(true).find((b) => b.id === id) ?? null;
}

export async function fetchLibrariesPersisted(options?: {
  statut?: "ACTIVE" | "ARCHIVEE";
  type?: "INTERNE" | "EXTERNE";
  page?: number;
  limit?: number;
}): Promise<MockBibliotheque[]> {
  if (!isApiConfigured()) {
    return [];
  }
  if (!isAdminListApiReady()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set("limit", String(options?.limit ?? LIST_LIMIT));
    if (options?.statut) params.set("statut", options.statut);
    if (options?.type) params.set("type", options.type);

    const payload = await apiRequest<AdminLibrariesListResponse>(
      `${ADMIN_ROUTES.libraries.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminLibraryApi>(payload);
    const mapped = rows.map(mapAdminLibraryToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

function isValidLibraryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createLibraryPersisted(input: {
  nom: string;
  type: "INTERNE" | "EXTERNE";
  description?: string;
  urlExterne?: string | null;
  couvertureUrl?: string;
}): Promise<
  { ok: true; bibliotheque: MockBibliotheque } | { ok: false; error: string }
> {
  const nom = input.nom.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };

  if (input.type === "EXTERNE") {
    const url = input.urlExterne?.trim() ?? "";
    if (!url) {
      return {
        ok: false,
        error: "L'URL externe est obligatoire pour une bibliothèque EXTERNE.",
      };
    }
    if (!isValidLibraryUrl(url)) {
      return { ok: false, error: "URL invalide — utilisez http:// ou https://." };
    }
  }

  if (isApiConfigured()) {
    try {
      const body: Record<string, string> = {
        nom,
        type: input.type,
      };
      if (input.description?.trim()) {
        body.description = input.description.trim();
      }
      if (input.couvertureUrl?.trim()) {
        body.couverture_url = input.couvertureUrl.trim();
      }
      // INTERNE : url_externe interdit — ne jamais l’envoyer (HTTP 400).
      if (input.type === "EXTERNE") {
        body.url_externe = input.urlExterne!.trim();
      }

      const created = await apiRequest<AdminLibraryCreateResponse>(
        ADMIN_ROUTES.libraries.create,
        { method: "POST", body: JSON.stringify(body) }
      );

      await fetchLibrariesPersisted();
      const bibliotheque = getLibraryById(created.id);
      if (!bibliotheque) {
        return {
          ok: true,
          bibliotheque: {
            id: created.id,
            nom: created.nom,
            type: input.type,
            statut: "ACTIVE",
            description: input.description?.trim() || "—",
            urlExterne:
              input.type === "EXTERNE" ? input.urlExterne?.trim() ?? null : null,
            nbLivres: 0,
            deletedAt: null,
          },
        };
      }
      return { ok: true, bibliotheque };
    } catch (err) {
      return { ok: false, error: messageFromApiError(err, "Création impossible.") };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function updateLibraryPersisted(
  id: string,
  patch: {
    nom?: string;
    description?: string;
    urlExterne?: string | null;
    couvertureUrl?: string;
  }
): Promise<
  { ok: true; bibliotheque: MockBibliotheque } | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    try {
      const existing = getLibraryById(id);
      const body: Record<string, string> = {};
      let hasField = false;

      if (patch.nom !== undefined) {
        const nom = patch.nom.trim();
        if (!nom) return { ok: false, error: "Le nom est obligatoire." };
        body.nom = nom;
        hasField = true;
      }
      if (patch.description !== undefined) {
        body.description = patch.description.trim();
        hasField = true;
      }
      if (patch.couvertureUrl?.trim()) {
        body.couverture_url = patch.couvertureUrl.trim();
        hasField = true;
      }
      // url_externe : uniquement pour une bibliothèque déjà EXTERNE (jamais si INTERNE).
      if (existing?.type === "EXTERNE" && patch.urlExterne !== undefined) {
        const url = patch.urlExterne?.trim() ?? "";
        if (!url) {
          return { ok: false, error: "L'URL externe est obligatoire." };
        }
        if (!isValidLibraryUrl(url)) {
          return { ok: false, error: "URL invalide — utilisez http:// ou https://." };
        }
        body.url_externe = url;
        hasField = true;
      }

      if (!hasField) {
        return { ok: false, error: "Aucune modification à enregistrer." };
      }

      await apiRequest<AdminLibraryUpdateResponse>(ADMIN_ROUTES.libraries.byId(id), {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      await fetchLibrariesPersisted();
      const bibliotheque = getLibraryById(id);
      if (!bibliotheque) return { ok: false, error: "Bibliothèque introuvable." };
      return { ok: true, bibliotheque };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Mise à jour impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function archiveLibraryPersisted(
  id: string
): Promise<
  { ok: true; statut: string } | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    try {
      const res = await apiRequest<AdminLibraryArchiveResponse>(
        ADMIN_ROUTES.libraries.archive(id),
        { method: "PATCH" }
      );
      await fetchLibrariesPersisted();
      return { ok: true, statut: res.statut };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Archivage impossible."),
      };
    }
  }

  const rows = ensureLibraries();
  const idx = rows.findIndex((b) => b.id === id);
  if (idx < 0) return { ok: false, error: "Bibliothèque introuvable." };
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "ARCHIVEE" };
  setCache(next);
  return { ok: true, statut: "ARCHIVEE" };
}

export async function unarchiveLibraryPersisted(
  id: string
): Promise<
  { ok: true; statut: string } | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    try {
      const res = await apiRequest<AdminLibraryUnarchiveResponse>(
        ADMIN_ROUTES.libraries.unarchive(id),
        { method: "PATCH" }
      );
      await fetchLibrariesPersisted();
      return { ok: true, statut: res.statut };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Désarchivage impossible."),
      };
    }
  }

  const rows = ensureLibraries();
  const idx = rows.findIndex((b) => b.id === id);
  if (idx < 0) return { ok: false, error: "Bibliothèque introuvable." };
  if (rows[idx]!.statut !== "ARCHIVEE") {
    return { ok: false, error: "Cette bibliothèque n'est pas archivée." };
  }
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "ACTIVE" };
  setCache(next);
  return { ok: true, statut: "ACTIVE" };
}

export async function addBooksToLibraryPersisted(
  libraryId: string,
  livreIds: string[]
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const uniqueIds = [
    ...new Set(livreIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (!uniqueIds.length) {
    return { ok: false, error: "Au moins un identifiant livre requis." };
  }

  if (isApiConfigured()) {
    const library = getLibraryById(libraryId);
    if (!library) {
      return { ok: false, error: "Bibliothèque introuvable." };
    }
    if (library.type === "EXTERNE") {
      return {
        ok: false,
        error:
          "Seules les bibliothèques INTERNE acceptent des livres associés (RG29).",
      };
    }

    try {
      const res = await apiRequest<AdminLibraryAddBooksResponse>(
        ADMIN_ROUTES.libraries.books(libraryId),
        {
          method: "POST",
          body: JSON.stringify({ livre_ids: uniqueIds }),
        }
      );
      await fetchLibrariesPersisted();
      return { ok: true, added: res.added };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Association livres impossible."),
      };
    }
  }

  const rows = ensureLibraries();
  const idx = rows.findIndex((b) => b.id === libraryId);
  if (idx < 0) return { ok: false, error: "Bibliothèque introuvable." };
  if (rows[idx]!.type === "EXTERNE") {
    return {
      ok: false,
      error:
        "Seules les bibliothèques INTERNE acceptent des livres associés (RG29).",
    };
  }
  const next = [...rows];
  next[idx] = {
    ...next[idx]!,
    nbLivres: next[idx]!.nbLivres + uniqueIds.length,
  };
  setCache(next);
  return { ok: true, added: uniqueIds.length };
}

/** DELETE /admin/libraries/{bibId}/books/{bookId} — retire une ligne `appartient`. */
export async function removeBookFromLibraryPersisted(
  bibId: string,
  bookId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const libraryId = bibId.trim();
  const livreId = bookId.trim();
  if (!libraryId) {
    return { ok: false, error: "Identifiant bibliothèque requis." };
  }
  if (!livreId) {
    return { ok: false, error: "Identifiant livre requis." };
  }

  if (isApiConfigured()) {
    try {
      const res = await apiRequest<AdminLibraryRemoveBookResponse>(
        ADMIN_ROUTES.libraries.removeBook(libraryId, livreId),
        { method: "DELETE" }
      );
      await fetchLibrariesPersisted();
      return { ok: true, message: res.message };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Retrait du livre impossible."),
      };
    }
  }

  return { ok: true, message: "Opération réussie." };
}

function createLibraryLocal(input: {
  nom: string;
  type: "INTERNE" | "EXTERNE";
  description?: string;
  urlExterne?: string | null;
  statut?: MockBibliotheque["statut"];
}): { ok: true; bibliotheque: MockBibliotheque } | { ok: false; error: string } {
  const bibliotheque: MockBibliotheque = {
    id: `b-${Date.now()}`,
    nom: input.nom.trim(),
    type: input.type,
    statut: input.statut ?? "ACTIVE",
    description: input.description?.trim() || "—",
    urlExterne: input.type === "EXTERNE" ? input.urlExterne?.trim() ?? null : null,
    nbLivres: 0,
    deletedAt: null,
  };
  const next = [...ensureLibraries(), bibliotheque];
  setCache(next);
  return { ok: true, bibliotheque };
}

function updateLibraryLocal(
  id: string,
  patch: {
    nom?: string;
    description?: string;
    urlExterne?: string | null;
  }
): { ok: true; bibliotheque: MockBibliotheque } | { ok: false; error: string } {
  const rows = ensureLibraries();
  const idx = rows.findIndex((b) => b.id === id);
  if (idx < 0) return { ok: false, error: "Bibliothèque introuvable." };
  const updated: MockBibliotheque = {
    ...rows[idx]!,
    nom: patch.nom?.trim() ?? rows[idx]!.nom,
    description: patch.description?.trim() ?? rows[idx]!.description,
    urlExterne:
      patch.urlExterne !== undefined ? patch.urlExterne : rows[idx]!.urlExterne,
  };
  const next = [...rows];
  next[idx] = updated;
  setCache(next);
  return { ok: true, bibliotheque: updated };
}

export function softDeleteLibraryLocal(id: string): boolean {
  const rows = ensureLibraries();
  const idx = rows.findIndex((b) => b.id === id);
  if (idx < 0) return false;
  const next = [...rows];
  next[idx] = { ...next[idx]!, deletedAt: softDeleteTimestamp() };
  setCache(next);
  return true;
}
