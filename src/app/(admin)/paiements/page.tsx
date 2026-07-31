"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type { MockPaiement, PlanType, StatutPaiement } from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import { fetchPaymentsPersisted } from "@/lib/payments-store";
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
import { ExportDropdownButton } from "@/components/admin/ExportDropdownButton";
import { ADMIN_ROUTES } from "@/lib/api/routes";

function estMoisCourant(iso: string): boolean {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return iso.startsWith(prefix);
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

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function PaymentsStatsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Chargement du résumé financier"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <TextSkeleton className="h-4 w-40" />
          <TextSkeleton className="mt-3 h-8 w-28" />
          <TextSkeleton className="mt-3 h-3 w-full max-w-xs" />
        </div>
      ))}
    </div>
  );
}

function PaymentsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
      aria-busy="true"
      aria-label="Chargement des paiements"
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1150px]">
          <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
            {Array.from({ length: 9 }).map((_, i) => (
              <TextSkeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <TextSkeleton className="h-4 w-28" />
                <TextSkeleton className="h-4 w-20" />
                <TextSkeleton className="h-4 w-16" />
                <TextSkeleton className="h-4 w-20" />
                <TextSkeleton className="h-4 w-24" />
                <TextSkeleton className="h-6 w-16 rounded-full" />
                <TextSkeleton className="h-4 w-32" />
                <TextSkeleton className="h-4 w-28" />
                <TextSkeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<MockPaiement[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<
    "tous" | StatutPaiement
  >("tous");
  const [filtreOperateur, setFiltreOperateur] = useState<string>("tous");
  const [exportDateDebut, setExportDateDebut] = useState("");
  const [exportDateFin, setExportDateFin] = useState("");
  const [detailPaiement, setDetailPaiement] = useState<MockPaiement | null>(
    null
  );
  const [loadingPaiements, setLoadingPaiements] = useState(true);

  const apiMode = isApiConfigured();

  const chargerPaiements = useCallback(async () => {
    setLoadingPaiements(true);
    try {
      const statut =
        apiMode && filtreStatut !== "tous" ? filtreStatut : undefined;
      const operateur =
        apiMode && filtreOperateur !== "tous" ? filtreOperateur : undefined;
      setPaiements(await fetchPaymentsPersisted({ statut, operateur }));
    } finally {
      setLoadingPaiements(false);
    }
  }, [apiMode, filtreStatut, filtreOperateur]);

  useEffect(() => {
    void chargerPaiements();
  }, [chargerPaiements]);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setFiltreOperateur("tous");
  }, []);

  const operateurs = useMemo(() => {
    const s = new Set(paiements.map((p) => p.operateur));
    return Array.from(s).sort();
  }, [paiements]);

  const exportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (apiMode && filtreStatut !== "tous") params.set("statut", filtreStatut);
    if (apiMode && filtreOperateur !== "tous")
      params.set("operateur", filtreOperateur);
    if (apiMode && exportDateDebut) params.set("dateDebut", exportDateDebut);
    if (apiMode && exportDateFin) params.set("dateFin", exportDateFin);
    return params.toString();
  }, [apiMode, filtreStatut, filtreOperateur, exportDateDebut, exportDateFin]);

  const libelleMoisCourant = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }, []);

  const resume = useMemo(() => {
    const succesMois = paiements.filter(
      (p) => p.statut === "SUCCES" && estMoisCourant(p.createdAt)
    );
    const totalEncaisse = succesMois.reduce((acc, p) => acc + p.montant, 0);
    const enAttente = paiements.filter(
      (p) => p.statut === "EN_ATTENTE"
    ).length;
    const echec = paiements.filter((p) => p.statut === "ECHEC").length;
    const succesTous = paiements.filter((p) => p.statut === "SUCCES");
    const moyenne =
      succesTous.length > 0
        ? Math.round(
            succesTous.reduce((a, p) => a + p.montant, 0) / succesTous.length
          )
        : 0;
    return { totalEncaisse, enAttente, echec, moyenne };
  }, [paiements]);

  const listeFiltree = useMemo(() => {
    return paiements.filter((p) => {
      const okStat =
        apiMode || filtreStatut === "tous" || p.statut === filtreStatut;
      const okOp =
        apiMode ||
        filtreOperateur === "tous" ||
        p.operateur === filtreOperateur;
      return okStat && okOp;
    });
  }, [paiements, filtreStatut, filtreOperateur, apiMode]);

  const showPageSkeleton = apiMode && loadingPaiements && paiements.length === 0;
  const listRefreshing = apiMode && loadingPaiements && paiements.length > 0;

  return (
    <div className="space-y-8" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Paiements")} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Paiements
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Encaissements et transactions Mobile Money
          </p>
        </div>
        {apiMode && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Label htmlFor="export-date-debut">Période de l&apos;export (du)</Label>
              <input
                id="export-date-debut"
                type="date"
                className={selectClass}
                value={exportDateDebut}
                max={exportDateFin || undefined}
                onChange={(e) => setExportDateDebut(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="export-date-fin">au</Label>
              <input
                id="export-date-fin"
                type="date"
                className={selectClass}
                value={exportDateFin}
                min={exportDateDebut || undefined}
                onChange={(e) => setExportDateFin(e.target.value)}
              />
            </div>
            <ExportDropdownButton
              pdfPath={ADMIN_ROUTES.exports.paymentsPdf(exportQuery)}
              xlsxPath={ADMIN_ROUTES.exports.paymentsXlsx(exportQuery)}
              filenameBase="blinks-paiements"
            />
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Résumé financier
        </h2>
        {showPageSkeleton ? (
          <PaymentsStatsSkeleton />
        ) : (
        <div
          className={
            listRefreshing
              ? "pointer-events-none opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total encaissé ce mois ({libelleMoisCourant})
            </span>
            <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {formatXaf(resume.totalEncaisse)}
            </p>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
              Somme des paiements réussis sur le mois en cours
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
        </div>
        )}
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

        {showPageSkeleton ? (
          <PaymentsTableSkeleton />
        ) : !loadingPaiements && listeFiltree.length === 0 ? (
          <EmptyState
            icon={<DollarLineIcon className="size-7" />}
            message="Aucun paiement trouvé pour ce filtre."
            onReset={reinitialiserFiltres}
          />
        ) : (
          <div
            className={
              listRefreshing
                ? "pointer-events-none opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
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
