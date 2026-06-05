"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type { MockAuteur, MockLivre } from "@/lib/mock-data";
import { fetchCategoriesPersisted, getAllCategories } from "@/lib/categories-store";
import { fetchAuteursPersisted, getAllAuteurs } from "@/lib/auteurs-store";
import {
  fetchLibrariesPersisted,
  getAllLibraries,
} from "@/lib/libraries-store";
import {
  archiveLivrePersisted,
  createLivrePersisted,
  fetchLivres,
} from "@/lib/livres-store";
import type { PaginationMeta } from "@/lib/api/pagination";
import type { TypeLivreCatalogue } from "@/types/admin";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";
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
import { BookFileUploader } from "@/components/livres/BookFileUploader";
import { dataUrlToFile } from "@/lib/book-file";
import { isApiConfigured } from "@/lib/api/client";
import {
  validateCreateBookInput,
  type TypeLivre,
} from "@/lib/admin/book-payload";
import { formatCatalogPages, formatCatalogYear } from "@/lib/catalog-display";

type StatutFiltre = "tous" | "publie" | "archive";
type TypeLivreFiltre = "tous" | TypeLivreCatalogue;
type DownloadableFiltre = "tous" | "oui" | "non";
type VueMode = "grille" | "tableau";

export default function LivresPage() {
  const router = useRouter();
  const [livres, setLivres] = useState<MockLivre[]>([]);
  const [categories, setCategories] = useState(
    () => [] as ReturnType<typeof getAllCategories>
  );
  const [auteurs, setAuteurs] = useState<MockAuteur[]>([]);
  const [vue, setVue] = useState<VueMode>("grille");

  const apiMode = isApiConfigured();

  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>("tous");
  const [typeLivreFiltre, setTypeLivreFiltre] = useState<TypeLivreFiltre>("tous");
  const [downloadableFiltre, setDownloadableFiltre] =
    useState<DownloadableFiltre>("tous");
  const [categorieFiltre, setCategorieFiltre] = useState<string>("tous");
  const [livresPage, setLivresPage] = useState(1);
  const [livresMeta, setLivresMeta] = useState<PaginationMeta | null>(null);
  const [loadingLivres, setLoadingLivres] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [archiveCible, setArchiveCible] = useState<MockLivre | null>(null);

  const loadLivres = useCallback(async () => {
    setLoadingLivres(true);
    try {
      const statut =
        statutFiltre === "publie"
          ? ("PUBLIE" as const)
          : statutFiltre === "archive"
            ? ("ARCHIVE" as const)
            : undefined;
      const { livres: rows, meta } = await fetchLivres(
        apiMode
          ? {
              statut,
              q: search.trim() || undefined,
              type_livre:
                typeLivreFiltre !== "tous" ? typeLivreFiltre : undefined,
              is_downloadable:
                downloadableFiltre === "oui"
                  ? true
                  : downloadableFiltre === "non"
                    ? false
                    : undefined,
              page: livresPage,
              limit: 20,
            }
          : undefined
      );
      setLivres(rows);
      setLivresMeta(meta);
    } finally {
      setLoadingLivres(false);
    }
  }, [
    apiMode,
    statutFiltre,
    typeLivreFiltre,
    downloadableFiltre,
    search,
    livresPage,
  ]);

  const refreshReferentiels = useCallback(async () => {
    await Promise.all([
      fetchCategoriesPersisted(),
      fetchAuteursPersisted(),
      fetchLibrariesPersisted({ statut: "ACTIVE", type: "INTERNE" }),
    ]);
    setCategories(getAllCategories());
    setAuteurs(getAllAuteurs());
  }, []);

  const refresh = useCallback(async () => {
    await refreshReferentiels();
    await loadLivres();
  }, [loadLivres, refreshReferentiels]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!apiMode) return;
    const timer = setTimeout(() => {
      void loadLivres();
    }, search.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [apiMode, loadLivres, statutFiltre, typeLivreFiltre, downloadableFiltre, search]);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setStatutFiltre("tous");
    setTypeLivreFiltre("tous");
    setDownloadableFiltre("tous");
    setCategorieFiltre("tous");
    setLivresPage(1);
  }, []);

  const categoriesOptions = useMemo(
    () => categories.map((c) => c.nom),
    [categories]
  );

  const bibliothequesInternes = useMemo(
    () =>
      getAllLibraries().filter(
        (b) => b.type === "INTERNE" && b.statut === "ACTIVE"
      ),
    [livres]
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

  const multiAuteursOptions = useMemo(
    () =>
      auteurs.map((a) => ({
        value: a.id,
        text: `${a.prenom} ${a.nom}`.trim() || a.nom,
        selected: false,
      })),
    [auteurs]
  );

  const confirmerArchivage = useCallback(async () => {
    if (!archiveCible) return;
    const result = await archiveLivrePersisted(archiveCible.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await refresh();
    toast.success(
      `« ${archiveCible.titre} » archivé (${result.statut}) — hors catalogue utilisateur.`
    );
    setArchiveCible(null);
  }, [archiveCible, refresh]);

  const livresFiltres = useMemo(() => {
    const q = apiMode ? "" : search.trim().toLowerCase();
    return livres.filter((livre) => {
      const matchText =
        !q ||
        livre.titre.toLowerCase().includes(q) ||
        livre.auteurs.some((a) => a.toLowerCase().includes(q));
      const matchStatut =
        apiMode ||
        statutFiltre === "tous" ||
        (statutFiltre === "publie" && livre.statut === "PUBLIE") ||
        (statutFiltre === "archive" && livre.statut === "ARCHIVE");
      const matchCat =
        categorieFiltre === "tous" || livre.categorie === categorieFiltre;
      const matchType =
        apiMode ||
        typeLivreFiltre === "tous" ||
        livre.type_livre === typeLivreFiltre;
      const matchDownloadable =
        apiMode ||
        downloadableFiltre === "tous" ||
        (downloadableFiltre === "oui" && livre.is_downloadable === true) ||
        (downloadableFiltre === "non" && livre.is_downloadable !== true);
      return matchText && matchStatut && matchCat && matchType && matchDownloadable;
    });
  }, [
    livres,
    search,
    statutFiltre,
    typeLivreFiltre,
    downloadableFiltre,
    categorieFiltre,
    apiMode,
  ]);

  const stats = useMemo(() => {
    const total = livres.length;
    const publies = livres.filter((l) => l.statut === "PUBLIE").length;
    const archives = livres.filter((l) => l.statut === "ARCHIVE").length;
    return { total, publies, archives };
  }, [livres]);

  const ouvrirModal = async () => {
    await refreshReferentiels();
    if (apiMode && getAllAuteurs().length === 0) {
      toast.error(
        "Aucun auteur disponible. Créez-en un dans Auteurs ou vérifiez votre session.",
        { duration: 5000 }
      );
    }
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
              placeholder={
                apiMode
                  ? "Rechercher par titre…"
                  : "Rechercher un titre ou auteur…"
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLivresPage(1);
              }}
              className="h-10 w-full rounded-lg border-0 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 ring-1 ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/90 dark:ring-white/[0.08] dark:placeholder:text-gray-500 dark:focus:ring-brand-500/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statutFiltre}
              onChange={(e) => {
                setStatutFiltre(e.target.value as StatutFiltre);
                setLivresPage(1);
              }}
              className="h-10 rounded-lg border-0 bg-gray-50 px-3 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/80 dark:ring-white/[0.08]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="publie">Publié</option>
              <option value="archive">Archivé</option>
            </select>
            <select
              value={typeLivreFiltre}
              onChange={(e) => {
                setTypeLivreFiltre(e.target.value as TypeLivreFiltre);
                setLivresPage(1);
              }}
              className="h-10 rounded-lg border-0 bg-gray-50 px-3 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/80 dark:ring-white/[0.08]"
            >
              <option value="tous">Tous types</option>
              <option value="INTERNE">Interne</option>
              <option value="EXTERNE">Externe</option>
            </select>
            <select
              value={downloadableFiltre}
              onChange={(e) => {
                setDownloadableFiltre(e.target.value as DownloadableFiltre);
                setLivresPage(1);
              }}
              className="h-10 rounded-lg border-0 bg-gray-50 px-3 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500/30 dark:bg-white/[0.04] dark:text-white/80 dark:ring-white/[0.08]"
            >
              <option value="tous">Téléchargeable</option>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
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
      {loadingLivres ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      ) : livresFiltres.length === 0 ? (
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
          apiMode={apiMode}
          onVoir={(id) => router.push(`/admin/livres/${id}`)}
          onEditer={(id) => router.push(`/admin/livres/${id}/modifier`)}
          onArchiver={setArchiveCible}
        />
      )}

      {apiMode && livresMeta && livresMeta.total_pages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {livresMeta.page} / {livresMeta.total_pages} — {livresMeta.total}{" "}
            livre{livresMeta.total > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={livresPage <= 1 || loadingLivres}
              onClick={() => setLivresPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                livresPage >= livresMeta.total_pages || loadingLivres
              }
              onClick={() => setLivresPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={archiveCible != null}
        onClose={() => setArchiveCible(null)}
        onConfirm={confirmerArchivage}
        title="Archiver ce livre ?"
        description={
          archiveCible ? (
            <>
              « {archiveCible.titre} » passera au statut <strong>ARCHIVE</strong>{" "}
              — hors catalogue utilisateur. Les jetons et progressions existants
              ne sont pas supprimés.
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
          multiAuteursOptions={multiAuteursOptions}
          multiCategoriesOptions={multiCategoriesOptions}
          multiBibliothequesOptions={multiBibliothequesOptions}
          onSuccess={async (created) => {
            await refresh();
            setModalOuvert(false);
            toast.success(
              `Livre créé (${created.statut}) — ${created.titre} [${created.type_livre}]`
            );
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
              <span className="ml-auto text-[11px] text-gray-400">
                {formatCatalogYear(livre.anneePublication)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Vue en tableau ─── */

function formatDownloadable(livre: MockLivre): string {
  if (livre.type_livre === "EXTERNE") return "—";
  return livre.is_downloadable ? "Oui" : "Non";
}

function TableauView({
  livres,
  apiMode,
  onVoir,
  onEditer,
  onArchiver,
}: {
  livres: MockLivre[];
  apiMode: boolean;
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
                  "Type",
                  "Catégorie",
                  "Langue",
                  apiMode ? "Lectures" : "Année",
                  apiMode ? "Téléchargeable" : "Pages",
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
                    {livre.type_livre ? (
                      <Badge
                        color={livre.type_livre === "INTERNE" ? "primary" : "info"}
                        size="sm"
                        variant="light"
                      >
                        {livre.type_livre === "INTERNE" ? "Interne" : "Externe"}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {livre.categorie && livre.categorie !== "—" ? (
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                        {livre.categorie}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {livre.langue}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {apiMode
                      ? livre.nbLectures
                      : formatCatalogYear(livre.anneePublication)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {apiMode
                      ? formatDownloadable(livre)
                      : formatCatalogPages(livre.nombrePages)}
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
    | "titre"
    | "auteurs"
    | "fichier"
    | "langue"
    | "urlExterne"
    | "isbn"
    | "annee"
    | "pages",
    string
  >
>;

function AjouterLivreForm({
  multiAuteursOptions,
  multiCategoriesOptions,
  multiBibliothequesOptions,
  onSuccess,
}: {
  multiAuteursOptions: { value: string; text: string; selected: boolean }[];
  multiCategoriesOptions: { value: string; text: string; selected: boolean }[];
  multiBibliothequesOptions: { value: string; text: string; selected: boolean }[];
  onSuccess: (created: {
    id: string;
    titre: string;
    type_livre: string;
    statut: string;
  }) => void;
}) {
  const [titre, setTitre] = useState("");
  const [auteurIds, setAuteurIds] = useState<string[]>([]);
  const [isbn, setIsbn] = useState("");
  const [resume, setResume] = useState("");
  const [fichierLivre, setFichierLivre] = useState<File | null>(null);
  const [couverturePreview, setCouverturePreview] = useState<string | null>(null);
  const [langue, setLangue] = useState("");
  const [annee, setAnnee] = useState("");
  const [nbPages, setNbPages] = useState("");
  const [categoriesIds, setCategoriesIds] = useState<string[]>([]);
  const [bibliothequesIds, setBibliothequesIds] = useState<string[]>([]);
  const [typeLivre, setTypeLivre] = useState<TypeLivre>("INTERNE");
  const [urlExterneLivre, setUrlExterneLivre] = useState("");
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const apiMode = isApiConfigured();

  const validate = useCallback(() => {
    const payload = {
      titre: titre.trim(),
      auteurIds,
      categorieIds: categoriesIds,
      bibliothequeIds: bibliothequesIds,
      langue,
      type_livre: typeLivre,
      urlExterneLivre: urlExterneLivre.trim() || undefined,
      anneePublication: annee === "" ? null : Number(annee),
      nombrePages: nbPages === "" ? null : Number(nbPages),
      fichier: fichierLivre ?? undefined,
    };
    const storeError = validateCreateBookInput(payload, apiMode);
    const next: FormErrors = {};
    if (!payload.titre) next.titre = "Le titre est obligatoire.";
    if (payload.auteurIds.length === 0) {
      next.auteurs = "Sélectionnez au moins un auteur.";
    }
    if (!apiMode && !payload.langue) {
      next.langue = "La langue est obligatoire.";
    }
    if (storeError?.match(/fichier|format|50 Mo/i)) next.fichier = storeError;
    if (storeError?.match(/auteur/i)) next.auteurs = storeError;
    if (storeError?.match(/URL/i)) next.urlExterne = storeError;
    if (storeError?.match(/ISBN/i)) next.isbn = storeError;
    if (storeError?.match(/année/i)) next.annee = storeError;
    if (storeError?.match(/pages/i)) next.pages = storeError;
    setErrors(next);
    return !storeError;
  }, [
    titre,
    auteurIds,
    fichierLivre,
    langue,
    bibliothequesIds,
    typeLivre,
    urlExterneLivre,
    apiMode,
    annee,
    nbPages,
    categoriesIds,
    isbn,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const couvertureFile =
      couverturePreview?.startsWith("data:")
        ? dataUrlToFile(couverturePreview, "couverture.jpg")
        : undefined;

    setSubmitting(true);
    const result = await createLivrePersisted({
      titre: titre.trim(),
      auteurIds,
      categorieIds: categoriesIds,
      bibliothequeIds: bibliothequesIds,
      langue,
      type_livre: typeLivre,
      urlExterneLivre: urlExterneLivre.trim() || undefined,
      anneePublication: annee === "" ? null : Number(annee),
      nombrePages: nbPages === "" ? null : Number(nbPages),
      couvertureFile,
      fichier: typeLivre === "INTERNE" ? fichierLivre ?? undefined : undefined,
      isbn: isbn.trim() || undefined,
      resume: resume.trim() || undefined,
      is_downloadable: typeLivre === "INTERNE" ? isDownloadable : undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      if (result.error.match(/ISBN/i)) {
        setErrors((prev) => ({ ...prev, isbn: result.error }));
      }
      toast.error(result.error);
      return;
    }
    onSuccess(result.created);
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
            {apiMode && (
              <div>
                <Label htmlFor="livre-type">Type de livre *</Label>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="livre-type"
                      checked={typeLivre === "INTERNE"}
                      onChange={() => setTypeLivre("INTERNE")}
                    />
                    Interne (fichier PDF/EPUB/MOBI)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="livre-type"
                      checked={typeLivre === "EXTERNE"}
                      onChange={() => setTypeLivre("EXTERNE")}
                    />
                    Externe (lien URL)
                  </label>
                </div>
              </div>
            )}
            {apiMode && typeLivre === "EXTERNE" && (
              <div>
                <Label htmlFor="livre-url-ext">URL externe du livre *</Label>
                <Input
                  id="livre-url-ext"
                  type="url"
                  placeholder="https://…"
                  value={urlExterneLivre}
                  onChange={(e) => setUrlExterneLivre(e.target.value)}
                  error={!!errors.urlExterne}
                />
                {errors.urlExterne && (
                  <p className="mt-1.5 text-xs text-error-500">
                    {errors.urlExterne}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-gray-400">
                  Envoyé comme <code>url_externe_livre</code> — pas de fichier
                  ni bibliothèque INTERNE requise.
                </p>
              </div>
            )}
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
              <MultiSelect
                label="Auteur(s) *"
                options={multiAuteursOptions}
                onChange={setAuteurIds}
              />
              {errors.auteurs && (
                <p className="mt-1.5 text-xs text-error-500">{errors.auteurs}</p>
              )}
              {multiAuteursOptions.length === 0 && (
                <p className="mt-1.5 text-xs text-warning-600 dark:text-warning-400">
                  Aucun auteur chargé.{" "}
                  <Link
                    href="/admin/auteurs"
                    className="font-medium underline"
                  >
                    Créer un auteur
                  </Link>{" "}
                  puis rouvrez ce formulaire.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="livre-isbn">ISBN</Label>
                <Input
                  id="livre-isbn"
                  type="text"
                  placeholder="978-…"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  error={!!errors.isbn}
                />
                {errors.isbn && (
                  <p className="mt-1.5 text-xs text-error-500">{errors.isbn}</p>
                )}
              </div>
              <div>
                <Label htmlFor="livre-langue">
                  Langue{apiMode ? "" : " *"}
                </Label>
                <Select
                  placeholder={apiMode ? "Français" : "Choisir"}
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
              <Input
                id="livre-annee"
                type="number"
                min="1"
                placeholder="2024"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                error={!!errors.annee}
              />
              {errors.annee && (
                <p className="mt-1.5 text-xs text-error-500">{errors.annee}</p>
              )}
            </div>
            <div>
              <Label htmlFor="livre-pages">Nombre de pages</Label>
              <Input
                id="livre-pages"
                type="number"
                min="1"
                placeholder="320"
                value={nbPages}
                onChange={(e) => setNbPages(e.target.value)}
                error={!!errors.pages}
              />
              {errors.pages && (
                <p className="mt-1.5 text-xs text-error-500">{errors.pages}</p>
              )}
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

          {(!apiMode || typeLivre === "INTERNE") && (
          <div>
            <Label>Fichier du livre *</Label>
            <p className="mb-2 text-[11px] text-gray-400">
              Champ <code>file</code> — PDF, EPUB ou MOBI (max 50 Mo).
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
          )}

          {apiMode && typeLivre === "INTERNE" && (
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
          )}

          <div>
            <MultiSelect
              label="Catégorie(s)"
              options={multiCategoriesOptions}
              onChange={setCategoriesIds}
            />
          </div>

          {(!apiMode || typeLivre === "INTERNE") && (
            <div>
              <MultiSelect
                label="Bibliothèque(s)"
                options={multiBibliothequesOptions}
                onChange={setBibliothequesIds}
              />
              {apiMode && (
                <p className="mt-1 text-[11px] text-gray-400">
                  Optionnel — association après création du livre.
                </p>
              )}
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            Le livre est publié par défaut à la création. Utilisez « Archiver » depuis le catalogue pour le masquer.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-white/[0.06]">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.97] disabled:opacity-60"
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
