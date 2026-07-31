"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type {
  AdminReadingHabitsApi,
  AdminReadingHabitsPeriode,
} from "@/lib/api/admin-types";
import { fetchReadingHabits, fetchUserReadingHabits } from "@/lib/stats-store";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HEURES = Array.from({ length: 24 }, (_, i) => i);

const CRENEAU_LABELS: Record<string, string> = {
  MATIN: "Matin",
  APRES_MIDI: "Après-midi",
  SOIR: "Soir",
  NUIT: "Nuit",
};

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function buildHeatmapSeries(data: AdminReadingHabitsApi | null) {
  const lookup = new Map<string, number>();
  for (const cell of data?.heatmap ?? []) {
    lookup.set(`${cell.jour_semaine}-${cell.heure}`, cell.minutes_total);
  }
  return JOURS.map((label, jour) => ({
    name: label,
    data: HEURES.map((heure) => ({
      x: `${heure}h`,
      y: lookup.get(`${jour}-${heure}`) ?? 0,
    })),
  }));
}

export function ReadingHabitsPanel({
  userId,
  periode = "30j",
}: {
  userId?: string;
  periode?: AdminReadingHabitsPeriode;
}) {
  const [data, setData] = useState<AdminReadingHabitsApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const result = userId
        ? await fetchUserReadingHabits(userId, periode)
        : await fetchReadingHabits(periode);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, periode]);

  const heatmapOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        type: "heatmap",
      },
      dataLabels: { enabled: false },
      xaxis: {
        labels: { style: { colors: "#6B7280", fontSize: "11px" } },
      },
      yaxis: {
        labels: { style: { colors: "#6B7280", fontSize: "12px" } },
      },
      tooltip: {
        y: { formatter: (val: number) => `${val} min` },
      },
      plotOptions: {
        heatmap: { radius: 2 },
      },
      legend: { show: false },
    }),
    []
  );

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Chargement des habitudes de lecture">
        <TextSkeleton className="h-5 w-56" />
        <TextSkeleton className="mt-6 h-[260px] w-full" />
      </div>
    );
  }

  const hasData = (data?.nb_sessions ?? 0) > 0;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Créneau préféré
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {data?.creneau_prefere
              ? CRENEAU_LABELS[data.creneau_prefere]
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Durée moyenne / session
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {data?.duree_moyenne_session_min ?? 0} min
            {data?.tendance_duree_pct != null && (
              <span
                className={
                  data.tendance_duree_pct >= 0
                    ? "ml-2 text-xs text-green-600 dark:text-green-400"
                    : "ml-2 text-xs text-red-600 dark:text-red-400"
                }
              >
                {data.tendance_duree_pct >= 0 ? "+" : ""}
                {data.tendance_duree_pct}%
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {userId ? "Série actuelle" : "Série moyenne"}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {(userId ? data?.streak_actuel : data?.streak_moyen) ?? 0} j
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {data?.nb_sessions ?? 0}
          </p>
        </div>
      </div>

      {hasData ? (
        <ReactApexChart
          options={heatmapOptions}
          series={buildHeatmapSeries(data)}
          type="heatmap"
          height={260}
        />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune session de lecture sur cette période.
        </p>
      )}
    </div>
  );
}
