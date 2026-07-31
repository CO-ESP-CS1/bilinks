import type {
  AdminEtablissementApi,
  AdminEtablissementCreateBody,
  AdminEtablissementDetailApi,
  AdminEtablissementPerformanceApi,
  AdminEtablissementsListResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady, API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { unwrapListData } from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export type { AdminEtablissementApi as EtablissementRow };

export async function fetchEtablissementsPersisted(): Promise<
  AdminEtablissementApi[]
> {
  if (!isApiConfigured() || !isAdminListApiReady()) return [];

  try {
    const payload = await apiRequest<AdminEtablissementsListResponse>(
      `${ADMIN_ROUTES.etablissements.list}?limit=100`
    );
    return unwrapListData<AdminEtablissementApi>(payload);
  } catch {
    return [];
  }
}

export async function fetchEtablissementDetailPersisted(
  id: string
): Promise<AdminEtablissementDetailApi | null> {
  if (!isApiConfigured()) return null;

  try {
    return await apiRequest<AdminEtablissementDetailApi>(
      ADMIN_ROUTES.etablissements.byId(id)
    );
  } catch {
    return null;
  }
}

export async function fetchEtablissementPerformancePersisted(
  id: string
): Promise<AdminEtablissementPerformanceApi | null> {
  if (!isApiConfigured()) return null;

  try {
    return await apiRequest<AdminEtablissementPerformanceApi>(
      ADMIN_ROUTES.etablissements.performance(id)
    );
  } catch {
    return null;
  }
}

export async function createEtablissementPersisted(
  body: AdminEtablissementCreateBody
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isApiConfigured()) return { ok: false, error: API_REQUIRED_MESSAGE };

  try {
    await apiRequest(ADMIN_ROUTES.etablissements.create, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err, "Création impossible.") };
  }
}

export async function attachMembrePersisted(
  etablissementId: string,
  authId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isApiConfigured()) return { ok: false, error: API_REQUIRED_MESSAGE };

  try {
    await apiRequest(ADMIN_ROUTES.etablissements.membres(etablissementId), {
      method: "POST",
      body: JSON.stringify({ auth_id: authId }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Rattachement impossible."),
    };
  }
}

export async function prolongerEtablissementPersisted(
  id: string,
  joursSupplementaires: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isApiConfigured()) return { ok: false, error: API_REQUIRED_MESSAGE };

  try {
    await apiRequest(ADMIN_ROUTES.etablissements.prolonger(id), {
      method: "PATCH",
      body: JSON.stringify({ jours_supplementaires: joursSupplementaires }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Prolongation impossible."),
    };
  }
}

export async function detachMembrePersisted(
  etablissementId: string,
  membreId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isApiConfigured()) return { ok: false, error: API_REQUIRED_MESSAGE };

  try {
    await apiRequest(
      ADMIN_ROUTES.etablissements.retireMembre(etablissementId, membreId),
      { method: "PATCH" }
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err, "Retrait impossible.") };
  }
}
