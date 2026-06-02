import {
  mockAbonnements,
  mockPaiements,
  type MockAbonnement,
  type PlanType,
} from "@/lib/mock-data";
import { getAllPlans, getPlanByCode } from "@/lib/plans-store";

export const PLAN_LABELS: Record<PlanType, string> = {
  HEBDOMADAIRE: "Hebdomadaire",
  MENSUEL: "Mensuel",
  ANNUEL: "Annuel",
};

/** Caractéristiques du plan personnel B LINKS */
export const PLAN_CARACTERISTIQUES: Record<PlanType, string[]> = {
  HEBDOMADAIRE: [
    "Accès complet au catalogue pendant 7 jours",
    "Lecture en ligne et hors ligne",
    "1 appareil simultané",
    "Support standard",
  ],
  MENSUEL: [
    "Accès illimité au catalogue 30 jours",
    "Lecture en ligne et hors ligne",
    "Jusqu'à 2 appareils simultanés",
    "Participation aux défis de lecture",
    "Support prioritaire",
  ],
  ANNUEL: [
    "Accès illimité 12 mois — meilleur tarif",
    "Lecture en ligne et hors ligne",
    "Jusqu'à 3 appareils simultanés",
    "Défis de lecture + badges exclusifs",
    "Support prioritaire 24/7",
    "Renouvellement automatique optionnel",
  ],
};

export function getAbonnementsByEmail(email: string): MockAbonnement[] {
  return mockAbonnements.filter(
    (a) => a.utilisateurEmail.toLowerCase() === email.toLowerCase()
  );
}

export function getPlanDetails(plan: PlanType | string) {
  return getPlanByCode(plan) ?? getAllPlans().find((p) => p.code === plan);
}

export function getPaiementsByNom(nomComplet: string) {
  return mockPaiements.filter((p) => p.utilisateurNom === nomComplet);
}

export function getPlanCaracteristiques(code: string): string[] {
  if (code in PLAN_CARACTERISTIQUES) {
    return PLAN_CARACTERISTIQUES[code as PlanType];
  }
  const details = getPlanByCode(code);
  if (details) {
    return [
      `Accès au catalogue B LINKS`,
      `Durée : ${details.dureeJours} jours`,
      `Tarif : ${formatXaf(details.prix)}`,
    ];
  }
  return ["Accès au catalogue selon les conditions du plan."];
}

export function formatXaf(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} XAF`;
}

/** @deprecated Utiliser formatXaf */
export const formatXof = formatXaf;

export function formatDateFr(d: string): string {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}
