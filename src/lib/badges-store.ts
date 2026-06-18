import type { MockBadge } from "@/lib/mock-data";
import { mapAdminBadgeToMock } from "@/lib/api/adapters";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import type {
  AdminBadgeCreateResponse,
  AdminBadgeListItemApi,
  AdminBadgeUpdateResponse,
  AdminBadgesListResponse,
} from "@/lib/api/admin-types";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError, SESSION_REQUIRED_MESSAGE } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import {
  BADGE_ICONE_MAX_BYTES,
  BADGE_NOM_MAX_LENGTH,
} from "@/lib/admin/validators";

const BADGES_KEY = "bibliotech_badges";
const LIST_LIMIT = 100;
const BADGE_ICONE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const COULEUR_HEX_RE = /^#[0-9A-Fa-f]{6}$/;

let apiCache: MockBadge[] | null = null;

export function resetBadgesListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readBadges(): MockBadge[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockBadge[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBadges(rows: MockBadge[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(BADGES_KEY, JSON.stringify(rows));
}

function setCache(rows: MockBadge[]): void {
  apiCache = rows;
}

function normalize(b: MockBadge): MockBadge {
  return { ...b, deletedAt: b.deletedAt ?? null };
}

function ensureBadges(): MockBadge[] {
  return apiCache ?? [];
}

export function getAllBadges(): MockBadge[] {
  return apiCache ?? [];
}

export function getBadgeById(id: string): MockBadge | null {
  return getAllBadges().find((b) => b.id === id) ?? null;
}

export async function fetchBadgesPersisted(options?: {
  page?: number;
  limit?: number;
}): Promise<MockBadge[]> {
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

    const payload = await apiRequest<AdminBadgesListResponse>(
      `${ADMIN_ROUTES.badges.list}?${params.toString()}`
    );
    const rows = unwrapListData<AdminBadgeListItemApi>(payload);
    const mapped = rows.map(mapAdminBadgeToMock);
    setCache(mapped);
    return mapped;
  } catch {
    return [];
  }
}

export async function createBadgePersisted(input: {
  nom: string;
  couleur: string;
  points: number;
  description?: string;
  iconeFile: File;
}): Promise<{ ok: true; badge: MockBadge } | { ok: false; error: string }> {
  const nom = input.nom.trim();
  const couleur = input.couleur.trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  if (nom.length > BADGE_NOM_MAX_LENGTH) {
    return {
      ok: false,
      error: `Le nom ne peut pas dépasser ${BADGE_NOM_MAX_LENGTH} caractères.`,
    };
  }
  if (!COULEUR_HEX_RE.test(couleur)) {
    return { ok: false, error: "Couleur au format #RRGGBB requis." };
  }
  if (!Number.isInteger(input.points) || input.points < 0) {
    return { ok: false, error: "Les points doivent être un entier ≥ 0." };
  }
  if (!input.iconeFile) {
    return { ok: false, error: "L’icône (fichier) est obligatoire." };
  }
  if (!BADGE_ICONE_MIME.has(input.iconeFile.type)) {
    return {
      ok: false,
      error: "Icône invalide — formats acceptés : PNG, JPEG, WebP, SVG.",
    };
  }
  if (input.iconeFile.size > BADGE_ICONE_MAX_BYTES) {
    return {
      ok: false,
      error: "Icône trop volumineuse — taille maximale 5 Mo.",
    };
  }

  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return {
        ok: false,
        error: SESSION_REQUIRED_MESSAGE,
      };
    }
    try {
      const form = new FormData();
      form.set("nom", nom);
      form.set("couleur", couleur);
      form.set("points", String(input.points));
      if (input.description?.trim()) {
        form.set("description", input.description.trim());
      }
      form.append("icone", input.iconeFile, input.iconeFile.name);

      const created = await apiRequest<AdminBadgeCreateResponse>(
        ADMIN_ROUTES.badges.create,
        { method: "POST", body: form }
      );

      await fetchBadgesPersisted();
      const badge = getBadgeById(created.id);
      if (!badge) {
        return {
          ok: true,
          badge: {
            id: created.id,
            nom,
            description: input.description?.trim() || "—",
            condition: "—",
            rarete: "COMMUN",
            nbAttribues: 0,
            actif: true,
            icone: created.icone,
            couleur,
            points: input.points,
            deletedAt: null,
          },
        };
      }
      return { ok: true, badge };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Création badge impossible."),
      };
    }
  }

  const badge: MockBadge = {
    id: `badge-${Date.now()}`,
    nom,
    description: input.description?.trim() || "—",
    condition: "—",
    rarete: "COMMUN",
    nbAttribues: 0,
    actif: true,
    deletedAt: null,
  };
  setCache([...ensureBadges(), badge]);
  return { ok: true, badge };
}

