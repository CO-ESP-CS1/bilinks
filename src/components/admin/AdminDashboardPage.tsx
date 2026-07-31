"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ApexOptions } from "apexcharts";
import {
  mockKPIs,
  mockAbonnementsChart,
  mockPlanRepartition,
  type MockPlanTarifaire,
  type PlanType,
} from "@/lib/mock-data";
import {
  fetchDashboardActivity,
  fetchDashboardAlerts,
  fetchDashboardStats,
  fetchStatsUsers,
  type DashboardActivityItem,
  type DashboardAlerts,
  type DashboardFetchResult,
  type DashboardView,
} from "@/lib/stats-store";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { fetchPlansPersisted } from "@/lib/plans-store";
import { fetchSubscriptionsPersisted } from "@/lib/subscriptions-store";
import {
  CheckCircleIcon,
  DocsIcon,
  DollarLineIcon,
  GroupIcon,
  UserIcon,
} from "@/icons";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { AnimatedCard } from "@/components/admin/AnimatedCard";
import { StaggerGroup } from "@/components/admin/StaggerGroup";
import { formatXaf } from "@/lib/abonnements-utils";
import { getPlanLabel } from "@/lib/plans-store";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function formatEntierFr(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function DashboardSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-6 w-6 animate-spin text-brand-500 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
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

function KpiValuesSkeleton() {
  return (
    <div className="mt-5 space-y-3" aria-busy="true" aria-label="Chargement">
      <TextSkeleton className="h-8 w-24" />
      <TextSkeleton className="h-4 w-36" />
    </div>
  );
}

function ChartLoadingState() {
  return (
    <div
      className="flex h-[320px] flex-col items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400"
      aria-busy="true"
      aria-label="Chargement du graphique"
    >
      <DashboardSpinner className="h-8 w-8" />
      <span>Chargement des inscriptions…</span>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="admin-card animate-pulse rounded-xl border border-gray-100 p-5 dark:border-white/[0.06]">
      <TextSkeleton className="h-4 w-28" />
      <TextSkeleton className="mt-3 h-7 w-20" />
      <TextSkeleton className="mt-3 h-4 w-32" />
      <TextSkeleton className="mt-4 h-2 w-full rounded-full" />
    </div>
  );
}

function AlertCardSkeleton() {
  return (
    <div className="admin-card animate-pulse rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
      <div className="flex gap-3">
        <TextSkeleton className="h-6 w-6 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <TextSkeleton className="h-4 w-40" />
          <TextSkeleton className="h-4 w-56" />
        </div>
      </div>
    </div>
  );
}

const JOURS_COURTS_FR = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const;

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatJourLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const weekday = JOURS_COURTS_FR[d.getDay()] ?? "";
  return `${weekday}. ${d.getDate()}`;
}

/** 7 derniers jours calendaires, aujourd'hui inclus, avec 0 si aucune inscription. */
function aggregateInscriptionsLast7Days(
  points: Array<{ date: string; count: number }>
): Array<{ jour: string; count: number }> {
  const byDay = new Map<string, number>();
  for (const p of points) {
    const key = p.date.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + p.count);
  }

  const keys: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(toLocalDateKey(d));
  }

  return keys.map((dateKey) => ({
    jour: formatJourLabel(dateKey),
    count: byDay.get(dateKey) ?? 0,
  }));
}

