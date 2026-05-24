"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockKPIs,
  type MockUtilisateur,
  type RoleUser,
} from "@/lib/mock-data";
import {
  createUser,
  deleteUser,
  getAllUsers,
  toggleUserBan,
  updateUser,
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
type FiltreStatut = "tous" | "actif" | "banni";
type FiltreAbonnement = "tous" | "abonne" | "non";

type DialogCible = {
  user: MockUtilisateur;
  type: "ban" | "supprimer";
};

const selectBaseClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

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
  const [utilisateurs, setUtilisateurs] = useState<MockUtilisateur[]>(() =>
    getAllUsers()
  );
  const [search, setSearch] = useState("");
  const [filtreRole, setFiltreRole] = useState<FiltreRole>("tous");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreAbonnement, setFiltreAbonnement] =
    useState<FiltreAbonnement>("tous");

  const [modalCreate, setModalCreate] = useState(false);
  const [editCible, setEditCible] = useState<MockUtilisateur | null>(null);
  const [dialogCible, setDialogCible] = useState<DialogCible | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const recharger = useCallback(() => {
    setUtilisateurs(getAllUsers());
  }, []);

  const reinitialiserFiltres = useCallback(() => {
    setSearch("");
    setFiltreRole("tous");
    setFiltreStatut("tous");
    setFiltreAbonnement("tous");
  }, []);

  const stats = useMemo(() => {
    const actifs = utilisateurs.filter((u) => u.statut === "ACTIF").length;
    const bannis = utilisateurs.filter((u) => u.statut === "BANNI").length;
    const admins = utilisateurs.filter((u) => u.role === "ADMIN").length;
    return { actifs, bannis, admins };
  }, [utilisateurs]);

  const listeFiltree = useMemo(() => {
    const q = search.trim().toLowerCase();
    return utilisateurs.filter((u) => {
      const nomComplet = `${u.prenom} ${u.nom}`.toLowerCase();
      const matchSearch =
        !q ||
        nomComplet.includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole =
        filtreRole === "tous" ||
        (filtreRole === "user" && u.role === "USER") ||
        (filtreRole === "admin" && u.role === "ADMIN");
      const matchStatut =
        filtreStatut === "tous" ||
        (filtreStatut === "actif" && u.statut === "ACTIF") ||
        (filtreStatut === "banni" && u.statut === "BANNI");
      const matchAbo =
        filtreAbonnement === "tous" ||
        (filtreAbonnement === "abonne" && u.abonnementActif) ||
        (filtreAbonnement === "non" && !u.abonnementActif);
      return matchSearch && matchRole && matchStatut && matchAbo;
    });
  }, [utilisateurs, search, filtreRole, filtreStatut, filtreAbonnement]);

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

  const soumettreForm = (e: React.FormEvent) => {
    e.preventDefault();
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

    if (editCible) {
      const result = updateUser(editCible.id, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Utilisateur mis à jour.");
      setEditCible(null);
    } else {
      const result = createUser(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Utilisateur créé.");
      setModalCreate(false);
    }
    setForm(emptyForm);
    recharger();
  };

  const confirmerDialog = () => {
    if (!dialogCible) return;
    const { user, type } = dialogCible;
    if (type === "ban") {
      const result = toggleUserBan(user.id);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          result.user.statut === "BANNI"
            ? `${user.prenom} ${user.nom} a été banni.`
            : `${user.prenom} ${user.nom} a été réactivé.`
        );
      }
    } else {
      const result = deleteUser(user.id);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          `${user.prenom} ${user.nom} a été supprimé (soft delete).`
        );
      }
    }
    setDialogCible(null);
    recharger();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Utilisateurs")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Gestion des utilisateurs
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Enregistrés :
              </span>{" "}
              {utilisateurs.length}
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
          <p className="mt-1 text-xs text-gray-500">
            Plateforme (indicateurs) : {formatEntier(mockKPIs.totalUtilisateurs)}{" "}
            utilisateurs — données locales modifiables.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setModalCreate(true);
          }}
        >
          Nouvel utilisateur
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="search-users">Rechercher</Label>
          <Input
            id="search-users"
            type="text"
            placeholder="Nom ou e-mail…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        {listeFiltree.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<GroupIcon className="size-7" />}
              message="Aucun utilisateur trouvé pour ce filtre."
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
                        {u.statut === "ACTIF" ? (
                          <Badge color="success" size="sm" variant="light">
                            Actif
                          </Badge>
                        ) : (
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
                          <button
                            type="button"
                            title="Modifier"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                            onClick={() => ouvrirEdit(u)}
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            type="button"
                            title={
                              u.statut === "ACTIF" ? "Bannir" : "Réactiver"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-warning-500 dark:hover:bg-white/5"
                            onClick={() =>
                              setDialogCible({ user: u, type: "ban" })
                            }
                          >
                            <LockIcon className="size-5" />
                          </button>
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
        )}
      </div>

      <Modal
        isOpen={modalCreate}
        onClose={() => {
          setModalCreate(false);
          setForm(emptyForm);
        }}
        className="max-w-lg p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Nouvel utilisateur
        </h2>
        <form onSubmit={soumettreForm} className="mt-6 space-y-4">
          <UserFormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                setModalCreate(false);
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
              Créer
            </button>
          </div>
        </form>
      </Modal>

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
        onClose={() => setDialogCible(null)}
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
                « {dialogCible.user.prenom} {dialogCible.user.nom} » ne pourra
                plus accéder à l&apos;application.
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
