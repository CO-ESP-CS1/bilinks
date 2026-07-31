"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  type MockUtilisateur,
  type RoleUser,
} from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/pagination";
import { useAuth } from "@/context/AuthContext";
import { useAdminPageSearch } from "@/context/AdminPageSearchContext";
import {
  deleteUserPersisted,
  fetchUsersPersisted,
  toggleUserBanPersisted,
  updateUserPersisted,
} from "@/lib/users-store";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EyeIcon, GroupIcon, LockIcon, PencilIcon, ShootingStarIcon, TrashBinIcon } from "@/icons";

const AVATAR_PALETTE = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
] as const;

function couleurAvatar(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]!;
}

function initiales(nom: string, prenom: string): string {
  const a = (prenom.trim()[0] ?? "").toUpperCase();
  const b = (nom.trim()[0] ?? "").toUpperCase();
  return `${a}${b}` || "?";
}

function formatEntier(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

type FiltreRole = "tous" | "user" | "admin";
type FiltreStatut = "tous" | "actif" | "banni" | "pending";
type FiltreAbonnement = "tous" | "abonne" | "non";

type DialogCible = {
  user: MockUtilisateur;
  type: "ban" | "supprimer";
};

const selectBaseClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function UsersStatsSkeleton() {
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

function UsersTableSkeleton() {
  return (
    <div
      className="overflow-x-auto"
      aria-busy="true"
      aria-label="Chargement des utilisateurs"
    >
      <div className="min-w-[1100px]">
        <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          {Array.from({ length: 9 }).map((_, i) => (
            <TextSkeleton key={i} className="h-4 w-14" />
          ))}
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <TextSkeleton className="h-10 w-10 shrink-0 rounded-full" />
              <TextSkeleton className="h-4 w-28" />
              <TextSkeleton className="h-4 w-36" />
              <TextSkeleton className="h-4 w-24" />
              <TextSkeleton className="h-6 w-16 rounded-full" />
              <TextSkeleton className="h-6 w-14 rounded-full" />
              <TextSkeleton className="h-4 w-10" />
              <TextSkeleton className="h-6 w-20 rounded-full" />
              <div className="flex gap-1">
                <TextSkeleton className="h-9 w-9 rounded-lg" />
                <TextSkeleton className="h-9 w-9 rounded-lg" />
                <TextSkeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type UserFormState = {
  prenom: string;
  nom: string;
  email: string;
  ecole: string;
  niveau: string;
  role: RoleUser;
  points: string;
  abonnementActif: boolean;
};

const emptyForm: UserFormState = {
  prenom: "",
  nom: "",
  email: "",
  ecole: "",
  niveau: "",
  role: "USER",
  points: "0",
  abonnementActif: false,
};

function UserFormFields({
  form,
  setForm,
}: {
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="uf-prenom">Prénom *</Label>
          <Input
            id="uf-prenom"
            required
            value={form.prenom}
            onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="uf-nom">Nom *</Label>
          <Input
            id="uf-nom"
            required
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="uf-email">E-mail *</Label>
        <Input
          id="uf-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="uf-ecole">École</Label>
          <Input
            id="uf-ecole"
            value={form.ecole}
            onChange={(e) => setForm((f) => ({ ...f, ecole: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="uf-niveau">Niveau</Label>
          <Input
            id="uf-niveau"
            value={form.niveau}
            onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="uf-role">Rôle</Label>
          <select
            id="uf-role"
            className={selectBaseClass}
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as RoleUser }))
            }
          >
            <option value="USER">Utilisateur</option>
            <option value="ADMIN">Admin (app)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="uf-points">Points</Label>
          <Input
            id="uf-points"
            type="number"
            min="0"
            value={form.points}
            onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={form.abonnementActif}
          onChange={(e) =>
            setForm((f) => ({ ...f, abonnementActif: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        Abonnement actif
      </label>
    </>
  );
}

export default function UtilisateursPage() {
  const router = useRouter();
  const [utilisateurs, setUtilisateurs] = useState<MockUtilisateur[]>([]);
  const apiMode = isApiConfigured();
  const { query: search, setQuery: setSearch } = useAdminPageSearch({
    placeholder: "Rechercher par nom ou e-mail…",
  });
  const [filtreRole, setFiltreRole] = useState<FiltreRole>("tous");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreAbonnement, setFiltreAbonnement] =
    useState<FiltreAbonnement>("tous");
  const [usersPage, setUsersPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [editCible, setEditCible] = useState<MockUtilisateur | null>(null);
  const [dialogCible, setDialogCible] = useState<DialogCible | null>(null);
  const [raisonBan, setRaisonBan] = useState("");
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const { admin: currentAdmin } = useAuth();

  const recharger = useCallback(async () => {
    setLoadingUsers(true);
    try {
      if (apiMode) {
        const statut =
          filtreStatut === "actif"
            ? ("ACTIF" as const)
            : filtreStatut === "banni"
              ? ("BANNI" as const)
              : filtreStatut === "pending"
                ? ("PENDING" as const)
                : undefined;
        const role =
          filtreRole === "user"
            ? ("USER" as const)
            : filtreRole === "admin"
              ? ("ADMIN" as const)
              : undefined;
        const abonnement_actif =
          filtreAbonnement === "abonne"
            ? true
            : filtreAbonnement === "non"
              ? false
              : undefined;
        const { users, meta } = await fetchUsersPersisted({
          statut,
          role,
          q: search.trim() || undefined,
          abonnement_actif,
          page: usersPage,
          limit: 20,
        });
        setUtilisateurs(users);
        setUsersMeta(meta);
        return;
      }
      const { users } = await fetchUsersPersisted();
      setUtilisateurs(users);
      setUsersMeta(null);
    } finally {
      setLoadingUsers(false);
    }
  }, [apiMode, filtreStatut, filtreRole, filtreAbonnement, search, usersPage]);

  useEffect(() => {
    setUsersPage(1);
  }, [filtreStatut, filtreRole, filtreAbonnement, search]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        void recharger();
      },
      apiMode && search.trim() ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [recharger, apiMode, search]);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setFiltreRole("tous");
    setFiltreStatut("tous");
    setFiltreAbonnement("tous");
  }, [setSearch]);

  const stats = useMemo(() => {
    const actifs = utilisateurs.filter((u) => u.statut === "ACTIF").length;
    const bannis = utilisateurs.filter((u) => u.statut === "BANNI").length;
    const admins = utilisateurs.filter((u) => u.role === "ADMIN").length;
    return { actifs, bannis, admins };
  }, [utilisateurs]);

  const listeFiltree = useMemo(() => {
    const q = apiMode ? "" : search.trim().toLowerCase();
    return utilisateurs.filter((u) => {
      const nomComplet = `${u.prenom} ${u.nom}`.toLowerCase();
      const matchSearch =
        !q ||
        nomComplet.includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole =
        apiMode ||
        filtreRole === "tous" ||
        (filtreRole === "user" && u.role === "USER") ||
        (filtreRole === "admin" && u.role === "ADMIN");
      const matchStatut =
        apiMode ||
        filtreStatut === "tous" ||
        (filtreStatut === "actif" && u.statut === "ACTIF") ||
        (filtreStatut === "pending" && u.statut === "PENDING") ||
        (filtreStatut === "banni" && u.statut === "BANNI");
      const matchAbo =
        apiMode ||
        filtreAbonnement === "tous" ||
        (filtreAbonnement === "abonne" && u.abonnementActif) ||
        (filtreAbonnement === "non" && !u.abonnementActif);
      return matchSearch && matchRole && matchStatut && matchAbo;
    });
  }, [utilisateurs, search, filtreRole, filtreStatut, filtreAbonnement, apiMode]);

  const showPageSkeleton = apiMode && loadingUsers && utilisateurs.length === 0;
  const listRefreshing = apiMode && loadingUsers && utilisateurs.length > 0;

  const ouvrirEdit = (u: MockUtilisateur) => {
    setEditCible(u);
    setForm({
      prenom: u.prenom,
      nom: u.nom,
      email: u.email,
      ecole: u.ecole,
      niveau: u.niveau,
      role: u.role,
      points: String(u.points),
      abonnementActif: u.abonnementActif,
    });
  };

  const soumettreForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCible) return;
    const points = parseInt(form.points, 10) || 0;
    const payload = {
      prenom: form.prenom,
      nom: form.nom,
      email: form.email,
      ecole: form.ecole,
      niveau: form.niveau,
      role: form.role,
      points,
      abonnementActif: form.abonnementActif,
    };

    const result = await updateUserPersisted(editCible.id, payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Utilisateur mis à jour.");
    setEditCible(null);
    setForm(emptyForm);
    await recharger();
  };

  const confirmerDialog = async () => {
    if (!dialogCible) return;
    const { user, type } = dialogCible;
    if (type === "ban") {
      if (
        apiMode &&
        currentAdmin?.id === user.id &&
        user.statut === "ACTIF"
      ) {
        toast.error("Vous ne pouvez pas vous bannir vous-même.");
        setDialogCible(null);
        setRaisonBan("");
        return;
      }
      const result = await toggleUserBanPersisted(
        user.id,
        user.statut === "ACTIF" ? raisonBan : undefined,
        user.statut
      );
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          result.user.statut === "BANNI"
            ? `${user.prenom} ${user.nom} a été banni.`
            : `${user.prenom} ${user.nom} a été réactivé.`
        );
      }
      setRaisonBan("");
    } else {
      const result = await deleteUserPersisted(user.id);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          `${user.prenom} ${user.nom} a été supprimé (soft delete).`
        );
      }
    }
    setDialogCible(null);
    await recharger();
  };

  return (
    <div className="space-y-6" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Utilisateurs")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Gestion des utilisateurs
          </h1>
          {showPageSkeleton ? (
            <UsersStatsSkeleton />
          ) : (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Enregistrés :
              </span>{" "}
              {apiMode && usersMeta ? usersMeta.total : utilisateurs.length}
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Actifs :
              </span>{" "}
              {stats.actifs}
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Bannis :
              </span>{" "}
              {stats.bannis}
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Admins app :
              </span>{" "}
              {stats.admins}
            </span>
          </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {apiMode
              ? "Recherche, filtres et modération des comptes inscrits via l'application."
              : "Configurez NEXT_PUBLIC_API_BASE_URL pour charger les utilisateurs depuis le backend."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:flex-wrap lg:items-end">
        <div className="w-full min-w-[160px] sm:w-44">
          <Label htmlFor="filtre-role">Rôle</Label>
          <select
            id="filtre-role"
            className={selectBaseClass}
            value={filtreRole}
            onChange={(e) => setFiltreRole(e.target.value as FiltreRole)}
          >
            <option value="tous">Tous</option>
            <option value="user">Utilisateurs</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div className="w-full min-w-[160px] sm:w-44">
          <Label htmlFor="filtre-statut-user">Statut</Label>
          <select
            id="filtre-statut-user"
            className={selectBaseClass}
            value={filtreStatut}
            onChange={(e) =>
              setFiltreStatut(e.target.value as FiltreStatut)
            }
          >
            <option value="tous">Tous</option>
            <option value="actif">Actifs</option>
            {apiMode && <option value="pending">En attente (PENDING)</option>}
            <option value="banni">Bannis</option>
          </select>
        </div>
        <div className="w-full min-w-[180px] sm:w-48">
          <Label htmlFor="filtre-abo">Abonnement</Label>
          <select
            id="filtre-abo"
            className={selectBaseClass}
            value={filtreAbonnement}
            onChange={(e) =>
              setFiltreAbonnement(e.target.value as FiltreAbonnement)
            }
          >
            <option value="tous">Tous</option>
            <option value="abonne">Abonnés</option>
            <option value="non">Non abonnés</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {showPageSkeleton ? (
          <UsersTableSkeleton />
        ) : !loadingUsers && listeFiltree.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<GroupIcon className="size-7" />}
              message="Aucun utilisateur trouvé pour ce filtre."
              onReset={reinitialiserFiltres}
            />
          </div>
        ) : (
          <div
            className={
              listRefreshing
                ? "pointer-events-none opacity-60 transition-opacity"
                : "transition-opacity"
            }
          >
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Avatar",
                      "Nom complet",
                      "E-mail",
                      "École / Niveau",
                      "Rôle",
                      "Statut",
                      "Points",
                      "Abonnement",
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
                  {listeFiltree.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="px-4 py-3 text-start">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${couleurAvatar(u.id)}`}
                        >
                          {initiales(u.nom, u.prenom)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {u.prenom} {u.nom}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {u.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        <span className="block">{u.ecole}</span>
                        <span className="text-theme-xs text-gray-500">
                          {u.niveau}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {u.role === "ADMIN" ? (
                          <Badge color="info" size="sm" variant="light">
                            Admin
                          </Badge>
                        ) : (
                          <Badge color="light" size="sm" variant="light">
                            Utilisateur
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {u.statut === "ACTIF" && (
                          <Badge color="success" size="sm" variant="light">
                            Actif
                          </Badge>
                        )}
                        {u.statut === "PENDING" && (
                          <Badge color="warning" size="sm" variant="light">
                            En attente
                          </Badge>
                        )}
                        {u.statut === "BANNI" && (
                          <Badge color="error" size="sm" variant="light">
                            Banni
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-amber-500">
                        ★ {formatEntier(u.points)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {u.abonnementActif ? (
                          <Badge color="success" size="sm" variant="light">
                            Abonné
                          </Badge>
                        ) : (
                          <Badge color="light" size="sm" variant="light">
                            Non abonné
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            title="Voir le profil"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                            onClick={() =>
                              router.push(`/admin/utilisateurs/${u.id}`)
                            }
                          >
                            <EyeIcon className="size-5" />
                          </button>
                          {!apiMode && (
                            <button
                              type="button"
                              title="Modifier"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                              onClick={() => ouvrirEdit(u)}
                            >
                              <PencilIcon className="size-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title={
                              u.statut === "BANNI" ? "Réactiver" : "Bannir"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-warning-500 dark:hover:bg-white/5"
                            disabled={apiMode && currentAdmin?.id === u.id}
                            onClick={() => {
                              setRaisonBan("");
                              setDialogCible({ user: u, type: "ban" });
                            }}
                          >
                            <LockIcon className="size-5" />
                          </button>
                          {!apiMode && (
                            <button
                              type="button"
                              title="Supprimer"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/5"
                              onClick={() =>
                                setDialogCible({ user: u, type: "supprimer" })
                              }
                            >
                              <TrashBinIcon className="size-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Abonnement"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                            onClick={() =>
                              router.push(
                                `/admin/utilisateurs/${u.id}/abonnement`
                              )
                            }
                          >
                            <ShootingStarIcon className="size-5" />
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
        )}
      </div>

      {apiMode && usersMeta && usersMeta.total_pages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {usersMeta.page} / {usersMeta.total_pages} · {usersMeta.total}{" "}
            utilisateur{usersMeta.total > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={usersPage <= 1 || loadingUsers}
              onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                usersPage >= usersMeta.total_pages || loadingUsers
              }
              onClick={() => setUsersPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={editCible != null}
        onClose={() => {
          setEditCible(null);
          setForm(emptyForm);
        }}
        className="max-w-lg p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Modifier l&apos;utilisateur
        </h2>
        <form onSubmit={soumettreForm} className="mt-6 space-y-4">
          <UserFormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                setEditCible(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={dialogCible != null}
        onClose={() => {
          setDialogCible(null);
          setRaisonBan("");
        }}
        onConfirm={confirmerDialog}
        title={
          dialogCible?.type === "supprimer"
            ? "Supprimer cet utilisateur ?"
            : dialogCible?.user.statut === "ACTIF"
              ? "Bannir cet utilisateur ?"
              : "Réactiver cet utilisateur ?"
        }
        description={
          dialogCible ? (
            dialogCible.type === "supprimer" ? (
              <>
                « {dialogCible.user.prenom} {dialogCible.user.nom} » sera
                marqué comme supprimé (soft delete, données conservées).
              </>
            ) : dialogCible.user.statut === "ACTIF" ? (
              <>
                <p>
                  « {dialogCible.user.prenom} {dialogCible.user.nom} » ne pourra
                  plus accéder à l&apos;application.
                </p>
                {apiMode && (
                  <div className="mt-4">
                    <Label htmlFor="ban-raison">Raison (optionnelle)</Label>
                    <Input
                      id="ban-raison"
                      value={raisonBan}
                      onChange={(e) => setRaisonBan(e.target.value)}
                      placeholder="Ex. violation des conditions d’utilisation"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Journalisée côté serveur (non stockée en base).
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                « {dialogCible.user.prenom} {dialogCible.user.nom} » retrouvera
                l&apos;accès à l&apos;application.
              </>
            )
          ) : null
        }
        confirmLabel={
          dialogCible?.type === "supprimer"
            ? "Supprimer"
            : dialogCible?.user.statut === "ACTIF"
              ? "Bannir"
              : "Réactiver"
        }
        variant={
          dialogCible?.type === "supprimer" ||
          dialogCible?.user.statut === "ACTIF"
            ? "danger"
            : "primary"
        }
      />
    </div>
  );
}
