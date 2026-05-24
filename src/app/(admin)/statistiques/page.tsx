"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { formatXaf } from "@/lib/abonnements-utils";
import { PieChartIcon } from "@/icons";
import {
  mockKPIs,
  mockLecturesParMois,
  mockTopLivres,
  mockCroissanceUtilisateurs,
  mockRepartitionCategories,
  mockAbonnementsChart,
} from "@/lib/mock-data";
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

export default function StatistiquesPage() {
  const lecturesOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "bar", height: 300 },
      colors: ["#465FFF"],
      plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
      xaxis: {
        ...chartBase.xaxis,
        categories: mockLecturesParMois.map((d) => d.mois),
      },
    }),
    []
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
        categories: mockCroissanceUtilisateurs.map((d) => d.mois),
      },
    }),
    []
  );

  const categoriesOptions = useMemo<ApexOptions>(
    () => ({
      chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
      labels: mockRepartitionCategories.map((c) => c.categorie),
      colors: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
      legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
      dataLabels: { enabled: true },
    }),
    []
  );

  const aboOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "line", height: 280 },
      colors: ["#465FFF", "#10B981"],
      stroke: { curve: "smooth", width: 2 },
      legend: { position: "top" },
      xaxis: {
        ...chartBase.xaxis,
        categories: mockAbonnementsChart.map((d) => d.mois),
      },
    }),
    []
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Statistiques")} />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/15">
          <PieChartIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Statistiques
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyses et tendances BiblioTech (données de démo)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Lectures (mai)</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(mockLecturesParMois.at(-1)?.lectures ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(mockKPIs.totalUtilisateurs)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Revenus mensuels</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatXaf(mockKPIs.revenusMonthly)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Abonnements actifs</span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatEntier(mockKPIs.abonnementsActifs)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Lectures par mois
          </h2>
          <ReactApexChart
            options={lecturesOptions}
            series={[{ name: "Lectures", data: mockLecturesParMois.map((d) => d.lectures) }]}
            type="bar"
            height={300}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Croissance utilisateurs
          </h2>
          <ReactApexChart
            options={usersOptions}
            series={[{ name: "Utilisateurs", data: mockCroissanceUtilisateurs.map((d) => d.total) }]}
            type="area"
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-5">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Répartition par catégorie
          </h2>
          <ReactApexChart
            options={categoriesOptions}
            series={mockRepartitionCategories.map((c) => c.count)}
            type="donut"
            height={320}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-7">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Abonnements — nouveaux vs renouvellements
          </h2>
          <ReactApexChart
            options={aboOptions}
            series={[
              { name: "Nouveaux", data: mockAbonnementsChart.map((d) => d.nouveaux) },
              { name: "Renouvellements", data: mockAbonnementsChart.map((d) => d.renouvellements) },
            ]}
            type="line"
            height={280}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
          Top 5 des livres les plus lus
        </h2>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopLivres.map((l, i) => (
                <TableRow key={l.titre}>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600">{i + 1}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {l.titre}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-brand-500">
                    {formatEntier(l.lectures)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
