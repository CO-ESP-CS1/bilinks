import {
  mockCroissanceUtilisateurs,
  mockKPIs,
  mockLecturesParMois,
  mockTopLivres,
} from "@/lib/mock-data";
import type {
  AdminStatsActivityItemApi,
  AdminStatsActivityPeriode,
  AdminStatsActivityResponse,
  AdminStatsBookItemApi,
  AdminStatsBooksResponse,
  AdminStatsBooksSort,
  AdminStatsDashboardApi,
  AdminStatsSearchTermsApi,
  AdminStatsUsersApi,
  AdminStatsUsersPeriode,
} from "@/lib/api/admin-types";
import {
  buildStatsActivityQuery,
  buildStatsBooksQuery,
  buildStatsSearchTermsQuery,
  buildStatsUsersQuery,
} from "@/lib/admin/validators";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError, SESSION_REQUIRED_MESSAGE } from "@/lib/api/errors";
import {
  unwrapListData,
  unwrapPaginationMeta,
  type PaginationMeta,
  type PaginatedResponse,
} from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export type DashboardTopLivre = {
  titre: string;
  typeLivre: string;
  lectures: number;
  note: number | null;
};

export type DashboardView = {
  totalLivres: number;
  totalUtilisateurs: number;
  abonnementsActifs: number;
  revenusMonthly: number;
  livresAjoutes: number;
  nouveauxUsersHebdo: number;
  nbLectures7j: number;
  nbPaiementsSucces7j: number;
  topLivres: DashboardTopLivre[];
};

export type StatsUsersView = {
  inscriptionsParJour: Array<{ date: string; count: number }>;
  inscriptionsParMois: Array<{ mois: string; count: number }>;
  nbAbonnesActifs: number;
  tauxActivation: number;
  repartitionProvider: Record<string, number>;
  repartitionStatut: Record<string, number>;
};

function aggregateInscriptionsForChart(
  points: Array<{ date: string; count: number }>,
  periode: AdminStatsUsersPeriode
): Array<{ mois: string; count: number }> {
  if (periode === "7j" || periode === "30j") {
    return points.map((d) => ({ mois: d.date.slice(5), count: d.count }));
  }
  const byMonth = new Map<string, number>();
  for (const p of points) {
    const key = p.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.count);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, count]) => ({
      mois: `${ym.slice(5)}/${ym.slice(2, 4)}`,
      count,
    }));
}

function mockStatsUsersView(): StatsUsersView {
  return {
    inscriptionsParJour: [],
    inscriptionsParMois: mockCroissanceUtilisateurs.map((d) => ({
      mois: d.mois,
      count: d.total,
    })),
    nbAbonnesActifs: mockKPIs.abonnementsActifs,
    tauxActivation: 72,
    repartitionProvider: { LOCAL: 0, GOOGLE: 0, HYBRID: 0 },
    repartitionStatut: { PENDING: 0, ACTIF: 0, BANNI: 0 },
  };
}

function emptyStatsUsersView(): StatsUsersView {
  return {
    inscriptionsParJour: [],
    inscriptionsParMois: [],
    nbAbonnesActifs: 0,
    tauxActivation: 0,
    repartitionProvider: {},
    repartitionStatut: {},
  };
}

export type StatsBookRow = {
  id: string;
  titre: string;
  typeLivre?: string;
  statut?: string;
  nbLectures: number;
  nbTerminees: number;
  noteMoyenne: number | null;
  nbNotes: number;
  nbLectures7j: number;
};

export type StatsBooksFetchResult = {
  rows: StatsBookRow[];
  meta: PaginationMeta | null;
};

function mapStatsBookRow(row: AdminStatsBookItemApi): StatsBookRow {
  return {
    id: row.livre.id,
    titre: row.livre.titre,
    typeLivre: row.livre.type_livre,
    statut: row.livre.statut,
    nbLectures: row.nb_lectures,
    nbTerminees: row.nb_terminees,
    noteMoyenne:
      typeof row.note_moyenne === "number"
        ? row.note_moyenne
        : row.note_moyenne != null
          ? Number(row.note_moyenne)
          : null,
    nbNotes: row.nb_notes,
    nbLectures7j: row.nb_lectures_7j,
  };
}

function mockStatsBookRows(): StatsBookRow[] {
  return mockTopLivres.map((l, i) => ({
    id: `mock-${i}`,
    titre: l.titre,
    nbLectures: l.lectures,
    nbTerminees: 0,
    noteMoyenne: null,
    nbNotes: 0,
    nbLectures7j: 0,
  }));
}

export type DashboardDataSource = "api" | "mock" | "unavailable";

export type DashboardFetchResult = {
  data: DashboardView;
  source: DashboardDataSource;
  error?: string;
};

