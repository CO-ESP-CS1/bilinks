import { ApiError } from "@/lib/api/client";
import type { NestJsErrorPayload } from "@/lib/api/admin-types";

export const SESSION_REQUIRED_MESSAGE =
  "Connectez-vous avec un compte administrateur pour continuer.";

export const GENERIC_ERROR_MESSAGE =
  "Une erreur inattendue s'est produite. Réessayez dans un instant.";

const EXACT_MESSAGE_MAP: Record<string, string> = {
  "Mot de passe actuel incorrect.": "Mot de passe actuel incorrect.",
  "Mot de passe modifié avec succès.": "Mot de passe modifié avec succès.",
  "Erreur API.": GENERIC_ERROR_MESSAGE,
  "API non configurée (NEXT_PUBLIC_API_BASE_URL).":
    "Le serveur n'est pas configuré. Contactez l'administrateur technique.",
  "Session invalide.": "Votre session a expiré. Reconnectez-vous.",
  "Unauthorized": SESSION_REQUIRED_MESSAGE,
  "Forbidden": "Vous n'avez pas les droits pour effectuer cette action.",
};

const PATTERN_REPLACEMENTS: [RegExp, string][] = [
  [
    /objectif_valeur doit être strictement positif\.?/i,
    "La valeur objectif doit être supérieure à zéro.",
  ],
  [
    /objectif_valeur doit être un entier ≥ 1\.?/i,
    "La valeur objectif doit être un entier d'au moins 1.",
  ],
  [
    /date_fin doit être postérieure à date_debut\.?/i,
    "La date de fin doit être postérieure à la date de début.",
  ],
  [
    /categorie_id est obligatoire pour un défi de type CATEGORIE\.?/i,
    "Sélectionnez une catégorie pour ce type de défi.",
  ],
  [
    /auteur_id est obligatoire pour un défi de type AUTEUR\.?/i,
    "Sélectionnez un auteur pour ce type de défi.",
  ],
  [
    /livre_id est obligatoire pour un défi de type LIVRE_SPECIFIQUE\.?/i,
    "Sélectionnez un livre pour ce type de défi.",
  ],
  [
    /is_downloadable must be a boolean value\.?/i,
    "Indiquez si le livre est téléchargeable (oui ou non).",
  ],
  [
    /must be a boolean value\.?/i,
    "Une case à cocher attendue n'a pas la bonne valeur.",
  ],
  [
    /must be (a|an) \w+ value\.?/i,
    "Certaines informations du formulaire ne sont pas valides.",
  ],
  [
    /should not be empty\.?/i,
    "Un champ obligatoire est manquant.",
  ],
  [
    /must be longer than or equal to (\d+) characters?\.?/i,
    "Un texte est trop court.",
  ],
  [
    /must be shorter than or equal to (\d+) characters?\.?/i,
    "Un texte est trop long.",
  ],
  [
    /Failed to fetch\.?/i,
    "Impossible de joindre le serveur. Vérifiez votre connexion.",
  ],
  [
    /NetworkError/i,
    "Problème de connexion réseau. Réessayez.",
  ],
];

function extractNestMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload === "object" && "message" in payload) {
    const msg = (payload as NestJsErrorPayload).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg)) {
      const parts = msg
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
  }
  return null;
}

function isTechnicalMessage(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length > 280) return true;
  if (/<[a-z][\s\S]*>/i.test(t)) return true;
  if (/\/admin\/|\/auth\//i.test(t)) return true;
  if (/\bHTTP\s?\d{3}\b/i.test(t)) return true;
  if (/NEXT_PUBLIC_|JWT|Bearer|Internal Server Error/i.test(t)) return true;
  if (
    /\bmust be\b|\bshould not\b|\bcannot be\b|\bis required\b|\bis not allowed\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /\b(is_downloadable|url_externe|objectif_valeur|date_fin|date_debut|auteur_id|categorie_id|livre_id|points_bonus|type_livre|nb_utilisateurs)\b/.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function messageFromHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return "Les informations envoyées ne sont pas valides.";
    case 401:
      return SESSION_REQUIRED_MESSAGE;
    case 403:
      return "Vous n'avez pas les droits pour effectuer cette action.";
    case 404:
      return "Élément introuvable.";
    case 409:
      return "Cette action n'est pas possible : l'élément existe déjà ou est utilisé ailleurs.";
    case 413:
      return "Le fichier envoyé est trop volumineux.";
    case 422:
      return "Certaines informations du formulaire sont incorrectes.";
    case 429:
      return "Trop de tentatives. Patientez quelques instants.";
    case 500:
    case 502:
    case 503:
      return "Le serveur rencontre un problème. Réessayez plus tard.";
    default:
      return GENERIC_ERROR_MESSAGE;
  }
}

/** Transforme un message brut (API ou validation) en texte lisible. */
export function humanizeErrorMessage(
  raw: string | null | undefined,
  fallback = GENERIC_ERROR_MESSAGE
): string {
  if (!raw?.trim()) return fallback;

  let text = raw.trim();
  if (EXACT_MESSAGE_MAP[text]) return EXACT_MESSAGE_MAP[text];

  for (const [pattern, replacement] of PATTERN_REPLACEMENTS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
    }
  }

  if (EXACT_MESSAGE_MAP[text]) return EXACT_MESSAGE_MAP[text];
  if (isTechnicalMessage(text)) return fallback;
  return text;
}

/** Message utilisateur à partir d'une erreur inconnue (toast, formulaire…). */
export function formatUserFacingError(
  err: unknown,
  fallback = GENERIC_ERROR_MESSAGE
): string {
  return messageFromApiError(err, fallback);
}

export function messageFromApiError(
  err: unknown,
  fallback = GENERIC_ERROR_MESSAGE
): string {
  if (err instanceof ApiError) {
    const raw = extractNestMessage(err.payload);
    if (raw) {
      const humanized = humanizeErrorMessage(raw, "");
      if (humanized) return humanized;
    }
    if (err.status === 409 && raw) {
      const humanized409 = humanizeErrorMessage(raw, fallback);
      if (!isTechnicalMessage(humanized409)) return humanized409;
      return "Cette action n'est pas possible : conflit avec une donnée existante.";
    }
    return messageFromHttpStatus(err.status) || fallback;
  }

  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }

  if (err instanceof Error && err.message.trim()) {
    return humanizeErrorMessage(err.message, fallback);
  }

  return fallback;
}
