"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { StatutLivre, MockLivre } from "@/lib/mock-data";
import { fetchCategoriesPersisted, getAllCategories } from "@/lib/categories-store";
import { fetchAuteursPersisted, getAllAuteurs } from "@/lib/auteurs-store";
import {
  fetchLibrariesPersisted,
  getAllLibraries,
} from "@/lib/libraries-store";
import {
  fetchLivres,
  getLivreById,
  updateLivrePersisted,
} from "@/lib/livres-store";
import { isApiConfigured } from "@/lib/api/client";
import {
  validateUpdateBookInput,
  type TypeLivre,
} from "@/lib/admin/book-payload";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { BookFileUploader } from "@/components/livres/BookFileUploader";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import Radio from "@/components/form/input/Radio";
import { CoverUploader } from "@/components/livres/CoverUploader";

type FormErrors = Partial<
  Record<
    "titre" | "auteurs" | "langue" | "isbn" | "fichier" | "urlExterne" | "annee" | "pages",
    string
  >
>;

export default function ModifierLivrePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [livre, setLivre] = useState<MockLivre | null>(null);
  const [auteurs, setAuteurs] = useState<ReturnType<typeof getAllAuteurs>>([]);
  const [categories, setCategories] = useState<
    ReturnType<typeof getAllCategories>
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchCategoriesPersisted(),
        fetchAuteursPersisted(),
        fetchLibrariesPersisted(),
      ]);
      await fetchLivres();
      setCategories(getAllCategories());
      setAuteurs(getAllAuteurs());
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
      categories={categories}
      auteurs={auteurs}
      onSuccess={(updatedAt) => {
        toast.success(`Livre mis à jour (${updatedAt}).`);
        router.push(`/admin/livres/${livre.id}`);
      }}
      onCancel={() => router.push(`/admin/livres/${livre.id}`)}
    />
  );
}

