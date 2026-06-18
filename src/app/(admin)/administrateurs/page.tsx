"use client";

import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { useAuth } from "@/context/AuthContext";
import { fetchUsersPersisted } from "@/lib/users-store";
import type { MockUtilisateur } from "@/lib/mock-data";
import {
  getDisplayName,
  type AdminAccount,
} from "@/lib/auth/admin-auth";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LockIcon, PencilIcon, TrashBinIcon } from "@/icons";

type DialogCible = {
  admin: AdminAccount;
  type: "suspendre" | "supprimer";
};

function TextSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

function AdminsTableSkeleton({ withAvatar = false }: { withAvatar?: boolean }) {
  const cols = withAvatar ? 7 : 4;
  return (
    <div
      className="overflow-x-auto"
      aria-busy="true"
      aria-label="Chargement des administrateurs"
    >
      <div className="min-w-[800px]">
        <div className="flex gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          {Array.from({ length: cols }).map((_, i) => (
            <TextSkeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              {withAvatar && (
                <TextSkeleton className="h-10 w-10 shrink-0 rounded-full" />
              )}
              <TextSkeleton className="h-4 w-32" />
              <TextSkeleton className="h-4 w-40" />
              <TextSkeleton className="h-6 w-16 rounded-full" />
              {withAvatar ? (
                <>
                  <TextSkeleton className="h-6 w-14 rounded-full" />
                  <TextSkeleton className="h-4 w-24" />
                  <div className="flex gap-1">
                    <TextSkeleton className="h-9 w-9 rounded-lg" />
                    <TextSkeleton className="h-9 w-9 rounded-lg" />
                    <TextSkeleton className="h-9 w-9 rounded-lg" />
                  </div>
                </>
              ) : (
                <TextSkeleton className="h-4 w-24" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdministrateursPage() {
  const apiMode = isApiConfigured();
  const {
    admins,
    addAdmin,
    editAdmin,
    suspendAdmin,
    removeAdmin,
    admin: current,
    refresh,
  } = useAuth();

  const [apiAdmins, setApiAdmins] = useState<MockUtilisateur[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(apiMode);
  const [modalCreate, setModalCreate] = useState(false);
  const [editCible, setEditCible] = useState<AdminAccount | null>(null);
  const [dialogCible, setDialogCible] = useState<DialogCible | null>(null);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editPrenom, setEditPrenom] = useState("");
  const [editNom, setEditNom] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFonction, setEditFonction] = useState("");
  const [editLocalisation, setEditLocalisation] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadApiAdmins = useCallback(async () => {
    if (!apiMode || !hasApiSession()) {
      setApiAdmins([]);
      setLoadingAdmins(false);
      return;
    }
    setLoadingAdmins(true);
    try {
      const result = await fetchUsersPersisted({ role: "ADMIN", limit: 100 });
      setApiAdmins(result.users);
    } finally {
      setLoadingAdmins(false);
    }
  }, [apiMode]);

  useEffect(() => {
    if (apiMode) {
      void loadApiAdmins();
    }
  }, [apiMode, loadApiAdmins]);

  const reinitialiserCreate = useCallback(() => {
    setPrenom("");
    setNom("");
    setEmail("");
    setPassword("");
  }, []);

  const ouvrirEdit = useCallback((a: AdminAccount) => {
    setEditCible(a);
    setEditPrenom(a.prenom);
    setEditNom(a.nom);
    setEditEmail(a.email);
    setEditFonction(a.fonction);
    setEditLocalisation(a.localisation);
    setEditPassword("");
  }, []);

  const fermerEdit = useCallback(() => {
    setEditCible(null);
    setEditPassword("");
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (creatingAdmin) return;
    const fd = new FormData(e.currentTarget);
    setCreatingAdmin(true);
    try {
      const result = await addAdmin({
        prenom: String(fd.get("prenom") ?? prenom).trim(),
        nom: String(fd.get("nom") ?? nom).trim(),
        email: String(fd.get("email") ?? email).trim(),
        password: String(fd.get("password") ?? password),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Administrateur « ${getDisplayName(result.admin)} » créé.`);
      setModalCreate(false);
      reinitialiserCreate();
      if (apiMode) {
        await loadApiAdmins();
      }
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCible) return;
    const result = editAdmin(editCible.id, {
      prenom: editPrenom,
      nom: editNom,
      email: editEmail,
      fonction: editFonction,
      localisation: editLocalisation,
      ...(editPassword ? { password: editPassword } : {}),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Administrateur mis à jour.");
    fermerEdit();
  };

  const confirmerDialog = async () => {
    if (!dialogCible) return;
    const { admin: cible, type } = dialogCible;
    if (type === "suspendre") {
      const suspendre = cible.statut === "ACTIF";
      const result = await suspendAdmin(cible.id, suspendre);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(
          suspendre
            ? `${getDisplayName(cible)} a été suspendu.`
            : `${getDisplayName(cible)} a été réactivé.`
        );
      }
    } else {
      const result = removeAdmin(cible.id);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(`${getDisplayName(cible)} a été supprimé (soft delete).`);
      }
    }
    setDialogCible(null);
  };

  const colonnes = [
    "",
    "Nom",
    "E-mail",
    "Rôle",
    "Statut",
    "Créé le",
    "Actions",
  ];

  const showPageSkeleton = apiMode && loadingAdmins && apiAdmins.length === 0;
  const listRefreshing = apiMode && loadingAdmins && apiAdmins.length > 0;

  return (
    <div className="space-y-6" aria-busy={showPageSkeleton}>
      <Breadcrumb items={adminCrumb("Administrateurs")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Administrateurs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérer les comptes administrateurs de la plateforme.
          </p>
        </div>
        <Button onClick={() => setModalCreate(true)}>Créer un admin</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {showPageSkeleton ? (
          <AdminsTableSkeleton />
        ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {apiMode ? (
              !loadingAdmins && apiAdmins.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-gray-500">
                  Aucun administrateur.
                </p>
              ) : (
                <div
                  className={
                    listRefreshing
                      ? "pointer-events-none opacity-60 transition-opacity"
                      : "transition-opacity"
                  }
                >
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {["Nom", "E-mail", "Statut", "Inscrit le"].map((col) => (
                        <TableCell
                          key={col}
                          isHeader
                          className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500"
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {apiAdmins.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {a.prenom} {a.nom}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                          {a.email}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge color="success" size="sm" variant="light">
                            {a.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-500">
                          {a.dateInscription}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )
            ) : admins.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-500">
                Aucun administrateur.
              </p>
            ) : (
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {colonnes.map((col) => (
                      <TableCell
                        key={col}
                        isHeader
                        className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500"
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {admins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="px-4 py-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={a.avatarUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized={a.avatarUrl.startsWith("data:")}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {getDisplayName(a)}
                        {a.id === current?.id && (
                          <span className="ml-2 text-xs text-brand-500">
                            (vous)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                        {a.email}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {a.isSuperAdmin ? (
                          <Badge color="info" size="sm" variant="light">
                            Super admin
                          </Badge>
                        ) : (
                          <Badge color="light" size="sm" variant="light">
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {a.statut === "ACTIF" ? (
                          <Badge color="success" size="sm" variant="light">
                            Actif
                          </Badge>
                        ) : (
                          <Badge color="error" size="sm" variant="light">
                            Suspendu
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-500">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            title="Modifier"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/5"
                            onClick={() => ouvrirEdit(a)}
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          {!a.isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                title={
                                  a.statut === "ACTIF"
                                    ? "Suspendre"
                                    : "Réactiver"
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-warning-500 dark:hover:bg-white/5"
                                onClick={() =>
                                  setDialogCible({
                                    admin: a,
                                    type: "suspendre",
                                  })
                                }
                                disabled={a.id === current?.id}
                              >
                                <LockIcon className="size-5" />
                              </button>
                              <button
                                type="button"
                                title="Supprimer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/5"
                                onClick={() =>
                                  setDialogCible({
                                    admin: a,
                                    type: "supprimer",
                                  })
                                }
                                disabled={a.id === current?.id}
                              >
                                <TrashBinIcon className="size-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        )}
      </div>

      <Modal
        isOpen={modalCreate}
        onClose={() => {
          if (creatingAdmin) return;
          setModalCreate(false);
          reinitialiserCreate();
        }}
        className="max-w-md p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Nouvel administrateur
        </h2>
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-prenom">Prénom</Label>
              <Input
                id="new-prenom"
                name="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-nom">Nom</Label>
              <Input
                id="new-nom"
                name="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="new-email">E-mail *</Label>
            <Input
              id="new-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-password">Mot de passe *</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              placeholder={apiMode ? "8 caractères minimum" : "6 caractères minimum"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              disabled={creatingAdmin}
              onClick={() => {
                setModalCreate(false);
                reinitialiserCreate();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creatingAdmin}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingAdmin ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Création…
                </>
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editCible != null}
        onClose={fermerEdit}
        className="max-w-md p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Modifier l&apos;administrateur
        </h2>
        {editCible && (
          <form onSubmit={handleEdit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-prenom">Prénom</Label>
                <Input
                  id="edit-prenom"
                  value={editPrenom}
                  onChange={(e) => setEditPrenom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-nom">Nom</Label>
                <Input
                  id="edit-nom"
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={editCible.isSuperAdmin}
              />
            </div>
            <div>
              <Label htmlFor="edit-fonction">Fonction</Label>
              <Input
                id="edit-fonction"
                value={editFonction}
                onChange={(e) => setEditFonction(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-loc">Localisation</Label>
              <Input
                id="edit-loc"
                value={editLocalisation}
                onChange={(e) => setEditLocalisation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Nouveau mot de passe</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Laisser vide pour ne pas changer"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={fermerEdit}
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
        )}
      </Modal>

      <ConfirmDialog
        isOpen={dialogCible != null}
        onClose={() => setDialogCible(null)}
        onConfirm={confirmerDialog}
        title={
          dialogCible?.type === "supprimer"
            ? "Supprimer cet administrateur ?"
            : dialogCible?.admin.statut === "ACTIF"
              ? "Suspendre cet administrateur ?"
              : "Réactiver cet administrateur ?"
        }
        description={
          dialogCible ? (
            dialogCible.type === "supprimer" ? (
              <>
                « {getDisplayName(dialogCible.admin)} » sera marqué comme
                supprimé (soft delete, données conservées).
              </>
            ) : dialogCible.admin.statut === "ACTIF" ? (
              <>
                « {getDisplayName(dialogCible.admin)} » ne pourra plus se
                connecter tant que le compte est suspendu.
              </>
            ) : (
              <>
                « {getDisplayName(dialogCible.admin)} » pourra à nouveau se
                connecter.
              </>
            )
          ) : null
        }
        confirmLabel={
          dialogCible?.type === "supprimer"
            ? "Supprimer"
            : dialogCible?.admin.statut === "ACTIF"
              ? "Suspendre"
              : "Réactiver"
        }
        variant={
          dialogCible?.type === "supprimer" ||
          dialogCible?.admin.statut === "ACTIF"
            ? "danger"
            : "primary"
        }
      />
    </div>
  );
}
