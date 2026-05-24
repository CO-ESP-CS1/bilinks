"use client";

import React, { useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockDefis,
  mockBadges,
  type MockDefi,
  type StatutDefi,
  type RareteBadge,
} from "@/lib/mock-data";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import { BoltIcon, PencilIcon, TrashBinIcon } from "@/icons";

type Onglet = "defis" | "badges";
type FiltreDefi = "tous" | StatutDefi;

const RARETE_LABELS: Record<RareteBadge, string> = {
  COMMUN: "Commun",
  RARE: "Rare",
  EPIC: "Épique",
};

const RARETE_COLORS: Record<
  RareteBadge,
  "light" | "info" | "warning" | "error" | "success" | "primary"
> = {
  COMMUN: "light",
  RARE: "info",
  EPIC: "warning",
};

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type DefiFormState = {
  titre: string;
  description: string;
  objectif: string;
  points: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutDefi;
};

function defaultDefiForm(): DefiFormState {
  const debut = new Date();
  const fin = new Date();
  fin.setMonth(fin.getMonth() + 1);
  return {
    titre: "",
    description: "",
    objectif: "",
    points: "50",
    dateDebut: debut.toISOString().slice(0, 10),
    dateFin: fin.toISOString().slice(0, 10),
    statut: "BROUILLON",
  };
}

function defiToForm(d: MockDefi): DefiFormState {
  return {
    titre: d.titre,
    description: d.description,
    objectif: d.objectif,
    points: String(d.pointsRecompense),
    dateDebut: d.dateDebut,
    dateFin: d.dateFin,
    statut: d.statut,
  };
}

function DefiForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: MockDefi;
  onSubmit: (
    data: Omit<MockDefi, "id" | "participants" | "deletedAt">
  ) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<DefiFormState>(() =>
    initial ? defiToForm(initial) : defaultDefiForm()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    if (form.dateFin < form.dateDebut) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }
    onSubmit({
      titre: form.titre.trim(),
      description: form.description.trim(),
      objectif: form.objectif.trim() || "—",
      pointsRecompense: Number(form.points) || 50,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      statut: form.statut,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="defi-titre">Titre *</Label>
        <Input
          id="defi-titre"
          type="text"
          required
          value={form.titre}
          onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="defi-desc">Description</Label>
        <TextArea
          rows={3}
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
      </div>
      <div>
        <Label htmlFor="defi-obj">Objectif</Label>
        <Input
          id="defi-obj"
          type="text"
          value={form.objectif}
          onChange={(e) => setForm((f) => ({ ...f, objectif: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="defi-pts">Points récompense</Label>
          <Input
            id="defi-pts"
            type="number"
            min="1"
            value={form.points}
            onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="defi-statut">Statut</Label>
          <select
            id="defi-statut"
            className={selectClass}
            value={form.statut}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                statut: e.target.value as StatutDefi,
              }))
            }
          >
            <option value="BROUILLON">Brouillon</option>
            <option value="ACTIF">Actif</option>
            <option value="TERMINE">Terminé</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Période du défi
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="defi-debut">Date de début *</Label>
            <Input
              id="defi-debut"
              type="date"
              required
              value={form.dateDebut}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateDebut: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="defi-fin">Date de fin *</Label>
            <Input
              id="defi-fin"
              type="date"
              required
              value={form.dateFin}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateFin: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function DefisPage() {
  const [onglet, setOnglet] = useState<Onglet>("defis");
  const [defis, setDefis] = useState<MockDefi[]>(() =>
    mockDefis.map((d) => ({ ...d, deletedAt: d.deletedAt ?? null }))
  );
  const [badges, setBadges] = useState(() =>
    mockBadges.map((b) => ({ ...b, deletedAt: b.deletedAt ?? null }))
  );
  const [filtreStatut, setFiltreStatut] = useState<FiltreDefi>("tous");
  const [search, setSearch] = useState("");
  const [champRechercheKey, setChampRechercheKey] = useState(0);
  const [modalDefi, setModalDefi] = useState<"creer" | "modifier" | null>(null);
  const [defiEdition, setDefiEdition] = useState<MockDefi | null>(null);
  const [supprimerCible, setSupprimerCible] = useState<MockDefi | null>(null);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setSearch("");
    setChampRechercheKey((k) => k + 1);
  }, []);

  const listeDefis = useMemo(() => {
    const q = search.trim().toLowerCase();
    return defis.filter((d) => {
      if (isSoftDeleted(d.deletedAt)) return false;
      const okStat = filtreStatut === "tous" || d.statut === filtreStatut;
      const okSearch =
        !q ||
        d.titre.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);
      return okStat && okSearch;
    });
  }, [defis, filtreStatut, search]);

  const stats = useMemo(() => {
    const defisVisibles = defis.filter((d) => !isSoftDeleted(d.deletedAt));
    const badgesVisibles = badges.filter((b) => !isSoftDeleted(b.deletedAt));
    const actifs = defisVisibles.filter((d) => d.statut === "ACTIF").length;
    const badgesActifs = badgesVisibles.filter((b) => b.actif).length;
    const participants = defisVisibles.reduce(
      (acc, d) => acc + d.participants,
      0
    );
    return { actifs, badgesActifs, participants };
  }, [defis, badges]);

  const basculerBadge = (id: string) => {
    setBadges((prev) =>
      prev.map((b) => (b.id === id ? { ...b, actif: !b.actif } : b))
    );
    toast.success("Statut du badge mis à jour.");
  };

  const enregistrerDefi = (
    data: Omit<MockDefi, "id" | "participants" | "deletedAt">
  ) => {
    if (modalDefi === "modifier" && defiEdition) {
      setDefis((prev) =>
        prev.map((row) =>
          row.id === defiEdition.id
            ? { ...row, ...data }
            : row
        )
      );
      toast.success("Défi modifié.");
    } else {
      setDefis((prev) => [
        ...prev,
        {
          id: `d-new-${Date.now()}`,
          ...data,
          participants: 0,
          deletedAt: null,
        },
      ]);
      toast.success("Défi créé.");
    }
    setModalDefi(null);
    setDefiEdition(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Défis & Badges")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Défis &amp; Badges
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gamification et récompenses lecteurs
          </p>
        </div>
        {onglet === "defis" && (
          <Button
            onClick={() => {
              setDefiEdition(null);
              setModalDefi("creer");
            }}
          >
            Créer un défi
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Défis actifs
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.actifs}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Badges actifs
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.badgesActifs}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Participants (tous défis)
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.participants}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setOnglet("defis")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            onglet === "defis"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Défis
        </button>
        <button
          type="button"
          onClick={() => setOnglet("badges")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            onglet === "badges"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Badges
        </button>
      </div>

      {onglet === "defis" && (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="search-defi">Rechercher</Label>
              <Input
                key={champRechercheKey}
                id="search-defi"
                type="text"
                placeholder="Titre ou description…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full min-w-[140px] sm:w-44">
              <Label htmlFor="defi-statut-filtre">Statut</Label>
              <select
                id="defi-statut-filtre"
                className={selectClass}
                value={filtreStatut}
                onChange={(e) =>
                  setFiltreStatut(e.target.value as FiltreDefi)
                }
              >
                <option value="tous">Tous</option>
                <option value="ACTIF">Actif</option>
                <option value="TERMINE">Terminé</option>
                <option value="BROUILLON">Brouillon</option>
              </select>
            </div>
          </div>

          {listeDefis.length === 0 ? (
            <EmptyState
              icon={<BoltIcon className="size-7" />}
              message="Aucun défi trouvé pour ce filtre."
              onReset={reinitialiserFiltres}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[960px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {[
                          "Titre",
                          "Objectif",
                          "Points",
                          "Période",
                          "Statut",
                          "Participants",
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
                      {listeDefis.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="px-4 py-3 text-start">
                            <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                              {d.titre}
                            </span>
                            <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                              {d.description}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {d.objectif}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-brand-500">
                            {d.pointsRecompense} pts
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {formatDate(d.dateDebut)} — {formatDate(d.dateFin)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            {d.statut === "ACTIF" && (
                              <Badge color="success" size="sm" variant="light">
                                Actif
                              </Badge>
                            )}
                            {d.statut === "TERMINE" && (
                              <Badge color="light" size="sm" variant="light">
                                Terminé
                              </Badge>
                            )}
                            {d.statut === "BROUILLON" && (
                              <Badge color="warning" size="sm" variant="light">
                                Brouillon
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                            {d.participants}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                title="Modifier"
                                onClick={() => {
                                  setDefiEdition(d);
                                  setModalDefi("modifier");
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:text-brand-500 dark:ring-gray-700"
                              >
                                <PencilIcon className="size-4" />
                              </button>
                              <button
                                type="button"
                                title="Supprimer"
                                onClick={() => setSupprimerCible(d)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:text-error-500 dark:ring-gray-700"
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
        </>
      )}

      {onglet === "badges" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {badges
            .filter((b) => !isSoftDeleted(b.deletedAt))
            .map((b) => (
            <article
              key={b.id}
              className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 ${
                !b.actif ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {b.nom}
                </h2>
                <Badge
                  color={RARETE_COLORS[b.rarete]}
                  size="sm"
                  variant="light"
                >
                  {RARETE_LABELS[b.rarete]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {b.description}
              </p>
              <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Condition : {b.condition}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Intl.NumberFormat("fr-FR").format(b.nbAttribues)}{" "}
                attribution(s)
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => basculerBadge(b.id)}
                  className="rounded-lg bg-brand-500/15 px-3 py-1.5 text-theme-xs font-medium text-brand-600 dark:text-brand-400"
                >
                  {b.actif ? "Désactiver" : "Activer"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalDefi != null}
        onClose={() => {
          setModalDefi(null);
          setDefiEdition(null);
        }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalDefi === "modifier" ? "Modifier le défi" : "Nouveau défi"}
        </h2>
        <DefiForm
          key={defiEdition?.id ?? "new"}
          initial={defiEdition ?? undefined}
          submitLabel="Enregistrer"
          onCancel={() => {
            setModalDefi(null);
            setDefiEdition(null);
          }}
          onSubmit={enregistrerDefi}
        />
      </Modal>

      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={() => {
          if (!supprimerCible) return;
          setDefis((prev) =>
            prev.map((row) =>
              row.id === supprimerCible.id
                ? { ...row, deletedAt: softDeleteTimestamp() }
                : row
            )
          );
          toast.success("Défi supprimé (soft delete).");
          setSupprimerCible(null);
        }}
        title="Supprimer ce défi ?"
        description={
          supprimerCible ? (
            <>« {supprimerCible.titre} » sera marqué comme supprimé (soft delete).</>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
