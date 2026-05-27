import type { MockLivre, MockPlanTarifaire, MockUtilisateur } from "@/lib/mock-data";

type AdminBookListItemApi = {
  id: string;
  titre: string;
  langue: string;
  statut: "PUBLIE" | "ARCHIVE";
  isbn?: string | null;
  nb_lectures?: number;
  note_moyenne?: number | null;
  type_livre?: "INTERNE" | "EXTERNE";
  auteurs?: Array<{ id: string; nom: string; prenom: string }>;
  categories?: Array<{ id: string; nom: string }>;
};

type AdminPlanApi = {
  id: string;
  plan: string;
  prix: number;
  devise: string;
  duree_jours: number;
  statut: "ACTIF" | "INACTIF";
};

type AdminUserListApi = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  statut: "ACTIF" | "BANNI";
  date_inscription: string;
  personne: {
    nom: string;
    prenom: string;
    points: number;
  };
  abonnement_actif: unknown | null;
};

export function mapAdminBookToMockLivre(row: AdminBookListItemApi): MockLivre {
  const firstCategory = row.categories?.[0]?.nom ?? "—";
  const anneeFallback = new Date().getFullYear();
  return {
    id: row.id,
    titre: row.titre,
    auteurs:
      row.auteurs?.map((a) => `${a.prenom} ${a.nom}`.trim()).filter(Boolean) ?? [],
    categorie: firstCategory,
    langue: row.langue || "Français",
    anneePublication: anneeFallback,
    nombrePages: 0,
    statut: row.statut ?? "PUBLIE",
    nbLectures: row.nb_lectures ?? 0,
    noteMoyenne: row.note_moyenne ?? null,
    couvertureUrl: "",
  };
}

export function mapAdminPlanToMockPlan(row: AdminPlanApi): MockPlanTarifaire {
  return {
    id: row.id,
    code: row.plan,
    nom: planLabelFromCode(row.plan),
    prix: Number(row.prix),
    dureeJours: row.duree_jours,
    devise: (row.devise as "XAF") ?? "XAF",
    statut: row.statut ?? "ACTIF",
    deletedAt: null,
  };
}

export function mapAdminUserToMockUser(row: AdminUserListApi): MockUtilisateur {
  return {
    id: row.id,
    nom: row.personne?.nom ?? "—",
    prenom: row.personne?.prenom ?? "—",
    email: row.email,
    ecole: "—",
    niveau: "—",
    role: row.role,
    statut: row.statut,
    points: row.personne?.points ?? 0,
    dateInscription: (row.date_inscription ?? "").slice(0, 10),
    abonnementActif: Boolean(row.abonnement_actif),
    deletedAt: null,
  };
}

function planLabelFromCode(code: string): string {
  const labels: Record<string, string> = {
    HEBDOMADAIRE: "Hebdomadaire",
    MENSUEL: "Mensuel",
    ANNUEL: "Annuel",
  };
  return labels[code] ?? code;
}

