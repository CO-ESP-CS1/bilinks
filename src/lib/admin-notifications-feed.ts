import { isApiConfigured } from "@/lib/api/client";
import {
  mockActiviteRecente,
  mockKPIs,
  mockNotifications,
  type MockNotification,
} from "@/lib/mock-data";
import type { DashboardAlerts } from "@/lib/stats-store";

export type NotificationFeedType =
  | "inscription"
  | "paiement"
  | "commentaire"
  | "livre"
  | "badge"
  | "push"
  | "alerte";

export type AdminNotificationFeedItem = {
  id: string;
  titre: string;
  message: string;
  temps: string;
  type: NotificationFeedType;
  href?: string;
};

function formatRelativeTimeFr(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 7) return `Il y a ${diffJ} j`;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

function mapPushNotification(n: MockNotification): AdminNotificationFeedItem {
  const dateRef = n.envoyeLe ?? n.programmeLe ?? new Date().toISOString();
  return {
    id: `push-${n.id}`,
    titre: n.titre,
    message: n.message,
    temps: formatRelativeTimeFr(dateRef),
    type: "push",
    href: "/admin/notifications",
  };
}

function buildMockAlerts(): AdminNotificationFeedItem[] {
  const alertes: AdminNotificationFeedItem[] = [];
  if (mockKPIs.paiementsEnAttente > 0) {
    alertes.push({
      id: "alert-paiements",
      titre: "Paiements en attente",
      message: `${mockKPIs.paiementsEnAttente} paiements à confirmer`,
      temps: "À traiter",
      type: "alerte",
      href: "/admin/paiements",
    });
  }
  if (mockKPIs.commentairesAModerer > 0) {
    alertes.push({
      id: "alert-commentaires",
      titre: "Modération",
      message: `${mockKPIs.commentairesAModerer} commentaires à modérer`,
      temps: "À traiter",
      type: "alerte",
      href: "/admin/commentaires",
    });
  }
  return alertes;
}

/** Alertes réelles (paiements en attente, commentaires modérés). */
export function buildAlertsNotificationFeed(
  alerts: DashboardAlerts
): AdminNotificationFeedItem[] {
  const items: AdminNotificationFeedItem[] = [];
  if (alerts.paiementsEnAttente > 0) {
    items.push({
      id: "alert-paiements",
      titre: "Paiements en attente",
      message: `${alerts.paiementsEnAttente} paiement${alerts.paiementsEnAttente > 1 ? "s" : ""} à confirmer`,
      temps: "À traiter",
      type: "alerte",
      href: "/admin/paiements",
    });
  }
  if (alerts.commentairesAModerer > 0) {
    items.push({
      id: "alert-commentaires",
      titre: "Modération",
      message: `${alerts.commentairesAModerer} commentaire${alerts.commentairesAModerer > 1 ? "s" : ""} à modérer`,
      temps: "À traiter",
      type: "alerte",
      href: "/admin/commentaires",
    });
  }
  return items;
}

/** Notifications affichées dans la cloche — démo locale uniquement. */
export function getAdminNotificationFeed(): AdminNotificationFeedItem[] {
  if (isApiConfigured()) {
    return [];
  }

  const activites: AdminNotificationFeedItem[] = mockActiviteRecente.map(
    (a, i) => ({
      id: `act-${i}`,
      titre: a.message.split("—")[0]?.trim() || a.message,
      message: a.message,
      temps: a.temps,
      type: a.type as NotificationFeedType,
      href:
        a.type === "commentaire"
          ? "/admin/commentaires"
          : a.type === "paiement"
            ? "/admin/paiements"
            : a.type === "inscription"
              ? "/admin/utilisateurs"
              : undefined,
    })
  );

  const pushes = mockNotifications
    .filter((n) => n.statut === "ENVOYEE")
    .sort((a, b) => {
      const da = new Date(a.envoyeLe ?? 0).getTime();
      const db = new Date(b.envoyeLe ?? 0).getTime();
      return db - da;
    })
    .map(mapPushNotification);

  return [...buildMockAlerts(), ...activites, ...pushes].slice(0, 10);
}

export function countUnreadAdminNotifications(
  feed: AdminNotificationFeedItem[] = getAdminNotificationFeed()
): number {
  return feed.length;
}
