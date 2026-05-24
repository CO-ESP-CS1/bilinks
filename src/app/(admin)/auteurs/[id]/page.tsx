"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockAuteur } from "@/lib/mock-data";
import { getAuteurById } from "@/lib/auteurs-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon } from "@/icons";

const AVATAR_PALETTE = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
] as const;

function couleurAvatar(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]!;
}

function initiales(nom: string, prenom: string): string {
  const a = (prenom.trim()[0] ?? "").toUpperCase();
  const b = (nom.trim()[0] ?? "").toUpperCase();
  return `${a}${b}` || "?";
}

export default function AuteurDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [auteur, setAuteur] = useState<MockAuteur | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAuteur(getAuteurById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!auteur) {
    notFound();
  }

  const nomComplet = [auteur.prenom, auteur.nom].filter(Boolean).join(" ");
  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Auteurs", href: "/admin/auteurs" },
    { label: nomComplet || auteur.nom },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold ${couleurAvatar(auteur.id)}`}
          >
            {initiales(auteur.nom, auteur.prenom)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {nomComplet || auteur.nom}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fiche auteur
            </p>
            <div className="mt-3">
              {auteur.deletedAt == null ? (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Actif
                </span>
              ) : (
                <Badge color="error" size="sm" variant="light">
                  Supprimé (soft delete)
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/auteurs">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
          {auteur.deletedAt == null && (
            <Link href={`/admin/auteurs/${auteur.id}/modifier`}>
              <Button startIcon={<PencilIcon className="size-5" />}>
                Modifier
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Nom" value={auteur.nom} />
        <DetailItem label="Prénom" value={auteur.prenom || "—"} />
        <DetailItem label="Nombre de livres" value={String(auteur.nbLivres)} />
        <DetailItem label="Identifiant" value={auteur.id} />
        {auteur.deletedAt && (
          <DetailItem
            label="Supprimé le"
            value={new Date(auteur.deletedAt).toLocaleString("fr-FR")}
          />
        )}
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
