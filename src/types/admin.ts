// Types domaine admin (UI) — source de vérité côté front

export type StatutLivre = "PUBLIE" | "ARCHIVE";
export type TypeBibliotheque = "INTERNE" | "EXTERNE";
export type StatutBibliotheque = "ACTIVE" | "ARCHIVEE";
export type StatutAbonnement = "ACTIF" | "EXPIRE" | "ANNULE" | "SUSPENDU";
export type StatutPaiement = "EN_ATTENTE" | "SUCCES" | "ECHEC";
export type TypeRenouvellement = "NOUVEAU" | "RENOUVELLEMENT" | "UPGRADE";
export type PlanType = "HEBDOMADAIRE" | "MENSUEL" | "ANNUEL";
export type StatutCommentaire = "PUBLIE" | "MODERE" | "SUPPRIME";
export type RoleUser = "USER" | "ADMIN";
export type StatutUser = "ACTIF" | "BANNI" | "PENDING";

export type TypeLivreCatalogue = "INTERNE" | "EXTERNE";

export interface MockLivre {
  id: string;
  titre: string;
  auteurs: string[];
  /** IDs API (liste admin) — pour formulaires d’édition */
  auteurIds?: string[];
  categorieIds?: string[];
  categories?: Array<{ id: string; nom: string }>;
  categorie: string;
  langue: string;
  isbn?: string | null;
  type_livre?: TypeLivreCatalogue;
  is_downloadable?: boolean;
  anneePublication: number;
  nombrePages: number;
  statut: StatutLivre;
  nbLectures: number;
  noteMoyenne: number | null;
  couvertureUrl: string;
  resume?: string;
  urlExterneLivre?: string;
  maisonEdition?: string | null;
}

export interface MockAuteur {
  id: string;
  nom: string;
  prenom: string;
  bio?: string;
  nbLivres: number;
  deletedAt: null | string;
}

export interface MockCategorie {
  id: string;
  nom: string;
  description: string;
  nbLivres: number;
  deletedAt: null | string;
}

export interface MockBibliotheque {
  id: string;
  nom: string;
  type: TypeBibliotheque;
  statut: StatutBibliotheque;
  description: string;
  urlExterne: string | null;
  nbLivres: number;
  deletedAt: string | null;
}

export interface MockUtilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  ecole: string;
  niveau: string;
  role: RoleUser;
  statut: StatutUser;
  points: number;
  dateInscription: string;
  abonnementActif: boolean;
  deletedAt: string | null;
}

export interface MockAbonnement {
  id: string;
  utilisateurNom: string;
  utilisateurEmail: string;
  plan: string;
  statut: StatutAbonnement;
  typeRenouvellement: TypeRenouvellement;
  dateDebut: string;
  dateFin: string;
  montant: number;
  deletedAt: string | null;
}

export interface MockPaiement {
  id: string;
  utilisateurNom: string;
  plan: PlanType;
  montant: number;
  operateur: string;
  numeroTelephone: string;
  statut: StatutPaiement;
  refTransaction: string | null;
  createdAt: string;
}

export interface MockCommentaire {
  id: string;
  utilisateurNom: string;
  livreTitre: string;
  contenu: string;
  statut: StatutCommentaire;
  createdAt: string;
}

export type StatutPlanTarifaire = "ACTIF" | "INACTIF";
export type DevisePlan = "XOF";

export interface MockPlanTarifaire {
  id: string;
  code: string;
  nom: string;
  prix: number;
  dureeJours: number;
  statut: StatutPlanTarifaire;
  devise: DevisePlan;
  deletedAt: string | null;
}

export type StatutDefi = "ACTIF" | "TERMINE" | "ANNULE" | "BROUILLON";

export type TypeDefi =
  | "NB_LIVRES"
  | "DUREE_LECTURE"
  | "CATEGORIE"
  | "AUTEUR"
  | "LIVRE_SPECIFIQUE";

export interface MockDefi {
  id: string;
  titre: string;
  description: string;
  objectif: string;
  pointsRecompense: number;
  dateDebut: string;
  dateFin: string;
  statut: StatutDefi;
  participants: number;
  type?: TypeDefi;
  badgeId?: string;
  badgeNom?: string;
  objectifValeur?: number;
  deletedAt: string | null;
}

export type RareteBadge = "COMMUN" | "RARE" | "EPIC";

export interface MockBadge {
  id: string;
  nom: string;
  description: string;
  condition: string;
  rarete: RareteBadge;
  nbAttribues: number;
  actif: boolean;
  icone?: string;
  couleur?: string;
  points?: number;
  deletedAt: string | null;
}

export type StatutNotification = "BROUILLON" | "ENVOYEE" | "PROGRAMMEE";
export type CibleNotification = "TOUS" | "ABONNES" | "NON_ABONNES" | "ECOLE";

export interface MockNotification {
  id: string;
  titre: string;
  message: string;
  cible: CibleNotification;
  statut: StatutNotification;
  envoyeLe: string | null;
  programmeLe: string | null;
  lus: number;
  totalCibles: number;
  deletedAt: string | null;
}
