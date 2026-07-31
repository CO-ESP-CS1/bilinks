import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { ADMIN_ROUTES } from "@/lib/api/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminChannel = {
  id: string;
  channel_id: string;
  nom: string;
  description: string | null;
  thumbnail_url: string | null;
  actif: boolean;
  max_videos: number | null;
  last_synced_at: string | null;
  nb_videos: number;
};

export type ResolvedChannel = {
  channel_id: string;
  nom: string;
  description: string;
  thumbnail_url: string | null;
  subscriber_count: number | null;
};

export type AdminVideo = {
  id: string;
  video_id: string;
  titre: string;
  thumbnail_url: string | null;
  published_at: string;
  duree_secondes: number | null;
  view_count: number;
  chaine: { id: string; nom: string; thumbnail_url: string | null };
};

export type CreateChannelPayload = {
  channel_id: string;
  nom: string;
  description?: string;
  thumbnail_url?: string;
  actif?: boolean;
};

export type SyncResult = {
  chaines_traitees: number;
  videos_upserted: number;
  erreurs: number;
};

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notConfigured(): { ok: false; error: string } {
  return { ok: false, error: "Serveur non configuré." };
}

// ─── Fonctions ────────────────────────────────────────────────────────────────

export async function fetchChannels(): Promise<ApiResult<AdminChannel[]>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<AdminChannel[]>(ADMIN_ROUTES.youtube.channels);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function resolveChannels(
  q: string
): Promise<ApiResult<ResolvedChannel[]>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const payload = await apiRequest<{ data: ResolvedChannel[] }>(
      ADMIN_ROUTES.youtube.resolveChannel(q)
    );
    return { ok: true, data: payload.data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function createChannel(
  payload: CreateChannelPayload
): Promise<ApiResult<{ id: string; nom: string; videos_importees: number }>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<{
      id: string;
      nom: string;
      videos_importees: number;
    }>(ADMIN_ROUTES.youtube.createChannel, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function updateChannelMaxVideos(
  id: string,
  maxVideos: number
): Promise<
  ApiResult<{ id: string; max_videos: number | null; upserted: number }>
> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<{
      id: string;
      max_videos: number | null;
      upserted: number;
    }>(ADMIN_ROUTES.youtube.updateChannel(id), {
      method: "PATCH",
      body: JSON.stringify({ max_videos: maxVideos }),
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function activateChannel(
  id: string
): Promise<ApiResult<{ id: string; actif: boolean }>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<{ id: string; actif: boolean }>(
      ADMIN_ROUTES.youtube.activateChannel(id),
      { method: "PATCH" }
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function deactivateChannel(
  id: string
): Promise<ApiResult<{ id: string; actif: boolean }>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<{ id: string; actif: boolean }>(
      ADMIN_ROUTES.youtube.deactivateChannel(id),
      { method: "PATCH" }
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function deleteChannel(
  id: string
): Promise<ApiResult<{ deleted: boolean }>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<{ deleted: boolean }>(
      ADMIN_ROUTES.youtube.deleteChannel(id),
      { method: "DELETE" }
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}

export async function triggerSync(): Promise<ApiResult<SyncResult>> {
  if (!isApiConfigured()) return notConfigured();
  try {
    const data = await apiRequest<SyncResult>(ADMIN_ROUTES.youtube.sync, {
      method: "POST",
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: messageFromApiError(err) };
  }
}
