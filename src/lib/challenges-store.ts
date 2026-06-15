import { mockDefis, type MockDefi, type StatutDefi, type TypeDefi } from "@/lib/mock-data";

import { mapAdminChallengeToMock } from "@/lib/api/adapters";

import { isAdminListApiReady, isDemoDataOnly } from "@/lib/api/admin-list-fetch";

import type {

  AdminChallengeCancelResponse,

  AdminChallengeCreateResponse,

  AdminChallengeUpdateResponse,

  AdminChallengeListItemApi,

  AdminChallengeParticipantItemApi,

  AdminChallengeParticipantsResponse,

  AdminChallengesListResponse,

  StatutChallengeParticipant,

} from "@/lib/api/admin-types";

import { apiRequest, isApiConfigured } from "@/lib/api/client";

import { messageFromApiError } from "@/lib/api/errors";

import {
  unwrapListData,
  unwrapPaginationMeta,
  type PaginationMeta,
} from "@/lib/api/pagination";

import { ADMIN_ROUTES } from "@/lib/api/routes";

import {
  buildChallengeCreateBody,
  buildChallengeUpdateBody,
  validateChallengeCreateInput,
  validateChallengeUpdateInput,
} from "@/lib/admin/validators";



const CHALLENGES_KEY = "bibliotech_challenges";

const LIST_LIMIT = 100;



let apiCache: MockDefi[] | null = null;



export function resetChallengesListCache(): void {

  apiCache = null;

}



function isBrowser(): boolean {

  return typeof window !== "undefined";

}



function readChallenges(): MockDefi[] {

  if (!isBrowser()) return [];

  try {

    const raw = localStorage.getItem(CHALLENGES_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw) as MockDefi[];

    return Array.isArray(parsed) ? parsed : [];

  } catch {

    return [];

  }

}



function writeChallenges(rows: MockDefi[]): void {

  if (!isBrowser()) return;

  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(rows));

}



function normalize(d: MockDefi): MockDefi {

  return { ...d, deletedAt: d.deletedAt ?? null };

}



function setCache(rows: MockDefi[]): void {

  apiCache = rows;

  writeChallenges(rows);

}



function ensureChallenges(): MockDefi[] {

  if (!isDemoDataOnly()) {

    return (apiCache ?? readChallenges().map(normalize));

  }

  if (apiCache?.length) return apiCache;

  let rows = readChallenges().map(normalize);

  if (rows.length === 0) {

    rows = mockDefis.map((d) => ({ ...d, deletedAt: d.deletedAt ?? null }));

    writeChallenges(rows);

  }

  return rows;

}



export function getAllChallenges(): MockDefi[] {

  return isDemoDataOnly()

    ? (apiCache ?? ensureChallenges())

    : (apiCache ?? readChallenges().map(normalize));

}



export async function fetchChallengesPersisted(options?: {

  statut?: StatutDefi;

  page?: number;

  limit?: number;

}): Promise<MockDefi[]> {

  if (!isApiConfigured()) {

    return ensureChallenges();

  }

  if (!isAdminListApiReady()) {

    return [];

  }



  try {

    const params = new URLSearchParams();

    params.set("page", String(options?.page ?? 1));

    params.set("limit", String(options?.limit ?? LIST_LIMIT));

    const apiStat =

      options?.statut === "ACTIF" ||

      options?.statut === "TERMINE" ||

      options?.statut === "ANNULE"

        ? options.statut

        : undefined;

    if (apiStat) params.set("statut", apiStat);



    const payload = await apiRequest<AdminChallengesListResponse>(

      `${ADMIN_ROUTES.challenges.list}?${params.toString()}`

    );

    const rows = unwrapListData<AdminChallengeListItemApi>(payload);

    const mapped = rows.map(mapAdminChallengeToMock);

    setCache(mapped);

    return mapped;

  } catch {

    return [];

  }

}



