"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { ReadingHabitsPanel } from "@/components/admin/ReadingHabitsPanel";
import { ExportDropdownButton } from "@/components/admin/ExportDropdownButton";
import { formatXaf } from "@/lib/abonnements-utils";
import { PieChartIcon } from "@/icons";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type {
  AdminStatsBooksSort,
  AdminStatsUsersPeriode,
} from "@/lib/api/admin-types";
import {
  fetchDashboardStats,
  fetchSearchTermsStats,
  fetchStatsBooks,
  fetchStatsUsers,
  type DashboardView,
  type SearchTermsFetchResult,
  type StatsBookRow,
  type StatsUsersView,
} from "@/lib/stats-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatEntier(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

const chartBase: ApexOptions = {
  chart: { fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
  dataLabels: { enabled: false },
  grid: {
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    labels: { style: { colors: "#6B7280", fontSize: "12px" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: "#6B7280", fontSize: "12px" } },
  },
  tooltip: { theme: "light" },
};

const SORT_LABELS: Record<AdminStatsBooksSort, string> = {
  nb_lectures: "Lectures",
  note_moyenne: "Note moyenne",
  nb_terminees: "Terminées",
  nb_lectures_7j: "Lectures (7 j)",
};

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function StatsKpiSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Chargement des indicateurs"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <TextSkeleton className="h-4 w-32" />
          <TextSkeleton className="mt-3 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function ChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
      aria-busy="true"
      aria-label="Chargement du graphique"
    >
      <TextSkeleton className="h-5 w-48" />
      <TextSkeleton className={`mt-6 w-full ${tall ? "h-[320px]" : "h-[300px]"}`} />
    </div>
  );
}

function StatsTableSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Chargement du tableau">
      <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
        {Array.from({ length: cols }).map((_, i) => (
          <TextSkeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3">
            {Array.from({ length: cols }).map((__, j) => (
              <TextSkeleton key={j} className="h-4 w-16" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatistiquesPage() {
  const apiMode = isApiConfigured();
  const apiSessionReady = !apiMode || hasApiSession();
  const [loading, setLoading] = useState(apiMode);
  const [triLivres, setTriLivres] = useState<AdminStatsBooksSort>("nb_lectures");
  const [periodeRecherche, setPeriodeRecherche] = useState<"7j" | "30j">("30j");
  const [sansResultatsUniquement, setSansResultatsUniquement] = useState(false);
  const [termesRecherche, setTermesRecherche] = useState<SearchTermsFetchResult>({
    data: [],
    topSansResultats: [],
  });
  const [topLivres, setTopLivres] = useState<StatsBookRow[]>([]);
  const [periodeUsers, setPeriodeUsers] = useState<AdminStatsUsersPeriode>("30j");
  const [usersStats, setUsersStats] = useState<StatsUsersView | null>(null);
  const [dashKpi, setDashKpi] = useState<DashboardView | null>(null);

  const showPageSkeleton = apiMode && loading && dashKpi === null;
  const listRefreshing = apiMode && loading && dashKpi !== null;

  useEffect(() => {
    if (!apiMode) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [books, users, dash, search] = await Promise.all([
        fetchStatsBooks({ sort: triLivres, limit: 10 }),
        fetchStatsUsers(periodeUsers),
        fetchDashboardStats(),
        fetchSearchTermsStats({
          periode: periodeRecherche,
          no_results: sansResultatsUniquement || undefined,
        }),
      ]);
      if (cancelled) return;
      setTopLivres(books.rows);
      setUsersStats(users);
      setDashKpi(dash.data);
      setTermesRecherche(search);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    apiMode,
    triLivres,
    periodeUsers,
    periodeRecherche,
    sansResultatsUniquement,
  ]);

  useEffect(() => {
    if (apiMode) return;
    void fetchStatsBooks({ sort: triLivres, limit: 10 }).then((res) =>
      setTopLivres(res.rows)
    );
  }, [apiMode, triLivres]);

  useEffect(() => {
    if (apiMode) return;
    void fetchStatsUsers(periodeUsers).then(setUsersStats);
  }, [apiMode, periodeUsers]);

  const usersSeries = useMemo(
    () => usersStats?.inscriptionsParMois ?? [],
    [usersStats]
  );

  const lecturesData = useMemo(
    () =>
      topLivres.map((l) => ({
        mois: l.titre.slice(0, 12),
        lectures: l.nbLectures,
      })),
    [topLivres]
  );

  const lecturesOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "bar", height: 300 },
      colors: ["#465FFF"],
      plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
      xaxis: {
        ...chartBase.xaxis,
        categories: lecturesData.map((d) => d.mois),
      },
    }),
    [lecturesData]
  );

  const usersOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "area", height: 300 },
      colors: ["#10B981"],
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: {
        ...chartBase.xaxis,
        categories: usersSeries.map((d) => d.mois),
      },
    }),
    [usersSeries]
  );

  const repartitionStatut = useMemo(
    () => Object.entries(usersStats?.repartitionStatut ?? {}),
    [usersStats]
  );

  const categoriesOptions = useMemo<ApexOptions>(
    () => ({
      chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
      labels: repartitionStatut.map(([k]) => k),
      colors: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
      legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
      dataLabels: { enabled: true },
    }),
    [repartitionStatut]
  );

  const inscriptionsSeries = useMemo(
    () => usersStats?.inscriptionsParMois ?? [],
    [usersStats]
  );

  const aboOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "line", height: 280 },
      colors: ["#465FFF"],
      stroke: { curve: "smooth", width: 2 },
      legend: { position: "top" },
      xaxis: {
        ...chartBase.xaxis,
        categories: inscriptionsSeries.map((d) => d.mois),
      },
    }),
    [inscriptionsSeries]
  );

  return (
    <div className="space-y-6" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Statistiques")} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/15">
            <PieChartIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Statistiques
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Analyses et tendances B LINKS
            </p>
          </div>
        </div>
        <ExportDropdownButton
          pdfPath={ADMIN_ROUTES.exports.statsPdf}
          xlsxPath={ADMIN_ROUTES.exports.statsXlsx}
          filenameBase="blinks-statistiques"
        />
      </div>

      {apiMode && !apiSessionReady && !loading && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          Connectez-vous avec un compte <strong>ADMIN</strong> pour charger les
          statistiques. Sans session active, les graphiques restent vides.
        </div>
      )}

      {showPageSkeleton ? (
        <StatsKpiSkeleton />
      ) : (
      <div
        className={
          listRefreshing
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {apiMode ? "Lectures (7 j)" : "Lectures (mai)"}
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(dashKpi?.nbLectures7j ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(dashKpi?.totalUtilisateurs ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Revenus mensuels</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatXaf(dashKpi?.revenusMonthly ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Abonnements actifs</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(
              usersStats?.nbAbonnesActifs ?? dashKpi?.abonnementsActifs ?? 0
            )}
          </p>
        </div>
      </div>
      </div>
      )}

      {showPageSkeleton ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      ) : (
      <div
        className={
          listRefreshing
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {apiMode ? "Top livres par lectures" : "Lectures par mois"}
          </h2>
          {apiMode && !loading && lecturesData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun livre avec statistiques.
            </p>
          ) : (
          <ReactApexChart
            options={lecturesOptions}
            series={[{ name: "Lectures", data: lecturesData.map((d) => d.lectures) }]}
            type="bar"
            height={300}
          />
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Croissance utilisateurs
            </h2>
            {apiMode && (
              <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Période</span>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  value={periodeUsers}
                  onChange={(e) =>
                    setPeriodeUsers(e.target.value as AdminStatsUsersPeriode)
                  }
                >
                  <option value="7j">7 jours</option>
                  <option value="30j">30 jours</option>
                  <option value="90j">90 jours</option>
                  <option value="365j">365 jours</option>
                </select>
              </label>
            )}
          </div>
          {apiMode && usersStats && (
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5">
                <span className="text-gray-500 dark:text-gray-400">Taux activation</span>
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {usersStats.tauxActivation.toFixed(1)} %
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5">
                <span className="text-gray-500 dark:text-gray-400">Abonnés actifs</span>
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {formatEntier(usersStats.nbAbonnesActifs)}
                </p>
              </div>
            </div>
          )}
          {apiMode && !loading && usersSeries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune inscription sur la période sélectionnée.
            </p>
          ) : (
          <ReactApexChart
            options={usersOptions}
            series={[{ name: "Inscriptions", data: usersSeries.map((d) => d.count) }]}
            type="area"
            height={300}
          />
          )}
          {apiMode && usersStats && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Répartition provider
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {Object.entries(usersStats.repartitionProvider).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span className="font-medium">{formatEntier(v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Répartition statut
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {Object.entries(usersStats.repartitionStatut).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <span className="font-medium">{formatEntier(v)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {showPageSkeleton ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
          <div className="lg:col-span-5">
            <ChartCardSkeleton tall />
          </div>
          <div className="lg:col-span-7">
            <ChartCardSkeleton />
          </div>
        </div>
      ) : (
      <div
        className={
          listRefreshing
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-5">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {apiMode ? "Répartition par statut compte" : "Répartition par catégorie"}
          </h2>
          {apiMode && !loading && repartitionStatut.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune donnée disponible.
            </p>
          ) : (
            <ReactApexChart
              options={categoriesOptions}
              series={repartitionStatut.map(([, v]) => v)}
              type="donut"
              height={320}
            />
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-7">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {apiMode
              ? "Inscriptions : tendance"
              : "Abonnements : nouveaux vs renouvellements"}
          </h2>
          {apiMode && !loading && inscriptionsSeries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune inscription sur la période.
            </p>
          ) : (
            <ReactApexChart
              options={aboOptions}
              series={[
                {
                  name: "Inscriptions",
                  data: inscriptionsSeries.map((d) => d.count),
                },
              ]}
              type="line"
              height={280}
            />
          )}
        </div>
      </div>
      </div>
      )}

      {showPageSkeleton ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <TextSkeleton className="h-5 w-56" />
          <div className="mt-4">
            <StatsTableSkeleton cols={apiMode ? 6 : 3} />
          </div>
        </div>
      ) : (
      <div
        className={
          listRefreshing
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {apiMode ? "Statistiques par livre" : "Top 5 des livres les plus lus"}
          </h2>
          {apiMode && (
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Trier par</span>
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={triLivres}
                onChange={(e) =>
                  setTriLivres(e.target.value as AdminStatsBooksSort)
                }
              >
                {(Object.keys(SORT_LABELS) as AdminStatsBooksSort[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  )
                )}
              </select>
            </label>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Rang
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Titre
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Lectures
                </TableCell>
                {apiMode && (
                  <>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Terminées
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Note
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Lectures 7j
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLivres.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600">{i + 1}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {l.titre}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-brand-500">
                    {formatEntier(l.nbLectures)}
                  </TableCell>
                  {apiMode && (
                    <>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {formatEntier(l.nbTerminees)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {l.noteMoyenne != null ? l.noteMoyenne.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {formatEntier(l.nbLectures7j)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {apiMode && !loading && topLivres.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Aucune statistique livre disponible.
            </p>
          )}
        </div>
      </div>
      </div>
      )}

      {apiMode && showPageSkeleton && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <TextSkeleton className="h-5 w-44" />
              <div className="mt-4">
                <StatsTableSkeleton cols={4} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <TextSkeleton className="h-5 w-40" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <TextSkeleton className="h-4 w-24" />
                    <TextSkeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {apiMode && !showPageSkeleton && (
        <div
          className={
            listRefreshing
              ? "pointer-events-none opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Termes de recherche
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <label className="flex items-center gap-2">
                  <span>Période</span>
                  <select
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={periodeRecherche}
                    onChange={(e) =>
                      setPeriodeRecherche(e.target.value as "7j" | "30j")
                    }
                  >
                    <option value="7j">7 jours</option>
                    <option value="30j">30 jours</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sansResultatsUniquement}
                    onChange={(e) => setSansResultatsUniquement(e.target.checked)}
                  />
                  <span>Sans résultats uniquement</span>
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Terme
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Recherches
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Taux clic
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Résultats moy.
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termesRecherche.data.map((row) => (
                    <TableRow key={row.terme}>
                      <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {row.terme}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {formatEntier(row.nb_recherches)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {row.taux_clic.toFixed(1)} %
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                        {row.nb_resultats_moyen.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {termesRecherche.data.length === 0 && !loading && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Aucun terme sur la période.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-4">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
              Top sans résultats
            </h2>
            <ul className="space-y-3">
              {termesRecherche.topSansResultats.map((row) => (
                <li
                  key={row.terme}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {row.terme}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatEntier(row.nb_recherches)}
                  </span>
                </li>
              ))}
            </ul>
            {termesRecherche.topSansResultats.length === 0 && !loading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune recherche sans résultat sur la période.
              </p>
            )}
          </div>
        </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Habitudes de lecture
        </h2>
        <ReadingHabitsPanel />
      </div>
    </div>
  );
}
