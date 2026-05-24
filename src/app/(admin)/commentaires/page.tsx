"use client";

import React, { useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockCommentaires,
  type MockCommentaire,
  type StatutCommentaire,
} from "@/lib/mock-data";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatIcon } from "@/icons";

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

export default function CommentairesPage() {
  const [commentaires, setCommentaires] = useState<MockCommentaire[]>(() =>
    mockCommentaires.map((c) => ({ ...c }))
  );
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [champRechercheKey, setChampRechercheKey] = useState(0);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setFiltreStatut("tous");
    setChampRechercheKey((k) => k + 1);
  }, []);

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
        filtreStatut === "tous" || c.statut === filtreStatut;
      return matchText && matchStat;
    });
  }, [commentaires, search, filtreStatut]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const majStatut = (id: string, statut: StatutCommentaire, message: string) => {
    setCommentaires((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut } : c))
    );
    toast.success(message);
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
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Commentaires")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Modération des commentaires
        </h1>
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
      </div>

      <div className="rounded-xl border border-blue-light-500/30 bg-blue-light-50 p-4 text-sm text-blue-light-800 dark:border-blue-light-500/20 dark:bg-blue-light-500/10 dark:text-blue-light-200">
        <strong>MODERE</strong> = commentaire masqué aux utilisateurs mais
        conservé en base. <strong>SUPPRIME</strong> = commentaire définitivement
        effacé côté utilisateur (la ligne reste en base pour l&apos;historique
        admin).
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="search-comment">Rechercher</Label>
          <Input
            key={champRechercheKey}
            id="search-comment"
            type="text"
            placeholder="Contenu ou nom d&apos;utilisateur…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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

      {listeFiltree.length === 0 ? (
        <EmptyState
          icon={<ChatIcon className="size-7" />}
          message="Aucun commentaire trouvé pour ce filtre."
          onReset={reinitialiserFiltres}
        />
      ) : (
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
                                onClick={() =>
                                  majStatut(
                                    c.id,
                                    "MODERE",
                                    "Commentaire passé en modération."
                                  )
                                }
                                className="rounded-lg bg-warning-500/15 px-3 py-1.5 text-theme-xs font-medium text-warning-700 hover:bg-warning-500/25 dark:text-orange-300"
                              >
                                Modérer
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  majStatut(
                                    c.id,
                                    "SUPPRIME",
                                    "Commentaire supprimé (conservé pour l'historique)."
                                  )
                                }
                                className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 dark:text-error-400"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                          {c.statut === "MODERE" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  majStatut(
                                    c.id,
                                    "PUBLIE",
                                    "Commentaire republié."
                                  )
                                }
                                className="rounded-lg bg-success-500/15 px-3 py-1.5 text-theme-xs font-medium text-success-700 hover:bg-success-500/25 dark:text-success-400"
                              >
                                Republier
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  majStatut(
                                    c.id,
                                    "SUPPRIME",
                                    "Commentaire supprimé (conservé pour l'historique)."
                                  )
                                }
                                className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 dark:text-error-400"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                          {c.statut === "SUPPRIME" && (
                            <button
                              type="button"
                              onClick={() =>
                                majStatut(
                                  c.id,
                                  "PUBLIE",
                                  "Commentaire restauré (republié)."
                                )
                              }
                              className="rounded-lg bg-brand-500/15 px-3 py-1.5 text-theme-xs font-medium text-brand-600 hover:bg-brand-500/25 dark:text-brand-400"
                            >
                              Restaurer
                            </button>
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
      )}

    </div>
  );
}
