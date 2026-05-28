"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { mockBibliotheques } from "@/lib/mock-data";
import type { StatutLivre, MockLivre } from "@/lib/mock-data";
import { getAllCategories } from "@/lib/categories-store";
import {
  archiveLivrePersisted,
  createLivrePersisted,
  fetchLivres,
} from "@/lib/livres-store";
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
import { BookCover } from "@/components/livres/BookCover";
import { CoverUploader } from "@/components/livres/CoverUploader";

type StatutFiltre = "tous" | "publie" | "archive";
type VueMode = "grille" | "tableau";

export default function LivresPage() {
  const router = useRouter();
  const [livres, setLivres] = useState<MockLivre[]>([]);
  const [categories, setCategories] = useState(
    () => [] as ReturnType<typeof getAllCategories>
  );
  const [vue, setVue] = useState<VueMode>("grille");

  const refresh = useCallback(async () => {
    setLivres(await fetchLivres());
    setCategories(getAllCategories());
  }, []);

  useEffect(() => {
    void refresh();
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

  const confirmerArchivage = useCallback(async () => {
    if (!archiveCible) return;
    await archiveLivrePersisted(archiveCible.id);
    await refresh();
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

  const stats = useMemo(() => {
    const total = livres.length;
    const publies = livres.filter((l) => l.statut === "PUBLIE").length;
    const archives = livres.filter((l) => l.statut === "ARCHIVE").length;
    return { total, publies, archives };
  }, [livres]);

  const ouvrirModal = () => {
    setModalKey((k) => k + 1);
    setModalOuvert(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Livres")} />

      {/* Header avec statistiques */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Catalogue
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Gérez votre collection de livres numériques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex">
            <StatCard label="Total" value={stats.total} />
            <div className="h-8 w-px bg-gray-100 dark:bg-white/[0.06]" />
            <StatCard label="Publiés" value={stats.publies} color="success" />
            <div className="h-8 w-px bg-gray-100 dark:bg-white/[0.06]" />
            <StatCard label="Archivés" value={stats.archives} color="warning" />
          </div>
          <button
            onClick={ouvrirModal}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-300 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.97]"
          >
            <svg className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un livre
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[220px] flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg className="h-4.5 w-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un titre ou auteur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border-0 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 ring-1 ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/90 dark:ring-white/[0.08] dark:placeholder:text-gray-500 dark:focus:ring-brand-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value as StatutFiltre)}
              className="h-10 rounded-lg border-0 bg-gray-50 px-3 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/80 dark:ring-white/[0.08]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="publie">Publié</option>
              <option value="archive">Archivé</option>
            </select>
            <select
              value={categorieFiltre}
              onChange={(e) => setCategorieFiltre(e.target.value)}
              className="h-10 rounded-lg border-0 bg-gray-50 px-3 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/80 dark:ring-white/[0.08]"
            >
              <option value="tous">Toutes catégories</option>
              {categoriesOptions.map((nom) => (
                <option key={nom} value={nom}>{nom}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.06]">
          <button
            type="button"
            onClick={() => setVue("grille")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${vue === "grille" ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setVue("tableau")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${vue === "tableau" ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      {livresFiltres.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <EmptyState
            icon={<DocsIcon className="size-7" />}
            message="Aucun livre trouvé pour ce filtre."
            onReset={reinitialiserFiltres}
          />
        </div>
      ) : vue === "grille" ? (
        <GrilleView
          livres={livresFiltres}
          onVoir={(id) => router.push(`/admin/livres/${id}`)}
          onEditer={(id) => router.push(`/admin/livres/${id}/modifier`)}
          onArchiver={setArchiveCible}
        />
      ) : (
        <TableauView
          livres={livresFiltres}
          onVoir={(id) => router.push(`/admin/livres/${id}`)}
          onEditer={(id) => router.push(`/admin/livres/${id}/modifier`)}
          onArchiver={setArchiveCible}
        />
      )}

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
        className="w-full max-w-xl p-6 sm:p-8"
      >
        <AjouterLivreForm
          key={modalKey}
          multiCategoriesOptions={multiCategoriesOptions}
          multiBibliothequesOptions={multiBibliothequesOptions}
          onSuccess={async () => {
            await refresh();
            setModalOuvert(false);
            toast.success("Livre ajouté avec succès.");
          }}
        />
      </Modal>
    </div>
  );
}

/* ─── Composants auxiliaires ─── */

function StatCard({ label, value, color }: { label: string; value: number; color?: "success" | "warning" }) {
  const dotColor = color === "success"
    ? "bg-success-500"
    : color === "warning"
    ? "bg-warning-500"
    : "bg-gray-400";

  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-2 w-2 rounded-full ${dotColor}`} />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold leading-tight text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

/* ─── Vue en grille (cartes) ─── */

function GrilleView({
  livres,
  onVoir,
  onEditer,
  onArchiver,
}: {
  livres: MockLivre[];
  onVoir: (id: string) => void;
  onEditer: (id: string) => void;
  onArchiver: (livre: MockLivre) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {livres.map((livre, idx) => (
        <div
          key={livre.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white animate-fade-in-up transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-900/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12] dark:hover:shadow-none"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {/* Couverture — ratio 2:3 (mobile / Cloudinary) */}
          <div className="relative w-full">
            <BookCover
              src={livre.couvertureUrl}
              title={livre.titre}
              variant="grid"
              rounded="none"
              hoverZoom
              showShine
              className="!rounded-t-2xl"
            />
            {/* Overlay actions au hover */}
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex gap-2 pb-4">
                <button
                  onClick={() => onVoir(livre.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur-sm transition hover:bg-white"
                  title="Voir"
                >
                  <EyeIcon className="size-4" />
                </button>
                <button
                  onClick={() => onEditer(livre.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur-sm transition hover:bg-white"
                  title="Modifier"
                >
                  <PencilIcon className="size-4" />
                </button>
                {livre.statut !== "ARCHIVE" && (
                  <button
                    onClick={() => onArchiver(livre)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur-sm transition hover:bg-white"
                    title="Archiver"
                  >
                    <BoxCubeIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Badge statut */}
            <div className="absolute left-3 top-3">
              {livre.statut === "PUBLIE" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50/90 px-2.5 py-1 text-xs font-medium text-success-700 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                  Publié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100/90 px-2.5 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  Archivé
                </span>
              )}
            </div>
            {/* Note */}
            {livre.noteMoyenne != null && (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-50/90 px-2 py-1 backdrop-blur-sm">
                <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-amber-700">{livre.noteMoyenne.toFixed(1)}</span>
              </div>
            )}
          </div>
          {/* Infos */}
          <div className="flex flex-1 flex-col p-4">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
              {livre.titre}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
              {livre.auteurs.join(", ")}
            </p>
            <div className="mt-auto flex items-center gap-2 pt-3">
              {livre.categorie && (
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {livre.categorie}
                </span>
              )}
              <span className="ml-auto text-[11px] text-gray-400">{livre.anneePublication}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Vue en tableau ─── */

function TableauView({
  livres,
  onVoir,
  onEditer,
  onArchiver,
}: {
  livres: MockLivre[];
  onVoir: (id: string) => void;
  onEditer: (id: string) => void;
  onArchiver: (livre: MockLivre) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "Livre",
                  "Catégorie",
                  "Langue",
                  "Année",
                  "Pages",
                  "Statut",
                  "Note",
                  "",
                ].map((col) => (
                  <TableCell
                    key={col || "actions"}
                    isHeader
                    className="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {livres.map((livre) => (
                <TableRow key={livre.id} className="transition-colors hover:bg-gray-25 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3.5">
                      <BookCover
                        src={livre.couvertureUrl}
                        title={livre.titre}
                        variant="thumbnail"
                        rounded="lg"
                        className="shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {livre.titre}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {livre.auteurs.join(", ")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {livre.categorie && (
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                        {livre.categorie}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {livre.langue}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {livre.anneePublication}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {livre.nombrePages || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {livre.statut === "PUBLIE" ? (
                      <Badge color="success" size="sm" variant="light">Publié</Badge>
                    ) : (
                      <Badge color="light" size="sm" variant="light">Archivé</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {livre.noteMoyenne != null ? (
                      <div className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{livre.noteMoyenne.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Voir"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                        onClick={() => onVoir(livre.id)}
                      >
                        <EyeIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Éditer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                        onClick={() => onEditer(livre.id)}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Archiver"
                        disabled={livre.statut === "ARCHIVE"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-warning-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/5"
                        onClick={() => onArchiver(livre)}
                      >
                        <BoxCubeIcon className="size-4" />
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
  );
}

/* ─── Formulaire d'ajout ─── */

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
  const [couverturePreview, setCouverturePreview] = useState<string | null>(null);
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
    const auteursParsed = auteurs.split(",").map((a) => a.trim()).filter(Boolean);
    if (auteursParsed.length === 0) {
      next.auteurs = "Indiquez au moins un auteur (séparés par des virgules).";
    }
    if (!urlFichier.trim()) next.urlFichier = "L'URL du fichier est obligatoire.";
    if (!langue) next.langue = "La langue est obligatoire.";
    if (bibliothequesIds.length === 0) {
      next.bibliotheques = "Sélectionnez au moins une bibliothèque.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [titre, auteurs, urlFichier, langue, bibliothequesIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const auteursParsed = auteurs.split(",").map((a) => a.trim()).filter(Boolean);
    await createLivrePersisted({
      titre: titre.trim(),
      auteurs: auteursParsed,
      langue,
      anneePublication: annee === "" ? null : Number(annee),
      nombrePages: nbPages === "" ? null : Number(nbPages),
      categorieIds: categoriesIds,
      couvertureUrl: couverturePreview || null,
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
      {/* Header du modal */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nouveau livre
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajoutez un ouvrage à votre catalogue
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <CoverUploader
          value={couverturePreview}
          onChange={(url) => setCouverturePreview(url)}
          bookTitle={titre || "Aperçu"}
        />

        {/* Infos essentielles */}
        <div className="space-y-4">
            <div>
              <Label htmlFor="livre-titre">Titre *</Label>
              <Input
                id="livre-titre"
                type="text"
                placeholder="Ex. : Les Misérables"
                onChange={(e) => setTitre(e.target.value)}
                error={!!errors.titre}
              />
              {errors.titre && (
                <p className="mt-1.5 text-xs text-error-500">{errors.titre}</p>
              )}
            </div>

            <div>
              <Label htmlFor="livre-auteurs">Auteurs *</Label>
              <Input
                id="livre-auteurs"
                type="text"
                placeholder="Victor Hugo, Albert Camus"
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
                <Label htmlFor="livre-isbn">ISBN</Label>
                <Input id="livre-isbn" type="text" placeholder="978-…" onChange={(e) => setIsbn(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="livre-langue">Langue *</Label>
                <Select
                  placeholder="Choisir"
                  options={langueOptions}
                  onChange={(v) => setLangue(v)}
                />
                {errors.langue && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.langue}</p>
                )}
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
            <Label htmlFor="livre-resume">Résumé</Label>
            <TextArea
              rows={3}
              value={resume}
              onChange={setResume}
              placeholder="Une brève description du contenu…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="livre-annee">Année de publication</Label>
              <Input id="livre-annee" type="number" placeholder="2024" onChange={(e) => setAnnee(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="livre-pages">Nombre de pages</Label>
              <Input id="livre-pages" type="number" min="0" placeholder="320" onChange={(e) => setNbPages(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section : Fichier & Organisation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fichier & Organisation</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
          </div>

          <div>
            <Label htmlFor="livre-url-fichier">URL du fichier (stockage S3) *</Label>
            <Input
              id="livre-url-fichier"
              type="url"
              placeholder="https://storage.example.com/livres/…"
              onChange={(e) => setUrlFichier(e.target.value)}
              error={!!errors.urlFichier}
            />
            {errors.urlFichier && (
              <p className="mt-1.5 text-xs text-error-500">{errors.urlFichier}</p>
            )}
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
              label="Bibliothèque(s) *"
              options={multiBibliothequesOptions}
              onChange={setBibliothequesIds}
            />
            {errors.bibliotheques && (
              <p className="mt-1.5 text-xs text-error-500">{errors.bibliotheques}</p>
            )}
          </div>

          <div>
            <span className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Statut de publication
            </span>
            <div className="flex gap-4">
              <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${statut === "PUBLIE" ? "border-brand-500 bg-brand-25 dark:border-brand-500 dark:bg-brand-500/5" : "border-gray-200 hover:border-gray-300 dark:border-gray-700"}`}>
                <Radio
                  id="statut-publie"
                  name="statut-livre"
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
                  id="statut-archive"
                  name="statut-livre"
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
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-white/[0.06]">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.97]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Enregistrer le livre
          </button>
        </div>
      </form>
    </div>
  );
}
