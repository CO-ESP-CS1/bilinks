import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";
import { getApiBearerToken } from "@/lib/api/auth-token";
import { PROFILE_ROUTES } from "@/lib/api/routes";
import {
  DEFAULT_AVATAR,
  establishLocalSessionFromApiUser,
  getAdminById,
  getCurrentAdmin,
  updateAdminProfile,
  type AdminAccount,
} from "@/lib/auth/admin-auth";

type ProfilePersonneApi = {
  nom: string;
  prenom: string;
  photo_profil_url: string | null;
};

type MyProfileApi = {
  id: string;
  email: string;
  personne: ProfilePersonneApi;
};

type UpdateProfileResponseApi = {
  personne: ProfilePersonneApi;
};

type UploadPhotoResponseApi = {
  photo_profil_url: string;
  personne: ProfilePersonneApi;
};

type DeletePhotoResponseApi = {
  message: string;
  personne: ProfilePersonneApi;
};

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function sessionRequired(): { ok: false; error: string } {
  return { ok: false, error: "Connectez-vous pour modifier votre profil." };
}

export async function fetchMyProfile(): Promise<ApiResult<MyProfileApi>> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }
  if (!getApiBearerToken()) {
    return sessionRequired();
  }

  try {
    const data = await apiRequest<MyProfileApi>(PROFILE_ROUTES.me);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible de charger le profil."),
    };
  }
}

export async function updateMyProfile(input: {
  nom?: string;
  prenom?: string;
}): Promise<ApiResult<UpdateProfileResponseApi>> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }
  if (!getApiBearerToken()) {
    return sessionRequired();
  }

  try {
    const data = await apiRequest<UpdateProfileResponseApi>(PROFILE_ROUTES.me, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible de mettre à jour le profil."),
    };
  }
}

export async function uploadMyProfilePhoto(
  file: File
): Promise<ApiResult<UploadPhotoResponseApi>> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }
  if (!getApiBearerToken()) {
    return sessionRequired();
  }

  try {
    const form = new FormData();
    form.append("file", file);
    const data = await apiRequest<UploadPhotoResponseApi>(PROFILE_ROUTES.photo, {
      method: "POST",
      body: form,
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible d'envoyer la photo de profil."),
    };
  }
}

export async function deleteMyProfilePhoto(): Promise<
  ApiResult<DeletePhotoResponseApi>
> {
  if (!isApiConfigured()) {
    return { ok: false, error: "API non configurée." };
  }
  if (!getApiBearerToken()) {
    return sessionRequired();
  }

  try {
    const data = await apiRequest<DeletePhotoResponseApi>(PROFILE_ROUTES.photo, {
      method: "DELETE",
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible de supprimer la photo de profil."),
    };
  }
}

export function avatarUrlFromPersonne(personne: ProfilePersonneApi): string {
  return personne.photo_profil_url ?? DEFAULT_AVATAR;
}

/** Compte factice affiché quand un JWT existe sans session locale valide. */
export function isPlaceholderAdmin(admin: AdminAccount | null): boolean {
  return (
    admin?.id === "api-bootstrap" || admin?.email === "session-api@local"
  );
}

/** Charge le profil depuis GET /me et réécrit la session admin locale. */
export async function hydrateAdminSessionFromApi(): Promise<
  ApiResult<AdminAccount>
> {
  const result = await fetchMyProfile();
  if (!result.ok) return result;

  const existing = getAdminById(result.data.id);
  establishLocalSessionFromApiUser({
    id: result.data.id,
    email: result.data.email,
    nom: result.data.personne.nom,
    prenom: result.data.personne.prenom,
  });

  const hydrated =
    getAdminById(result.data.id) ??
    getCurrentAdmin();

  if (!hydrated || isPlaceholderAdmin(hydrated)) {
    return { ok: false, error: "Impossible de restaurer la session admin." };
  }

  const withAvatar = updateAdminProfile(hydrated.id, {
    avatarUrl: avatarUrlFromPersonne(result.data.personne),
    fonction: existing?.fonction ?? hydrated.fonction,
    localisation: existing?.localisation ?? hydrated.localisation,
  });
  return { ok: true, data: withAvatar ?? hydrated };
}

/** Synchronise nom/prénom/avatar depuis l'API vers le cache local admin. */
export function applyProfileToLocalAdmin(
  adminId: string,
  personne: ProfilePersonneApi
): AdminAccount | null {
  return updateAdminProfile(adminId, {
    prenom: personne.prenom,
    nom: personne.nom,
    avatarUrl: avatarUrlFromPersonne(personne),
  });
}
