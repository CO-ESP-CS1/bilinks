"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockPaiements,
  type MockPaiement,
  type PlanType,
  type StatutPaiement,
} from "@/lib/mock-data";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatXaf } from "@/lib/abonnements-utils";
import { getPlanLabel } from "@/lib/plans-store";
import { DollarLineIcon } from "@/icons";

function estMai2025(iso: string): boolean {
  return iso.startsWith("2025-05");
}

function dateHeureFr(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

export default function PaiementsPage() {
  const [filtreStatut, setFiltreStatut] = useState<
    "tous" | StatutPaiement
  >("tous");
  const [filtreOperateur, setFiltreOperateur] = useState<string>("tous");
  const [detailPaiement, setDetailPaiement] = useState<MockPaiement | null>(
    null
  );

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setFiltreOperateur("tous");
  }, []);

  const operateurs = useMemo(() => {
    const s = new Set(mockPaiements.map((p) => p.operateur));
    return Array.from(s).sort();
  }, []);

  const resume = useMemo(() => {
    const succesMai = mockPaiements.filter(
      (p) => p.statut === "SUCCES" && estMai2025(p.createdAt)
    );
    const totalEncaisse = succesMai.reduce((acc, p) => acc + p.montant, 0);
    const enAttente = mockPaiements.filter(
      (p) => p.statut === "EN_ATTENTE"
    ).length;
    const echec = mockPaiements.filter((p) => p.statut === "ECHEC").length;
    const succesTous = mockPaiements.filter((p) => p.statut === "SUCCES");
    const moyenne =
      succesTous.length > 0
        ? Math.round(
            succesTous.reduce((a, p) => a + p.montant, 0) / succesTous.length
          )
        : 0;
    return { totalEncaisse, enAttente, echec, moyenne };
  }, []);

  const listeFiltree = useMemo(() => {
    return mockPaiements.filter((p) => {
      const okStat =
        filtreStatut === "tous" || p.statut === filtreStatut;
      const okOp =
        filtreOperateur === "tous" || p.operateur === filtreOperateur;
      return okStat && okOp;
    });
  }, [filtreStatut, filtreOperateur]);

  return (
    <div className="space-y-8">
      <Breadcrumb items={adminCrumb("Paiements")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Paiements
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Encaissements et transactions Mobile Money
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Résumé financier
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total encaissé ce mois (mai 2025)
            </span>
            <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatXaf(resume.totalEncaisse)}
            </p>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
              Somme des paiements réussis en mai 2025
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Paiements en attente
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-title-sm font-bold text-gray-800 dark:text-white/90">
                {resume.enAttente}
              </span>
              <Badge color="warning" size="sm" variant="light">
                En attente
              </Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Paiements échoués
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-title-sm font-bold text-gray-800 dark:text-white/90">
                {resume.echec}
              </span>
              <Badge color="error" size="sm" variant="light">
                Échec
              </Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Transaction moyenne (réussies)
            </span>
            <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatXaf(resume.moyenne)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Historique des paiements
        </h2>

        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
          <div className="w-full min-w-[180px] sm:w-52">
            <Label htmlFor="pay-statut">Statut</Label>
            <select
              id="pay-statut"
              className={selectClass}
              value={filtreStatut}
              onChange={(e) =>
                setFiltreStatut(e.target.value as typeof filtreStatut)
              }
            >
              <option value="tous">Tous</option>
              <option value="SUCCES">Succès</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ECHEC">Échec</option>
            </select>
          </div>
          <div className="w-full min-w-[160px] sm:w-48">
            <Label htmlFor="pay-op">Opérateur</Label>
            <select
              id="pay-op"
              className={selectClass}
              value={filtreOperateur}
              onChange={(e) => setFiltreOperateur(e.target.value)}
            >
              <option value="tous">Tous</option>
              {operateurs.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>

        {listeFiltree.length === 0 ? (
          <EmptyState
            icon={<DollarLineIcon className="size-7" />}
            message="Aucun paiement trouvé pour ce filtre."
            onReset={reinitialiserFiltres}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1150px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {[
                        "Utilisateur",
                        "Plan",
                        "Montant",
                        "Opérateur",
                        "N° Mobile Money",
                        "Statut",
                        "Réf. transaction",
                        "Date",
                        "Actions",
                      ].map((c) => (
                        <TableCell
                          key={c}
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          {c}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {listeFiltree.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {p.utilisateurNom}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {getPlanLabel(p.plan)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {formatXaf(p.montant)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {p.operateur}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {p.numeroTelephone}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {p.statut === "SUCCES" && (
                            <Badge color="success" size="sm" variant="light">
                              Succès
                            </Badge>
                          )}
                          {p.statut === "EN_ATTENTE" && (
                            <Badge color="warning" size="sm" variant="light">
                              En attente
                            </Badge>
                          )}
                          {p.statut === "ECHEC" && (
                            <Badge color="error" size="sm" variant="light">
                              Échec
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start font-mono text-theme-xs text-gray-600 dark:text-gray-400">
                          {p.refTransaction ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {dateHeureFr(p.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            type="button"
                            onClick={() => setDetailPaiement(p)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-theme-xs font-medium text-white hover:bg-brand-600"
                          >
                            Voir détails
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={detailPaiement !== null}
        onClose={() => setDetailPaiement(null)}
        className="max-w-lg p-6 sm:p-8"
      >
        {detailPaiement && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Détails du paiement
            </h3>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Identifiant</dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {detailPaiement.id}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Utilisateur</dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {detailPaiement.utilisateurNom}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Plan</dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {getPlanLabel(detailPaiement.plan)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Montant</dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {formatXaf(detailPaiement.montant)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Opérateur</dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {detailPaiement.operateur}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">
                  N° Mobile Money
                </dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {detailPaiement.numeroTelephone}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Statut</dt>
                <dd className="mt-1">
                  {detailPaiement.statut === "SUCCES" && (
                    <Badge color="success" size="sm" variant="light">
                      Succès
                    </Badge>
                  )}
                  {detailPaiement.statut === "EN_ATTENTE" && (
                    <Badge color="warning" size="sm" variant="light">
                      En attente
                    </Badge>
                  )}
                  {detailPaiement.statut === "ECHEC" && (
                    <Badge color="error" size="sm" variant="light">
                      Échec
                    </Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">
                  Référence transaction
                </dt>
                <dd className="font-mono font-medium text-gray-800 dark:text-white/90">
                  {detailPaiement.refTransaction ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">
                  Date et heure
                </dt>
                <dd className="font-medium text-gray-800 dark:text-white/90">
                  {dateHeureFr(detailPaiement.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
