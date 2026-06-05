import { BRAND_ADMIN, BRAND_NAME } from "@/config/brand";
import type { Metadata } from "next";

/** Métadonnées racine — template appliqué aux pages enfants */
export const rootMetadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — Administration`,
    template: `%s — ${BRAND_ADMIN}`,
  },
  description: "Console d'administration B LINKS",
};

/** Titre d'une page admin (ex. « Livres — B LINKS Admin » via le template racine) */
export function adminPageMetadata(page: string): Metadata {
  return { title: page };
}

export function signInPageMetadata(): Metadata {
  return {
    title: "Connexion",
    description: "Connexion à la console d'administration B LINKS",
  };
}

export function notFoundPageMetadata(): Metadata {
  return { title: "Page introuvable" };
}
