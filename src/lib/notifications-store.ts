import type {
  AdminCreateNotificationBody,
  AdminCreateNotificationResponse,
  AdminNotificationType,
} from "@/lib/api/admin-types";
import { ADMIN_NOTIFICATION_TYPES } from "@/lib/api/admin-types";
import { isAdminListApiReady } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError, SESSION_REQUIRED_MESSAGE } from "@/lib/api/errors";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export type SentAdminNotification = {
  id: string;
  titre: string;
  contenu: string;
  type: AdminNotificationType;
  cible: "TOUS" | "UTILISATEUR";
  authId?: string;
  destinataireLabel?: string;
  created: number;
  envoyeLe: string;
};

export function mapNotificationResponseToSent(
  input: {
    titre: string;
    contenu: string;
    type: AdminNotificationType;
    authId?: string;
    destinataireLabel?: string;
  },
  response: AdminCreateNotificationResponse
): SentAdminNotification {
  const envoyeLe = new Date().toISOString();
  if (response.cible === "UTILISATEUR") {
    return {
      id: response.notification_id,
      titre: input.titre,
      contenu: input.contenu,
      type: input.type,
      cible: "UTILISATEUR",
      authId: response.auth_id,
      destinataireLabel: input.destinataireLabel,
      created: response.created,
      envoyeLe,
    };
  }
  return {
    id: `bulk-${Date.now()}`,
    titre: input.titre,
    contenu: input.contenu,
    type: input.type,
    cible: "TOUS",
    created: response.created,
    envoyeLe,
  };
}

export async function createAdminNotificationPersisted(input: {
  titre: string;
  contenu?: string;
  type: AdminNotificationType;
  auth_id?: string;
  destinataireLabel?: string;
}): Promise<
  | { ok: true; notification: SentAdminNotification }
  | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Le serveur n'est pas configuré." };
  }
  if (!isAdminListApiReady()) {
    return { ok: false, error: SESSION_REQUIRED_MESSAGE };
  }

  const titre = input.titre.trim();
  if (!titre) {
    return { ok: false, error: "Le titre est obligatoire." };
  }
  if (!ADMIN_NOTIFICATION_TYPES.includes(input.type)) {
    return { ok: false, error: "Type de notification invalide." };
  }

  const body: AdminCreateNotificationBody = {
    titre,
    type: input.type,
  };
  const contenu = input.contenu?.trim();
  if (contenu) body.contenu = contenu;
  if (input.auth_id?.trim()) body.auth_id = input.auth_id.trim();

  try {
    const response = await apiRequest<AdminCreateNotificationResponse>(
      ADMIN_ROUTES.notifications.create,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return {
      ok: true,
      notification: mapNotificationResponseToSent(
        {
          titre,
          contenu: contenu ?? "",
          type: input.type,
          authId: input.auth_id,
          destinataireLabel: input.destinataireLabel,
        },
        response
      ),
    };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Envoi de la notification impossible."),
    };
  }
}
