"use client";

import React, { useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  type MockAbonnement,
  type MockPlanTarifaire,
  type PlanType,
  type StatutAbonnement,
  type StatutPlanTarifaire,
  type TypeRenouvellement,
} from "@/lib/mock-data";
import { formatXaf } from "@/lib/abonnements-utils";
import { isApiConfigured } from "@/lib/api/client";
import {
  createPlanPersisted,
  deletePlanPersisted,
  fetchPlansPersisted,
  getPlanLabel,
  slugifyPlanCode,
  updatePlanPersisted,
} from "@/lib/plans-store";
import { isSoftDeleted } from "@/lib/soft-delete";
import {
  activateSubscriptionPersisted,
  cancelSubscriptionPersisted,
  fetchSubscriptionsPersisted,
  suspendSubscriptionPersisted,
} from "@/lib/subscriptions-store";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, PlusIcon, ShootingStarIcon, TrashBinIcon } from "@/icons";

const TYPE_LABELS: Record<TypeRenouvellement, string> = {
  NOUVEAU: "Nouveau",
  RENOUVELLEMENT: "Renouvellement",
  UPGRADE: "Upgrade",
};

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function estDatePassee(dateFin: string): boolean {
  const fin = new Date(dateFin + "T23:59:59");
  return fin < new Date();
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type PlanFormState = {
  nom: string;
  code: string;
  prix: string;
  dureeJours: string;
  statut: StatutPlanTarifaire;
};

const emptyPlanForm = (): PlanFormState => ({
  nom: "",
  code: "",
  prix: "",
  dureeJours: "30",
  statut: "ACTIF",
});

type DialogCible =
  | { type: "suspendre"; abo: MockAbonnement }
  | { type: "annuler"; abo: MockAbonnement }
  | { type: "activer"; abo: MockAbonnement }
  | { type: "supprimerPlan"; plan: MockPlanTarifaire };

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function PlansGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Chargement des plans tarifaires"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <TextSkeleton className="h-6 w-32" />
          <TextSkeleton className="mt-2 h-3 w-20" />
          <TextSkeleton className="mt-4 h-8 w-28" />
          <TextSkeleton className="mt-2 h-4 w-36" />
          <TextSkeleton className="mt-4 h-4 w-40" />
          <div className="mt-3 flex gap-2">
            <TextSkeleton className="h-6 w-14 rounded-full" />
            <TextSkeleton className="h-9 w-9 rounded-lg" />
            <TextSkeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SubscriptionsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
      aria-busy="true"
      aria-label="Chargement des abonnements"
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1080px]">
          <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
            {Array.from({ length: 8 }).map((_, i) => (
              <TextSkeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="space-y-1">
                  <TextSkeleton className="h-4 w-28" />
                  <TextSkeleton className="h-3 w-36" />
                </div>
                <TextSkeleton className="h-4 w-20" />
                <TextSkeleton className="h-6 w-16 rounded-full" />
                <TextSkeleton className="h-6 w-14 rounded-full" />
                <TextSkeleton className="h-4 w-20" />
                <TextSkeleton className="h-4 w-20" />
                <TextSkeleton className="h-4 w-16" />
                <div className="flex gap-1">
                  <TextSkeleton className="h-9 w-9 rounded-lg" />
                  <TextSkeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AbonnementsPage() {
  const [abonnements, setAbonnements] = useState<MockAbonnement[]>([]);
  const [plans, setPlans] = useState<MockPlanTarifaire[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<"tous" | StatutAbonnement>(
    "tous"
  );
  const [filtrePlan, setFiltrePlan] = useState<string>("tous");
  const [filtreType, setFiltreType] = useState<"tous" | TypeRenouvellement>(
    "tous"
  );
  const [dialog, setDialog] = useState<DialogCible | null>(null);
  const [modalPlan, setModalPlan] = useState<"creer" | "modifier" | null>(null);
  const [planEdition, setPlanEdition] = useState<MockPlanTarifaire | null>(null);
  const [formPlan, setFormPlan] = useState<PlanFormState>(emptyPlanForm);
  const [raisonAnnulation, setRaisonAnnulation] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingAbonnements, setLoadingAbonnements] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [confirmingDialog, setConfirmingDialog] = useState(false);

  const apiMode = isApiConfigured();

  const rafraichirPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      setPlans(await fetchPlansPersisted());
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const rafraichirAbonnements = useCallback(async () => {
    if (!apiMode) return;
    setLoadingAbonnements(true);
    try {
      const statut =
        filtreStatut !== "tous" ? filtreStatut : undefined;
      const plan =
        filtrePlan !== "tous" ? (filtrePlan as PlanType) : undefined;
      const type_renouvellement =
        filtreType !== "tous" ? (filtreType as TypeRenouvellement) : undefined;
      const rows = await fetchSubscriptionsPersisted({
        statut,
        plan,
        type_renouvellement,
      });
      setAbonnements(rows);
    } finally {
      setLoadingAbonnements(false);
    }
  }, [apiMode, filtreStatut, filtrePlan, filtreType]);

  React.useEffect(() => {
    void rafraichirPlans();
  }, [rafraichirPlans]);

  React.useEffect(() => {
    if (!apiMode) {
      const load = async () => {
        setLoadingAbonnements(true);
        try {
          setAbonnements(await fetchSubscriptionsPersisted());
        } finally {
          setLoadingAbonnements(false);
        }
      };
      void load();
      return;
    }
    void rafraichirAbonnements();
  }, [apiMode, rafraichirAbonnements, filtreStatut, filtrePlan, filtreType]);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setFiltrePlan("tous");
    setFiltreType("tous");
  }, []);

  const abonnementsActifs = useMemo(
    () => abonnements.filter((a) => !isSoftDeleted(a.deletedAt)),
    [abonnements]
  );

  const plansVisibles = useMemo(
    () => plans.filter((p) => !isSoftDeleted(p.deletedAt)),
    [plans]
  );

  const nbParPlan = useMemo(() => {
    const counts: Record<string, number> = {};
    plansVisibles.forEach((p) => {
      counts[p.code] = 0;
    });
    abonnementsActifs.forEach((a) => {
      if (a.statut === "ACTIF") {
        counts[a.plan] = (counts[a.plan] ?? 0) + 1;
      }
    });
    return counts;
  }, [abonnementsActifs, plansVisibles]);

  const listeFiltree = useMemo(() => {
    return abonnementsActifs.filter((a) => {
      const okStat =
        apiMode || filtreStatut === "tous" || a.statut === filtreStatut;
      const okPlan = apiMode || filtrePlan === "tous" || a.plan === filtrePlan;
      const okType =
        apiMode || filtreType === "tous" || a.typeRenouvellement === filtreType;
      return okStat && okPlan && okType;
    });
  }, [abonnementsActifs, filtreStatut, filtrePlan, filtreType, apiMode]);

  const showPlansSkeleton = loadingPlans && plans.length === 0;
  const showSubsSkeleton = loadingAbonnements && abonnements.length === 0;
  const listRefreshingSubs = loadingAbonnements && abonnements.length > 0;
  const pageLoading = showPlansSkeleton || showSubsSkeleton;

  const ouvrirPlanCreer = () => {
    setPlanEdition(null);
    setFormPlan(emptyPlanForm());
    setModalPlan("creer");
  };

  const ouvrirPlanModifier = (pl: MockPlanTarifaire) => {
    setPlanEdition(pl);
    setFormPlan({
      nom: pl.nom,
      code: pl.code,
      prix: String(pl.prix),
      dureeJours: String(pl.dureeJours),
      statut: pl.statut,
    });
    setModalPlan("modifier");
  };

  const confirmerDialog = async () => {
    if (!dialog || confirmingDialog) return;

    if (dialog.type === "supprimerPlan") {
      const { plan } = dialog;
      const abonnesActifs = nbParPlan[plan.code] ?? 0;
      if (abonnesActifs > 0) {
        toast.error(
          `Impossible : ${abonnesActifs} abonnement(s) actif(s) sur ce plan.`
        );
        setDialog(null);
        return;
      }
      setConfirmingDialog(true);
      try {
        const result = await deletePlanPersisted(plan.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        await rafraichirPlans();
        toast.success(
          isApiConfigured()
            ? `Plan « ${plan.nom} » passé en INACTIF.`
            : `Plan « ${plan.nom} » supprimé (soft delete).`
        );
        setDialog(null);
      } finally {
        setConfirmingDialog(false);
      }
      return;
    }

    const { abo } = dialog;

    if (dialog.type === "annuler") {
      const raison = raisonAnnulation.trim();
      if (apiMode && raison.length < 3) {
        toast.error("La raison doit contenir au moins 3 caractères.");
        return;
      }
      if (!apiMode && !raison) {
        toast.error("La raison d’annulation est obligatoire.");
        return;
      }
    }

    setConfirmingDialog(true);
    try {
      if (dialog.type === "suspendre") {
        const result = await suspendSubscriptionPersisted(abo.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        await rafraichirAbonnements();
        toast.success(`Abonnement de ${abo.utilisateurNom} suspendu.`);
      } else if (dialog.type === "activer") {
        const result = await activateSubscriptionPersisted(abo.id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        await rafraichirAbonnements();
        toast.success(`Abonnement de ${abo.utilisateurNom} réactivé.`);
      } else if (dialog.type === "annuler") {
        const result = await cancelSubscriptionPersisted(abo.id, raisonAnnulation);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        await rafraichirAbonnements();
        toast.success(`Abonnement de ${abo.utilisateurNom} annulé.`);
      }
      setDialog(null);
      setRaisonAnnulation("");
    } finally {
      setConfirmingDialog(false);
    }
  };

  const fermerDialog = () => {
    if (confirmingDialog) return;
    setDialog(null);
    setRaisonAnnulation("");
  };

  const enregistrerPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPlan) return;
    const prix = Number(formPlan.prix);
    const dureeJours = Number(formPlan.dureeJours);
    if (!formPlan.nom.trim()) {
      toast.error("Le nom du plan est obligatoire.");
      return;
    }
    if (!prix || prix <= 0 || !dureeJours || dureeJours <= 0) {
      toast.error("Prix et durée doivent être supérieurs à 0.");
      return;
    }
    if (apiMode && prix < 100) {
      toast.error("Le prix minimum est de 100 XAF.");
      return;
    }
    setSubmittingPlan(true);
    try {
      if (modalPlan === "modifier" && planEdition) {
        const result = await updatePlanPersisted(planEdition.id, {
          ...(apiMode ? {} : { nom: formPlan.nom.trim() }),
          prix,
          dureeJours,
          statut: formPlan.statut,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Plan tarifaire modifié.");
      } else {
        const code = formPlan.code.trim() || slugifyPlanCode(formPlan.nom);
        const result = await createPlanPersisted({
          nom: formPlan.nom.trim(),
          code,
          prix,
          dureeJours,
          ...(apiMode ? {} : { statut: formPlan.statut }),
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Plan tarifaire créé.");
      }
      await rafraichirPlans();
      setModalPlan(null);
      setPlanEdition(null);
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="space-y-8" aria-busy={pageLoading}>
      <Breadcrumb items={adminCrumb("Abonnements")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Abonnements
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Plans tarifaires et suivi des abonnements B LINKS
        </p>
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Plans tarifaires
          </h2>
          <Button
            size="sm"
            onClick={ouvrirPlanCreer}
            startIcon={<PlusIcon className="size-4" />}
          >
            Ajouter un plan
          </Button>
        </div>
        {showPlansSkeleton ? (
          <PlansGridSkeleton />
        ) : plansVisibles.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun plan tarifaire. Ajoutez-en un pour commencer.
          </p>
        ) : (
          <div
            className={
              loadingPlans
                ? "pointer-events-none opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
            {plansVisibles.map((pl) => (
              <div
                key={pl.id}
                className={`rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] ${
                  pl.statut === "INACTIF" ? "opacity-70" : ""
                }`}
              >
                <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {pl.nom}
                </p>
                <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  Code : {pl.code}
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-500">
                  {formatXaf(pl.prix)}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Durée : {pl.dureeJours} j · {pl.devise}
                </p>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {nbParPlan[pl.code] ?? 0}
                  </span>{" "}
                  abonné(s) actif(s)
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {pl.statut === "ACTIF" ? (
                    <Badge color="success" size="sm" variant="light">
                      Actif
                    </Badge>
                  ) : (
                    <Badge color="light" size="sm" variant="light">
                      Inactif
                    </Badge>
                  )}
                  <button
                    type="button"
                    title="Modifier"
                    onClick={() => ouvrirPlanModifier(pl)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/5 dark:hover:text-brand-400"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() =>
                      setDialog({ type: "supprimerPlan", plan: pl })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Liste des abonnements
        </h2>

        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:flex-wrap lg:items-end">
          <div className="w-full min-w-[140px] sm:w-44">
            <Label htmlFor="abo-statut">Statut</Label>
            <select
              id="abo-statut"
              className={selectClass}
              value={filtreStatut}
              onChange={(e) =>
                setFiltreStatut(e.target.value as typeof filtreStatut)
              }
            >
              <option value="tous">Tous</option>
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="EXPIRE">Expiré</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div className="w-full min-w-[140px] sm:w-44">
            <Label htmlFor="abo-plan">Plan</Label>
            <select
              id="abo-plan"
              className={selectClass}
              value={filtrePlan}
              onChange={(e) =>
                setFiltrePlan(e.target.value as typeof filtrePlan)
              }
            >
              <option value="tous">Tous</option>
              {plans.map((pl) => (
                <option key={pl.id} value={pl.code}>
                  {pl.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-[160px] sm:w-56">
            <Label htmlFor="abo-type">Type de renouvellement</Label>
            <select
              id="abo-type"
              className={selectClass}
              value={filtreType}
              onChange={(e) =>
                setFiltreType(e.target.value as typeof filtreType)
              }
            >
              <option value="tous">Tous</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="RENOUVELLEMENT">Renouvellement</option>
              <option value="UPGRADE">Upgrade</option>
            </select>
          </div>
        </div>

        {showSubsSkeleton ? (
          <SubscriptionsTableSkeleton />
        ) : !loadingAbonnements && listeFiltree.length === 0 ? (
          <EmptyState
            icon={<ShootingStarIcon className="size-7" />}
            message="Aucun abonnement trouvé pour ce filtre."
            onReset={reinitialiserFiltres}
          />
        ) : (
          <div
            className={
              listRefreshingSubs
                ? "pointer-events-none opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1080px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {[
                        "Utilisateur",
                        "Plan",
                        "Type",
                        "Statut",
                        "Début",
                        "Fin",
                        "Montant",
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
                    {listeFiltree.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {a.utilisateurNom}
                          </span>
                          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                            {a.utilisateurEmail}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                          {getPlanLabel(a.plan)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {a.typeRenouvellement === "NOUVEAU" && (
                            <Badge color="info" size="sm" variant="light">
                              {TYPE_LABELS.NOUVEAU}
                            </Badge>
                          )}
                          {a.typeRenouvellement === "RENOUVELLEMENT" && (
                            <Badge color="success" size="sm" variant="light">
                              {TYPE_LABELS.RENOUVELLEMENT}
                            </Badge>
                          )}
                          {a.typeRenouvellement === "UPGRADE" && (
                            <Badge color="warning" size="sm" variant="light">
                              {TYPE_LABELS.UPGRADE}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {a.statut === "ACTIF" && (
                            <Badge color="success" size="sm" variant="light">
                              Actif
                            </Badge>
                          )}
                          {a.statut === "SUSPENDU" && (
                            <Badge color="warning" size="sm" variant="light">
                              Suspendu
                            </Badge>
                          )}
                          {a.statut === "EXPIRE" && (
                            <Badge color="light" size="sm" variant="light">
                              Expiré
                            </Badge>
                          )}
                          {a.statut === "ANNULE" && (
                            <Badge color="error" size="sm" variant="light">
                              Annulé
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(a.dateDebut)}
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 text-start text-theme-sm ${
                            estDatePassee(a.dateFin)
                              ? "font-medium text-error-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {formatDate(a.dateFin)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {formatXaf(a.montant)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex flex-wrap gap-1.5">
                            {(a.statut === "SUSPENDU" || a.statut === "EXPIRE") && (
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "activer", abo: a })
                                }
                                className="rounded-lg border border-success-200 px-2.5 py-1.5 text-theme-xs font-medium text-success-600 hover:bg-success-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-success-500/30"
                              >
                                Activer
                              </button>
                            )}
                            {a.statut === "ACTIF" && (
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "suspendre", abo: a })
                                }
                                className="rounded-lg border border-warning-200 px-2.5 py-1.5 text-theme-xs font-medium text-warning-600 hover:bg-warning-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-warning-500/30 dark:text-warning-400"
                              >
                                Suspendre
                              </button>
                            )}
                            {a.statut !== "ANNULE" && (
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() => {
                                  setRaisonAnnulation("");
                                  setDialog({ type: "annuler", abo: a });
                                }}
                                className="rounded-lg border border-error-200 px-2.5 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/30"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
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
        isOpen={modalPlan != null}
        onClose={() => {
          if (submittingPlan) return;
          setModalPlan(null);
          setPlanEdition(null);
        }}
        className="max-w-md p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalPlan === "modifier"
            ? "Modifier le plan tarifaire"
            : "Nouveau plan tarifaire"}
        </h2>
        <form onSubmit={enregistrerPlan} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="plan-nom">Nom *</Label>
            <Input
              id="plan-nom"
              required
              disabled={apiMode && modalPlan === "modifier"}
              value={formPlan.nom}
              onChange={(e) => {
                const nom = e.target.value;
                setFormPlan((f) => ({
                  ...f,
                  nom,
                  code:
                    modalPlan === "creer"
                      ? slugifyPlanCode(nom)
                      : f.code,
                }));
              }}
            />
            {apiMode && modalPlan === "modifier" && (
              <p className="mt-1 text-theme-xs text-gray-500">
                Type de plan (<code className="text-xs">{formPlan.code}</code>) non
                modifiable.
              </p>
            )}
          </div>
          {modalPlan === "creer" && (
            <div>
              <Label htmlFor="plan-code">Code (identifiant)</Label>
              <Input
                id="plan-code"
                value={formPlan.code}
                onChange={(e) =>
                  setFormPlan((f) => ({
                    ...f,
                    code: slugifyPlanCode(e.target.value),
                  }))
                }
                placeholder="Ex. MENSUEL"
              />
              <p className="mt-1 text-theme-xs text-gray-500">
                Généré automatiquement à partir du nom si vide.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="plan-prix">Prix (XAF) *</Label>
              <Input
                id="plan-prix"
                type="number"
                min={apiMode ? "100" : "1"}
                required
                value={formPlan.prix}
                onChange={(e) =>
                  setFormPlan((f) => ({ ...f, prix: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="plan-duree">Durée (jours) *</Label>
              <Input
                id="plan-duree"
                type="number"
                min="1"
                required
                value={formPlan.dureeJours}
                onChange={(e) =>
                  setFormPlan((f) => ({ ...f, dureeJours: e.target.value }))
                }
              />
            </div>
          </div>
          {modalPlan === "modifier" || !apiMode ? (
            <div>
              <Label htmlFor="plan-statut">Statut</Label>
              <select
                id="plan-statut"
                className={selectClass}
                value={formPlan.statut}
                onChange={(e) =>
                  setFormPlan((f) => ({
                    ...f,
                    statut: e.target.value as StatutPlanTarifaire,
                  }))
                }
              >
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
          ) : (
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              À la création, le statut est toujours <strong>ACTIF</strong>{" "}
              (modifiable ensuite).
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              variant="outline"
              type="button"
              disabled={submittingPlan}
              onClick={() => {
                setModalPlan(null);
                setPlanEdition(null);
              }}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingPlan ? "Patientez…" : "Annuler"}
            </Button>
            <button
              type="submit"
              disabled={submittingPlan}
              className="inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingPlan ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={dialog != null}
        onClose={fermerDialog}
        onConfirm={confirmerDialog}
        confirming={confirmingDialog}
        title={
          dialog?.type === "supprimerPlan"
            ? "Supprimer ce plan tarifaire ?"
            : dialog?.type === "activer"
              ? "Réactiver cet abonnement ?"
              : dialog?.type === "suspendre"
                ? "Suspendre cet abonnement ?"
                : "Annuler cet abonnement ?"
        }
        description={
          dialog?.type === "supprimerPlan" ? (
            <>
              Le plan « {dialog.plan.nom} » sera marqué comme supprimé (soft
              delete). Impossible s&apos;il reste des abonnements actifs.
            </>
          ) : dialog && "abo" in dialog ? (
            <>
              Abonnement de « {dialog.abo.utilisateurNom} » (
              {getPlanLabel(dialog.abo.plan)}).
              {dialog.type === "activer" &&
                " L’accès aux contenus internes sera rétabli."}
              {dialog.type === "suspendre" &&
                " L’accès aux contenus internes sera temporairement révoqué."}
              {dialog.type === "annuler" && (
                <div className="mt-4">
                  <Label htmlFor="raison-annulation">Raison d’annulation *</Label>
                  <TextArea
                    rows={3}
                    value={raisonAnnulation}
                    onChange={(v) => setRaisonAnnulation(v)}
                    placeholder="Minimum 3 caractères"
                    disabled={confirmingDialog}
                  />
                </div>
              )}
            </>
          ) : null
        }
        confirmLabel={
          dialog?.type === "supprimerPlan"
            ? "Supprimer"
            : dialog?.type === "activer"
              ? "Activer"
              : dialog?.type === "suspendre"
                ? "Suspendre"
                : "Confirmer l'annulation"
        }
        variant={
          dialog?.type === "activer"
            ? "primary"
            : dialog?.type === "suspendre"
              ? "warning"
              : "danger"
        }
      />
    </div>
  );
}
