import type { MockLivre, StatutLivre } from "@/lib/mock-data";
import { mapAdminBookToMockLivre } from "@/lib/api/adapters";
import {
  API_REQUIRED_MESSAGE,
  isAdminListApiReady,
} from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import type {
  AdminBookArchiveResponse,
  AdminBookAuthorBrief,
  AdminBookAuthorsResponse,
  AdminBookCategoriesResponse,
  AdminBookCategoryBrief,
  AdminBookCreateResponse,
  AdminBookListItemApi,
  AdminBookUpdateResponse,
  AdminBooksListResponse,
} from "@/lib/api/admin-types";
import { messageFromApiError } from "@/lib/api/errors";
import {
  unwrapListData,
  unwrapPaginationMeta,
  type PaginationMeta,
} from "@/lib/api/pagination";
import type { TypeLivreCatalogue } from "@/types/admin";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { addBooksToLibraryPersisted } from "@/lib/libraries-store";
import { getAuteurById } from "@/lib/auteurs-store";
import { getCategoryById } from "@/lib/categories-store";
import {
  buildBookFormData,
  buildUpdateBookFormData,
  validateCreateBookInput,
  validateUpdateBookInput,
  type CreateBookPersistedInput,
  type TypeLivre,
  type UpdateBookPersistedInput,
} from "@/lib/admin/book-payload";

const LIVRES_KEY = "bibliotech_livres";
const LIST_LIMIT = 100;
const PAGE_LIMIT_DEFAULT = 20;

