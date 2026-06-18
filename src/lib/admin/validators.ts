import type { TypeDefi } from "@/types/admin";

export const CHALLENGE_TITRE_MAX_LENGTH = 200;
export const BADGE_NOM_MAX_LENGTH = 150;
export const BADGE_ICONE_MAX_BYTES = 5 * 1024 * 1024;

export function validateChallengeTargets(
  type: TypeDefi,
  ids: {
    categorie_id?: string;
    auteur_id?: string;
    livre_id?: string;
  }
): string | null {
  switch (type) {
    case "CATEGORIE":
      return ids.categorie_id?.trim()
        ? null
        : "Sélectionnez une catégorie pour ce type de défi.";
    case "AUTEUR":
      return ids.auteur_id?.trim()
        ? null
        : "Sélectionnez un auteur pour ce type de défi.";
    case "LIVRE_SPECIFIQUE":
      return ids.livre_id?.trim()
        ? null
        : "Sélectionnez un livre pour ce type de défi.";
    default:
      return null;
  }
}

export function validateChallengeCreateInput(input: {
  titre: string;
  type: TypeDefi;
  objectif_valeur: number;
  badge_id: string;
  date_debut: string;
  date_fin: string;
  categorie_id?: string;
  auteur_id?: string;
  livre_id?: string;
}): string | null {
  const titre = input.titre.trim();
  if (!titre) return "Le titre est obligatoire.";
  if (titre.length > CHALLENGE_TITRE_MAX_LENGTH) {
    return `Le titre ne peut pas dépasser ${CHALLENGE_TITRE_MAX_LENGTH} caractères.`;
  }
  if (!input.badge_id) return "Sélectionnez un badge récompense.";
  if (!Number.isFinite(input.objectif_valeur) || input.objectif_valeur < 1) {
    return "La valeur objectif doit être un entier d'au moins 1.";
  }
  if (input.date_fin <= input.date_debut) {
    return "La date de fin doit être postérieure à la date de début.";
  }
  return validateChallengeTargets(input.type, {
    categorie_id: input.categorie_id,
    auteur_id: input.auteur_id,
    livre_id: input.livre_id,
  });
}

/** Corps `POST /admin/challenges` — respecte chk_defi_exclusivite (une seule cible FK). */
export function buildChallengeCreateBody(input: {
  titre: string;
  type: TypeDefi;
  objectif_valeur: number;
  badge_id: string;
  date_debut: string;
  date_fin: string;
  description?: string;
  points_bonus?: number;
  categorie_id?: string;
  auteur_id?: string;
  livre_id?: string;
}): Record<string, string | number> {
  const body: Record<string, string | number> = {
    titre: input.titre.trim(),
    type: input.type,
    objectif_valeur: input.objectif_valeur,
    badge_id: input.badge_id,
    date_debut: input.date_debut,
    date_fin: input.date_fin,
    points_bonus: input.points_bonus ?? 0,
  };
  const description = input.description?.trim();
  if (description) body.description = description;

  switch (input.type) {
    case "CATEGORIE":
      body.categorie_id = input.categorie_id!.trim();
      break;
    case "AUTEUR":
      body.auteur_id = input.auteur_id!.trim();
      break;
    case "LIVRE_SPECIFIQUE":
      body.livre_id = input.livre_id!.trim();
      break;
  }

  return body;
}

export function validateChallengeUpdateInput(input: {
  titre?: string;
  description?: string;
  date_fin?: string;
  date_debut?: string;
  objectif_valeur?: number;
}): string | null {
  const hasField =
    input.titre !== undefined ||
    input.description !== undefined ||
    input.date_fin !== undefined ||
    input.objectif_valeur !== undefined;
  if (!hasField) return "Aucune modification à enregistrer.";

  if (input.titre !== undefined) {
    const titre = input.titre.trim();
    if (!titre) return "Le titre est obligatoire.";
    if (titre.length > CHALLENGE_TITRE_MAX_LENGTH) {
      return `Le titre ne peut pas dépasser ${CHALLENGE_TITRE_MAX_LENGTH} caractères.`;
    }
  }
  if (
    input.objectif_valeur !== undefined &&
    (!Number.isFinite(input.objectif_valeur) || input.objectif_valeur < 1)
  ) {
    return "La valeur objectif doit être un entier d'au moins 1.";
  }
  if (input.date_fin && input.date_debut && input.date_fin <= input.date_debut) {
    return "La date de fin doit être postérieure à la date de début.";
  }
  return null;
}

