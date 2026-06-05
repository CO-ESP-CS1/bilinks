"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockUtilisateur, StatutAbonnement } from "@/lib/mock-data";
import type {
  AdminUserDetailAbonnementApi,
  AdminUserDetailPaiementApi,
  AdminUserDetailResponse,
} from "@/lib/api/admin-types";
import { isApiConfigured } from "@/lib/api/client";
import {
  fetchUserDetailPersisted,
  getUserById,
} from "@/lib/users-store";
import { fetchPlansPersisted } from "@/lib/plans-store";
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

const PAIEMENT_STATUT_LABEL: Record<string, string> = {
  SUCCES: "Succès",
  ECHEC: "Échec",
  EN_ATTENTE: "En attente",
};

export default function UtilisateurAbonnementPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const apiMode = isApiConfigured();

  const [utilisateur, setUtilisateur] = useState<
    MockUtilisateur | null | undefined
  >(undefined);
  const [detail, setDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [planPrix, setPlanPrix] = useState<Record<string, number>>({});

  const recharger = useCallback(async () => {
    if (apiMode) {
      setLoadError(null);
      const result = await fetchUserDetailPersisted(id);
      if (!result.ok) {
        setUtilisateur(null);
        setDetail(null);
        setLoadError(result.error);
        return;
      }
      setUtilisateur(result.user);
      setDetail(result.detail);
      const plans = await fetchPlansPersisted();
      const prixMap: Record<string, number> = {};
      for (const p of plans) {
        prixMap[p.code] = p.prix;
      }
      setPlanPrix(prixMap);
      return;
    }

    const user = getUserById(id);
    setUtilisateur(user ?? null);
    setDetail(null);
  }, [apiMode, id]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  if (utilisateur === undefined) {
    return null;
  }

  if (!utilisateur) {
    if (loadError && apiMode) {
      return (
        <div className="space-y-4 p-6">
          <p className="text-sm text-warning-600 dark:text-warning-400">
            {loadError}
          </p>
          <Link href="/admin/utilisateurs">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
        </div>
      );
    }
    notFound();
  }

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;

  const abonnementsApi = detail?.abonnements ?? [];
  const paiementsApi = detail?.paiements ?? [];
  const abonnementsMock = getAbonnementsByEmail(utilisateur.email);
  const paiementsMock = getPaiementsByNom(nomComplet);

  const abonnements = apiMode ? abonnementsApi : abonnementsMock;
  const paiements = apiMode ? paiementsApi : paiementsMock;

  const abonnementActif = abonnements.find((a) => a.statut === "ACTIF");

  const planCourant =
    !apiMode && abonnementActif
      ? getPlanDetails(abonnementActif.plan)
      : null;

  const caracteristiques =
    !apiMode && abonnementActif
      ? getPlanCaracteristiques(abonnementActif.plan)
      : [];

  const montantActif = apiMode && abonnementActif
    ? findMontantApi(abonnementActif as AdminUserDetailAbonnementApi, paiementsApi)
    : abonnementActif && "montant" in abonnementActif
      ? (abonnementActif as { montant: number }).montant
      : null;

  const prixPlanActif = apiMode && abonnementActif
    ? planPrix[abonnementActif.plan]
    : planCourant?.prix;

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Utilisateurs", href: "/admin/utilisateurs" },
    { label: nomComplet, href: `/admin/utilisateurs/${utilisateur.id}` },
    { label: "Abonnement" },
  ];

  const aucunHistorique =
    !utilisateur.abonnementActif && abonnements.length === 0;

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

      {aucunHistorique ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-gray-600 dark:text-gray-400">
            Cet utilisateur n&apos;a pas d&apos;abonnement actif.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Aucun historique d&apos;abonnement enregistré.
          </p>
        </div>
      ) : (
        <>
          {abonnementActif && (
            <section className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6 dark:border-brand-500/20 dark:bg-brand-500/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                    Plan actuel
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                    {getPlanLabel(abonnementActif.plan)}
                  </h2>
                  {prixPlanActif != null && (
                    <p className="mt-2 text-xl font-bold text-brand-500">
                      {formatXaf(prixPlanActif)}
                      {!apiMode && planCourant && (
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          / {planCourant.dureeJours} jours
                        </span>
                      )}
                    </p>
                  )}
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
                  value={formatDateFr(
                    apiMode
                      ? (abonnementActif as AdminUserDetailAbonnementApi)
                          .date_debut
                      : (abonnementActif as { dateDebut: string }).dateDebut
                  )}
                />
                <InfoBox
                  label="Date de fin"
                  value={formatDateFr(
                    apiMode
                      ? (abonnementActif as AdminUserDetailAbonnementApi).date_fin
                      : (abonnementActif as { dateFin: string }).dateFin
                  )}
                />
                {montantActif != null && (
                  <InfoBox
                    label="Montant payé"
                    value={formatXaf(montantActif)}
                  />
                )}
                <InfoBox
                  label="Type"
                  value={
                    apiMode
                      ? (abonnementActif as AdminUserDetailAbonnementApi)
                          .type_renouvellement
                      : (abonnementActif as { typeRenouvellement: string })
                          .typeRenouvellement
                  }
                />
              </div>

              {!apiMode && caracteristiques.length > 0 && (
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
              )}
            </section>
          )}

          {abonnements.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Historique des abonnements
              </h2>
              <div className="mt-4 space-y-3">
                {abonnements.map((a) => {
                  const dateDebut = apiMode
                    ? (a as AdminUserDetailAbonnementApi).date_debut
                    : (a as { dateDebut: string }).dateDebut;
                  const dateFin = apiMode
                    ? (a as AdminUserDetailAbonnementApi).date_fin
                    : (a as { dateFin: string }).dateFin;
                  const montant = apiMode
                    ? findMontantApi(
                        a as AdminUserDetailAbonnementApi,
                        paiementsApi
                      )
                    : (a as { montant?: number }).montant;

                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {getPlanLabel(a.plan)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateFr(dateDebut)} → {formatDateFr(dateFin)}
                          {montant != null ? ` · ${formatXaf(montant)}` : ""}
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
                  );
                })}
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
                        {apiMode
                          ? [
                              (p as AdminUserDetailPaiementApi).operateur,
                              (p as AdminUserDetailPaiementApi).numero_telephone,
                              (p as AdminUserDetailPaiementApi).ref_transaction
                                ? `Réf. ${(p as AdminUserDetailPaiementApi).ref_transaction}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : [
                              (p as { operateur: string }).operateur,
                              (p as { numeroTelephone: string }).numeroTelephone,
                              (p as { refTransaction?: string }).refTransaction
                                ? `Réf. ${(p as { refTransaction?: string }).refTransaction}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
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
                      {PAIEMENT_STATUT_LABEL[p.statut] ?? p.statut}
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

function findMontantApi(
  abo: AdminUserDetailAbonnementApi,
  paiements: AdminUserDetailPaiementApi[]
): number | null {
  if (abo.paiement_id) {
    const linked = paiements.find((p) => p.id === abo.paiement_id);
    if (linked) return linked.montant;
  }
  const byPlan = paiements.find(
    (p) => p.plan === abo.plan && p.statut === "SUCCES"
  );
  return byPlan?.montant ?? null;
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
