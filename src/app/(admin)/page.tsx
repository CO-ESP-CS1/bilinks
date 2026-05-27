"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ApexOptions } from "apexcharts";
import {
  mockKPIs,
  mockAbonnementsChart,
  mockPlanRepartition,
  mockActiviteRecente,
  type PlanType,
} from "@/lib/mock-data";
import {
  ChatIcon,
  CheckCircleIcon,
  DocsIcon,
  DollarLineIcon,
  GroupIcon,
  ShootingStarIcon,
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

export default function Page() {
  const refAbonnesMensuel = useMemo(() => {
    const m = mockPlanRepartition.find((p) => p.plan === "MENSUEL");
    return m?.count ?? 1;
  }, []);

  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "line",
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ["#1e5f8f", "#10B981"],
      stroke: {
        curve: "smooth",
        width: [3, 3],
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.45,
          opacityTo: 0.05,
        },
      },
      markers: {
        size: 4,
        strokeWidth: 2,
        strokeColors: "#fff",
        hover: { size: 6 },
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
        categories: mockAbonnementsChart.map((d) => d.mois),
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
    []
  );

  const chartSeries = useMemo(
    () => [
      {
        name: "Nouveaux abonnements",
        data: mockAbonnementsChart.map((d) => d.nouveaux),
      },
      {
        name: "Renouvellements",
        data: mockAbonnementsChart.map((d) => d.renouvellements),
      },
    ],
    []
  );

  const derniersNouveaux = mockAbonnementsChart.at(-1)?.nouveaux ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={adminCrumb("Tableau de bord")} />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vue d&apos;ensemble BiblioTech — données de démonstration
        </p>
      </div>

      {/* Section 1 — KPIs */}
      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <AnimatedCard className="p-5 md:p-6" hover delay={0}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <DocsIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total livres</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatEntierFr(mockKPIs.totalLivres)}
            </h4>
            <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
              +{mockKPIs.livresAjoutes} livres
            </p>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={70}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <GroupIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatEntierFr(mockKPIs.totalUtilisateurs)}
            </h4>
            <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
              +{mockKPIs.nouveauxUsersHebdo} cette semaine
            </p>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={140}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-500/10">
            <CheckCircleIcon className="size-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Abonnements actifs</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatEntierFr(mockKPIs.abonnementsActifs)}
            </h4>
            <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">
              +{derniersNouveaux} nouveaux en mai
            </p>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-5 md:p-6" hover delay={210}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 transition-transform duration-300 group-hover:scale-105 dark:bg-amber-500/10">
            <DollarLineIcon className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Revenus du mois</span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatXaf(mockKPIs.revenusMonthly)}
            </h4>
            <p className="mt-2 text-sm font-medium text-warning-600 dark:text-orange-400">
              +{mockKPIs.paiementsEnAttente} en attente
            </p>
          </div>
        </AnimatedCard>
      </StaggerGroup>

      {/* Sections 2 + 3 — graphique + plans */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
        <AnimatedCard className="p-5 md:p-6 lg:col-span-8" delay={280}>
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Évolution des abonnements — 6 derniers mois
          </h3>
          <div className="min-h-[320px] w-full">
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={320}
            />
          </div>
        </AnimatedCard>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <h3 className="animate-fade-in-up text-base font-semibold text-gray-800 dark:text-white/90 lg:px-1" style={{ animationDelay: "320ms" }}>
            Répartition des plans
          </h3>
          {mockPlanRepartition.map((row, planIdx) => {
            const pct = Math.min(
              100,
              Math.round((row.count / refAbonnesMensuel) * 100)
            );
            return (
              <AnimatedCard
                key={row.plan}
                className="p-5"
                delay={360 + planIdx * 80}
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {getPlanLabel(row.plan)}
                </p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
                  {formatXaf(row.prix)}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {formatEntierFr(row.count)}
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
          })}
        </div>
      </div>

      {/* Section 4 — Activité récente */}
      <AnimatedCard className="p-5 md:p-6" delay={400}>
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Activité récente
        </h3>
        <ul className="space-y-4">
          {mockActiviteRecente.map((item, i) => {
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
                wrap: "bg-success-50 dark:bg-success-500/15",
                icon: "text-success-600 dark:text-success-500",
                Icon: DollarLineIcon,
              },
              commentaire: {
                wrap: "bg-warning-50 dark:bg-warning-500/15",
                icon: "text-warning-600 dark:text-orange-400",
                Icon: ChatIcon,
              },
              livre: {
                wrap: "bg-[#f5f3ff] dark:bg-violet-500/15",
                icon: "text-violet-600 dark:text-violet-400",
                Icon: DocsIcon,
              },
              badge: {
                wrap: "bg-gray-100 dark:bg-white/5",
                icon: "text-gray-700 dark:text-gray-300",
                Icon: ShootingStarIcon,
              },
            };
            const s = styles[item.type] ?? styles.badge;
            const Icon = s.Icon;
            return (
              <li
                key={i}
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
          })}
        </ul>
      </AnimatedCard>

      {/* Section 5 — Alertes admin */}
      <StaggerGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6" baseDelayMs={520} staggerMs={90}>
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
                {mockKPIs.paiementsEnAttente} paiements en attente de
                confirmation
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
                {mockKPIs.commentairesAModerer} commentaires à modérer
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
      </StaggerGroup>
    </div>
  );
}