/** Corps `PATCH /admin/challenges/{id}` — titre, description, date_fin, objectif_valeur. */
export function buildChallengeUpdateBody(input: {
  titre?: string;
  description?: string;
  date_fin?: string;
  objectif_valeur?: number;
}): Record<string, string | number> {
  const body: Record<string, string | number> = {};
  if (input.titre !== undefined) body.titre = input.titre.trim();
  if (input.description !== undefined) body.description = input.description.trim();
  if (input.date_fin !== undefined) body.date_fin = input.date_fin;
  if (input.objectif_valeur !== undefined) {
    body.objectif_valeur = input.objectif_valeur;
  }
  return body;
}

export function validateSubscriptionCancelRaison(
  raison: string,
  apiMode: boolean
): string | null {
  const trimmed = raison.trim();
  if (!trimmed) return "La raison d’annulation est obligatoire.";
  if (apiMode && trimmed.length < 3) {
    return "La raison doit contenir au moins 3 caractères.";
  }
  return null;
}

export function buildPlanCreateBody(input: {
  plan: string;
  prix: number;
  duree_jours: number;
  devise?: string;
}): { plan: string; prix: number; devise: string; duree_jours: number } {
  return {
    plan: input.plan,
    prix: input.prix,
    devise: input.devise ?? "XOF",
    duree_jours: input.duree_jours,
  };
}

export function buildBanUserBody(raison?: string): { raison?: string } {
  const trimmed = raison?.trim();
  return trimmed ? { raison: trimmed } : {};
}

export function buildAdminCreateBody(input: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}): { nom: string; prenom: string; email: string; password: string } {
  return {
    nom: input.nom.trim(),
    prenom: input.prenom.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

export function validateAdminCreateBody(
  input: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
  },
  apiMode: boolean
): string | null {
  if (!input.nom.trim() || !input.prenom.trim() || !input.email.trim()) {
    return "Nom, prénom et e-mail sont requis.";
  }
  if (!input.password) {
    return "Le mot de passe est requis.";
  }
  if (apiMode && input.password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  return null;
}

export function buildAdminUsersQuery(input: {
  statut?: string;
  role?: string;
  q?: string;
  page?: number;
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(input.page ?? 1));
  params.set("limit", String(input.limit ?? 20));
  if (input.statut) params.set("statut", input.statut);
  if (input.role) params.set("role", input.role);
  if (input.q?.trim()) params.set("q", input.q.trim());
  return params;
}

export function buildStatsUsersQuery(input: {
  periode?: "7j" | "30j" | "90j" | "365j";
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.periode) params.set("periode", input.periode);
  return params;
}

export function buildStatsSearchTermsQuery(input: {
  periode?: "7j" | "30j";
  no_results?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.periode) params.set("periode", input.periode);
  if (input.no_results) params.set("no_results", "true");
  return params;
}

export function buildStatsActivityQuery(input: {
  periode?: "7j" | "30j" | "90j";
  page?: number;
  limit?: number;
  type?: "INSCRIPTION" | "PAIEMENT";
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.periode) params.set("periode", input.periode);
  if (input.page != null) params.set("page", String(input.page));
  if (input.limit != null) params.set("limit", String(input.limit));
  if (input.type) params.set("type", input.type);
  return params;
}

export function buildStatsBooksQuery(input: {
  sort?: string;
  page?: number;
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(input.page ?? 1));
  params.set("limit", String(input.limit ?? 20));
  if (input.sort) params.set("sort", input.sort);
  return params;
}

export function buildPlanUpdateBody(input: {
  prix?: number;
  duree_jours?: number;
  statut?: string;
}): Record<string, number | string> {
  const body: Record<string, number | string> = {};
  if (input.prix !== undefined) body.prix = input.prix;
  if (input.duree_jours !== undefined) body.duree_jours = input.duree_jours;
  if (input.statut !== undefined) body.statut = input.statut;
  return body;
}
