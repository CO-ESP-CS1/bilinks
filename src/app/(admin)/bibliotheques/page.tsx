"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type {
  MockBibliotheque,
  TypeBibliotheque,
} from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import {
  archiveLibraryPersisted,
  unarchiveLibraryPersisted,
  createLibraryPersisted,
  fetchLibrariesPersisted,
  updateLibraryPersisted,
} from "@/lib/libraries-store";
import type { StatutBibliotheque } from "@/types/admin";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Radio from "@/components/form/input/Radio";
import { useAdminPageSearch } from "@/context/AdminPageSearchContext";
import { PencilIcon, ArrowRightIcon, FolderIcon } from "@/icons";

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

type FormErr = Partial<Record<"nom" | "urlExterne", string>>;

function BibliothequeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: MockBibliotheque;
  onSave: (data: {
    nom: string;
    description?: string;
    type: TypeBibliotheque;
    urlExterne?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [description, setDescription] = useState(
    initial?.description === "—" ? "" : (initial?.description ?? "")
  );
  const [type, setType] = useState<TypeBibliotheque>(initial?.type ?? "INTERNE");
  const [urlExterne, setUrlExterne] = useState(initial?.urlExterne ?? "");
  const isEdit = Boolean(initial);
  const [errors, setErrors] = useState<FormErr>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErr = {};
    if (!nom.trim()) next.nom = "Le nom est obligatoire.";
    if ((!isEdit || initial?.type === "EXTERNE") && type === "EXTERNE") {
      if (!urlExterne.trim()) {
        next.urlExterne = "L'URL externe est obligatoire.";
      } else {
        try {
          const parsed = new URL(urlExterne.trim());
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            next.urlExterne = "URL invalide — utilisez http:// ou https://.";
          }
        } catch {
          next.urlExterne = "URL invalide — utilisez http:// ou https://.";
        }
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    await onSave({
      nom: nom.trim(),
      description: description.trim() || undefined,
      type,
      urlExterne: type === "EXTERNE" ? urlExterne.trim() : null,
    });
    setSubmitting(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {initial ? "Modifier la bibliothèque" : "Nouvelle bibliothèque"}
      </h2>

      <div className="mt-4 rounded-xl border border-blue-light-500/30 bg-blue-light-50 p-4 text-sm text-blue-light-700 dark:border-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-200">
        {isEdit ? (
          <>
            Le <strong>type</strong> n&apos;est pas modifiable. L&apos;URL
            externe s&apos;applique uniquement aux bibliothèques{" "}
            <strong>EXTERNE</strong>.
          </>
        ) : (
          <>
            <strong>INTERNE</strong> : pas d&apos;URL externe.{" "}
            <strong>EXTERNE</strong> : URL obligatoire. Statut{" "}
            <strong>ACTIVE</strong> appliqué à la création.
          </>
        )}
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
            Type {isEdit ? "" : "*"}
          </span>
          {isEdit ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <Badge color={type === "INTERNE" ? "info" : "primary"} size="sm" variant="light">
                {type}
              </Badge>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                Non modifiable après création
              </span>
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <Radio
                id="type-interne"
                name="bib-type"
                value="INTERNE"
                checked={type === "INTERNE"}
                label="Interne"
                onChange={() => {
                  setType("INTERNE");
                  setUrlExterne("");
                  setErrors((e) => ({ ...e, urlExterne: undefined }));
                }}
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
          )}
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

        {initial?.statut === "ARCHIVEE" && (
          <p className="text-sm text-warning-600 dark:text-warning-400">
            Bibliothèque archivée — utilisez le bouton Désarchiver sur la carte
            pour la réactiver.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function BibliothequesPage() {
  const apiMode = isApiConfigured();
  const [bibliotheques, setBibliotheques] = useState<MockBibliotheque[]>([]);
  const [loading, setLoading] = useState(true);
  const { query: search, setQuery: setSearch } = useAdminPageSearch({
    placeholder: "Rechercher par nom ou description…",
  });
  const [filtreStatut, setFiltreStatut] = useState<"" | StatutBibliotheque>("");
  const [filtreType, setFiltreType] = useState<"" | TypeBibliotheque>("");
  const [modalMode, setModalMode] = useState<"ajouter" | "modifier" | null>(null);
  const [edition, setEdition] = useState<MockBibliotheque | null>(null);
  const [archiveCible, setArchiveCible] = useState<MockBibliotheque | null>(
    null
  );
  const [desarchiveCible, setDesarchiveCible] =
    useState<MockBibliotheque | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLibrariesPersisted({
        statut: filtreStatut || undefined,
        type: filtreType || undefined,
      });
      setBibliotheques(rows);
    } finally {
      setLoading(false);
    }
  }, [filtreStatut, filtreType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setFiltreStatut("");
    setFiltreType("");
  }, [setSearch]);

  const listeFiltree = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...bibliotheques].sort((a, b) =>
      a.nom.localeCompare(b.nom, "fr")
    );
    if (!q) return base;
    return base.filter(
      (b) =>
        b.nom.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [bibliotheques, search]);

  const enregistrerBibliotheque = async (data: {
    nom: string;
    description?: string;
    type: TypeBibliotheque;
    urlExterne?: string | null;
  }) => {
    if (modalMode === "modifier" && edition) {
      const result = await updateLibraryPersisted(edition.id, {
        nom: data.nom,
        description: data.description ?? "",
        urlExterne:
          edition.type === "EXTERNE" ? (data.urlExterne ?? undefined) : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Bibliothèque modifiée.");
    } else {
      const result = await createLibraryPersisted({
        nom: data.nom,
        type: data.type,
        description: data.description,
        urlExterne: data.urlExterne,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Bibliothèque ajoutée.");
    }
    await refresh();
    setModalMode(null);
    setEdition(null);
  };

  const confirmerArchivage = useCallback(async () => {
    if (!archiveCible) return;
    const result = await archiveLibraryPersisted(archiveCible.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refresh();
    toast.success(
      `« ${archiveCible.nom} » archivée (statut ${result.statut}).`
    );
    setArchiveCible(null);
  }, [archiveCible, refresh]);

  const confirmerDesarchivage = useCallback(async () => {
    if (!desarchiveCible) return;
    const result = await unarchiveLibraryPersisted(desarchiveCible.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refresh();
    toast.success(
      `« ${desarchiveCible.nom} » réactivée (statut ${result.statut}).`
    );
    setDesarchiveCible(null);
  }, [desarchiveCible, refresh]);

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

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
        <div className="w-full min-w-[140px] sm:w-44">
          <Label htmlFor="bib-filtre-statut">Statut</Label>
          <select
            id="bib-filtre-statut"
            className={`mt-2 ${selectClass}`}
            value={filtreStatut}
            onChange={(e) =>
              setFiltreStatut(e.target.value as "" | StatutBibliotheque)
            }
          >
            <option value="">Tous</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVEE">Archivée</option>
          </select>
        </div>
        <div className="w-full min-w-[140px] sm:w-44">
          <Label htmlFor="bib-filtre-type">Type</Label>
          <select
            id="bib-filtre-type"
            className={`mt-2 ${selectClass}`}
            value={filtreType}
            onChange={(e) =>
              setFiltreType(e.target.value as "" | TypeBibliotheque)
            }
          >
            <option value="">Tous</option>
            <option value="INTERNE">Interne</option>
            <option value="EXTERNE">Externe</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="size-7" />}
          message={
            apiMode
              ? "Aucune bibliothèque en base (ou filtres trop restrictifs)."
              : "Aucune bibliothèque trouvée pour ce filtre."
          }
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
                  {b.statut === "ACTIVE" ? (
                    <button
                      type="button"
                      title="Archiver"
                      onClick={() => setArchiveCible(b)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-warning-500 dark:ring-gray-700 dark:hover:bg-white/5"
                    >
                      <IconeToggleArchive archivage />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Désarchiver"
                      onClick={() => setDesarchiveCible(b)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-success-500 dark:ring-gray-700 dark:hover:bg-white/5"
                    >
                      <IconeToggleArchive archivage={false} />
                    </button>
                  )}
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
        isOpen={archiveCible != null}
        onClose={() => setArchiveCible(null)}
        onConfirm={confirmerArchivage}
        title="Archiver cette bibliothèque ?"
        description={
          archiveCible ? (
            <>
              « {archiveCible.nom} » passera au statut{" "}
              <strong>ARCHIVEE</strong> — masquée du catalogue utilisateur. Les
              livres liés ne sont pas supprimés.
            </>
          ) : null
        }
        confirmLabel="Archiver"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={desarchiveCible != null}
        onClose={() => setDesarchiveCible(null)}
        onConfirm={confirmerDesarchivage}
        title="Désarchiver cette bibliothèque ?"
        description={
          desarchiveCible ? (
            <>
              « {desarchiveCible.nom} » passera au statut{" "}
              <strong>ACTIVE</strong> — de nouveau visible dans le catalogue
              utilisateur.
            </>
          ) : null
        }
        confirmLabel="Désarchiver"
        variant="primary"
      />
    </div>
  );
}
