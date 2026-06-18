/** Affichage catalogue — champs absents du GET list admin books. */

export function formatCatalogYear(annee: number): string {
  return annee > 0 ? String(annee) : "—";
}

export function formatCatalogPages(nombrePages: number): string {
  return nombrePages > 0 ? String(nombrePages) : "—";
}

export function formatMaisonEdition(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "N/A";
  return value.trim();
}

export function hasCatalogCover(couvertureUrl: string | undefined | null): boolean {
  return Boolean(couvertureUrl?.trim());
}