function ModifierLivreContenu({
  livre,
  categories,
  auteurs,
  onSuccess,
  onCancel,
}: {
  livre: MockLivre;
  categories: ReturnType<typeof getAllCategories>;
  auteurs: ReturnType<typeof getAllAuteurs>;
  onSuccess: (updatedAt: string) => void;
  onCancel: () => void;
}) {
  const bibliothequesInternes = getAllLibraries().filter(
    (b) => b.type === "INTERNE" && b.statut === "ACTIVE"
  );

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
        selected:
          livre.categorieIds?.includes(c.id) ?? c.nom === livre.categorie,
      })),
    [categories, livre.categorie, livre.categorieIds]
  );

  const multiAuteursOptions = useMemo(
    () =>
      auteurs.map((a) => ({
        value: a.id,
        text: `${a.prenom} ${a.nom}`.trim(),
        selected: livre.auteurIds?.includes(a.id) ?? false,
      })),
    [auteurs, livre.auteurIds]
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
          <svg
            className="size-5 text-brand-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Modifier le livre
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{livre.titre}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-8">
        <ModifierLivreForm
          livre={livre}
          multiAuteursOptions={multiAuteursOptions}
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
  multiAuteursOptions,
  multiCategoriesOptions,
  multiBibliothequesOptions,
  onSuccess,
  onCancel,
}: {
  livre: MockLivre;
  multiAuteursOptions: { value: string; text: string; selected: boolean }[];
  multiCategoriesOptions: { value: string; text: string; selected: boolean }[];
  multiBibliothequesOptions: { value: string; text: string; selected: boolean }[];
  onSuccess: (updatedAt: string) => void;
  onCancel: () => void;
}) {
  const apiMode = isApiConfigured();
  const typeLivre: TypeLivre = livre.type_livre ?? "INTERNE";
  const [titre, setTitre] = useState(livre.titre);
  const [auteurIds, setAuteurIds] = useState<string[]>(
    () => livre.auteurIds ?? []
  );
  const [langue, setLangue] = useState(livre.langue);
  const [isbn, setIsbn] = useState(livre.isbn ?? "");
  const [maisonEdition, setMaisonEdition] = useState(livre.maisonEdition ?? "");
  const [annee, setAnnee] = useState(
    livre.anneePublication > 0 ? String(livre.anneePublication) : ""
  );
  const [nbPages, setNbPages] = useState(
    livre.nombrePages > 0 ? String(livre.nombrePages) : ""
  );
  const [resume, setResume] = useState(livre.resume ?? "");
  const [urlExterneLivre, setUrlExterneLivre] = useState(
    livre.urlExterneLivre ?? ""
  );
  const [isDownloadable, setIsDownloadable] = useState(
    livre.is_downloadable ?? false
  );
  const [fichierLivre, setFichierLivre] = useState<File | null>(null);
  const [couverturePreview, setCouverturePreview] = useState<string | null>(
    livre.couvertureUrl || null
  );
  const [couvertureFile, setCouvertureFile] = useState<File | null>(null);
  const [categoriesIds, setCategoriesIds] = useState<string[]>(
    () => livre.categorieIds ?? []
  );
  const [statut, setStatut] = useState<StatutLivre>(livre.statut);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const parseOptionalInt = (raw: string): number | null | undefined => {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  };

  const validate = useCallback(() => {
    const payload = {
      titre: titre.trim(),
      langue,
      type_livre: typeLivre,
      urlExterneLivre: urlExterneLivre.trim() || undefined,
      anneePublication: parseOptionalInt(annee),
      nombrePages: parseOptionalInt(nbPages),
      isbn: isbn.trim() || undefined,
      maisonEdition: maisonEdition.trim() || undefined,
      resume: resume.trim() || undefined,
      fichier: fichierLivre ?? undefined,
      is_downloadable: typeLivre === "INTERNE" ? isDownloadable : undefined,
      auteurIds,
      categorieIds: categoriesIds,
      statut,
      previousStatut: livre.statut,
    };
    const storeError = apiMode ? validateUpdateBookInput(payload) : null;
    const next: FormErrors = {};
    if (!payload.titre) next.titre = "Le titre est obligatoire.";
    if (payload.auteurIds.length === 0) {
      next.auteurs = "Sélectionnez au moins un auteur.";
    }
    if (!apiMode && !payload.langue) {
      next.langue = "La langue est obligatoire.";
    }
    if (storeError?.match(/ISBN/i)) next.isbn = storeError;
    if (storeError?.match(/fichier|format|50 Mo/i)) next.fichier = storeError;
    if (storeError?.match(/URL/i)) next.urlExterne = storeError;
    if (storeError?.match(/année/i)) next.annee = storeError;
    if (storeError?.match(/pages/i)) next.pages = storeError;
    // Toujours notifier par toast, même quand l'erreur est aussi routée vers un
    // champ précis — ce champ peut être masqué selon le type de livre (ex. la
    // section "Fichier" n'existe pas pour un livre EXTERNE), auquel cas
    // l'utilisateur ne verrait sinon rien du tout.
    if (storeError) {
      toast.error(storeError);
    }
    setErrors(next);
    return !storeError && Object.keys(next).length === 0;
  }, [
    titre,
    auteurIds,
    langue,
    apiMode,
    typeLivre,
    urlExterneLivre,
    annee,
    nbPages,
    isbn,
    maisonEdition,
    resume,
    fichierLivre,
    isDownloadable,
    categoriesIds,
    statut,
    livre.statut,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const coverFile = couvertureFile ?? undefined;

    setSubmitting(true);
    const result = await updateLivrePersisted(livre.id, {
      titre: titre.trim(),
      langue: langue && langue !== "—" ? langue : undefined,
      type_livre: typeLivre,
      urlExterneLivre: urlExterneLivre.trim() || undefined,
      anneePublication: parseOptionalInt(annee),
      nombrePages: parseOptionalInt(nbPages),
      isbn: isbn.trim() || undefined,
      auteurIds,
      categorieIds: categoriesIds,
      couvertureFile: coverFile,
      fichier: typeLivre === "INTERNE" ? fichierLivre ?? undefined : undefined,
      resume: resume.trim() || undefined,
      is_downloadable: typeLivre === "INTERNE" ? isDownloadable : undefined,
      statut,
      previousStatut: livre.statut,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.match(/ISBN/i)) {
        setErrors((prev) => ({ ...prev, isbn: result.error }));
      }
      toast.error(result.error);
      return;
    }
    onSuccess(result.updated.updatedAt);
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
      {apiMode && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Type (lecture seule) :
          </span>
          <Badge
            color={typeLivre === "INTERNE" ? "primary" : "info"}
            size="sm"
            variant="light"
          >
            {typeLivre === "INTERNE" ? "Interne" : "Externe"}
          </Badge>
        </div>
      )}

      <CoverUploader
        value={couverturePreview}
        onChange={(url, meta) => {
          setCouverturePreview(url);
          setCouvertureFile(meta?.file ?? null);
        }}
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
          <MultiSelect
            label="Auteur(s) *"
            options={multiAuteursOptions}
            onChange={setAuteurIds}
          />
          {errors.auteurs && (
            <p className="mt-1.5 text-xs text-error-500">{errors.auteurs}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-isbn">ISBN</Label>
            <Input
              id="edit-isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              error={!!errors.isbn}
            />
            {errors.isbn && (
              <p className="mt-1.5 text-xs text-error-500">{errors.isbn}</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit-langue">
              Langue{apiMode ? "" : " *"}
            </Label>
            <Select
              defaultValue={langue}
              options={langueOptions}
              onChange={(v) => setLangue(v)}
            />
            {errors.langue && (
              <p className="mt-1.5 text-xs text-error-500">{errors.langue}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="edit-maison-edition">Maison d&apos;édition</Label>
          <Input
            id="edit-maison-edition"
            type="text"
            placeholder="Optionnel"
            value={maisonEdition}
            onChange={(e) => setMaisonEdition(e.target.value)}
          />
        </div>

        {apiMode && typeLivre === "EXTERNE" && (
          <div>
            <Label htmlFor="edit-url-ext">URL externe du livre</Label>
            <Input
              id="edit-url-ext"
              type="url"
              placeholder="https://…"
              value={urlExterneLivre}
              onChange={(e) => setUrlExterneLivre(e.target.value)}
              error={!!errors.urlExterne}
            />
            {errors.urlExterne && (
              <p className="mt-1.5 text-xs text-error-500">{errors.urlExterne}</p>
            )}
            <p className="mt-1 text-[11px] text-gray-400">
              Envoyé comme <code>url_externe_livre</code> si renseigné.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="edit-annee">Année de publication</Label>
          <Input
            id="edit-annee"
            type="number"
            min="1"
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            error={!!errors.annee}
          />
          {errors.annee && (
            <p className="mt-1.5 text-xs text-error-500">{errors.annee}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Détails
          </span>
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
            min="1"
            value={nbPages}
            onChange={(e) => setNbPages(e.target.value)}
            error={!!errors.pages}
          />
          {errors.pages && (
            <p className="mt-1.5 text-xs text-error-500">{errors.pages}</p>
          )}
        </div>
      </div>

      {apiMode && typeLivre === "INTERNE" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Fichier
            </span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          </div>
          <div>
            <Label>Remplacer le fichier du livre</Label>
            <p className="mb-2 text-[11px] text-gray-400">
              Optionnel, champ <code>file</code> (PDF, EPUB, MOBI, max 50 Mo).
            </p>
            <BookFileUploader
              value={fichierLivre}
              onChange={setFichierLivre}
              error={!!errors.fichier}
            />
            {errors.fichier && (
              <p className="mt-1.5 text-xs text-error-500">{errors.fichier}</p>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isDownloadable}
              onChange={(e) => setIsDownloadable(e.target.checked)}
              className="size-4 rounded border-gray-300"
            />
            <span>
              Téléchargeable (<code>is_downloadable</code>)
            </span>
          </label>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Organisation
          </span>
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
          onChange={() => {}}
        />
        <p className="text-[11px] text-gray-400">
          Association et retrait des bibliothèques : page Bibliothèques.
        </p>

        <div>
          <span className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Statut
          </span>
          <div className="flex gap-4">
            <label
              className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${statut === "PUBLIE" ? "border-brand-500 bg-brand-25 dark:border-brand-500 dark:bg-brand-500/5" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}
            >
              <Radio
                id="edit-statut-publie"
                name="edit-statut"
                value="PUBLIE"
                checked={statut === "PUBLIE"}
                label=""
                onChange={() => setStatut("PUBLIE")}
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  Publié
                </p>
                <p className="text-[11px] text-gray-500">Visible</p>
              </div>
            </label>
            <label
              className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${statut === "ARCHIVE" ? "border-warning-500 bg-warning-25 dark:border-warning-500 dark:bg-warning-500/5" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}
            >
              <Radio
                id="edit-statut-archive"
                name="edit-statut"
                value="ARCHIVE"
                checked={statut === "ARCHIVE"}
                label=""
                onChange={() => setStatut("ARCHIVE")}
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  Archivé
                </p>
                <p className="text-[11px] text-gray-500">
                  Hors catalogue
                </p>
              </div>
            </label>
          </div>
          {livre.statut === "ARCHIVE" && statut === "PUBLIE" && (
            <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
              La réactivation n&apos;est pas disponible depuis l&apos;admin :
              seul l&apos;archivage est pris en charge.
            </p>
          )}
        </div>
      </div>

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
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Enregistrement…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
