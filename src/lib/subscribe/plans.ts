export type SubscribePlanId = "HEBDOMADAIRE" | "MENSUEL" | "ANNUEL";

export type PaymentProvider = "MTN" | "AIRTEL";

export type SubscribePlan = {
  id: SubscribePlanId;
  name: string;
  price: number;
  period: string;
  badge?: string;
  highlight?: boolean;
  savings?: string;
  monthlyNote?: string;
  features: string[];
  accent: "indigo" | "violet" | "green";
};

export const SUBSCRIBE_PLANS: SubscribePlan[] = [
  {
    id: "HEBDOMADAIRE",
    name: "Hebdomadaire",
    price: 1500,
    period: "/semaine",
    badge: "7 jours",
    accent: "indigo",
    features: [
      "Catalogue académique",
      "Lecture hors-ligne",
      "7 jours d'accès",
      "Support réactif",
    ],
  },
  {
    id: "MENSUEL",
    name: "Mensuel",
    price: 4500,
    period: "/mois",
    badge: "Le plus choisi",
    highlight: true,
    accent: "violet",
    features: [
      "Catalogue Standard",
      "Audio TTS inclus",
      "Sans publicité",
      "Nouveautés en priorité",
    ],
  },
  {
    id: "ANNUEL",
    name: "Annuel",
    price: 40000,
    period: "/an",
    badge: "Meilleure valeur",
    savings: "-26%",
    monthlyNote: "soit 3 333 F CFA / mois",
    accent: "green",
    features: [
      "Catalogue Premium",
      "Audio illimité",
      "Badge lecteur Pro",
      "Support prioritaire",
    ],
  },
];

export function getPlanById(id: string | null | undefined): SubscribePlan | null {
  return SUBSCRIBE_PLANS.find((p) => p.id === id) ?? null;
}

export function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
