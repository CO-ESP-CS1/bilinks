"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type { MockCategorie } from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import {
  createCategoryPersisted,
  fetchCategoriesPersisted,
  restoreCategory,
  softDeleteCategoryPersisted,
} from "@/lib/categories-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { FolderIcon } from "@/icons";

function formatLivres(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} livre${n > 1 ? "s" : ""}`;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MockCategorie[]>([]);
  const [loading, setLoading] = useState(true);
  const apiMode = isApiConfigured();

  const [search, setSearch] = useState("");
  const [champRechercheKey, setChampRechercheKey] = useState(0);

  const refresh = useCallback(
    async (q?: string) => {
      setLoading(true);
      try {
        const query = (q ?? search).trim();
        const list = await fetchCategoriesPersisted(
          apiMode && query ? { q: query } : undefined
        );
        setCategories(list);
      } finally {
        setLoading(false);
      }
    },
    [apiMode, search]
  );

  useEffect(() => {
    if (!apiMode) {
      void refresh();
      return;
    }
    const timer = setTimeout(() => void refresh(search), 300);
    return () => clearTimeout(timer);
  }, [apiMode, search, refresh]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [supprimerCible, setSupprimerCible] = useState<MockCategorie | null>(
    null
  );

  const listeFiltree = useMemo(() => {
    if (apiMode) return categories;
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, search, apiMode]);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setChampRechercheKey((k) => k + 1);
  }, []);

  const showToast = useCallback((msg: string) => {
    toast.success(msg);
  }, []);

  const confirmerSuppression = useCallback(async () => {
    if (!supprimerCible) return;
    const result = await softDeleteCategoryPersisted(supprimerCible.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refresh();
    showToast(
      apiMode
        ? `« ${supprimerCible.nom} » supprimée (deleted_at enregistré).`
        : `« ${supprimerCible.nom} » supprimée.`
    );
    setSupprimerCible(null);
  }, [apiMode, supprimerCible, showToast, refresh]);

  const restaurer = (id: string) => {
    if (!restoreCategory(id)) return;
    void refresh();
    showToast("Catégorie restaurée.");
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Catégories")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Catégories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thématiques du catalogue
          </p>
        </div>
        <Button
          onClick={() => {
            setModalKey((k) => k + 1);
            setModalOuvert(true);
          }}
        >
          Ajouter une catégorie
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <Label htmlFor="search-cat">Rechercher</Label>
        <Input
          key={champRechercheKey}
          id="search-cat"
          type="text"
          placeholder="Nom ou description…"
          className="mt-2"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {listeFiltree.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="size-7" />}
          message="Aucune catégorie trouvée pour ce filtre."
          onReset={reinitialiserFiltres}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {listeFiltree.map((c) => {
          const supprimee = c.deletedAt != null;
          return (
            <article
              key={c.id}
              className="relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              {supprimee && !apiMode && (
                <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-100/85 dark:bg-gray-900/80">
                  <span className="rounded-full bg-error-500/90 px-4 py-1.5 text-sm font-semibold text-white shadow">
                    Supprimée
                  </span>
                  <button
                    type="button"
                    onClick={() => restaurer(c.id)}
                    className="pointer-events-auto rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Restaurer
                  </button>
                </div>
              )}

              <div
                className={`relative z-[2] flex flex-1 flex-col ${supprimee ? "opacity-40" : ""}`}
              >
                <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {c.nom}
                </h2>
                <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-400">
                  {c.description}
                </p>
                <div className="mt-4">
                  <Badge color="primary" size="sm" variant="light">
                    {formatLivres(c.nbLivres)}
                  </Badge>
                </div>
                {!supprimee && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/admin/categories/${c.id}/modifier`)
                      }
                      className="rounded-lg bg-brand-500/15 px-3 py-1.5 text-theme-xs font-medium text-brand-600 hover:bg-brand-500/25 dark:text-brand-400"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupprimerCible(c)}
                      className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 dark:text-error-400"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        </div>
      )}

      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={confirmerSuppression}
        title="Supprimer cette catégorie ?"
        description={
          supprimerCible ? (
            <>
              « {supprimerCible.nom} » sera supprimée. Les livres liés restent
              en base.
              {apiMode ? (
                <>
                  {" "}
                  Impossible si un défi <strong>actif</strong> référence cette
                  catégorie.
                </>
              ) : (
                " Vous pourrez la restaurer en mode démo."
              )}
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
      />

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <AjouterCategorieForm
          key={modalKey}
          onSuccess={async () => {
            await refresh();
            setModalOuvert(false);
            showToast("Catégorie enregistrée.");
          }}
        />
      </Modal>

    </div>
  );
}

const CATEGORIE_NOM_MAX = 100;

function AjouterCategorieForm({
  onSuccess,
}: {
  onSuccess: () => void | Promise<void>;
}) {
  const apiMode = isApiConfigured();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [errNom, setErrNom] = useState<string | null>(null);
  const [errUnique, setErrUnique] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nom.trim();
    if (!n) {
      setErrNom("Le nom est obligatoire.");
      setErrUnique(false);
      return;
    }
    if (n.length > CATEGORIE_NOM_MAX) {
      setErrNom(
        `Le nom ne peut pas dépasser ${CATEGORIE_NOM_MAX} caractères.`
      );
      setErrUnique(false);
      return;
    }
    setErrNom(null);
    setSubmitting(true);
    const result = await createCategoryPersisted({ nom: n, description });
    setSubmitting(false);
    if (!result.ok) {
      if (
        result.error.includes("déjà") ||
        result.error.includes("utilisé") ||
        result.error.includes("Conflit")
      ) {
        setErrUnique(true);
        setErrNom(null);
      } else {
        toast.error(result.error);
        setErrNom(result.error);
      }
      return;
    }
    setErrUnique(false);
    await onSuccess();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Ajouter une catégorie
      </h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="cat-nom">Nom *</Label>
          <p className="mb-2 text-theme-xs text-warning-600 dark:text-orange-400">
            Unique (max {CATEGORIE_NOM_MAX} caractères).
          </p>
          <Input
            id="cat-nom"
            type="text"
            maxLength={CATEGORIE_NOM_MAX}
            value={nom}
            onChange={(e) => {
              setNom(e.target.value);
              setErrNom(null);
              setErrUnique(false);
            }}
            error={!!errNom || errUnique}
          />
          {errNom && (
            <p className="mt-1 text-sm text-error-500">{errNom}</p>
          )}
          {errUnique && !errNom && (
            <p className="mt-1 text-sm text-error-500">
              Nom déjà utilisé (409).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="cat-desc">Description (optionnel)</Label>
          <TextArea
            rows={4}
            value={description}
            onChange={setDescription}
            placeholder="Description de la catégorie…"
          />
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
