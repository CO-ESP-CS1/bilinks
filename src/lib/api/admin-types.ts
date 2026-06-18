import type {
  PlanType,
  StatutAbonnement,
  StatutCommentaire,
  StatutLivre,
  StatutPaiement,
  StatutUser,
  TypeRenouvellement,
} from "@/types/admin";
import type { PaginationMeta, PaginatedResponse } from "@/lib/api/pagination";

export type { PaginationMeta, PaginatedResponse };

// --- Utilisateurs ---
export type AdminUserListItemApi = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  statut: StatutUser | "PENDING";
  auth_provider?: "LOCAL" | "GOOGLE" | "HYBRID";
  email_verified?: boolean;
  date_inscription: string;
  derniere_connexion?: string | null;
  personne: {
    nom: string;
    prenom: string;
    points: number;
  };
  abonnement_actif: {
    id: string;
    plan: PlanType;
    date_debut: string;
    date_fin: string;
    jours_restants: number;
  } | null;
};

export type AdminUsersListResponse = PaginatedResponse<AdminUserListItemApi>;

/** POST /admin/users — corps (compte ADMIN uniquement). */
export type AdminCreateUserBody = {
  email: string;
  password: string;
  nom: string;
  prenom: string;
};

/** PATCH /admin/users/{id}/ban|unban — 200 */
export type AdminUserStatutResponse = {
  id: string;
  statut: StatutUser | "PENDING";
};

/** @deprecated Préférer `AdminUserStatutResponse` (ban et unban partagent la même réponse). */
export type AdminBanUserResponse = AdminUserStatutResponse;

/** POST /admin/users — 201 */
export type AdminCreateAdminResponse = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  statut: StatutUser | "PENDING";
};

