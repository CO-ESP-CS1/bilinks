"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockUtilisateur } from "@/lib/mock-data";
import { getUserById } from "@/lib/users-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ShootingStarIcon } from "@/icons";

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

function formatEntier(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export default function UtilisateurProfilPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [utilisateur, setUtilisateur] = useState<
    MockUtilisateur | null | undefined
  >(undefined);

  useEffect(() => {
    setUtilisateur(getUserById(id) ?? null);
  }, [id]);

  if (utilisateur === undefined) {
    return null;
  }

  if (!utilisateur) {
    notFound();
  }

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Utilisateurs", href: "/admin/utilisateurs" },
    { label: nomComplet },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold ${couleurAvatar(utilisateur.id)}`}
          >
            {initiales(utilisateur.nom, utilisateur.prenom)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {nomComplet}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {utilisateur.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {utilisateur.role === "ADMIN" ? (
                <Badge color="info" size="sm" variant="light">
                  Admin
                </Badge>
              ) : (
                <Badge color="light" size="sm" variant="light">
                  Utilisateur
                </Badge>
              )}
              {utilisateur.statut === "ACTIF" ? (
                <Badge color="success" size="sm" variant="light">
                  Actif
                </Badge>
              ) : (
                <Badge color="error" size="sm" variant="light">
                  Banni
                </Badge>
              )}
              {utilisateur.abonnementActif ? (
                <Badge color="success" size="sm" variant="light">
                  Abonné
                </Badge>
              ) : (
                <Badge color="light" size="sm" variant="light">
                  Non abonné
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/utilisateurs">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
          <Link href={`/admin/utilisateurs/${utilisateur.id}/abonnement`}>
            <Button startIcon={<ShootingStarIcon className="size-5" />}>
              Voir l&apos;abonnement
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="École" value={utilisateur.ecole} />
        <DetailItem label="Niveau" value={utilisateur.niveau} />
        <DetailItem
          label="Points"
          value={`★ ${formatEntier(utilisateur.points)}`}
        />
        <DetailItem
          label="Date d'inscription"
          value={new Date(utilisateur.dateInscription).toLocaleDateString(
            "fr-FR"
          )}
        />
        <DetailItem label="Identifiant" value={utilisateur.id} />
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