export type FetchLivresOptions = {
  statut?: "PUBLIE" | "ARCHIVE";
  type_livre?: TypeLivreCatalogue;
  is_downloadable?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export type FetchLivresResult = {
  livres: MockLivre[];
  meta: PaginationMeta | null;
};

let apiCache: MockLivre[] | null = null;

export function resetLivresListCache(): void {
  apiCache = null;
}

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

function setCache(livres: MockLivre[]): void {
  apiCache = livres;
}

export function ensureLivres(): MockLivre[] {
  return apiCache ?? [];
}

export function getAllLivres(): MockLivre[] {
  return apiCache ?? [];
}

export function getLivreById(id: string): MockLivre | null {
  return getAllLivres().find((l) => l.id === id) ?? null;
}

export function createLivre(input: {
  titre: string;
  auteurs: string[];
  langue: string;
  anneePublication?: number | null;
  nombrePages?: number | null;
  statut?: StatutLivre;
  categorie?: string;
  couvertureUrl?: string | null;
}): MockLivre {
  const livre: MockLivre = {
    id: `l-${Date.now()}`,
    titre: input.titre.trim(),
    auteurs: input.auteurs,
    categorie: input.categorie ?? "Non classé",
    langue: input.langue,
    anneePublication: input.anneePublication ?? new Date().getFullYear(),
    nombrePages: input.nombrePages ?? 0,
    statut: input.statut ?? "PUBLIE",
    nbLectures: 0,
    noteMoyenne: null,
    couvertureUrl: input.couvertureUrl?.trim() ?? "",
  };
  writeLivres([...ensureLivres(), livre]);
  apiCache = [...ensureLivres()];
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
  >
): MockLivre | null {
  const livres = ensureLivres();
  const idx = livres.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const updated: MockLivre = { ...livres[idx]!, ...patch };
  const next = [...livres];
  next[idx] = updated;
  setCache(next);
  return updated;
}

export function archiveLivre(id: string): boolean {
  const updated = updateLivre(id, { statut: "ARCHIVE" });
  return updated != null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function applyAuthorsToCachedLivre(
  bookId: string,
  auteurs: AdminBookAuthorBrief[]
): void {
  const rows = getAllLivres();
  const idx = rows.findIndex((l) => l.id === bookId);
  if (idx < 0) return;
  const next = [...rows];
  next[idx] = {
    ...next[idx]!,
    auteurIds: auteurs.map((a) => a.id),
    auteurs: auteurs
      .map((a) => `${a.prenom} ${a.nom}`.trim())
      .filter(Boolean),
  };
  setCache(next);
}

/** POST /admin/books/{id}/authors — remplace atomiquement tous les auteurs. */
export async function assignBookAuthorsPersisted(
  bookId: string,
  auteurIds: string[]
): Promise<
  | { ok: true; auteurs: AdminBookAuthorBrief[] }
  | { ok: false; error: string }
> {
  const uniqueIds = [...new Set(auteurIds.map((id) => id.trim()).filter(Boolean))];
  const invalid = uniqueIds.find((id) => !UUID_RE.test(id));
  if (invalid) {
    return { ok: false, error: `Identifiant auteur invalide : ${invalid}` };
  }

  if (!isApiConfigured()) {
    const auteurs: AdminBookAuthorBrief[] = uniqueIds.map((id) => {
      const a = getAuteurById(id);
      return a
        ? { id: a.id, nom: a.nom, prenom: a.prenom }
        : { id, nom: "—", prenom: "" };
    });
    applyAuthorsToCachedLivre(bookId, auteurs);
    if (!getLivreById(bookId)) {
      return { ok: false, error: "Livre introuvable." };
    }
    return { ok: true, auteurs };
  }

  try {
    const res = await apiRequest<AdminBookAuthorsResponse>(
      ADMIN_ROUTES.books.authors(bookId),
      {
        method: "POST",
        body: JSON.stringify({ auteur_ids: uniqueIds }),
      }
    );
    const auteurs = res.auteurs ?? [];
    applyAuthorsToCachedLivre(bookId, auteurs);
    return { ok: true, auteurs };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(
        err,
        "Association auteurs impossible."
      ),
    };
  }
}

function applyCategoriesToCachedLivre(
  bookId: string,
  categories: AdminBookCategoryBrief[]
): void {
  const rows = getAllLivres();
  const idx = rows.findIndex((l) => l.id === bookId);
  if (idx < 0) return;
  const next = [...rows];
  next[idx] = {
    ...next[idx]!,
    categorieIds: categories.map((c) => c.id),
    categories,
    categorie: categories[0]?.nom ?? "—",
  };
  setCache(next);
}

/** POST /admin/books/{id}/categories — remplace atomiquement toutes les catégories. */
export async function assignBookCategoriesPersisted(
  bookId: string,
  categorieIds: string[]
): Promise<
  | { ok: true; categories: AdminBookCategoryBrief[] }
  | { ok: false; error: string }
> {
  const uniqueIds = [...new Set(categorieIds.map((id) => id.trim()).filter(Boolean))];
  const invalid = uniqueIds.find((id) => !UUID_RE.test(id));
  if (invalid) {
    return { ok: false, error: `Identifiant catégorie invalide : ${invalid}` };
  }

  if (!isApiConfigured()) {
    const categories: AdminBookCategoryBrief[] = uniqueIds.map((id) => {
      const c = getCategoryById(id);
      return c ? { id: c.id, nom: c.nom } : { id, nom: "—" };
    });
    applyCategoriesToCachedLivre(bookId, categories);
    if (!getLivreById(bookId)) {
      return { ok: false, error: "Livre introuvable." };
    }
    return { ok: true, categories };
  }

  try {
    const res = await apiRequest<AdminBookCategoriesResponse>(
      ADMIN_ROUTES.books.categories(bookId),
      {
        method: "POST",
        body: JSON.stringify({ categorie_ids: uniqueIds }),
      }
    );
    const categories = res.categories ?? [];
    applyCategoriesToCachedLivre(bookId, categories);
    return { ok: true, categories };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(
        err,
        "Association catégories impossible."
      ),
    };
  }
}

