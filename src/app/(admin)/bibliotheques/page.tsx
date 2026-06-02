"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockBibliotheques,
  type MockBibliotheque,
  type TypeBibliotheque,
  type StatutBibliotheque,
} from "@/lib/mock-data";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Radio from "@/components/form/input/Radio";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import { PencilIcon, ArrowRightIcon, FolderIcon, TrashBinIcon } from "@/icons";

function formatLivres(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} livre${n > 1 ? "s" : ""}`;
}

function IconeLienExterne({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeToggleArchive({ archivage }: { archivage: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {archivage ? (
        <path
          d="M5 8H19M5 8C5 5.79086 6.79086 4 9 4H15C17.2091 4 19 5.79086 19 8M5 8V18C5 20.2091 6.79086 22 9 22H15C17.2091 22 19 20.2091 19 18V8M10 12H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type FormErr = Partial<Record<"nom" | "urlExterne", string>>;

type BibFormValues = {
  nom: string;
  description: string;
  type: TypeBibliotheque;
  urlExterne: string;
  statut: StatutBibliotheque;
};

function BibliothequeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: MockBibliotheque;
  onSave: (data: Omit<MockBibliotheque, "id">) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<TypeBibliotheque>(initial?.type ?? "INTERNE");
  const [urlExterne, setUrlExterne] = useState(initial?.urlExterne ?? "");
  const [statut, setStatut] = useState<StatutBibliotheque>(
    initial?.statut ?? "ACTIVE"
  );
  const [errors, setErrors] = useState<FormErr>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErr = {};
    if (!nom.trim()) next.nom = "Le nom est obligatoire.";
    if (type === "EXTERNE" && !urlExterne.trim()) {
      next.urlExterne = "L'URL externe est obligatoire.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      nom: nom.trim(),
      description: description.trim() || "—",
      type,
      urlExterne: type === "EXTERNE" ? urlExterne.trim() : null,
      statut,
      nbLivres: initial?.nbLivres ?? (type === "INTERNE" ? 0 : 0),
      deletedAt: initial?.deletedAt ?? null,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {initial ? "Modifier la bibliothèque" : "Nouvelle bibliothèque"}
      </h2>

      <div className="mt-4 rounded-xl border border-blue-light-500/30 bg-blue-light-50 p-4 text-sm text-blue-light-700 dark:border-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-200">
        Les bibliothèques <strong>EXTERNES</strong> redirigent vers un catalogue
        tiers : le volume de livres n&apos;est pas recensé dans B LINKS.
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="bib-nom">Nom *</Label>
          <Input
            id="bib-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            error={!!errors.nom}
          />
          {errors.nom && (
            <p className="mt-1 text-sm text-error-500">{errors.nom}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bib-desc">Description</Label>
          <TextArea
            rows={3}
            value={description}
            onChange={setDescription}
            placeholder="Description facultative…"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Type *
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <Radio
              id="type-interne"
              name="bib-type"
              value="INTERNE"
              checked={type === "INTERNE"}
              label="Interne"
              onChange={() => setType("INTERNE")}
            />
            <Radio
              id="type-externe"
              name="bib-type"
              value="EXTERNE"
              checked={type === "EXTERNE"}
              label="Externe"
              onChange={() => setType("EXTERNE")}
            />
          </div>
        </div>

        {type === "EXTERNE" && (
          <div>
            <Label htmlFor="bib-url-ext">URL externe *</Label>
            <Input
              id="bib-url-ext"
              type="url"
              placeholder="https://…"
              value={urlExterne}
              onChange={(e) => setUrlExterne(e.target.value)}
              error={!!errors.urlExterne}
            />
            {errors.urlExterne && (
              <p className="mt-1 text-sm text-error-500">{errors.urlExterne}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="bib-statut">Statut</Label>
          <select
            id="bib-statut"
            className={selectClass}
            value={statut}
            onChange={(e) =>
              setStatut(e.target.value as StatutBibliotheque)
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVEE">Archivée</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
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
    </div>
  );
}

export default function BibliothequesPage() {
  const [bibliotheques, setBibliotheques] = useState<MockBibliotheque[]>(() =>
    mockBibliotheques.map((b) => ({ ...b, deletedAt: b.deletedAt ?? null }))
  );
  const [search, setSearch] = useState("");
  const [champRechercheKey, setChampRechercheKey] = useState(0);
  const [modalMode, setModalMode] = useState<"ajouter" | "modifier" | null>(null);
  const [edition, setEdition] = useState<MockBibliotheque | null>(null);
  const [supprimerCible, setSupprimerCible] = useState<MockBibliotheque | null>(
    null
  );

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setChampRechercheKey((k) => k + 1);
  }, []);

  const basculerStatut = useCallback((b: MockBibliotheque) => {
    setBibliotheques((prev) =>
      prev.map((row) =>
        row.id === b.id
          ? {
              ...row,
              statut:
                row.statut === "ACTIVE"
                  ? ("ARCHIVEE" as const)
                  : ("ACTIVE" as const),
            }
          : row
      )
    );
    toast.success("Statut mis à jour.");
  }, []);

  const listeFiltree = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...bibliotheques]
      .filter((b) => !isSoftDeleted(b.deletedAt))
      .sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr")
    );
    if (!q) return base;
    return base.filter(
      (b) =>
        b.nom.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [bibliotheques, search]);

  const enregistrerBibliotheque = (data: Omit<MockBibliotheque, "id">) => {
    if (modalMode === "modifier" && edition) {
      setBibliotheques((prev) =>
        prev.map((row) =>
          row.id === edition.id
            ? {
                ...row,
                ...data,
                nbLivres:
                  data.type === "EXTERNE" ? 0 : (data.nbLivres ?? row.nbLivres),
              }
            : row
        )
      );
      toast.success("Bibliothèque modifiée.");
    } else {
      setBibliotheques((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          ...data,
          nbLivres: data.type === "INTERNE" ? (data.nbLivres ?? 0) : 0,
          deletedAt: null,
        },
      ]);
      toast.success("Bibliothèque ajoutée.");
    }
    setModalMode(null);
    setEdition(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Bibliothèques")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Bibliothèques
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Collections internes et plateformes externes
          </p>
        </div>
        <Button
          onClick={() => {
            setEdition(null);
            setModalMode("ajouter");
          }}
        >
          Ajouter une bibliothèque
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <Label htmlFor="search-bib">Rechercher</Label>
        <Input
          key={champRechercheKey}
          id="search-bib"
          type="text"
          placeholder="Nom ou description…"
          className="mt-2"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {listeFiltree.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="size-7" />}
          message="Aucune bibliothèque trouvée pour ce filtre."
          onReset={reinitialiserFiltres}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {listeFiltree.map((b) => (
            <article
              key={b.id}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
            >
              {b.statut === "ARCHIVEE" && (
                <div
                  className="pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-gray-100/75 dark:bg-gray-900/65"
                  aria-hidden
                />
              )}

              <div
                className={`relative z-[2] flex flex-1 flex-col ${b.statut === "ARCHIVEE" ? "opacity-90" : ""}`}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {b.type === "INTERNE" ? (
                    <Badge color="info" size="sm" variant="light">
                      INTERNE
                    </Badge>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-theme-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      EXTERNE
                    </span>
                  )}
                  {b.statut === "ACTIVE" ? (
                    <Badge color="success" size="sm" variant="light">
                      Active
                    </Badge>
                  ) : (
                    <Badge color="light" size="sm" variant="light">
                      Archivée
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {b.nom}
                </h2>
                <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
                  {b.description}
                </p>

                {b.type === "INTERNE" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatLivres(b.nbLivres)}
                    </p>
                    <Link
                      href="/admin/livres"
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                    >
                      Gérer les livres
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </div>
                )}

                {b.type === "EXTERNE" && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">
                      Volume non recensé — catalogue hébergé à l&apos;extérieur
                    </p>
                    {b.urlExterne && (
                      <>
                        <a
                          href={b.urlExterne}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 break-all text-sm font-medium text-brand-500 underline hover:text-brand-600"
                        >
                          <span>{b.urlExterne}</span>
                          <IconeLienExterne className="shrink-0 text-brand-500" />
                        </a>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          Accès via navigateur natif (Custom Tab / SFSafari)
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <button
                    type="button"
                    title="Modifier"
                    onClick={() => {
                      setEdition(b);
                      setModalMode("modifier");
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-brand-500 dark:ring-gray-700 dark:hover:bg-white/5"
                  >
                    <PencilIcon className="size-5" />
                  </button>
                  <button
                    type="button"
                    title={
                      b.statut === "ACTIVE" ? "Archiver" : "Réactiver"
                    }
                    onClick={() => basculerStatut(b)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-warning-500 dark:ring-gray-700 dark:hover:bg-white/5"
                  >
                    <IconeToggleArchive archivage={b.statut === "ACTIVE"} />
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() => setSupprimerCible(b)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-error-50 hover:text-error-500 dark:ring-gray-700"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalMode != null}
        onClose={() => {
          setModalMode(null);
          setEdition(null);
        }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <BibliothequeForm
          key={edition?.id ?? "new"}
          initial={edition ?? undefined}
          onSave={enregistrerBibliotheque}
          onCancel={() => {
            setModalMode(null);
            setEdition(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={() => {
          if (!supprimerCible) return;
          setBibliotheques((prev) =>
            prev.map((row) =>
              row.id === supprimerCible.id
                ? { ...row, deletedAt: softDeleteTimestamp() }
                : row
            )
          );
          toast.success("Bibliothèque supprimée (soft delete).");
          setSupprimerCible(null);
        }}
        title="Supprimer cette bibliothèque ?"
        description={
          supprimerCible ? (
            <>
              « {supprimerCible.nom} » sera marquée comme supprimée (soft delete).
              Les livres internes liés ne sont pas supprimés automatiquement.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
