export const BRAND_NAME = "B LINKS";
export const BRAND_ADMIN = `${BRAND_NAME} Admin`;
export const BRAND_TAGLINE = "Plateforme de lecture numérique";

/** Titre de page admin : « Livres — B LINKS Admin » */
export function brandPageTitle(page: string): string {
  return `${page} — ${BRAND_ADMIN}`;
}