export async function createChallengePersisted(input: {

  titre: string;

  type: TypeDefi;

  objectif_valeur: number;

  badge_id: string;

  date_debut: string;

  date_fin: string;

  description?: string;

  points_bonus?: number;

  categorie_id?: string;

  auteur_id?: string;

  livre_id?: string;

}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {

  if (isApiConfigured()) {

    const validationError = validateChallengeCreateInput(input);

    if (validationError) return { ok: false, error: validationError };



    try {

      const body = buildChallengeCreateBody(input);



      const created = await apiRequest<AdminChallengeCreateResponse>(

        ADMIN_ROUTES.challenges.create,

        {

          method: "POST",

          body: JSON.stringify(body),

        }

      );

      await fetchChallengesPersisted();

      return { ok: true, id: created.id };

    } catch (err) {

      return {

        ok: false,

        error: messageFromApiError(err, "Création défi impossible."),

      };

    }

  }



  const defi: MockDefi = {

    id: `d-${Date.now()}`,

    titre: input.titre.trim(),

    description: input.description?.trim() || "",

    objectif: String(input.objectif_valeur),

    objectifValeur: input.objectif_valeur,

    type: input.type,

    badgeId: input.badge_id,

    pointsRecompense: input.points_bonus ?? 50,

    dateDebut: input.date_debut,

    dateFin: input.date_fin,

    statut: "BROUILLON",

    participants: 0,

    deletedAt: null,

  };

  setCache([...ensureChallenges(), defi]);

  return { ok: true, id: defi.id };

}



export async function updateChallengePersisted(

  id: string,

  patch: {

    titre?: string;

    description?: string;

    date_fin?: string;

    objectif_valeur?: number;

  }

): Promise<
  | { ok: true; updatedAt?: string }
  | { ok: false; error: string }
> {

  if (isApiConfigured()) {

    const existing = getAllChallenges().find((d) => d.id === id);

    if (existing && existing.statut !== "ACTIF") {

      return {

        ok: false,

        error: "Seuls les défis ACTIF peuvent être modifiés.",

      };

    }

    const validationError = validateChallengeUpdateInput({

      ...patch,

      date_debut: existing?.dateDebut,

    });

    if (validationError) return { ok: false, error: validationError };



    try {

      const body = buildChallengeUpdateBody(patch);



      const res = await apiRequest<AdminChallengeUpdateResponse>(

        ADMIN_ROUTES.challenges.byId(id),

        {

          method: "PATCH",

          body: JSON.stringify(body),

        }

      );

      await fetchChallengesPersisted();

      return { ok: true, updatedAt: res.updatedAt };

    } catch (err) {

      return {

        ok: false,

        error: messageFromApiError(err, "Mise à jour défi impossible."),

      };

    }

  }



  const rows = ensureChallenges();

  const idx = rows.findIndex((d) => d.id === id);

  if (idx < 0) return { ok: false, error: "Défi introuvable." };

  const next = [...rows];

  next[idx] = {

    ...next[idx]!,

    titre: patch.titre?.trim() ?? next[idx]!.titre,

    description: patch.description?.trim() ?? next[idx]!.description,

    dateFin: patch.date_fin ?? next[idx]!.dateFin,

    objectif:

      patch.objectif_valeur !== undefined

        ? String(patch.objectif_valeur)

        : next[idx]!.objectif,

  };

  setCache(next);

  return { ok: true };

}



export async function cancelChallengePersisted(
  id: string
): Promise<
  | { ok: true; statut: string; nb_utilisateurs_echoues: number }
  | { ok: false; error: string }
> {
  if (isApiConfigured()) {
    try {
      const cancelled = await apiRequest<AdminChallengeCancelResponse>(
        ADMIN_ROUTES.challenges.cancel(id),
        { method: "PATCH" }
      );
      await fetchChallengesPersisted();
      return {
        ok: true,
        statut: cancelled.statut,
        nb_utilisateurs_echoues: cancelled.nb_utilisateurs_echoues ?? 0,
      };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Annulation défi impossible."),
      };
    }
  }

  const rows = ensureChallenges();
  const idx = rows.findIndex((d) => d.id === id);
  if (idx < 0) return { ok: false, error: "Défi introuvable." };
  const next = [...rows];
  next[idx] = { ...next[idx]!, statut: "ANNULE" };
  setCache(next);
  return { ok: true, statut: "ANNULE", nb_utilisateurs_echoues: 0 };
}

const PARTICIPANTS_PAGE_LIMIT = 20;

export async function fetchChallengeParticipantsPersisted(
  defiId: string,
  options?: {
    statut?: StatutChallengeParticipant;
    page?: number;
    limit?: number;
  }
): Promise<
  | { ok: true; data: AdminChallengeParticipantItemApi[]; meta: PaginationMeta }
  | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      error: "Liste participants disponible uniquement en mode API.",
    };
  }

  try {
    const params = new URLSearchParams();
    params.set("page", String(options?.page ?? 1));
    params.set("limit", String(options?.limit ?? PARTICIPANTS_PAGE_LIMIT));
    if (
      options?.statut === "EN_COURS" ||
      options?.statut === "COMPLETE" ||
      options?.statut === "ECHOUE"
    ) {
      params.set("statut", options.statut);
    }

    const payload = await apiRequest<AdminChallengeParticipantsResponse>(
      `${ADMIN_ROUTES.challenges.participants(defiId)}?${params.toString()}`
    );

    return {
      ok: true,
      data: unwrapListData<AdminChallengeParticipantItemApi>(payload),
      meta: unwrapPaginationMeta(payload) ?? {
        page: options?.page ?? 1,
        limit: options?.limit ?? PARTICIPANTS_PAGE_LIMIT,
        total: 0,
        total_pages: 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Chargement participants impossible."),
    };
  }
}

