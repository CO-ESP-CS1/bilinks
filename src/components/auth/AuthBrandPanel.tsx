"use client";

import { BrandName } from "@/components/common/BrandMark";
import { BrandLogoAnimated } from "@/components/auth/BrandLogoAnimated";
import { DocsIcon, DollarLineIcon } from "@/icons";

/**
 * Aperçu du vrai tableau de bord admin — pas une illustration marketing
 * générique. Reprend exactement le style des tuiles KPI de /admin (icône
 * dans un carré arrondi, libellé gris, valeur en gras) pour que cet écran
 * ressemble à une fenêtre sur le produit réel, pas à un template d'auth.
 */
function DashboardGlimpse() {
  return (
    <div className="animate-fade-in-up w-72 -rotate-3 rounded-2xl border border-white/10 bg-white p-5 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Tableau de bord
        </span>
        <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          En direct
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            <DocsIcon className="size-4 text-brand-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-gray-800">248</p>
          <p className="text-[11px] text-gray-500">Livres</p>
        </div>
        <div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
            <DollarLineIcon className="size-4 text-amber-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-gray-800">1,2 M</p>
          <p className="text-[11px] text-gray-500">XAF ce mois</p>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1">
        {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-brand-100"
            style={{ height: `${h * 0.32}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-brand-900 lg:flex">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-amber-400/[0.08] blur-3xl" />

      <div className="relative z-10 flex max-w-sm flex-col items-center px-8 text-center">
        <BrandLogoAnimated size="large" variant="hero" className="mb-6" />

        <h2 className="text-2xl font-bold tracking-tight text-white">
          <BrandName accentClassName="text-amber-300" />
        </h2>
        <p className="mt-2 text-sm font-medium text-blue-200/70">
          Console d&apos;administration
        </p>

        <div className="mt-12">
          <DashboardGlimpse />
        </div>
      </div>
    </div>
  );
}
