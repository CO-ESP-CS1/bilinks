"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getUserById } from "@/lib/users-store";
import type { StatutAbonnement } from "@/lib/mock-data";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  getAbonnementsByEmail,
  getPlanDetails,
  getPaiementsByNom,
  getPlanCaracteristiques,
  formatXaf,
  formatDateFr,
} from "@/lib/abonnements-utils";
import { getPlanLabel } from "@/lib/plans-store";

const STATUT_LABELS: Record<StatutAbonnement, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  EXPIRE: "Expiré",
  ANNULE: "Annulé",
};

const STATUT_COLOR: Record<
  StatutAbonnement,
  "success" | "warning" | "error" | "light"
> = {
  ACTIF: "success",
  SUSPENDU: "warning",
  EXPIRE: "light",
  ANNULE: "error",
};

export default function UtilisateurAbonnementPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const utilisateur = getUserById(id);

  if (!utilisateur) {
    notFound();
  }

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
  const abonnements = getAbonnementsByEmail(utilisateur.email);
  const abonnementActif = abonnements.find((a) => a.statut === "ACTIF");
  const planCourant = abonnementActif
    ? getPlanDetails(abonnementActif.plan)
    : null;
  const caracteristiques = abonnementActif
    ? getPlanCaracteristiques(abonnementActif.plan)
    : [];
  const paiements = useMemo(
    () => getPaiementsByNom(nomComplet),
    [nomComplet]
  );

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Utilisateurs", href: "/admin/utilisateurs" },
    { label: nomComplet, href: `/admin/utilisateurs/${utilisateur.id}` },
    { label: "Abonnement" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Abonnement personnel
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {nomComplet} — {utilisateur.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/admin/utilisateurs/${utilisateur.id}`}>
            <Button variant="outline">Voir le profil</Button>
          </Link>
          <Link href="/admin/utilisateurs">
            <Button variant="outline">Liste des utilisateurs</Button>
          </Link>
        </div>
      </div>

      {!utilisateur.abonnementActif && abonnements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-gray-600 dark:text-gray-400">
            Cet utilisateur n&apos;a pas d&apos;abonnement actif.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Aucun historique d&apos;abonnement enregistré dans la démo.
          </p>
        </div>
      ) : (
        <>
          {abonnementActif && planCourant && (
            <section className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6 dark:border-brand-500/20 dark:bg-brand-500/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                    Plan actuel
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                    {getPlanLabel(abonnementActif.plan)}
                  </h2>
                  <p className="mt-2 text-xl font-bold text-brand-500">
                    {formatXaf(planCourant.prix)}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                      / {planCourant.dureeJours} jours
                    </span>
                  </p>
                </div>
                <Badge
                  color={STATUT_COLOR[abonnementActif.statut]}
                  size="md"
                  variant="light"
                >
                  {STATUT_LABELS[abonnementActif.statut]}
                </Badge>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox
                  label="Date de début"
                  value={formatDateFr(abonnementActif.dateDebut)}
                />
                <InfoBox
                  label="Date de fin"
                  value={formatDateFr(abonnementActif.dateFin)}
                />
                <InfoBox
                  label="Montant payé"
                  value={formatXaf(abonnementActif.montant)}
                />
                <InfoBox
                  label="Type"
                  value={abonnementActif.typeRenouvellement}
                />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Caractéristiques incluses
                </h3>
                <ul className="mt-3 space-y-2">
                  {caracteristiques.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="mt-0.5 text-brand-500">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {abonnements.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Historique des abonnements
              </h2>
              <div className="mt-4 space-y-3">
                {abonnements.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {getPlanLabel(a.plan)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateFr(a.dateDebut)} → {formatDateFr(a.dateFin)} ·{" "}
                        {formatXaf(a.montant)}
                      </p>
                    </div>
                    <Badge
                      color={STATUT_COLOR[a.statut]}
                      size="sm"
                      variant="light"
                    >
                      {STATUT_LABELS[a.statut]}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {paiements.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Paiements associés
              </h2>
              <div className="mt-4 space-y-3">
                {paiements.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {getPlanLabel(p.plan)} — {formatXaf(p.montant)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {p.operateur} · {p.numeroTelephone}
                        {p.refTransaction
                          ? ` · Réf. ${p.refTransaction}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      color={
                        p.statut === "SUCCES"
                          ? "success"
                          : p.statut === "ECHEC"
                            ? "error"
                            : "warning"
                      }
                      size="sm"
                      variant="light"
                    >
                      {p.statut === "SUCCES"
                        ? "Succès"
                        : p.statut === "ECHEC"
                          ? "Échec"
                          : "En attente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/80 p-3 dark:bg-white/[0.05]">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}
