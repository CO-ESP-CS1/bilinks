import type { SubscribeMeProfile } from "@/lib/subscribe/api";
import { getPlanById } from "@/lib/subscribe/plans";

export function maskDisplayName(prenom?: string, nom?: string): string {
  const p = prenom?.trim() ?? "";
  const n = nom?.trim() ?? "";
  if (!p && !n) return "Lecteur BI LINKS";
  if (!n) return p;
  const visible = n.length > 4 ? `${n.slice(0, 4)}****` : `${n.charAt(0)}****`;
  return p ? `${p} ${visible}` : visible;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length > 2 ? `${local.slice(0, 2)}***` : `${local}***`;
  return `${visible}@${domain}`;
}

export function formatPlanLabel(planId?: string | null): string {
  if (!planId) return "Aucune";
  return getPlanById(planId as "HEBDOMADAIRE" | "MENSUEL" | "ANNUEL")?.name ?? planId;
}

export function formatExpiryDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getSubscriptionStatus(
  abonnement: SubscribeMeProfile["abonnement_actif"]
): { label: string; tone: "active" | "inactive" } {
  if (!abonnement) return { label: "Aucun abonnement", tone: "inactive" };
  if (abonnement.jours_restants > 0) return { label: "Actif", tone: "active" };
  return { label: "Expiré", tone: "inactive" };
}
