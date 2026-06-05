/** Métadonnées de pagination — contrat backend (PaginationMetaSchema). */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

/** Réponse API sans pagination (ex. GET /admin/plans). */
export type DataOnlyResponse<T> = {
  data: T[];
};

/** Ancien format interne — conservé le temps de la migration. */
export type LegacyItemsResponse<T> = {
  items: T[];
};

export type ListPayload<T> =
  | PaginatedResponse<T>
  | DataOnlyResponse<T>
  | LegacyItemsResponse<T>
  | T[]
  | null
  | undefined;

/** Extrait `data[]` (API) ou `items[]` (legacy) ou un tableau racine. */
export function unwrapListData<T>(payload: ListPayload<T>): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("items" in payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function unwrapPaginationMeta<T>(
  payload: ListPayload<T>
): PaginationMeta | null {
  if (!payload || Array.isArray(payload)) return null;
  if ("meta" in payload && payload.meta) return payload.meta;
  return null;
}
