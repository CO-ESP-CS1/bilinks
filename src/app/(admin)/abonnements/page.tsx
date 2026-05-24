"use client";

import React, { useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockAbonnements,
  type MockAbonnement,
  type MockPlanTarifaire,
  type StatutAbonnement,
  type StatutPlanTarifaire,
  type TypeRenouvellement,
} from "@/lib/mock-data";
import { formatXaf } from "@/lib/abonnements-utils";
import {
  createPlan,
  deletePlan,
  getAllPlans,
  getPlanLabel,
  slugifyPlanCode,
  updatePlan,
} from "@/lib/plans-store";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
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

function prixPlan(code: string, plans: MockPlanTarifaire[]): number {
  return plans.find((p) => p.code === code)?.prix ?? 0;
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type AboFormState = {
  utilisateurNom: string;
  utilisateurEmail: string;
  plan: string;
  typeRenouvellement: TypeRenouvellement;
  statut: StatutAbonnement;
  dateDebut: string;
  dateFin: string;
  montant: string;
};

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

function emptyAboForm(plans: MockPlanTarifaire[]): AboFormState {
  const defaut =
    plans.find((p) => p.code === "MENSUEL" && p.statut === "ACTIF") ??
    plans.find((p) => p.statut === "ACTIF");
  const code = defaut?.code ?? "MENSUEL";
  return {
    utilisateurNom: "",
    utilisateurEmail: "",
    plan: code,
    typeRenouvellement: "NOUVEAU",
    statut: "ACTIF",
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: "",
    montant: String(defaut?.prix ?? 1500),
  };
}

type DialogCible =
  | { type: "supprimer"; abo: MockAbonnement }
  | { type: "suspendre"; abo: MockAbonnement }
  | { type: "annuler"; abo: MockAbonnement }
  | { type: "supprimerPlan"; plan: MockPlanTarifaire };

export default function AbonnementsPage() {
  const [abonnements, setAbonnements] = useState<MockAbonnement[]>(() =>
    mockAbonnements.map((a) => ({ ...a, deletedAt: a.deletedAt ?? null }))
  );
  const [plans, setPlans] = useState<MockPlanTarifaire[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<"tous" | StatutAbonnement>(
    "tous"
  );
  const [filtrePlan, setFiltrePlan] = useState<string>("tous");
  const [filtreType, setFiltreType] = useState<"tous" | TypeRenouvellement>(
    "tous"
  );
  const [dialog, setDialog] = useState<DialogCible | null>(null);
  const [modalAbo, setModalAbo] = useState<"ajouter" | "modifier" | null>(null);
  const [aboEdition, setAboEdition] = useState<MockAbonnement | null>(null);
  const [formAbo, setFormAbo] = useState<AboFormState>(() => emptyAboForm([]));
  const [modalPlan, setModalPlan] = useState<"creer" | "modifier" | null>(null);
  const [planEdition, setPlanEdition] = useState<MockPlanTarifaire | null>(null);
  const [formPlan, setFormPlan] = useState<PlanFormState>(emptyPlanForm);

  React.useEffect(() => {
    setPlans(getAllPlans());
  }, []);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setFiltrePlan("tous");
    setFiltreType("tous");
  }, []);

  const abonnementsActifs = useMemo(
    () => abonnements.filter((a) => !isSoftDeleted(a.deletedAt)),
    [abonnements]
  );

  const plansActifs = useMemo(
    () =>
      plans.filter((p) => p.statut === "ACTIF" && !isSoftDeleted(p.deletedAt)),
    [plans]
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
        filtreStatut === "tous" || a.statut === filtreStatut;
      const okPlan = filtrePlan === "tous" || a.plan === filtrePlan;
      const okType =
        filtreType === "tous" || a.typeRenouvellement === filtreType;
      return okStat && okPlan && okType;
    });
  }, [abonnementsActifs, filtreStatut, filtrePlan, filtreType]);

  const rafraichirPlans = useCallback(() => {
    setPlans(getAllPlans());
  }, []);

  const ouvrirAjout = () => {
    setAboEdition(null);
    setFormAbo(emptyAboForm(plans));
    setModalAbo("ajouter");
  };

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

  const ouvrirModification = (a: MockAbonnement) => {
    setAboEdition(a);
    setFormAbo({
      utilisateurNom: a.utilisateurNom,
      utilisateurEmail: a.utilisateurEmail,
      plan: a.plan,
      typeRenouvellement: a.typeRenouvellement,
      statut: a.statut,
      dateDebut: a.dateDebut,
      dateFin: a.dateFin,
      montant: String(a.montant),
    });
    setModalAbo("modifier");
  };

  const enregistrerAbo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAbo.utilisateurNom.trim() || !formAbo.utilisateurEmail.trim()) {
      toast.error("Nom et e-mail obligatoires.");
      return;
    }
    const montant = Number(formAbo.montant) || prixPlan(formAbo.plan, plans);
    const payload = {
      utilisateurNom: formAbo.utilisateurNom.trim(),
      utilisateurEmail: formAbo.utilisateurEmail.trim(),
      plan: formAbo.plan,
      typeRenouvellement: formAbo.typeRenouvellement,
      statut: formAbo.statut,
      dateDebut: formAbo.dateDebut,
      dateFin: formAbo.dateFin || formAbo.dateDebut,
      montant,
    };
    if (modalAbo === "modifier" && aboEdition) {
      setAbonnements((prev) =>
        prev.map((row) =>
          row.id === aboEdition.id ? { ...row, ...payload } : row
        )
      );
      toast.success("Abonnement modifié.");
    } else {
      setAbonnements((prev) => [
        { id: `ab-${Date.now()}`, ...payload, deletedAt: null },
        ...prev,
      ]);
      toast.success("Abonnement ajouté.");
    }
    setModalAbo(null);
    setAboEdition(null);
  };

  const confirmerDialog = () => {
    if (!dialog) return;
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
      deletePlan(plan.id);
      rafraichirPlans();
      toast.success(`Plan « ${plan.nom} » supprimé (soft delete).`);
      setDialog(null);
      return;
    }
    const { abo } = dialog;
    if (dialog.type === "supprimer") {
      setAbonnements((prev) =>
        prev.map((row) =>
          row.id === abo.id
            ? { ...row, deletedAt: softDeleteTimestamp() }
            : row
        )
      );
      toast.success("Abonnement supprimé (soft delete).");
    } else if (dialog.type === "suspendre") {
      setAbonnements((prev) =>
        prev.map((row) =>
          row.id === abo.id ? { ...row, statut: "SUSPENDU" as const } : row
        )
      );
      toast.success(`Abonnement de ${abo.utilisateurNom} suspendu.`);
    } else if (dialog.type === "annuler") {
      setAbonnements((prev) =>
        prev.map((row) =>
          row.id === abo.id ? { ...row, statut: "ANNULE" as const } : row
        )
      );
      toast.success(`Abonnement de ${abo.utilisateurNom} annulé.`);
    }
    setDialog(null);
  };

  const enregistrerPlan = (e: React.FormEvent) => {
    e.preventDefault();
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
    try {
      if (modalPlan === "modifier" && planEdition) {
        updatePlan(planEdition.id, {
          nom: formPlan.nom.trim(),
          prix,
          dureeJours,
          statut: formPlan.statut,
        });
        toast.success("Plan tarifaire modifié.");
      } else {
        const code =
          formPlan.code.trim() || slugifyPlanCode(formPlan.nom);
        createPlan({
          nom: formPlan.nom.trim(),
          code,
          prix,
          dureeJours,
          statut: formPlan.statut,
        });
        toast.success("Plan tarifaire créé.");
      }
      rafraichirPlans();
      setModalPlan(null);
      setPlanEdition(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    }
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={adminCrumb("Abonnements")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Abonnements
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Plans tarifaires et suivi des abonnements BiblioTech
          </p>
        </div>
        <Button onClick={ouvrirAjout} startIcon={<PlusIcon className="size-5" />}>
          Ajouter un abonnement
        </Button>
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
        {plansVisibles.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun plan tarifaire. Ajoutez-en un pour commencer.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
            {plans.map((pl) => (
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-gray-200 hover:text-brand-500 dark:ring-gray-700"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() =>
                      setDialog({ type: "supprimerPlan", plan: pl })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-gray-200 hover:text-error-500 dark:ring-gray-700"
                  >
                    <TrashBinIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
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

        {listeFiltree.length === 0 ? (
          <EmptyState
            icon={<ShootingStarIcon className="size-7" />}
            message="Aucun abonnement trouvé pour ce filtre."
            onReset={reinitialiserFiltres}
          />
        ) : (
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
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => ouvrirModification(a)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-brand-500 dark:ring-gray-700 dark:hover:bg-white/5"
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            {a.statut === "ACTIF" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDialog({ type: "suspendre", abo: a })
                                }
                                className="rounded-lg border border-warning-200 px-2.5 py-1.5 text-theme-xs font-medium text-warning-600 hover:bg-warning-50 dark:border-warning-500/30 dark:text-warning-400"
                              >
                                Suspendre
                              </button>
                            )}
                            {a.statut === "SUSPENDU" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setAbonnements((prev) =>
                                    prev.map((row) =>
                                      row.id === a.id
                                        ? { ...row, statut: "ACTIF" as const }
                                        : row
                                    )
                                  )
                                }
                                className="rounded-lg border border-success-200 px-2.5 py-1.5 text-theme-xs font-medium text-success-600 hover:bg-success-50 dark:border-success-500/30"
                              >
                                Réactiver
                              </button>
                            )}
                            {a.statut !== "ANNULE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDialog({ type: "annuler", abo: a })
                                }
                                className="rounded-lg border border-error-200 px-2.5 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30"
                              >
                                Annuler
                              </button>
                            )}
                            <button
                              type="button"
                              title="Supprimer"
                              onClick={() =>
                                setDialog({ type: "supprimer", abo: a })
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:bg-error-50 hover:text-error-500 dark:ring-gray-700"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
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
        isOpen={modalAbo != null}
        onClose={() => {
          setModalAbo(null);
          setAboEdition(null);
        }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalAbo === "modifier"
            ? "Modifier l'abonnement"
            : "Nouvel abonnement"}
        </h2>
        <form onSubmit={enregistrerAbo} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="abo-nom">Utilisateur *</Label>
            <Input
              id="abo-nom"
              required
              value={formAbo.utilisateurNom}
              onChange={(e) =>
                setFormAbo((f) => ({ ...f, utilisateurNom: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="abo-email">E-mail *</Label>
            <Input
              id="abo-email"
              type="email"
              required
              value={formAbo.utilisateurEmail}
              onChange={(e) =>
                setFormAbo((f) => ({ ...f, utilisateurEmail: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="abo-plan-f">Plan</Label>
              <select
                id="abo-plan-f"
                className={selectClass}
                value={formAbo.plan}
                onChange={(e) => {
                  const plan = e.target.value;
                  setFormAbo((f) => ({
                    ...f,
                    plan,
                    montant: String(prixPlan(plan, plans)),
                  }));
                }}
              >
                {plansActifs.map((pl) => (
                  <option key={pl.id} value={pl.code}>
                    {pl.nom} — {formatXaf(pl.prix)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="abo-type-f">Type</Label>
              <select
                id="abo-type-f"
                className={selectClass}
                value={formAbo.typeRenouvellement}
                onChange={(e) =>
                  setFormAbo((f) => ({
                    ...f,
                    typeRenouvellement: e.target.value as TypeRenouvellement,
                  }))
                }
              >
                {(Object.keys(TYPE_LABELS) as TypeRenouvellement[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {TYPE_LABELS[k]}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="abo-debut">Date début</Label>
              <Input
                id="abo-debut"
                type="date"
                required
                value={formAbo.dateDebut}
                onChange={(e) =>
                  setFormAbo((f) => ({ ...f, dateDebut: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="abo-fin">Date fin</Label>
              <Input
                id="abo-fin"
                type="date"
                required
                value={formAbo.dateFin}
                onChange={(e) =>
                  setFormAbo((f) => ({ ...f, dateFin: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="abo-montant">Montant (XAF)</Label>
              <Input
                id="abo-montant"
                type="number"
                min="0"
                value={formAbo.montant}
                onChange={(e) =>
                  setFormAbo((f) => ({ ...f, montant: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="abo-statut-f">Statut</Label>
              <select
                id="abo-statut-f"
                className={selectClass}
                value={formAbo.statut}
                onChange={(e) =>
                  setFormAbo((f) => ({
                    ...f,
                    statut: e.target.value as StatutAbonnement,
                  }))
                }
              >
                <option value="ACTIF">Actif</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="EXPIRE">Expiré</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button variant="outline" onClick={() => setModalAbo(null)}>
              Annuler
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalPlan != null}
        onClose={() => {
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
                min="1"
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
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => {
                setModalPlan(null);
                setPlanEdition(null);
              }}
            >
              Annuler
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={dialog != null}
        onClose={() => setDialog(null)}
        onConfirm={confirmerDialog}
        title={
          dialog?.type === "supprimerPlan"
            ? "Supprimer ce plan tarifaire ?"
            : dialog?.type === "supprimer"
              ? "Supprimer cet abonnement ?"
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
              {dialog.type === "supprimer" &&
                " Soft delete : l'enregistrement est conservé mais masqué."}
            </>
          ) : null
        }
        confirmLabel={
          dialog?.type === "supprimer" || dialog?.type === "supprimerPlan"
            ? "Supprimer"
            : dialog?.type === "suspendre"
              ? "Suspendre"
              : "Confirmer l'annulation"
        }
        variant="danger"
      />
    </div>
  );
}
