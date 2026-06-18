export type SubscribePlanId = "HEBDOMADAIRE" | "MENSUEL" | "ANNUEL";

export type PaymentProvider = "MTN" | "AIRTEL";

export type SubscribePlan = {
  id: SubscribePlanId;
  /** UUID backend (`GET /plans`) */
  apiId?: string;
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
    id: "MENSUEL",
    name: "Mensuel",
    price: 4900,
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
    price: 39900,
    period: "/an",
    badge: "Meilleure valeur",
    savings: "-32%",
    monthlyNote: "soit 3 325 F CFA / mois",
    accent: "green",
    features: [
      "Catalogue Premium",
      "Audio illimité",
      "Badge lecteur Pro",
      "Support prioritaire",
    ],
  },
];

/** Plans historiques non proposés à l'abonnement (rétrocompat affichage). */
const LEGACY_SUBSCRIBE_PLANS: SubscribePlan[] = [
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
];

export function getPlanById(id: string | null | undefined): SubscribePlan | null {
  return (
    SUBSCRIBE_PLANS.find((p) => p.id === id) ??
    LEGACY_SUBSCRIBE_PLANS.find((p) => p.id === id) ??
    null
  );
}

export function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
