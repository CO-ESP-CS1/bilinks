"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { mockBibliotheques } from "@/lib/mock-data";
import type { StatutLivre, MockLivre } from "@/lib/mock-data";
import { getAllCategories } from "@/lib/categories-store";
import {
  archiveLivre,
  createLivre,
  getAllLivres,
} from "@/lib/livres-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
import Radio from "@/components/form/input/Radio";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EyeIcon, PencilIcon, BoxCubeIcon, DocsIcon } from "@/icons";

type StatutFiltre = "tous" | "publie" | "archive";

function initialeTitre(titre: string): string {
  const t = titre.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

export default function LivresPage() {
  const router = useRouter();
  const [livres, setLivres] = useState<MockLivre[]>([]);
  const [categories, setCategories] = useState(
    () => [] as ReturnType<typeof getAllCategories>
  );

  const refresh = useCallback(() => {
    setLivres(getAllLivres());
    setCategories(getAllCategories());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>("tous");
  const [categorieFiltre, setCategorieFiltre] = useState<string>("tous");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [archiveCible, setArchiveCible] = useState<MockLivre | null>(null);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setStatutFiltre("tous");
    setCategorieFiltre("tous");
  }, []);

  const categoriesOptions = useMemo(
    () => categories.map((c) => c.nom),
    [categories]
  );

  const bibliothequesInternes = useMemo(
    () => mockBibliotheques.filter((b) => b.type === "INTERNE"),
    []
  );

  const multiCategoriesOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        text: c.nom,
        selected: false,
      })),
    [categories]
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

  const confirmerArchivage = useCallback(() => {
    if (!archiveCible) return;
    archiveLivre(archiveCible.id);
    refresh();
    toast.success(`« ${archiveCible.titre} » a été archivé.`);
    setArchiveCible(null);
  }, [archiveCible, refresh]);

  const livresFiltres = useMemo(() => {
    const q = search.trim().toLowerCase();
    return livres.filter((livre) => {
      const matchText =
        !q ||
        livre.titre.toLowerCase().includes(q) ||
        livre.auteurs.some((a) => a.toLowerCase().includes(q));
      const matchStatut =
        statutFiltre === "tous" ||
        (statutFiltre === "publie" && livre.statut === "PUBLIE") ||
        (statutFiltre === "archive" && livre.statut === "ARCHIVE");
      const matchCat =
        categorieFiltre === "tous" || livre.categorie === categorieFiltre;
      return matchText && matchStatut && matchCat;
    });
  }, [livres, search, statutFiltre, categorieFiltre]);

  const ouvrirModal = () => {
    setModalKey((k) => k + 1);
    setModalOuvert(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Livres")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Livres
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion du catalogue BiblioTech
          </p>
        </div>
        <Button onClick={ouvrirModal}>Ajouter un livre</Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="search-livres">Rechercher</Label>
          <Input
            id="search-livres"
            type="text"
            placeholder="Titre ou auteur…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full min-w-[160px] sm:w-48">
          <Label htmlFor="filtre-statut">Statut</Label>
          <select
            id="filtre-statut"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            value={statutFiltre}
            onChange={(e) =>
              setStatutFiltre(e.target.value as StatutFiltre)
            }
          >
            <option value="tous">Tous</option>
            <option value="publie">Publié</option>
            <option value="archive">Archivé</option>
          </select>
        </div>
        <div className="w-full min-w-[180px] sm:w-56">
          <Label htmlFor="filtre-categorie">Catégorie</Label>
          <select
            id="filtre-categorie"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            value={categorieFiltre}
            onChange={(e) => setCategorieFiltre(e.target.value)}
          >
            <option value="tous">Toutes les catégories</option>
            {categoriesOptions.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {livresFiltres.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<DocsIcon className="size-7" />}
              message="Aucun livre trouvé pour ce filtre."
              onReset={reinitialiserFiltres}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {[
                    "Couverture",
                    "Titre",
                    "Auteurs",
                    "Catégorie",
                    "Langue",
                    "Année",
                    "Pages",
                    "Statut",
                    "Notes",
                    "Actions",
                  ].map((col) => (
                    <TableCell
                      key={col}
                      isHeader
                      className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {livresFiltres.map((livre) => (
                  <TableRow key={livre.id}>
                    <TableCell className="px-4 py-3 text-start">
                      {livre.couvertureUrl ? (
                        <div className="relative h-12 w-9 overflow-hidden rounded-md">
                          <Image
                            src={livre.couvertureUrl}
                            alt=""
                            width={36}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-9 items-center justify-center rounded-md bg-gray-200 text-sm font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {initialeTitre(livre.titre)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {livre.titre}
                    </TableCell>
                    <TableCell className="max-w-[200px] px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {livre.auteurs.join(", ")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {livre.categorie}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {livre.langue}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {livre.anneePublication}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                      {livre.nombrePages}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      {livre.statut === "PUBLIE" ? (
                        <Badge color="success" size="sm" variant="light">
                          Publié
                        </Badge>
                      ) : (
                        <Badge color="light" size="sm" variant="light">
                          Archivé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                      {livre.noteMoyenne != null ? (
                        <span className="font-medium text-amber-500">
                          ★ {livre.noteMoyenne.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Voir"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                          onClick={() =>
                            router.push(`/admin/livres/${livre.id}`)
                          }
                        >
                          <EyeIcon className="size-5" />
                        </button>
                        <button
                          type="button"
                          title="Éditer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                          onClick={() =>
                            router.push(`/admin/livres/${livre.id}/modifier`)
                          }
                        >
                          <PencilIcon className="size-5" />
                        </button>
                        <button
                          type="button"
                          title="Archiver"
                          disabled={livre.statut === "ARCHIVE"}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-warning-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
                          onClick={() => setArchiveCible(livre)}
                        >
                          <BoxCubeIcon className="size-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={archiveCible != null}
        onClose={() => setArchiveCible(null)}
        onConfirm={confirmerArchivage}
        title="Archiver ce livre ?"
        description={
          archiveCible ? (
            <>
              « {archiveCible.titre} » passera au statut Archivé. Vous pourrez le
              réactiver depuis la page de modification.
            </>
          ) : null
        }
        confirmLabel="Archiver"
        variant="warning"
      />

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8"
      >
        <AjouterLivreForm
          key={modalKey}
          multiCategoriesOptions={multiCategoriesOptions}
          multiBibliothequesOptions={multiBibliothequesOptions}
          onSuccess={() => {
            refresh();
            setModalOuvert(false);
            toast.success("Livre ajouté avec succès.");
          }}
        />
      </Modal>

    </div>
  );
}

type FormErrors = Partial<
  Record<
    "titre" | "auteurs" | "urlFichier" | "langue" | "bibliotheques",
    string
  >
>;

function AjouterLivreForm({
  multiCategoriesOptions,
  multiBibliothequesOptions,
  onSuccess,
}: {
  multiCategoriesOptions: { value: string; text: string; selected: boolean }[];
  multiBibliothequesOptions: { value: string; text: string; selected: boolean }[];
  onSuccess: () => void;
}) {
  const [titre, setTitre] = useState("");
  const [auteurs, setAuteurs] = useState("");
  const [isbn, setIsbn] = useState("");
  const [resume, setResume] = useState("");
  const [urlFichier, setUrlFichier] = useState("");
  const [urlCouverture, setUrlCouverture] = useState("");
  const [langue, setLangue] = useState("");
  const [annee, setAnnee] = useState("");
  const [nbPages, setNbPages] = useState("");
  const [categoriesIds, setCategoriesIds] = useState<string[]>([]);
  const [bibliothequesIds, setBibliothequesIds] = useState<string[]>([]);
  const [statut, setStatut] = useState<StatutLivre>("PUBLIE");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback(() => {
    const next: FormErrors = {};
    if (!titre.trim()) next.titre = "Le titre est obligatoire.";
    const auteursParsed = auteurs
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (auteursParsed.length === 0) {
      next.auteurs = "Indiquez au moins un auteur (noms séparés par des virgules).";
    }
    if (!urlFichier.trim()) {
      next.urlFichier = "L'URL du fichier est obligatoire.";
    }
    if (!langue) {
      next.langue = "La langue est obligatoire.";
    }
    if (bibliothequesIds.length === 0) {
      next.bibliotheques =
        "Sélectionnez au moins une bibliothèque interne.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [titre, auteurs, urlFichier, langue, bibliothequesIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const auteursParsed = auteurs
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    createLivre({
      titre: titre.trim(),
      auteurs: auteursParsed,
      langue,
      anneePublication: annee === "" ? null : Number(annee),
      nombrePages: nbPages === "" ? null : Number(nbPages),
      categorieIds: categoriesIds,
      couvertureUrl: urlCouverture.trim() || null,
      statut,
    });
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
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        Ajouter un livre
      </h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Remplissez les champs obligatoires (*)
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="livre-titre">Titre *</Label>
          <Input
            id="livre-titre"
            type="text"
            onChange={(e) => setTitre(e.target.value)}
            error={!!errors.titre}
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-error-500">{errors.titre}</p>
          )}
        </div>

        <div>
          <Label htmlFor="livre-auteurs">
            Auteurs * — Noms séparés par des virgules
          </Label>
          <Input
            id="livre-auteurs"
            type="text"
            placeholder="Ex. : Victor Hugo, Albert Camus"
            onChange={(e) => setAuteurs(e.target.value)}
            error={!!errors.auteurs}
          />
          {errors.auteurs && (
            <p className="mt-1 text-sm text-error-500">{errors.auteurs}</p>
          )}
        </div>

        <div>
          <Label htmlFor="livre-isbn">ISBN</Label>
          <Input id="livre-isbn" type="text" onChange={(e) => setIsbn(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="livre-resume">Résumé</Label>
          <TextArea
            rows={4}
            value={resume}
            onChange={setResume}
            placeholder="Résumé optionnel…"
          />
        </div>

        <div>
          <Label htmlFor="livre-url-fichier">
            URL du fichier sur stockage S3 *
          </Label>
          <Input
            id="livre-url-fichier"
            type="url"
            placeholder="https://…"
            onChange={(e) => setUrlFichier(e.target.value)}
            error={!!errors.urlFichier}
          />
          {errors.urlFichier && (
            <p className="mt-1 text-sm text-error-500">{errors.urlFichier}</p>
          )}
        </div>

        <div>
          <Label htmlFor="livre-url-couv">URL couverture</Label>
          <Input
            id="livre-url-couv"
            type="url"
            placeholder="https://…"
            onChange={(e) => setUrlCouverture(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="livre-langue">Langue *</Label>
          <Select
            placeholder="Choisir une langue"
            options={langueOptions}
            onChange={(v) => setLangue(v)}
          />
          {errors.langue && (
            <p className="mt-1 text-sm text-error-500">{errors.langue}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="livre-annee">Année de publication</Label>
            <Input
              id="livre-annee"
              type="number"
              onChange={(e) => setAnnee(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="livre-pages">Nombre de pages</Label>
            <Input
              id="livre-pages"
              type="number"
              min="0"
              onChange={(e) => setNbPages(e.target.value)}
            />
          </div>
        </div>

        <div>
          <MultiSelect
            label="Catégorie(s)"
            options={multiCategoriesOptions}
            onChange={setCategoriesIds}
          />
        </div>

        <div>
          <MultiSelect
            label="Bibliothèque(s) * — bibliothèques internes uniquement"
            options={multiBibliothequesOptions}
            onChange={setBibliothequesIds}
          />
          {errors.bibliotheques && (
            <p className="mt-1 text-sm text-error-500">
              {errors.bibliotheques}
            </p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Statut
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <Radio
              id="statut-publie"
              name="statut-livre"
              value="PUBLIE"
              checked={statut === "PUBLIE"}
              label="Publié"
              onChange={() => setStatut("PUBLIE")}
            />
            <Radio
              id="statut-archive"
              name="statut-livre"
              value="ARCHIVE"
              checked={statut === "ARCHIVE"}
              label="Archivé"
              onChange={() => setStatut("ARCHIVE")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
