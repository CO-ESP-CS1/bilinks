"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockLivre } from "@/lib/mock-data";
import { fetchLivres, getLivreById } from "@/lib/livres-store";
import { PencilIcon } from "@/icons";
import { BookCover } from "@/components/livres/BookCover";

export default function LivreDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [livre, setLivre] = useState<MockLivre | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetchLivres();
      setLivre(getLivreById(id));
      setLoaded(true);
    };
    void load();
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!livre) {
    notFound();
  }

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Livres", href: "/admin/livres" },
    { label: livre.titre },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/40 via-transparent to-transparent dark:from-brand-500/5" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          <div className="shrink-0 animate-scale-in">
            <BookCover
              src={livre.couvertureUrl}
              title={livre.titre}
              variant="hero"
              rounded="xl"
              showShine
              className="shadow-2xl shadow-brand-900/20 ring-1 ring-black/5 transition-transform duration-500 hover:-translate-y-1 dark:ring-white/10"
            />
          </div>

          {/* Infos principales */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    {livre.titre}
                  </h1>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    {livre.auteurs.join(", ")}
                  </p>
                </div>
                <div className="hidden sm:block">
                  {livre.statut === "PUBLIE" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700 ring-1 ring-success-200/50 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                      Publié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200/50 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Archivé
                    </span>
                  )}
                </div>
              </div>

              {/* Stats rapides */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {livre.noteMoyenne != null && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-500/10">
                    <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{livre.noteMoyenne.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{livre.nbLectures} lectures</span>
                </div>
                {livre.nombrePages > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span>{livre.nombrePages} pages</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/admin/livres/${livre.id}/modifier`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl active:scale-[0.97]"
              >
                <PencilIcon className="size-4" />
                Modifier
              </Link>
              <Link
                href="/admin/livres"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Retour au catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
          label="Catégorie"
          value={livre.categorie || "Non classé"}
        />
        <MetaCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
          }
          label="Langue"
          value={livre.langue}
        />
        <MetaCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          label="Année"
          value={String(livre.anneePublication)}
        />
        <MetaCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
            </svg>
          }
          label="Identifiant"
          value={livre.id}
          mono
        />
      </div>
    </div>
  );
}

function MetaCard({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