export async function updateBadgePersisted(
  id: string,
  patch: {
    nom?: string;
    couleur?: string;
    points?: number;
    description?: string;
    iconeFile?: File;
  }
): Promise<
  | { ok: true; badge: MockBadge; updatedAt?: string; icone?: string }
  | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return {
        ok: false,
        error: SESSION_REQUIRED_MESSAGE,
      };
    }
    try {
      const form = new FormData();
      let hasField = false;

      if (patch.nom !== undefined) {
        const nom = patch.nom.trim();
        if (!nom) return { ok: false, error: "Le nom est obligatoire." };
        if (nom.length > BADGE_NOM_MAX_LENGTH) {
          return {
            ok: false,
            error: `Le nom ne peut pas dépasser ${BADGE_NOM_MAX_LENGTH} caractères.`,
          };
        }
        form.set("nom", nom);
        hasField = true;
      }
      if (patch.couleur !== undefined) {
        const couleur = patch.couleur.trim();
        if (!COULEUR_HEX_RE.test(couleur)) {
          return { ok: false, error: "Couleur au format #RRGGBB requis." };
        }
        form.set("couleur", couleur);
        hasField = true;
      }
      if (patch.points !== undefined) {
        if (!Number.isInteger(patch.points) || patch.points < 0) {
          return { ok: false, error: "Les points doivent être un entier ≥ 0." };
        }
        form.set("points", String(patch.points));
        hasField = true;
      }
      if (patch.description !== undefined) {
        form.set("description", patch.description.trim());
        hasField = true;
      }
      if (patch.iconeFile) {
        if (!BADGE_ICONE_MIME.has(patch.iconeFile.type)) {
          return {
            ok: false,
            error: "Icône invalide — formats acceptés : PNG, JPEG, WebP, SVG.",
          };
        }
        if (patch.iconeFile.size > BADGE_ICONE_MAX_BYTES) {
          return {
            ok: false,
            error: "Icône trop volumineuse — taille maximale 5 Mo.",
          };
        }
        form.append("icone", patch.iconeFile, patch.iconeFile.name);
        hasField = true;
      }

      if (!hasField) {
        return { ok: false, error: "Aucune modification à enregistrer." };
      }

      const updated = await apiRequest<AdminBadgeUpdateResponse>(
        ADMIN_ROUTES.badges.byId(id),
        {
          method: "PATCH",
          body: form,
        }
      );

      await fetchBadgesPersisted();
      const badge = getBadgeById(id);
      if (!badge) return { ok: false, error: "Badge introuvable." };
      return {
        ok: true,
        badge,
        updatedAt: updated.updatedAt,
        icone: updated.icone,
      };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Mise à jour badge impossible."),
      };
    }
  }

  const existing = getBadgeById(id);
  if (!existing) return { ok: false, error: "Badge introuvable." };
  const badge: MockBadge = {
    ...existing,
    nom: patch.nom?.trim() ?? existing.nom,
    couleur: patch.couleur?.trim() ?? existing.couleur,
    points: patch.points ?? existing.points,
    description:
      patch.description !== undefined
        ? patch.description.trim() || "—"
        : existing.description,
  };
  const next = getAllBadges().map((b) => (b.id === id ? badge : b));
  setCache(next);
  return { ok: true, badge };
}