export type AdminUserDetailAbonnementApi = {
  id: string;
  paiement_id?: string | null;
  plan: PlanType;
  plan_id: string;
  date_debut: string;
  date_fin: string;
  statut: StatutAbonnement;
  type_renouvellement: TypeRenouvellement;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetailPaiementApi = {
  id: string;
  plan: PlanType;
  plan_id: string;
  montant: number;
  devise: string;
  operateur?: string | null;
  numero_telephone?: string | null;
  ref_transaction: string;
  statut: StatutPaiement;
  createdAt: string;
  updatedAt: string;
};

/** GET /admin/users/{id} — profil complet + historiques + compteurs (runtime). */
export type AdminUserDetailResponse = {
  auth: {
    id: string;
    email: string;
    role: "ADMIN" | "USER";
    statut: StatutUser | "PENDING";
    auth_provider?: string;
    email_verified?: boolean;
    date_inscription: string;
    numero_telephone?: string | null;
  };
  personne: {
    nom: string;
    prenom: string;
    bio?: string | null;
    ecole?: string | null;
    niveau?: string | null;
    points: number;
    deleted_at?: string | null;
  };
  abonnements: AdminUserDetailAbonnementApi[];
  paiements: AdminUserDetailPaiementApi[];
  nb_commentaires?: number;
  nb_notes?: number;
  nb_defis_completes?: number;
};

// --- Commentaires ---
export type AdminCommentListItemApi = {
  id: string;
  contenu: string;
  statut: StatutCommentaire;
  createdAt: string;
  livre: { id: string; titre: string };
  auteur: { email: string; nom: string; prenom: string };
};

export type AdminCommentsListResponse =
  PaginatedResponse<AdminCommentListItemApi>;

// --- Paiements ---
export type AdminPaymentListItemApi = {
  id: string;
  ref_transaction: string;
  statut: StatutPaiement;
  montant: number;
  devise: string;
  operateur?: string | null;
  createdAt: string;
  auth: { email: string };
  plan: { plan: PlanType; prix: number };
};

export type AdminPaymentsListResponse =
  PaginatedResponse<AdminPaymentListItemApi>;

// --- Livres ---
export type AdminBookListItemApi = {
  id: string;
  titre: string;
  /** Swagger nullable — chaîne en pratique. */
  langue?: string | null;
  statut: StatutLivre;
  isbn?: string | null;
  resume?: string | null;
  couverture_url?: string | null;
  annee_publication?: number | null;
  nombre_pages?: number | null;
  url_externe_livre?: string | null;
  nb_lectures?: number;
  note_moyenne?: number | null;
  type_livre?: "INTERNE" | "EXTERNE";
  is_downloadable?: boolean;
  maison_edition?: string | null;
  auteurs?: Array<{ id: string; nom: string; prenom: string }>;
  categories?: Array<{ id: string; nom: string }>;
};

export type AdminBooksListResponse = PaginatedResponse<AdminBookListItemApi>;

export type AdminBookCreateResponse = {
  id: string;
  titre: string;
  type_livre: string;
  statut: StatutLivre;
};

/** Réponse `PATCH /admin/books/{id}` — mise à jour (HTTP 200). */
export type AdminBookUpdateResponse = {
  id: string;
  updatedAt: string;
  couverture_url?: string | null;
};

/** Réponse `PATCH /admin/books/{id}/archive` — statut ARCHIVE. */
export type AdminBookArchiveResponse = {
  id: string;
  statut: StatutLivre;
};

/** Auteur renvoyé après association livre. */
export type AdminBookAuthorBrief = {
  id: string;
  nom: string;
  prenom: string;
};

/** Réponse `POST /admin/books/{id}/authors` — remplace tous les auteurs. */
export type AdminBookAuthorsResponse = {
  auteurs: AdminBookAuthorBrief[];
};

/** Catégorie renvoyée après association livre. */
export type AdminBookCategoryBrief = {
  id: string;
  nom: string;
};

/** Réponse `POST /admin/books/{id}/categories` — remplace toutes les catégories. */
export type AdminBookCategoriesResponse = {
  categories: AdminBookCategoryBrief[];
};

// --- Plans ---
export type AdminPlanApi = {
  id: string;
  plan: string;
  prix: number;
  devise: string;
  duree_jours: number;
  statut: "ACTIF" | "INACTIF";
};

/** GET /admin/plans — tableau racine (OpenAPI) ou enveloppe `{ data }` (runtime Nest). */
export type AdminPlansListResponse =
  | AdminPlanApi[]
  | { data: AdminPlanApi[] };

/** POST /admin/plans — 201 (sans `statut` dans le schéma OpenAPI ; présent en runtime). */
export type AdminPlanCreateResponse = Omit<AdminPlanApi, "statut"> & {
  statut?: AdminPlanApi["statut"];
};

/** PATCH /admin/plans/{id} — 200 */
export type AdminPlanUpdateResponse = {
  id: string;
  prix: number;
  statut: AdminPlanApi["statut"];
};

// --- Abonnements ---
export type AdminSubscriptionListItemApi = {
  id: string;
  plan: { plan: string; prix: number };
  date_debut: string;
  date_fin: string;
  statut: StatutAbonnement;
  type_renouvellement: TypeRenouvellement;
  auth: {
    email: string;
    personne: { nom: string; prenom: string };
  };
};

export type AdminSubscriptionsListResponse =
  PaginatedResponse<AdminSubscriptionListItemApi>;

// --- Auteurs / catégories ---
export type AdminAuteurApi = {
  id: string;
  nom: string;
  prenom?: string | null;
  bio?: string | null;
  nb_livres?: number;
  createdAt?: string;
};

export type AdminCategorieApi = {
  id: string;
  nom: string;
  description?: string | null;
  nb_livres?: number;
  createdAt?: string;
};

export type AdminAuteursListResponse = PaginatedResponse<AdminAuteurApi>;

/** Réponse `PATCH /admin/auteurs/{id}` — pas de détail auteur, seulement accusé de mise à jour. */
export type AdminAuteurUpdateResponse = {
  id: string;
  updatedAt: string;
};

/** Réponse `DELETE /admin/auteurs/{id}` — soft delete (`deleted_at`). */
export type AdminAuteurDeleteResponse = {
  deleted_at: string;
};

/** Réponse `POST /admin/badges` — identifiant + URL Cloudinary de l’icône. */
export type AdminBadgeCreateResponse = {
  id: string;
  icone: string;
};

/** Réponse `PATCH /admin/badges/{id}` — accusé de mise à jour. */
export type AdminBadgeUpdateResponse = {
  id: string;
  updatedAt: string;
  /** Présent si une nouvelle icône a été uploadée sur Cloudinary. */
  icone?: string;
};

export type AdminCategoriesListResponse = PaginatedResponse<AdminCategorieApi>;

/** Réponse `POST /admin/categories` — création (HTTP 201). */
export type AdminCategorieCreateResponse = {
  id: string;
  nom: string;
};

/** Réponse `PATCH /admin/categories/{id}` — mise à jour partielle. */
export type AdminCategorieUpdateResponse = {
  id: string;
  updatedAt: string;
};

/** Réponse `DELETE /admin/categories/{id}` — soft delete (`deleted_at`). */
export type AdminCategorieDeleteResponse = {
  deleted_at: string;
};

// --- Bibliothèques ---
export type AdminLibraryApi = {
  id: string;
  nom: string;
  type: "INTERNE" | "EXTERNE";
  statut: "ACTIVE" | "ARCHIVEE";
  description?: string;
  /** Swagger : parfois `null`, une URL ou `{}` pour les bibliothèques internes. */
  url_externe?: string | Record<string, unknown> | null;
  nb_livres?: number;
};

export type AdminLibrariesListResponse = PaginatedResponse<AdminLibraryApi>;

/** Réponse `POST /admin/libraries` — statut ACTIVE par défaut côté serveur. */
export type AdminLibraryCreateResponse = {
  id: string;
  nom: string;
  type: string;
};

/** Réponse `PATCH /admin/libraries/{id}` — mise à jour partielle. */
export type AdminLibraryUpdateResponse = {
  id: string;
  updatedAt: string;
};

/** Réponse `PATCH /admin/libraries/{id}/archive` — statut ARCHIVEE. */
export type AdminLibraryArchiveResponse = {
  statut: string;
};

/** Réponse `PATCH /admin/libraries/{id}/unarchive` — statut ACTIVE. */
export type AdminLibraryUnarchiveResponse = {
  statut: string;
};

/** Réponse `DELETE /admin/libraries/{bibId}/books/{bookId}`. */
export type AdminLibraryRemoveBookResponse = {
  message: string;
};

/** Réponse `POST /admin/libraries/{id}/books`. */
export type AdminLibraryAddBooksResponse = {
  added: number;
};

// --- Défis ---
export type AdminChallengeListItemApi = {
  id: string;
  titre: string;
  type: string;
  statut: string;
  date_debut: string;
  date_fin: string;
  objectif_valeur: number;
  points_bonus?: number;
  nb_participants: number;
  badge?: { nom: string; icone: string };
};

export type AdminChallengesListResponse =
  PaginatedResponse<AdminChallengeListItemApi>;

/** Réponse `POST /admin/challenges` — création (HTTP 201). */
export type AdminChallengeCreateResponse = {
  id: string;
};

/** Réponse `PATCH /admin/challenges/{id}` — mise à jour (défi ACTIF). */
export type AdminChallengeUpdateResponse = {
  id: string;
  updatedAt: string;
};

/** Réponse `PATCH /admin/challenges/{id}/cancel` — annulation (RG63). */
export type AdminChallengeCancelResponse = {
  statut: string;
  nb_utilisateurs_echoues: number;
};

export type StatutChallengeParticipant = "EN_COURS" | "COMPLETE" | "ECHOUE";

export type AdminChallengeParticipantItemApi = {
  auth: {
    id: string;
    email: string;
    personne: { nom: string; prenom: string };
  };
  progression: number;
  statut: StatutChallengeParticipant;
  date_completion: string | null;
};

/** Réponse `GET /admin/challenges/{id}/participants`. */
export type AdminChallengeParticipantsResponse =
  PaginatedResponse<AdminChallengeParticipantItemApi>;

// --- Badges ---
export type AdminBadgeListItemApi = {
  id: string;
  nom: string;
  icone: string;
  couleur: string;
  /** Swagger : `object` nullable — en pratique souvent une chaîne ou `{}`. */
  description?: string | Record<string, unknown> | null;
  points: number;
  nb_utilisateurs: number;
};

export type AdminBadgesListResponse = PaginatedResponse<AdminBadgeListItemApi>;

// --- Stats ---
export type AdminStatsDashboardApi = {
  nb_utilisateurs_actifs: number;
  nb_abonnements_actifs: number;
  revenue_mois_courant: number;
  nb_livres_publies: number;
  nb_lectures_7j: number;
  nb_inscriptions_7j: number;
  nb_paiements_succes_7j: number;
  top_5_livres: Array<{
    titre: string;
    type_livre: string;
    nb_lectures: number;
    note_moyenne?: number | null;
  }>;
};

export type AdminStatsUsersPeriode = "7j" | "30j" | "90j" | "365j";

export type AdminStatsUsersApi = {
  inscriptions_par_jour: Array<{ date: string; count: number }>;
  repartition_provider: Record<string, number>;
  repartition_statut: Record<string, number>;
  taux_activation: number;
  nb_abonnes_actifs: number;
};

export const ADMIN_STATS_BOOKS_SORT = [
  "nb_lectures",
  "note_moyenne",
  "nb_terminees",
  "nb_lectures_7j",
] as const;

export type AdminStatsBooksSort = (typeof ADMIN_STATS_BOOKS_SORT)[number];

export type AdminStatsBookItemApi = {
  livre: {
    id: string;
    titre: string;
    type_livre: string;
    statut: string;
  };
  nb_lectures: number;
  nb_terminees: number;
  note_moyenne?: number | null;
  nb_notes: number;
  nb_lectures_7j: number;
};

export type AdminStatsBooksResponse =
  PaginatedResponse<AdminStatsBookItemApi>;

export type AdminStatsSearchTermsApi = {
  data: Array<{
    terme: string;
    nb_recherches: number;
    taux_clic: number;
    nb_resultats_moyen: number;
  }>;
  top_sans_resultats: Array<{ terme: string; nb_recherches: number }>;
};

export type AdminActivityTypeApi = "INSCRIPTION" | "PAIEMENT";

export type AdminStatsActivityItemApi = {
  type: AdminActivityTypeApi;
  date: string;
  auth_id?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  auth_provider?: string;
  statut?: string;
  id?: string;
  montant?: number;
  devise?: string;
  operateur?: string | null;
  plan?: string;
};

export type AdminStatsActivityResponse =
  PaginatedResponse<AdminStatsActivityItemApi>;

export type AdminStatsActivityPeriode = "7j" | "30j" | "90j";

// --- Notifications in-app ---
export const ADMIN_NOTIFICATION_TYPES = [
  "ANNONCE",
  "PROMOTION",
  "MAINTENANCE",
  "ACTUALITE",
  "ALERTE",
] as const;

export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

/** POST /admin/notifications */
export type AdminCreateNotificationBody = {
  auth_id?: string;
  titre: string;
  contenu?: string;
  type: AdminNotificationType;
};

export type AdminCreateNotificationResponseUser = {
  cible: "UTILISATEUR";
  auth_id: string;
  created: number;
  notification_id: string;
};

export type AdminCreateNotificationResponseAll = {
  cible: "TOUS";
  created: number;
};

export type AdminCreateNotificationResponse =
  | AdminCreateNotificationResponseUser
  | AdminCreateNotificationResponseAll;

/** GET /admin/notifications — un élément de l'historique groupé par envoi */
export type AdminNotificationGroupItem = {
  id: string;
  titre: string;
  contenu: string | null;
  type: AdminNotificationType;
  cible: "TOUS" | "UTILISATEUR";
  envoyeLe: string;
  total_destinataires: number;
  nb_lus: number;
};

export type AdminNotificationsListResponse = {
  data: AdminNotificationGroupItem[];
  meta: PaginationMeta;
};

// --- Erreur NestJS ---
export type NestJsErrorPayload = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
