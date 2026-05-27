"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { mockBibliotheques } from "@/lib/mock-data";
import type { StatutLivre, MockLivre } from "@/lib/mock-data";
import { getAllCategories } from "@/lib/categories-store";
import {
  fetchLivres,
  getLivreById,
  updateLivrePersisted,
} from "@/lib/livres-store";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import Radio from "@/components/form/input/Radio";
import { CoverUploader } from "@/components/livres/CoverUploader";

type FormErrors = Partial<
  Record<"titre" | "auteurs" | "langue", string>
>;

export default function ModifierLivrePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [livre, setLivre] = useState<MockLivre | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetchLivres();
      setLivre(getLivreById(id));
      setLoaded(true);
    };
    void load();
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!livre) {
    notFound();
  }

  return (
    <ModifierLivreContenu
      livre={livre}
      onSuccess={() => {
        toast.success("Livre mis à jour.");
        router.push(`/admin/livres/${livre.id}`);
      }}
      onCancel={() => router.push(`/admin/livres/${livre.id}`)}
    />
  );
}

function ModifierLivreContenu({
  livre,
  onSuccess,
  onCancel,
}: {
  livre: MockLivre;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const categories = getAllCategories();

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Livres", href: "/admin/livres" },
    { label: livre.titre, href: `/admin/livres/${livre.id}` },
    { label: "Modifier" },
  ];

  const multiCategoriesOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        text: c.nom,
        selected: c.nom === livre.categorie,
      })),
    [categories, livre.categorie]
  );

  const bibliothequesInternes = useMemo(
    () => mockBibliotheques.filter((b) => b.type === "INTERNE"),
    []
  );

  const multiBibliothequesOptions = useMemo(
    () =>
      bibliothequesInternes.map((b) => ({
        value: b.id,
        text: b.nom,
        selected: false,
      })),
    [bibliothequesInternes]
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <svg className="size-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Modifier le livre
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {livre.titre}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-8">
        <ModifierLivreForm
          livre={livre}
          multiCategoriesOptions={multiCategoriesOptions}
          multiBibliothequesOptions={multiBibliothequesOptions}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function ModifierLivreForm({
  livre,
  multiCategoriesOptions,
  multiBibliothequesOptions,
  onSuccess,
  onCancel,
}: {
  livre: MockLivre;
  multiCategoriesOptions: { value: string; text: string; selected: boolean }[];
  multiBibliothequesOptions: { value: string; text: string; selected: boolean }[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [titre, setTitre] = useState(livre.titre);
  const [auteurs, setAuteurs] = useState(livre.auteurs.join(", "));
  const [langue, setLangue] = useState(livre.langue);
  const [annee, setAnnee] = useState(String(livre.anneePublication));
  const [nbPages, setNbPages] = useState(String(livre.nombrePages));
  const [resume, setResume] = useState("");
  const [couverturePreview, setCouverturePreview] = useState<string | null>(
    livre.couvertureUrl || null
  );
  const [categoriesIds, setCategoriesIds] = useState<string[]>([]);
  const [bibliothequesIds, setBibliothequesIds] = useState<string[]>([]);
  const [statut, setStatut] = useState<StatutLivre>(livre.statut);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback(() => {
    const next: FormErrors = {};
    if (!titre.trim()) next.titre = "Le titre est obligatoire.";
    const auteursParsed = auteurs.split(",").map((a) => a.trim()).filter(Boolean);
    if (auteursParsed.length === 0) next.auteurs = "Indiquez au moins un auteur.";
    if (!langue) next.langue = "La langue est obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [titre, auteurs, langue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const updated = await updateLivrePersisted(livre.id, {
      titre: titre.trim(),
      auteurs: auteurs.split(",").map((a) => a.trim()).filter(Boolean),
      langue,
      anneePublication: Number(annee) || livre.anneePublication,
      nombrePages: Number(nbPages) || livre.nombrePages,
      categorieIds: categoriesIds.length > 0 ? categoriesIds : undefined,
      couvertureUrl: couverturePreview ?? "",
      statut,
    });
    if (!updated) {
      toast.error("Impossible d'enregistrer le livre.");
      return;
    }
    onSuccess();
  };

  const langueOptions = [
    { value: "Français", label: "Français" },
    { value: "Anglais", label: "Anglais" },
    { value: "Portugais", label: "Portugais" },
    { value: "Arabe", label: "Arabe" },
    { value: "Autre", label: "Autre" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <CoverUploader
        value={couverturePreview}
        onChange={(url) => setCouverturePreview(url)}
        bookTitle={titre || livre.titre}
      />

      <div className="space-y-4">
          <div>
            <Label htmlFor="edit-titre">Titre *</Label>
            <Input
              id="edit-titre"
              type="text"
              defaultValue={titre}
              onChange={(e) => setTitre(e.target.value)}
              error={!!errors.titre}
            />
            {errors.titre && (
              <p className="mt-1.5 text-xs text-error-500">{errors.titre}</p>
            )}
          </div>

          <div>
            <Label htmlFor="edit-auteurs">Auteurs *</Label>
            <Input
              id="edit-auteurs"
              type="text"
              defaultValue={auteurs}
              onChange={(e) => setAuteurs(e.target.value)}
              error={!!errors.auteurs}
            />
            {errors.auteurs && (
              <p className="mt-1.5 text-xs text-error-500">{errors.auteurs}</p>
            )}
            <p className="mt-1 text-[11px] text-gray-400">Séparez les noms par des virgules</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-langue">Langue *</Label>
              <Select
                defaultValue={langue}
                options={langueOptions}
                onChange={(v) => setLangue(v)}
              />
              {errors.langue && (
                <p className="mt-1.5 text-xs text-error-500">{errors.langue}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-annee">Année</Label>
              <Input
                id="edit-annee"
                type="number"
                defaultValue={annee}
                onChange={(e) => setAnnee(e.target.value)}
              />
            </div>
          </div>
      </div>

      {/* Section : Détails */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Détails</span>
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
        </div>

        <div>
          <Label htmlFor="edit-resume">Résumé</Label>
          <TextArea
            rows={3}
            value={resume}
            onChange={setResume}
            placeholder="Une brève description du contenu…"
          />
        </div>

        <div>
          <Label htmlFor="edit-pages">Nombre de pages</Label>
          <Input
            id="edit-pages"
            type="number"
            min="0"
            defaultValue={nbPages}
            onChange={(e) => setNbPages(e.target.value)}
          />
        </div>
      </div>

      {/* Section : Organisation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Organisation</span>
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
        </div>

        <MultiSelect
          label="Catégorie(s)"
          options={multiCategoriesOptions}
          onChange={setCategoriesIds}
        />

        <MultiSelect
          label="Bibliothèque(s)"
          options={multiBibliothequesOptions}
          onChange={setBibliothequesIds}
        />

        <div>
          <span className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Statut de publication
          </span>
          <div className="flex gap-4">
            <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${statut === "PUBLIE" ? "border-brand-500 bg-brand-25 dark:border-brand-500 dark:bg-brand-500/5" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}>
              <Radio
                id="edit-statut-publie"
                name="edit-statut"
                value="PUBLIE"
                checked={statut === "PUBLIE"}
                label=""
                onChange={() => setStatut("PUBLIE")}
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Publié</p>
                <p className="text-[11px] text-gray-500">Visible immédiatement</p>
              </div>
            </label>
            <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${statut === "ARCHIVE" ? "border-warning-500 bg-warning-25 dark:border-warning-500 dark:bg-warning-500/5" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}>
              <Radio
                id="edit-statut-archive"
                name="edit-statut"
                value="ARCHIVE"
                checked={statut === "ARCHIVE"}
                label=""
                onChange={() => setStatut("ARCHIVE")}
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Archivé</p>
                <p className="text-[11px] text-gray-500">Masqué des lecteurs</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.97]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Enregistrer
        </button>
      </div>
    </form>
  );
}