export default function Page() {
  const apiMode = isApiConfigured();
  const [dashResult, setDashResult] = useState<DashboardFetchResult | null>(
    null
  );
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [inscriptionsJours, setInscriptionsJours] = useState<
    Array<{ jour: string; count: number }>
  >([]);
  const [plansApi, setPlansApi] = useState<MockPlanTarifaire[]>([]);
  const [abonnesParPlan, setAbonnesParPlan] = useState<
    Partial<Record<PlanType, number>>
  >({});
  const [activiteRecente, setActiviteRecente] = useState<DashboardActivityItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const [dash, alertRows, usersStats, plans, subs, activity] =
        await Promise.all([
        fetchDashboardStats(),
        fetchDashboardAlerts(),
        apiMode && hasApiSession()
          ? fetchStatsUsers("7j")
          : Promise.resolve(null),
        apiMode && hasApiSession()
          ? fetchPlansPersisted()
          : Promise.resolve([]),
        apiMode && hasApiSession()
          ? fetchSubscriptionsPersisted({ statut: "ACTIF" })
          : Promise.resolve([]),
        apiMode && hasApiSession()
          ? fetchDashboardActivity({ periode: "7j", limit: 10 })
          : Promise.resolve([]),
      ]);

      if (cancelled) return;

      setDashResult(dash);
      setAlerts(alertRows);
      if (usersStats) {
        setInscriptionsJours(
          aggregateInscriptionsLast7Days(usersStats.inscriptionsParJour)
        );
      } else {
        setInscriptionsJours([]);
      }

      setPlansApi(plans.filter((p) => p.statut === "ACTIF"));
      const counts: Partial<Record<PlanType, number>> = {};
      for (const s of subs) {
        if (s.statut !== "ACTIF") continue;
        const code = s.plan as PlanType;
        counts[code] = (counts[code] ?? 0) + 1;
      }
      setAbonnesParPlan(counts);
      setActiviteRecente(activity);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [apiMode]);

  const useMockDashboard = false;
  const kpi: DashboardView =
    dashResult?.data ?? {
      totalLivres: 0,
      totalUtilisateurs: 0,
      abonnementsActifs: 0,
      revenusMonthly: 0,
      livresAjoutes: 0,
      nouveauxUsersHebdo: 0,
      nbLectures7j: 0,
      nbPaiementsSucces7j: 0,
      topLivres: [],
    };

  const refAbonnesMensuel = useMemo(() => {
    if (!useMockDashboard && plansApi.length) {
      return abonnesParPlan.MENSUEL ?? 1;
    }
    const m = mockPlanRepartition.find((p) => p.plan === "MENSUEL");
    return m?.count ?? 1;
  }, [useMockDashboard, plansApi.length, abonnesParPlan]);

  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ["#1e5f8f"],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
        },
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      fill: {
        opacity: 1,
      },
      markers: {
        size: 0,
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Outfit, sans-serif",
        labels: { colors: "#6B7280" },
      },
      grid: {
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: useMockDashboard
          ? mockAbonnementsChart.map((d) => d.mois)
          : inscriptionsJours.map((d) => d.jour),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: "#6B7280", fontSize: "12px" },
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#6B7280", fontSize: "12px" },
        },
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val: number) => String(Math.round(val)),
        },
      },
    }),
    [useMockDashboard, inscriptionsJours]
  );

  const chartSeries = useMemo(
    () =>
      useMockDashboard
        ? [
            {
              name: "Nouveaux abonnements",
              data: mockAbonnementsChart.map((d) => d.nouveaux),
            },
            {
              name: "Renouvellements",
              data: mockAbonnementsChart.map((d) => d.renouvellements),
            },
          ]
        : [
            {
              name: "Inscriptions",
              data: inscriptionsJours.map((d) => d.count),
            },
          ],
    [useMockDashboard, inscriptionsJours]
  );

  const derniersNouveaux = useMockDashboard
    ? (mockAbonnementsChart.at(-1)?.nouveaux ?? 0)
    : (inscriptionsJours.at(-1)?.count ?? 0);

  const showLoading = loading && apiMode;
  const planRows = useMockDashboard ? mockPlanRepartition : plansApi;

  return (
    <div className="space-y-6" aria-busy={showLoading}>
      <div>
        <Breadcrumb items={adminCrumb("Tableau de bord")} />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {!apiMode
            ? "Vue d’ensemble : données de démonstration"
            : dashResult?.source === "api"
              ? "Vue d’ensemble de la plateforme B LINKS"
              : dashResult?.source === "unavailable"
                ? "Vue d’ensemble : données indisponibles"
                : "Vue d’ensemble"}
        </p>
        {apiMode && dashResult?.error && (
          <p className="mt-2 rounded-lg border border-warning-500/40 bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            {dashResult.error}
          </p>
        )}
      </div>

      {/* Section 1 — KPIs */}
      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <AnimatedCard className="p-5 md:p-6" hover delay={0}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <DocsIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total livres</span>
            {showLoading ? (
              <KpiValuesSkeleton />
            ) : (
              <>
                <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {formatEntierFr(kpi.totalLivres)}
                </h4>
                <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
                  {kpi.livresAjoutes > 0
                    ? `+${kpi.livresAjoutes} livres`
                    : `${formatEntierFr(kpi.nbLectures7j)} lectures (7j)`}
                </p>
              </>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={70}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <GroupIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
            {showLoading ? (
              <KpiValuesSkeleton />
            ) : (
              <>
                <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {formatEntierFr(kpi.totalUtilisateurs)}
                </h4>
                <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
                  +{kpi.nouveauxUsersHebdo} inscriptions (7j)
                </p>
              </>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={140}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <CheckCircleIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Abonnements actifs</span>
            {showLoading ? (
              <KpiValuesSkeleton />
            ) : (
              <>
                <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {formatEntierFr(kpi.abonnementsActifs)}
                </h4>
                <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
                  {useMockDashboard
                    ? `+${derniersNouveaux} nouveaux en mai`
                    : `${formatEntierFr(kpi.nbPaiementsSucces7j)} paiements succès (7j)`}
                </p>
              </>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={210}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 transition-transform duration-300 group-hover:scale-105 dark:bg-amber-500/10">
            <DollarLineIcon className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Revenus du mois</span>
            {showLoading ? (
              <KpiValuesSkeleton />
            ) : (
              <>
                <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                  {formatXaf(kpi.revenusMonthly)}
                </h4>
                <p className="mt-2 text-sm font-medium text-warning-600 dark:text-orange-400">
                  Mois en cours
                </p>
              </>
            )}
          </div>
        </AnimatedCard>
      </StaggerGroup>

      {/* Sections 2 + 3 — graphique + plans */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
        <AnimatedCard className="p-5 md:p-6 lg:col-span-8" delay={280}>
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {useMockDashboard
              ? "Évolution des abonnements (6 derniers mois)"
              : "Inscriptions (7 derniers jours)"}
          </h3>
          <div className="min-h-[320px] w-full">
            {showLoading ? (
              <ChartLoadingState />
            ) : !useMockDashboard && inscriptionsJours.length === 0 ? (
              <p className="flex h-[320px] items-center justify-center text-sm text-gray-500">
                Aucune inscription sur la période.
              </p>
            ) : (
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={320}
              />
            )}
          </div>
        </AnimatedCard>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <h3 className="animate-fade-in-up text-base font-semibold text-gray-800 dark:text-white/90 lg:px-1" style={{ animationDelay: "320ms" }}>
            Répartition des plans
          </h3>
          {showLoading ? (
            <>
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
            </>
          ) : planRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
              Aucun plan actif.
            </p>
          ) : (
          planRows.map((row, planIdx) => {
            const planCode = (useMockDashboard
              ? (row as (typeof mockPlanRepartition)[0]).plan
              : (row as MockPlanTarifaire).code) as PlanType;
            const prix = useMockDashboard
              ? (row as (typeof mockPlanRepartition)[0]).prix
              : (row as MockPlanTarifaire).prix;
            const count = useMockDashboard
              ? (row as (typeof mockPlanRepartition)[0]).count
              : (abonnesParPlan[planCode] ?? 0);
            const pct = Math.min(
              100,
              Math.round((count / refAbonnesMensuel) * 100)
            );
            return (
              <AnimatedCard
                key={planCode}
                className="p-5"
                delay={360 + planIdx * 80}
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {getPlanLabel(planCode)}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
                  {formatXaf(prix)}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {formatEntierFr(count)}
                  </span>{" "}
                  abonnés actifs
                </p>
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="admin-progress-bar h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%`, animationDelay: `${400 + planIdx * 100}ms` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {pct}% par rapport au plan mensuel (référence)
                  </p>
                </div>
              </AnimatedCard>
            );
          })
          )}
        </div>
      </div>

      {/* Section 4 — Top 5 livres (API) */}
      {showLoading ? (
        <AnimatedCard className="p-5 md:p-6" delay={380}>
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Top 5 des livres les plus lus
          </h3>
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <div className="flex-1 space-y-2">
                  <TextSkeleton className="h-4 w-3/4 max-w-xs" />
                  <TextSkeleton className="h-3 w-24" />
                </div>
                <TextSkeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </AnimatedCard>
      ) : (
      !useMockDashboard && kpi.topLivres.length > 0 && (
        <AnimatedCard className="p-5 md:p-6" delay={380}>
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Top 5 des livres les plus lus
          </h3>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {kpi.topLivres.map((livre, i) => (
              <li
                key={`${livre.titre}-${i}`}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    <span className="mr-2 text-gray-400">{i + 1}.</span>
                    {livre.titre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {livre.typeLivre}
                    {livre.note != null ? ` · note ${livre.note.toFixed(1)}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-brand-500">
                  {formatEntierFr(livre.lectures)} lectures
                </p>
              </li>
            ))}
          </ul>
        </AnimatedCard>
      )
      )}

      {/* Section 5 — Activité récente */}
      <AnimatedCard className="p-5 md:p-6" delay={400}>
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Activité récente
        </h3>
        <ul className="space-y-4">
          {showLoading ? (
            [0, 1, 2].map((i) => (
              <li key={i} className="flex gap-3" aria-hidden>
                <TextSkeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <TextSkeleton className="h-4 w-full max-w-md" />
                  <TextSkeleton className="h-3 w-20" />
                </div>
              </li>
            ))
          ) : activiteRecente.length > 0 ? (
          activiteRecente.map((item, i) => {
            const styles: Record<
              string,
              { wrap: string; icon: string; Icon: typeof UserIcon }
            > = {
              inscription: {
                wrap: "bg-blue-light-50 dark:bg-blue-light-500/15",
                icon: "text-blue-light-500",
                Icon: UserIcon,
              },
              paiement: {
                wrap:
                  item.statutPaiement === "EN_ATTENTE"
                    ? "bg-warning-50 dark:bg-warning-500/15"
                    : item.statutPaiement === "ECHEC"
                      ? "bg-error-50 dark:bg-error-500/15"
                      : "bg-success-50 dark:bg-success-500/15",
                icon:
                  item.statutPaiement === "EN_ATTENTE"
                    ? "text-warning-600 dark:text-orange-400"
                    : item.statutPaiement === "ECHEC"
                      ? "text-error-600 dark:text-error-400"
                      : "text-success-600 dark:text-success-500",
                Icon: DollarLineIcon,
              },
            };
            const s = styles[item.type] ?? styles.inscription;
            const Icon = s.Icon;
            return (
              <li
                key={item.id}
                className="animate-fade-in-up flex gap-3"
                style={{ animationDelay: `${480 + i * 60}ms` }}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.wrap}`}
                >
                  <Icon className={`size-5 ${s.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {item.message}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.temps}
                  </p>
                </div>
              </li>
            );
          })
          ) : (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              Aucune inscription ni paiement sur les 7 derniers jours.
            </li>
          )}
        </ul>
      </AnimatedCard>

      {/* Section 5 — Alertes admin */}
      <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" baseDelayMs={520} staggerMs={90}>
        {showLoading ? (
          <AlertCardSkeleton key="alert-skel-payments" />
        ) : (
        <div className="admin-card admin-card-hover animate-fade-in-up flex flex-col gap-3 rounded-xl border border-warning-500 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/15 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="shrink-0 text-warning-500">
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.6501 12.0001C3.6501 7.38852 7.38852 3.6501 12.0001 3.6501C16.6117 3.6501 20.3501 7.38852 20.3501 12.0001C20.3501 16.6117 16.6117 20.3501 12.0001 20.3501C7.38852 20.3501 3.6501 16.6117 3.6501 12.0001ZM12.0001 1.8501C6.39441 1.8501 1.8501 6.39441 1.8501 12.0001C1.8501 17.6058 6.39441 22.1501 12.0001 22.1501C17.6058 22.1501 22.1501 17.6058 22.1501 12.0001C22.1501 6.39441 17.6058 1.8501 12.0001 1.8501ZM10.9992 7.52517C10.9992 8.07746 11.4469 8.52517 11.9992 8.52517H12.0002C12.5525 8.52517 13.0002 8.07746 13.0002 7.52517C13.0002 6.97289 12.5525 6.52517 12.0002 6.52517H11.9992C11.4469 6.52517 10.9992 6.97289 10.9992 7.52517ZM12.0002 17.3715C11.586 17.3715 11.2502 17.0357 11.2502 16.6215V10.945C11.2502 10.5308 11.586 10.195 12.0002 10.195C12.4144 10.195 12.7502 10.5308 12.7502 10.945V16.6215C12.7502 17.0357 12.4144 17.3715 12.0002 17.3715Z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Paiements en attente
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {useMockDashboard
                  ? `${mockKPIs.paiementsEnAttente} paiements en attente de confirmation`
                  : `${formatEntierFr(alerts?.paiementsEnAttente ?? 0)} paiements en attente de confirmation`}
              </p>
            </div>
          </div>
          <Link
            href="/admin/paiements"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            Voir les paiements
          </Link>
        </div>
        )}
        {showLoading ? (
          <AlertCardSkeleton key="alert-skel-comments" />
        ) : (
        <div className="admin-card admin-card-hover animate-fade-in-up flex flex-col gap-3 rounded-xl border border-warning-500 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/15 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="shrink-0 text-warning-500">
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.6501 12.0001C3.6501 7.38852 7.38852 3.6501 12.0001 3.6501C16.6117 3.6501 20.3501 7.38852 20.3501 12.0001C20.3501 16.6117 16.6117 20.3501 12.0001 20.3501C7.38852 20.3501 3.6501 16.6117 3.6501 12.0001ZM12.0001 1.8501C6.39441 1.8501 1.8501 6.39441 1.8501 12.0001C1.8501 17.6058 6.39441 22.1501 12.0001 22.1501C17.6058 22.1501 22.1501 17.6058 22.1501 12.0001C22.1501 6.39441 17.6058 1.8501 12.0001 1.8501ZM10.9992 7.52517C10.9992 8.07746 11.4469 8.52517 11.9992 8.52517H12.0002C12.5525 8.52517 13.0002 8.07746 13.0002 7.52517C13.0002 6.97289 12.5525 6.52517 12.0002 6.52517H11.9992C11.4469 6.52517 10.9992 6.97289 10.9992 7.52517ZM12.0002 17.3715C11.586 17.3715 11.2502 17.0357 11.2502 16.6215V10.945C11.2502 10.5308 11.586 10.195 12.0002 10.195C12.4144 10.195 12.7502 10.5308 12.7502 10.945V16.6215C12.7502 17.0357 12.4144 17.3715 12.0002 17.3715Z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Modération
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {useMockDashboard
                  ? `${mockKPIs.commentairesAModerer} commentaires à modérer`
                  : `${formatEntierFr(alerts?.commentairesAModerer ?? 0)} commentaires à modérer`}
              </p>
            </div>
          </div>
          <Link
            href="/admin/commentaires"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            Modérer
          </Link>
        </div>
        )}
      </StaggerGroup>
    </div>
  );
}
