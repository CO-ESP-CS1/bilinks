/** Utilitaires de suppression logique (soft delete) partagés. */

export function softDeleteTimestamp(): string {
  return new Date().toISOString();
}

export function isSoftDeleted(
  deletedAt: string | null | undefined
): boolean {
  return deletedAt != null && deletedAt !== "";
}

export function formatSoftDeleteDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