const emptyDashboard = (): DashboardView => ({
  totalLivres: 0,
  totalUtilisateurs: 0,
  abonnementsActifs: 0,
  revenusMonthly: 0,
  livresAjoutes: 0,
  nouveauxUsersHebdo: 0,
  nbLectures7j: 0,
  nbPaiementsSucces7j: 0,
  topLivres: [],
});

const fallbackDashboard = (): DashboardView => ({
  totalLivres: mockKPIs.totalLivres,
  totalUtilisateurs: mockKPIs.totalUtilisateurs,
  abonnementsActifs: mockKPIs.abonnementsActifs,
  revenusMonthly: mockKPIs.revenusMonthly,
  livresAjoutes: mockKPIs.livresAjoutes,
  nouveauxUsersHebdo: mockKPIs.nouveauxUsersHebdo,
  nbLectures7j: mockLecturesParMois.at(-1)?.lectures ?? 0,
  nbPaiementsSucces7j: 0,
  topLivres: mockTopLivres.slice(0, 5).map((l) => ({
    titre: l.titre,
    typeLivre: "INTERNE",
    lectures: l.lectures,
    note: null,
  })),
});

function mapDashboard(api: AdminStatsDashboardApi): DashboardView {
  return {
    totalLivres: api.nb_livres_publies,
    totalUtilisateurs: api.nb_utilisateurs_actifs,
    abonnementsActifs: api.nb_abonnements_actifs,
    revenusMonthly: api.revenue_mois_courant,
    livresAjoutes: 0,
    nouveauxUsersHebdo: api.nb_inscriptions_7j,
    nbLectures7j: api.nb_lectures_7j,
    nbPaiementsSucces7j: api.nb_paiements_succes_7j,
    topLivres: (api.top_5_livres ?? []).map((l) => ({
      titre: l.titre,
      typeLivre: l.type_livre,
      lectures: l.nb_lectures,
      note:
        typeof l.note_moyenne === "number"
          ? l.note_moyenne
          : l.note_moyenne != null
            ? Number(l.note_moyenne)
            : null,
    })),
  };
}

/**
 * Tableau de bord global — GET /admin/stats/dashboard.
 * Métriques clés + top_5_livres (sans paramètres).
 */
export async function fetchDashboardStats(): Promise<DashboardFetchResult> {
  if (!isApiConfigured()) {
    return {
      data: emptyDashboard(),
      source: "unavailable",
      error: API_REQUIRED_MESSAGE,
    };
  }

  if (!isAdminListApiReady()) {
    return {
      data: emptyDashboard(),
      source: "unavailable",
      error: SESSION_REQUIRED_MESSAGE,
    };
  }

  try {
    const api = await apiRequest<AdminStatsDashboardApi>(
      ADMIN_ROUTES.stats.dashboard
    );
    return { data: mapDashboard(api), source: "api" };
  } catch (err) {
    return {
      data: emptyDashboard(),
      source: "unavailable",
      error: messageFromApiError(err, "Impossible de charger le tableau de bord."),
    };
  }
}

export type DashboardAlerts = {
  paiementsEnAttente: number;
  commentairesAModerer: number;
};

export type DashboardActivityItem = {
  id: string;
  type: "inscription" | "paiement";
  message: string;
  temps: string;
  statutPaiement?: string;
};

