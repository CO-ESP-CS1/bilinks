"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type { MockCommentaire, StatutCommentaire } from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import {
  deleteCommentPersisted,
  fetchCommentsPersisted,
  moderateCommentPersisted,
  republishCommentPersisted,
} from "@/lib/comments-store";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatIcon } from "@/icons";
import { useAdminPageSearch } from "@/context/AdminPageSearchContext";

const LIMITE_APERCU = 100;

type FiltreStatut = "tous" | StatutCommentaire;

function formatDateHeure(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type DialogCible =
  | { type: "moderer"; commentaire: MockCommentaire }
  | { type: "republier"; commentaire: MockCommentaire }
  | { type: "supprimer"; commentaire: MockCommentaire };

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function CommentsStatsSkeleton() {
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"
      aria-busy="true"
      aria-label="Chargement des statistiques"
    >
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
              |
            </span>
          )}
          <TextSkeleton className="h-4 w-28" />
        </React.Fragment>
      ))}
    </div>
  );
}

function CommentsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
      aria-busy="true"
      aria-label="Chargement des commentaires"
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
            {Array.from({ length: 6 }).map((_, i) => (
              <TextSkeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <TextSkeleton className="h-4 w-24" />
                <TextSkeleton className="h-4 w-28" />
                <TextSkeleton className="h-12 w-48" />
                <TextSkeleton className="h-6 w-16 rounded-full" />
                <TextSkeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <TextSkeleton className="h-8 w-20 rounded-lg" />
                  <TextSkeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentairesPage() {
  const [commentaires, setCommentaires] = useState<MockCommentaire[]>([]);
  const { query: search, setQuery: setSearch } = useAdminPageSearch({
    placeholder: "Rechercher par contenu ou utilisateur…",
  });
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [loadingComments, setLoadingComments] = useState(true);
  const [dialog, setDialog] = useState<DialogCible | null>(null);
  const [confirmingDialog, setConfirmingDialog] = useState(false);
  const apiMode = isApiConfigured();

  const refresh = useCallback(async () => {
    setLoadingComments(true);
    try {
      const statut =
        apiMode && filtreStatut !== "tous" ? filtreStatut : undefined;
      setCommentaires(await fetchCommentsPersisted({ statut }));
    } finally {
      setLoadingComments(false);
    }
  }, [apiMode, filtreStatut]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setFiltreStatut("tous");
  }, [setSearch]);

  const stats = useMemo(() => {
    const total = commentaires.length;
    const publies = commentaires.filter((c) => c.statut === "PUBLIE").length;
    const aModerer = commentaires.filter((c) => c.statut === "MODERE").length;
    const supprimes = commentaires.filter(
      (c) => c.statut === "SUPPRIME"
    ).length;
    return { total, publies, aModerer, supprimes };
  }, [commentaires]);

  const listeFiltree = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commentaires.filter((c) => {
      const matchText =
        !q ||
        c.contenu.toLowerCase().includes(q) ||
        c.utilisateurNom.toLowerCase().includes(q);
      const matchStat =
        apiMode || filtreStatut === "tous" || c.statut === filtreStatut;
      return matchText && matchStat;
    });
  }, [commentaires, search, filtreStatut, apiMode]);

  const showPageSkeleton =
    apiMode && loadingComments && commentaires.length === 0;
  const listRefreshing = apiMode && loadingComments && commentaires.length > 0;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apresAction = async (message: string) => {
    await refresh();
    toast.success(message);
  };

  const moderer = async (id: string) => {
    const result = await moderateCommentPersisted(id);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    await apresAction("Commentaire modéré (statut MODERE).");
    return true;
  };

  const supprimer = async (id: string) => {
    const result = await deleteCommentPersisted(id);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    await apresAction(
      apiMode
        ? "Commentaire supprimé définitivement."
        : "Commentaire retiré de la liste."
    );
    return true;
  };

  const republier = async (id: string) => {
    const result = await republishCommentPersisted(id);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    await apresAction("Commentaire republié (statut PUBLIE).");
    return true;
  };

  const confirmerDialog = async () => {
    if (!dialog || confirmingDialog) return;
    setConfirmingDialog(true);
    try {
      let ok = false;
      if (dialog.type === "moderer") {
        ok = await moderer(dialog.commentaire.id);
      } else if (dialog.type === "republier") {
        ok = await republier(dialog.commentaire.id);
      } else {
        ok = await supprimer(dialog.commentaire.id);
      }
      if (ok) setDialog(null);
    } finally {
      setConfirmingDialog(false);
    }
  };

  const fermerDialog = () => {
    if (confirmingDialog) return;
    setDialog(null);
  };

  function afficherContenu(c: MockCommentaire) {
    const exp = expandedIds.has(c.id);
    if (c.contenu.length <= LIMITE_APERCU) {
      return <span className="whitespace-pre-wrap">{c.contenu}</span>;
    }
    if (exp) {
      return <span className="whitespace-pre-wrap">{c.contenu}</span>;
    }
    return (
      <span className="whitespace-pre-wrap">
        {c.contenu.slice(0, LIMITE_APERCU)}...
      </span>
    );
  }

  return (
    <div className="space-y-6" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Commentaires")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Modération des commentaires
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Publier, modérer ou supprimer les avis des lecteurs.
        </p>
        {showPageSkeleton ? (
          <CommentsStatsSkeleton />
        ) : (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              Total :
            </span>{" "}
            {stats.total}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              Publiés :
            </span>{" "}
            {stats.publies}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              À modérer :
            </span>{" "}
            {stats.aModerer}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              Supprimés :
            </span>{" "}
            {stats.supprimes}
          </span>
        </div>
        )}
      </div>

      <div className="rounded-xl border border-blue-light-500/30 bg-blue-light-50 p-4 text-sm text-blue-light-800 dark:border-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-200">
        <strong>MODERE</strong> = commentaire masqué aux utilisateurs mais
        conservé en base. <strong>SUPPRIME</strong> = commentaire définitivement
        effacé côté utilisateur (la ligne reste en base pour l&apos;historique
        admin).
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
        <div className="w-full min-w-[200px] sm:w-56">
          <Label htmlFor="filtre-statut-com">Statut</Label>
          <select
            id="filtre-statut-com"
            className={selectClass}
            value={filtreStatut}
            onChange={(e) =>
              setFiltreStatut(e.target.value as FiltreStatut)
            }
          >
            <option value="tous">Tous</option>
            <option value="PUBLIE">Publiés</option>
            <option value="MODERE">À modérer</option>
            <option value="SUPPRIME">Supprimés</option>
          </select>
        </div>
      </div>

      {showPageSkeleton ? (
        <CommentsTableSkeleton />
      ) : !loadingComments && listeFiltree.length === 0 ? (
        <EmptyState
          icon={<ChatIcon className="size-7" />}
          message="Aucun commentaire trouvé pour ce filtre."
          onReset={reinitialiserFiltres}
        />
      ) : (
        <div
          className={
            listRefreshing
              ? "pointer-events-none opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Utilisateur",
                      "Livre concerné",
                      "Contenu",
                      "Statut",
                      "Date",
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
                  {listeFiltree.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {c.utilisateurNom}
                      </TableCell>
                      <TableCell className="max-w-[180px] px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {c.livreTitre}
                      </TableCell>
                      <TableCell className="max-w-md px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                        <div className="space-y-2">
                          {afficherContenu(c)}
                          {c.contenu.length > LIMITE_APERCU && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(c.id)}
                              className="text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                            >
                              {expandedIds.has(c.id)
                                ? "Réduire"
                                : "Voir tout"}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {c.statut === "PUBLIE" && (
                          <Badge color="success" size="sm" variant="light">
                            Publié
                          </Badge>
                        )}
                        {c.statut === "MODERE" && (
                          <Badge color="warning" size="sm" variant="light">
                            Modéré
                          </Badge>
                        )}
                        {c.statut === "SUPPRIME" && (
                          <Badge color="error" size="sm" variant="light">
                            Supprimé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {formatDateHeure(c.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          {c.statut === "PUBLIE" && (
                            <>
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "moderer", commentaire: c })
                                }
                                className="rounded-lg bg-warning-500/15 px-3 py-1.5 text-theme-xs font-medium text-warning-700 hover:bg-warning-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-orange-300"
                              >
                                Modérer
                              </button>
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "supprimer", commentaire: c })
                                }
                                className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                          {c.statut === "MODERE" && (
                            <>
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "republier", commentaire: c })
                                }
                                className="rounded-lg bg-success-500/15 px-3 py-1.5 text-theme-xs font-medium text-success-700 hover:bg-success-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-success-400"
                              >
                                Republier
                              </button>
                              <button
                                type="button"
                                disabled={confirmingDialog}
                                onClick={() =>
                                  setDialog({ type: "supprimer", commentaire: c })
                                }
                                className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={dialog != null}
        onClose={fermerDialog}
        onConfirm={confirmerDialog}
        confirming={confirmingDialog}
        title={
          dialog?.type === "moderer"
            ? "Modérer ce commentaire ?"
            : dialog?.type === "republier"
              ? "Republier ce commentaire ?"
              : "Supprimer ce commentaire ?"
        }
        description={
          dialog ? (
            <>
              Commentaire de <strong>{dialog.commentaire.utilisateurNom}</strong>{" "}
              sur « {dialog.commentaire.livreTitre} ».
              {dialog.type === "moderer" ? (
                <>
                  {" "}
                  Le commentaire sera masqué aux utilisateurs (statut{" "}
                  <strong>MODERE</strong>) mais conservé en base.
                </>
              ) : dialog.type === "republier" ? (
                <>
                  {" "}
                  Le commentaire redeviendra visible par les lecteurs (statut{" "}
                  <strong>PUBLIE</strong>).
                </>
              ) : (
                <>
                  {" "}
                  Le commentaire sera{" "}
                  {apiMode
                    ? "supprimé définitivement"
                    : "retiré de la liste"}{" "}
                  (statut <strong>SUPPRIME</strong>).
                </>
              )}
            </>
          ) : null
        }
        confirmLabel={
          dialog?.type === "moderer"
            ? "Modérer"
            : dialog?.type === "republier"
              ? "Republier"
              : "Supprimer"
        }
        variant={
          dialog?.type === "moderer"
            ? "warning"
            : dialog?.type === "republier"
              ? "primary"
              : "danger"
        }
      />

    </div>
  );
}