async function assignBookToLibraries(
  bookId: string,
  libraryIds: string[]
): Promise<{ ok: false; error: string } | { ok: true }> {
  for (const libraryId of libraryIds) {
    const result = await addBooksToLibraryPersisted(libraryId, [bookId]);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/**
 * Liste admin — GET /admin/books (enveloppe { data, meta }).
 * Ne retourne pas cloudinary_public_id ni url_externe_livre (contrat API).
 */
export async function fetchLivres(
  options?: FetchLivresOptions
): Promise<FetchLivresResult> {
  if (!isApiConfigured()) {
    return { livres: [], meta: null };
  }
  if (!isAdminListApiReady()) {
    return { livres: [], meta: null };
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set(
      "limit",
      String(options?.limit ?? (options?.page != null ? PAGE_LIMIT_DEFAULT : LIST_LIMIT))
    );
    if (options?.statut) params.set("statut", options.statut);
    if (options?.type_livre) params.set("type_livre", options.type_livre);
    if (options?.is_downloadable === true) {
      params.set("is_downloadable", "true");
    } else if (options?.is_downloadable === false) {
      params.set("is_downloadable", "false");
    }
    if (options?.q?.trim()) params.set("q", options.q.trim());

    const payload = await apiRequest<AdminBooksListResponse>(
      `${ADMIN_ROUTES.books.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminBookListItemApi>(payload);
    const mapped = rows.map(mapAdminBookToMockLivre);
    setCache(mapped);
    return {
      livres: mapped,
      meta: unwrapPaginationMeta(payload),
    };
  } catch {
    return { livres: [], meta: null };
  }
}

export async function createLivrePersisted(
  input: CreateBookPersistedInput
): Promise<
  | { ok: true; livre: MockLivre; created: AdminBookCreateResponse }
  | { ok: false; error: string }
> {
  const apiMode = isApiConfigured();
  const validationError = validateCreateBookInput(input, apiMode);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (!apiMode) {
    return { ok: false, error: API_REQUIRED_MESSAGE };
  }

  const typeLivre = input.type_livre ?? "INTERNE";

  try {
      const form = buildBookFormData({
        titre: input.titre,
        langue: input.langue?.trim() || "Français",
        type_livre: typeLivre,
        url_externe_livre: input.urlExterneLivre,
        anneePublication: input.anneePublication,
        nombrePages: input.nombrePages,
        isbn: input.isbn,
        resume: input.resume,
        maison_edition: input.maisonEdition,
        fichier: input.fichier,
        couvertureFile: input.couvertureFile,
        is_downloadable: input.is_downloadable,
      });

      const created = await apiRequest<AdminBookCreateResponse>(
        ADMIN_ROUTES.books.create,
        { method: "POST", body: form }
      );

      try {
        const authorsResult = await assignBookAuthorsPersisted(
          created.id,
          input.auteurIds
        );
        if (!authorsResult.ok) {
          await fetchLivres();
          return authorsResult;
        }
        if (input.categorieIds.length > 0) {
          const categoriesResult = await assignBookCategoriesPersisted(
            created.id,
            input.categorieIds
          );
          if (!categoriesResult.ok) {
            await fetchLivres();
            return categoriesResult;
          }
        }
        if (input.bibliothequeIds.length > 0) {
          const libResult = await assignBookToLibraries(
            created.id,
            input.bibliothequeIds
          );
          if (!libResult.ok) {
            await fetchLivres();
            return libResult;
          }
        }
      } catch (assignErr) {
        await fetchLivres();
        return {
          ok: false,
          error: messageFromApiError(
            assignErr,
            "Livre créé (201) mais une association post-création a échoué."
          ),
        };
      }

      await fetchLivres();
      const livre = getLivreById(created.id);
      if (livre) return { ok: true, livre, created };

      const createdTypeLivre =
        created.type_livre === "EXTERNE" ? "EXTERNE" : "INTERNE";
      return {
        ok: true,
        created,
        livre: {
          id: created.id,
          titre: created.titre,
          auteurs: [],
          categorie: "Non classé",
          langue: input.langue ?? "—",
          type_livre: createdTypeLivre,
          is_downloadable:
            createdTypeLivre === "INTERNE"
              ? (input.is_downloadable ?? false)
              : false,
          isbn: input.isbn ?? null,
          maisonEdition: input.maisonEdition ?? null,
          anneePublication: input.anneePublication ?? 0,
          nombrePages: input.nombrePages ?? 0,
          statut: created.statut,
          nbLectures: 0,
          noteMoyenne: null,
          couvertureUrl: "",
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Création livre impossible."),
      };
    }
}

export async function updateLivrePersisted(
  id: string,
  patch: UpdateBookPersistedInput
): Promise<
  | { ok: true; livre: MockLivre; updated: AdminBookUpdateResponse }
  | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return { ok: false, error: API_REQUIRED_MESSAGE };
  }

  const validationError = validateUpdateBookInput(patch);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
      const typeLivre: TypeLivre = patch.type_livre;
      const form = buildUpdateBookFormData({
        titre: patch.titre,
        langue: patch.langue,
        type_livre: typeLivre,
        url_externe_livre: patch.urlExterneLivre,
        anneePublication: patch.anneePublication,
        nombrePages: patch.nombrePages,
        isbn: patch.isbn,
        resume: patch.resume,
        maison_edition: patch.maisonEdition,
        fichier: patch.fichier,
        couvertureFile: patch.couvertureFile,
        is_downloadable: patch.is_downloadable,
      });

      const updated = await apiRequest<AdminBookUpdateResponse>(
        ADMIN_ROUTES.books.byId(id),
        { method: "PATCH", body: form }
      );

      try {
        const authorsResult = await assignBookAuthorsPersisted(
          id,
          patch.auteurIds
        );
        if (!authorsResult.ok) {
          await fetchLivres();
          return authorsResult;
        }
        if (patch.categorieIds !== undefined) {
          const categoriesResult = await assignBookCategoriesPersisted(
            id,
            patch.categorieIds
          );
          if (!categoriesResult.ok) {
            await fetchLivres();
            return categoriesResult;
          }
        }
        if (
          patch.statut === "ARCHIVE" &&
          patch.previousStatut !== "ARCHIVE"
        ) {
          const archiveResult = await archiveLivrePersisted(id);
          if (!archiveResult.ok) return archiveResult;
        }
      } catch (assignErr) {
        await fetchLivres();
        return {
          ok: false,
          error: messageFromApiError(
            assignErr,
            "Livre mis à jour (200) mais une association post-PATCH a échoué."
          ),
        };
      }

      await fetchLivres();
      const livre = getLivreById(id);
      if (!livre) {
        return { ok: false, error: "Livre introuvable après mise à jour." };
      }
      if (updated.couverture_url) {
        livre.couvertureUrl = updated.couverture_url;
        const next = getAllLivres().map((l) =>
          l.id === id ? { ...l, couvertureUrl: updated.couverture_url! } : l
        );
        setCache(next);
      }
      return { ok: true, livre, updated };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Mise à jour livre impossible."),
      };
    }
}

export async function archiveLivrePersisted(
  id: string
): Promise<
  | { ok: true; id: string; statut: StatutLivre }
  | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return { ok: false, error: API_REQUIRED_MESSAGE };
  }

  try {
    const res = await apiRequest<AdminBookArchiveResponse>(
      ADMIN_ROUTES.books.archive(id),
      { method: "PATCH" }
    );
    const statut: StatutLivre = res.statut === "PUBLIE" ? "PUBLIE" : "ARCHIVE";
    const next = getAllLivres().map((l) =>
      l.id === id ? { ...l, statut } : l
    );
    setCache(next);
    return { ok: true, id: res.id, statut };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Archivage livre impossible."),
    };
  }
}
