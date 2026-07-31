"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import Badge from "@/components/ui/badge/Badge";
import { ExportDropdownButton } from "@/components/admin/ExportDropdownButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatXaf } from "@/lib/abonnements-utils";
import { ArrowDownIcon, ArrowUpIcon, PieChartIcon } from "@/icons";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type {
  AdminPerformanceOverviewApi,
  AdminPerformancePeriode,
} from "@/lib/api/admin-types";
import { fetchPerformanceOverviewPersisted } from "@/lib/performance-store";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatEntier(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function formatDureeLecture(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return `${heures} h ${reste} min`;
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

function etablissementStatutBadge(statut: "ACTIF" | "SUSPENDU" | "EXPIRE") {
  if (statut === "ACTIF") {
    return (
      <Badge color="success" size="sm" variant="light">
        Actif
      </Badge>
    );
  }
  if (statut === "SUSPENDU") {
    return (
      <Badge color="warning" size="sm" variant="light">
        Suspendu
      </Badge>
    );
  }
  return (
    <Badge color="light" size="sm" variant="light">
      Expiré
    </Badge>
  );
}

function revenuPaiementBadge(
  statut: "EN_ATTENTE" | "SUCCES" | "ECHEC" | undefined
) {
  if (!statut) return null;
  if (statut === "SUCCES") {
    return (
      <Badge color="success" size="sm" variant="light">
        Encaissé
      </Badge>
    );
  }
  if (statut === "EN_ATTENTE") {
    return (
      <Badge color="warning" size="sm" variant="light">
        En attente
      </Badge>
    );
  }
  return (
    <Badge color="error" size="sm" variant="light">
      Échec
    </Badge>
  );
}

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function KpiSkeleton() {
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

export default function PerformancePage() {
  const apiMode = isApiConfigured();
  const apiSessionReady = !apiMode || hasApiSession();
  const [periode, setPeriode] = useState<AdminPerformancePeriode>("30j");
  const [overview, setOverview] = useState<AdminPerformanceOverviewApi | null>(
    null
  );
  const [loading, setLoading] = useState(apiMode);

  useEffect(() => {
    if (!apiMode) return;
    let cancelled = false;
    setLoading(true);
    void fetchPerformanceOverviewPersisted(periode).then((data) => {
      if (cancelled) return;
      setOverview(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [apiMode, periode]);

  const showPageSkeleton = apiMode && loading && overview === null;
  const listRefreshing = apiMode && loading && overview !== null;

  const serieJour = overview?.revenu.serie_jour ?? [];

  const revenuOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "area", height: 300 },
      colors: ["#465FFF"],
      stroke: { curve: "smooth", width: 2 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      xaxis: {
        ...chartBase.xaxis,
        categories: serieJour.map((d) => d.date),
      },
      yaxis: {
        labels: {
          style: { colors: "#6B7280", fontSize: "12px" },
          formatter: (v: number) => formatEntier(Math.round(v)),
        },
      },
    }),
    [serieJour]
  );

  const etablissements = overview?.etablissements ?? [];
  const nbEtablissementsAvecRevenu = etablissements.filter(
    (e) => e.revenu && e.revenu.statut === "SUCCES"
  ).length;
  const topEtablissement = overview?.top_etablissement ?? null;
  const variationPct = overview?.revenu.variation_pct ?? null;

  const repartitionOptions = useMemo<ApexOptions>(
    () => ({
      chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
      labels: ["Individuel", "Établissement"],
      colors: ["#465FFF", "#F59E0B"],
      legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
      dataLabels: { enabled: true },
      tooltip: {
        y: { formatter: (v: number) => formatXaf(v) },
      },
    }),
    []
  );

  const exportQuery = `periode=${periode}`;

  return (
    <div className="space-y-6" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Performance")} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/15">
            <PieChartIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Performance
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Revenu, paiements et performance des établissements
            </p>
          </div>
        </div>
        {apiMode && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Période</span>
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={periode}
                onChange={(e) =>
                  setPeriode(e.target.value as AdminPerformancePeriode)
                }
              >
                <option value="7j">7 jours</option>
                <option value="30j">30 jours</option>
                <option value="90j">90 jours</option>
                <option value="365j">365 jours</option>
              </select>
            </label>
            <ExportDropdownButton
              pdfPath={ADMIN_ROUTES.exports.performancePdf(exportQuery)}
              xlsxPath={ADMIN_ROUTES.exports.performanceXlsx(exportQuery)}
              filenameBase="blinks-performance"
            />
          </div>
        )}
      </div>

      {apiMode && !apiSessionReady && !loading && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          Connectez-vous avec un compte <strong>ADMIN</strong> pour charger la
          performance. Sans session active, les données restent vides.
        </div>
      )}

      {showPageSkeleton ? (
        <KpiSkeleton />
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Revenu total ({periode})
                </span>
                {variationPct !== null && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      variationPct >= 0
                        ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                        : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
                    }`}
                  >
                    {variationPct >= 0 ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )}
                    {Math.abs(variationPct).toFixed(1)} %
                  </span>
                )}
              </div>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {formatXaf(overview?.revenu.total_periode ?? 0)}
              </p>
              <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                {formatXaf(overview?.revenu.individuel_total ?? 0)} individuel ·{" "}
                {formatXaf(overview?.revenu.etablissement_total ?? 0)} établissement
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Taux de succès paiement
              </span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {(overview?.paiements.taux_succes_pct ?? 0).toFixed(1)} %
              </p>
              <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                {formatEntier(overview?.paiements.succes ?? 0)} réussis ·{" "}
                {formatEntier(overview?.paiements.en_attente ?? 0)} en attente ·{" "}
                {formatEntier(overview?.paiements.echec ?? 0)} échoués
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Établissements avec revenu encaissé
              </span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {nbEtablissementsAvecRevenu} / {etablissements.length}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Temps de lecture cumulé (établissements)
              </span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {formatDureeLecture(
                  etablissements.reduce(
                    (s, e) => s + e.minutes_lecture_total,
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Revenu encaissé par jour
          </h2>
          {apiMode && !loading && serieJour.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun paiement réussi sur la période sélectionnée.
            </p>
          ) : (
            <ReactApexChart
              options={revenuOptions}
              series={[{ name: "Revenu (XAF)", data: serieJour.map((d) => d.montant) }]}
              type="area"
              height={300}
            />
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Répartition du revenu
          </h2>
          {apiMode && !loading && (overview?.revenu.total_periode ?? 0) === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun revenu sur la période sélectionnée.
            </p>
          ) : (
            <ReactApexChart
              options={repartitionOptions}
              series={[
                overview?.revenu.individuel_total ?? 0,
                overview?.revenu.etablissement_total ?? 0,
              ]}
              type="donut"
              height={260}
            />
          )}

          {topEtablissement && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-transparent">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                <span>🏆</span> Top établissement
              </div>
              <p className="mt-1.5 truncate text-sm font-bold text-gray-800 dark:text-white/90">
                {topEtablissement.nom}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {topEtablissement.revenu
                  ? formatXaf(topEtablissement.revenu.montant)
                  : "Aucun paiement lié"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-5 pb-0 md:p-6 md:pb-0">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Performance par établissement
          </h2>
        </div>
        {!loading && etablissements.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400 md:px-6 md:pb-6">
            Aucun établissement pour l&apos;instant.
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[820px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Établissement",
                      "Statut",
                      "Revenu",
                      "Membres actifs lecteurs",
                      "Temps de lecture",
                    ].map((c) => (
                      <TableCell
                        key={c}
                        isHeader
                        className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {etablissements.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {e.nom}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {etablissementStatutBadge(e.statut)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {e.revenu ? (
                          <span className="flex items-center gap-2">
                            {formatXaf(e.revenu.montant)}
                            {revenuPaiementBadge(e.revenu.statut)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{
                                width: `${
                                  e.membres_total > 0
                                    ? Math.min(
                                        100,
                                        (e.membres_actifs_lecteurs / e.membres_total) * 100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span>
                            {e.membres_actifs_lecteurs} / {e.membres_total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {formatDureeLecture(e.minutes_lecture_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
