"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { mockBibliotheques } from "@/lib/mock-data";
import type { StatutLivre, MockLivre } from "@/lib/mock-data";
import { getAllCategories } from "@/lib/categories-store";
import { getLivreById, updateLivre } from "@/lib/livres-store";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import Radio from "@/components/form/input/Radio";

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
    setLivre(getLivreById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Modifier le livre
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {livre.titre}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:p-8">
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
  const [categoriesIds, setCategoriesIds] = useState<string[]>([]);
  const [bibliothequesIds, setBibliothequesIds] = useState<string[]>([]);
  const [statut, setStatut] = useState<StatutLivre>(livre.statut);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback(() => {
    const next: FormErrors = {};
    if (!titre.trim()) next.titre = "Le titre est obligatoire.";
    const auteursParsed = auteurs
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (auteursParsed.length === 0) {
      next.auteurs = "Indiquez au moins un auteur.";
    }
    if (!langue) next.langue = "La langue est obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [titre, auteurs, langue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const updated = updateLivre(livre.id, {
      titre: titre.trim(),
      auteurs: auteurs.split(",").map((a) => a.trim()).filter(Boolean),
      langue,
      anneePublication: Number(annee) || livre.anneePublication,
      nombrePages: Number(nbPages) || livre.nombrePages,
      categorieIds: categoriesIds.length > 0 ? categoriesIds : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="mt-1 text-sm text-error-500">{errors.titre}</p>
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
          <p className="mt-1 text-sm text-error-500">{errors.auteurs}</p>
        )}
      </div>

      <div>
        <Label htmlFor="edit-resume">Résumé</Label>
        <TextArea
          rows={4}
          value={resume}
          onChange={setResume}
          placeholder="Résumé optionnel…"
        />
      </div>

      <div>
        <Label htmlFor="edit-langue">Langue *</Label>
        <Select
          defaultValue={langue}
          options={langueOptions}
          onChange={(v) => setLangue(v)}
        />
        {errors.langue && (
          <p className="mt-1 text-sm text-error-500">{errors.langue}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-annee">Année de publication</Label>
          <Input
            id="edit-annee"
            type="number"
            defaultValue={annee}
            onChange={(e) => setAnnee(e.target.value)}
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

      <MultiSelect
        label="Catégorie(s)"
        options={multiCategoriesOptions}
        onChange={setCategoriesIds}
      />

      <MultiSelect
        label="Bibliothèque(s) — internes"
        options={multiBibliothequesOptions}
        onChange={setBibliothequesIds}
      />

      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Statut
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <Radio
            id="edit-statut-publie"
            name="edit-statut"
            value="PUBLIE"
            checked={statut === "PUBLIE"}
            label="Publié"
            onChange={() => setStatut("PUBLIE")}
          />
          <Radio
            id="edit-statut-archive"
            name="edit-statut"
            value="ARCHIVE"
            checked={statut === "ARCHIVE"}
            label="Archivé"
            onChange={() => setStatut("ARCHIVE")}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