function formatRelativeTimeFr(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function displayNameFromActivity(row: AdminStatsActivityItemApi): string {
  const name = [row.prenom, row.nom].filter(Boolean).join(" ").trim();
  return name || row.email || "Utilisateur";
}

function mapActivityItem(row: AdminStatsActivityItemApi): DashboardActivityItem {
  const name = displayNameFromActivity(row);
  if (row.type === "INSCRIPTION") {
    return {
      id: `inscription-${row.auth_id}-${row.date}`,
      type: "inscription",
      message: `${name} s'est inscrit(e)`,
      temps: formatRelativeTimeFr(row.date),
    };
  }

  const montant = new Intl.NumberFormat("fr-FR").format(row.montant ?? 0);
  const devise = row.devise ?? "XOF";
  const operateur = row.operateur?.trim() || "Mobile Money";
  const statut = row.statut ?? "EN_ATTENTE";
  const statutLabel =
    statut === "SUCCES"
      ? "reçu"
      : statut === "ECHEC"
        ? "échoué"
        : "en attente";

  return {
    id: `paiement-${row.id ?? row.date}`,
    type: "paiement",
    message: `Paiement ${operateur} ${statutLabel} — ${name} (${montant} ${devise})`,
    temps: formatRelativeTimeFr(row.date),
    statutPaiement: statut,
  };
}

/**
 * Activité récente dashboard — GET /admin/stats/activity.
 */
export async function fetchDashboardActivity(options?: {
  periode?: AdminStatsActivityPeriode;
  limit?: number;
}): Promise<DashboardActivityItem[]> {
  if (!isApiConfigured() || !isAdminListApiReady()) {
    return [];
  }

  try {
    const params = buildStatsActivityQuery({
      periode: options?.periode ?? "7j",
      page: 1,
      limit: options?.limit ?? 10,
    });
    const payload = await apiRequest<AdminStatsActivityResponse>(
      `${ADMIN_ROUTES.stats.activity}?${params.toString()}`
    );
    return unwrapListData<AdminStatsActivityItemApi>(payload).map(mapActivityItem);
  } catch {
    return [];
  }
}

async function fetchListTotal(path: string, query: string): Promise<number> {
  const payload = await apiRequest<PaginatedResponse<unknown>>(
    `${path}?${query}`
  );
  const meta = unwrapPaginationMeta(payload);
  if (meta) return meta.total;
  return unwrapListData(payload).length;
}

export async function fetchDashboardAlerts(): Promise<DashboardAlerts | null> {
  if (!isAdminListApiReady()) {
    return null;
  }

  try {
    const [paiementsEnAttente, commentairesAModerer] = await Promise.all([
      fetchListTotal(ADMIN_ROUTES.payments.list, "page=1&limit=1&statut=EN_ATTENTE"),
      fetchListTotal(ADMIN_ROUTES.comments.list, "page=1&limit=1&statut=MODERE"),
    ]);
    return { paiementsEnAttente, commentairesAModerer };
  } catch {
    return null;
  }
}

/**
 * Statistiques utilisateurs — GET /admin/stats/users.
 * Query periode : 7j | 30j | 90j | 365j (défaut 30j).
 */
export async function fetchStatsUsers(
  periode: AdminStatsUsersPeriode = "30j"
): Promise<StatsUsersView> {
  if (!isApiConfigured()) {
    return emptyStatsUsersView();
  }
  if (!isAdminListApiReady()) {
    return emptyStatsUsersView();
  }

  try {
    const params = buildStatsUsersQuery({ periode });
    const qs = params.toString();
    const api = await apiRequest<AdminStatsUsersApi>(
      `${ADMIN_ROUTES.stats.users}${qs ? `?${qs}` : ""}`
    );
    const inscriptionsParJour = api.inscriptions_par_jour ?? [];
    return {
      inscriptionsParJour,
      inscriptionsParMois: aggregateInscriptionsForChart(
        inscriptionsParJour,
        periode
      ),
      nbAbonnesActifs: api.nb_abonnes_actifs,
      tauxActivation: api.taux_activation,
      repartitionProvider: api.repartition_provider ?? {},
      repartitionStatut: api.repartition_statut ?? {},
    };
  } catch {
    return emptyStatsUsersView();
  }
}

/**
 * Statistiques par livre — GET /admin/stats/books.
 * Query : sort (défaut nb_lectures), page, limit. Réponse { data[], meta }.
 */
export async function fetchStatsBooks(options?: {
  sort?: AdminStatsBooksSort;
  page?: number;
  limit?: number;
}): Promise<StatsBooksFetchResult> {
  if (!isApiConfigured()) {
    return { rows: [], meta: null };
  }
  if (!isAdminListApiReady()) {
    return { rows: [], meta: null };
  }

  try {
    const params = buildStatsBooksQuery({
      sort: options?.sort ?? "nb_lectures",
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    });

    const payload = await apiRequest<AdminStatsBooksResponse>(
      `${ADMIN_ROUTES.stats.books}?${params.toString()}`
    );
    const rows = unwrapListData<AdminStatsBookItemApi>(payload);
    return {
      rows: rows.map(mapStatsBookRow),
      meta: unwrapPaginationMeta(payload),
    };
  } catch {
    return { rows: [], meta: null };
  }
}

export type SearchTermsFetchResult = {
  data: AdminStatsSearchTermsApi["data"];
  topSansResultats: AdminStatsSearchTermsApi["top_sans_resultats"];
};

const emptySearchTerms = (): SearchTermsFetchResult => ({
  data: [],
  topSansResultats: [],
});

/**
 * Analyse des termes de recherche — GET /admin/stats/search-terms.
 * Query : periode (7j|30j, défaut 30j), no_results (bool).
 */
export async function fetchSearchTermsStats(options?: {
  periode?: "7j" | "30j";
  no_results?: boolean;
}): Promise<SearchTermsFetchResult> {
  if (!isApiConfigured()) {
    return emptySearchTerms();
  }
  if (!isAdminListApiReady()) {
    return emptySearchTerms();
  }

  try {
    const params = buildStatsSearchTermsQuery({
      periode: options?.periode ?? "30j",
      no_results: options?.no_results,
    });
    const qs = params.toString();
    const api = await apiRequest<AdminStatsSearchTermsApi>(
      `${ADMIN_ROUTES.stats.searchTerms}${qs ? `?${qs}` : ""}`
    );
    return {
      data: api.data ?? [],
      topSansResultats: api.top_sans_resultats ?? [],
    };
  } catch {
    return emptySearchTerms();
  }
}
