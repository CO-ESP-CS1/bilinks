import { mockCommentaires, type MockCommentaire } from "@/lib/mock-data";
import { mapAdminCommentToMock } from "@/lib/api/adapters";
import type {
  AdminCommentListItemApi,
  AdminCommentsListResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { StatutCommentaire } from "@/types/admin";

const COMMENTS_KEY = "bibliotech_comments";
const LIST_LIMIT = 100;

let apiCache: MockCommentaire[] | null = null;

export function resetCommentsListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readComments(): MockCommentaire[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockCommentaire[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeComments(rows: MockCommentaire[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(rows));
}

function setCache(rows: MockCommentaire[]): void {
  apiCache = rows;
  writeComments(rows);
}

function ensureComments(): MockCommentaire[] {
  if (apiCache !== null) return apiCache;
  let rows = readComments();
  if (rows.length === 0) {
    rows = mockCommentaires.map((c) => ({ ...c }));
    writeComments(rows);
  }
  return rows;
}

export function getAllComments(): MockCommentaire[] {
  if (apiCache !== null) return apiCache;
  return ensureComments();
}

export async function fetchCommentsPersisted(options?: {
  statut?: StatutCommentaire;
  page?: number;
}): Promise<MockCommentaire[]> {
  if (!isApiConfigured()) {
    return ensureComments();
  }
  if (!isAdminListApiReady()) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set("limit", String(LIST_LIMIT));
    if (options?.statut) params.set("statut", options.statut);

    const payload = await apiRequest<AdminCommentsListResponse>(
      `${ADMIN_ROUTES.comments.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminCommentListItemApi>(payload);
    const mapped = rows.map(mapAdminCommentToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function moderateCommentPersisted(
  id: string,
  raison?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    try {
      await apiRequest(ADMIN_ROUTES.comments.moderate(id), {
        method: "PATCH",
        body: JSON.stringify({
          raison: raison?.trim() || "Modération admin",
        }),
      });
      const next = getAllComments().map((c) =>
        c.id === id ? { ...c, statut: "MODERE" as const } : c
      );
      setCache(next);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Modération impossible."),
      };
    }
  }

  const rows = ensureComments();
  const idx = rows.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Commentaire introuvable." };
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "MODERE" };
  setCache(next);
  return { ok: true };
}

/** DELETE /admin/comments/{id} — suppression définitive */
export async function deleteCommentPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    try {
      await apiRequest(ADMIN_ROUTES.comments.byId(id), { method: "DELETE" });
      setCache(getAllComments().filter((c) => c.id !== id));
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Suppression impossible."),
      };
    }
  }

  const rows = ensureComments();
  if (!rows.some((c) => c.id === id)) {
    return { ok: false, error: "Commentaire introuvable." };
  }
  setCache(rows.filter((c) => c.id !== id));
  return { ok: true };
}

/** Fallback local uniquement (hors API) */
export function setCommentStatutLocal(
  id: string,
  statut: StatutCommentaire
): { ok: true } | { ok: false; error: string } {
  const rows = ensureComments();
  const idx = rows.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, error: "Commentaire introuvable." };
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut };
  setCache(next);
  return { ok: true };
}
