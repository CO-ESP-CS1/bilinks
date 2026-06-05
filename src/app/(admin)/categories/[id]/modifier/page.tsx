"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockCategorie } from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import {
  fetchCategoriesPersisted,
  getCategoryById,
  isCategoryNameTaken,
  updateCategoryPersisted,
} from "@/lib/categories-store";
import { isSoftDeleted } from "@/lib/soft-delete";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";

export default function ModifierCategoriePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [categorie, setCategorie] = useState<MockCategorie | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchCategoriesPersisted();
      if (cancelled) return;
      setCategorie(getCategoryById(id));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!categorie || isSoftDeleted(categorie.deletedAt)) {
    notFound();
  }

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Catégories", href: "/admin/categories" },
    { label: categorie.nom, href: `/admin/categories/${categorie.id}` },
    { label: "Modifier" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Modifier la catégorie
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {categorie.nom}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:p-8">
        <ModifierCategorieForm
          categorie={categorie}
          onSuccess={() => {
            toast.success("Catégorie mise à jour.");
            router.push(`/admin/categories/${categorie.id}`);
          }}
          onCancel={() => router.push(`/admin/categories/${categorie.id}`)}
        />
      </div>
    </div>
  );
}

const CATEGORIE_NOM_MAX = 100;

function ModifierCategorieForm({
  categorie,
  onSuccess,
  onCancel,
}: {
  categorie: MockCategorie;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const apiMode = isApiConfigured();
  const [nom, setNom] = useState(categorie.nom);
  const [description, setDescription] = useState(categorie.description);
  const [errNom, setErrNom] = useState<string | null>(null);
  const [errUnique, setErrUnique] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
      if (!apiMode && isCategoryNameTaken(n, categorie.id)) {
        setErrUnique(true);
        return;
      }
      setSubmitting(true);
      const result = await updateCategoryPersisted(categorie.id, {
        nom: n,
        description,
      });
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
      onSuccess();
    },
    [apiMode, categorie.id, nom, description, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-cat-nom">Nom *</Label>
        <p className="mb-2 text-theme-xs text-warning-600 dark:text-orange-400">
          Unique (max {CATEGORIE_NOM_MAX} caractères).
        </p>
        <Input
          id="edit-cat-nom"
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
        <Label htmlFor="edit-cat-desc">Description (optionnel)</Label>
        <TextArea
          rows={4}
          value={description}
          onChange={setDescription}
          placeholder="Description de la catégorie…"
        />
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-5 py-3.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
