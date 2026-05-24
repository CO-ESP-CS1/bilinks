"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockLivre } from "@/lib/mock-data";
import { getLivreById } from "@/lib/livres-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon } from "@/icons";

function initialeTitre(titre: string): string {
  const t = titre.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

export default function LivreDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [livre, setLivre] = useState<MockLivre | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLivre(getLivreById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {livre.couvertureUrl ? (
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={livre.couvertureUrl}
                alt=""
                width={96}
                height={128}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-3xl font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {initialeTitre(livre.titre)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {livre.titre}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {livre.auteurs.join(", ")}
            </p>
            <div className="mt-3">
              {livre.statut === "PUBLIE" ? (
                <Badge color="success" size="sm" variant="light">
                  Publié
                </Badge>
              ) : (
                <Badge color="light" size="sm" variant="light">
                  Archivé
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/livres">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
          <Link href={`/admin/livres/${livre.id}/modifier`}>
            <Button startIcon={<PencilIcon className="size-5" />}>
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Catégorie" value={livre.categorie} />
        <DetailItem label="Langue" value={livre.langue} />
        <DetailItem
          label="Année de publication"
          value={String(livre.anneePublication)}
        />
        <DetailItem label="Nombre de pages" value={String(livre.nombrePages)} />
        <DetailItem label="Lectures" value={String(livre.nbLectures)} />
        <DetailItem
          label="Note moyenne"
          value={
            livre.noteMoyenne != null
              ? `★ ${livre.noteMoyenne.toFixed(1)}`
              : "—"
          }
        />
        <DetailItem label="Identifiant" value={livre.id} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}
