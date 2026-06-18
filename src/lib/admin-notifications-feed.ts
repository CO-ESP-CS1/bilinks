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

/** Feed cloche admin — alimenté par les alertes API (dashboard), pas de données démo. */
export function getAdminNotificationFeed(): AdminNotificationFeedItem[] {
  return [];
}

export function countUnreadAdminNotifications(
  feed: AdminNotificationFeedItem[] = getAdminNotificationFeed()
): number {
  return feed.length;
}
