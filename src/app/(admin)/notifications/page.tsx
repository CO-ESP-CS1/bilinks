"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import {
  mockNotifications,
  type MockNotification,
  type StatutNotification,
  type CibleNotification,
} from "@/lib/mock-data";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import { isApiConfigured } from "@/lib/api/client";
import {
  ADMIN_NOTIFICATION_TYPES,
  type AdminNotificationType,
  type AdminNotificationGroupItem,
} from "@/lib/api/admin-types";
import {
  createAdminNotificationPersisted,
  fetchAdminNotifications,
  deleteAdminNotification,
} from "@/lib/notifications-store";
import { fetchUsers } from "@/lib/users-store";
import type { MockUtilisateur } from "@/types/admin";
import { BellIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { PaginationMeta } from "@/lib/api/pagination";

type FiltreStatut = "tous" | StatutNotification;
type FiltreCible = "tous" | CibleNotification;

const CIBLE_LABELS: Record<CibleNotification, string> = {
  TOUS: "Tous les utilisateurs",
  ABONNES: "Abonnés actifs",
  NON_ABONNES: "Non abonnés",
  ECOLE: "Étudiants UMNG",
};

const TYPE_LABELS: Record<AdminNotificationType, string> = {
  ANNONCE: "Annonce",
  PROMOTION: "Promotion",
  MAINTENANCE: "Maintenance",
  ACTUALITE: "Actualité",
  ALERTE: "Alerte",
};

const TYPE_BADGE_COLOR: Record<AdminNotificationType, "info" | "warning" | "error" | "success"> = {
  ANNONCE: "info",
  PROMOTION: "success",
  MAINTENANCE: "warning",
  ACTUALITE: "info",
  ALERTE: "error",
};

function formatDateHeure(iso: string | null): string {
  if (!iso) return "—";
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

// ── Formulaire API (envoi immédiat) ──────────────────────────────────────────

type ApiNotifFormState = {
  titre: string;
  contenu: string;
  type: AdminNotificationType;
  cibleMode: "TOUS" | "UTILISATEUR";
  authId: string;
};

function defaultApiNotifForm(): ApiNotifFormState {
  return { titre: "", contenu: "", type: "ANNONCE", cibleMode: "TOUS", authId: "" };
}

function ApiNotificationForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (notification: AdminNotificationGroupItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ApiNotifFormState>(defaultApiNotifForm);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<MockUtilisateur[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    fetchUsers({ statut: "ACTIF", limit: 100 })
      .then(({ users: rows }) => { if (!cancelled) setUsers(rows); })
      .finally(() => { if (!cancelled) setLoadingUsers(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) { toast.error("Le titre est obligatoire."); return; }
    if (form.cibleMode === "UTILISATEUR" && !form.authId) {
      toast.error("Sélectionnez un utilisateur."); return;
    }

    const selected = users.find((u) => u.id === form.authId);
    setLoading(true);
    const result = await createAdminNotificationPersisted({
      titre: form.titre,
      contenu: form.contenu,
      type: form.type,
      auth_id: form.cibleMode === "UTILISATEUR" ? form.authId : undefined,
      destinataireLabel: selected ? `${selected.prenom} ${selected.nom}`.trim() : undefined,
    });
    setLoading(false);

    if (!result.ok) { toast.error(result.error); return; }

    // Construire l'item au format AdminNotificationGroupItem pour la table
    const item: AdminNotificationGroupItem = {
      id: result.notification.id,
      titre: result.notification.titre,
      contenu: result.notification.contenu || null,
      type: result.notification.type,
      cible: result.notification.cible,
      envoyeLe: result.notification.envoyeLe,
      total_destinataires: result.notification.created,
      nb_lus: 0,
    };

    onSubmit(item);
    toast.success(
      result.notification.cible === "TOUS"
        ? `Notification envoyée à ${result.notification.created} utilisateur(s).`
        : "Notification envoyée à l'utilisateur."
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Envoyer une notification in-app
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Diffusion immédiate — sans brouillon ni programmation.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="api-n-titre">Titre *</Label>
          <Input
            id="api-n-titre"
            type="text"
            required
            maxLength={200}
            value={form.titre}
            onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="api-n-contenu">Contenu</Label>
          <TextArea
            rows={4}
            value={form.contenu}
            onChange={(v) => setForm((f) => ({ ...f, contenu: v }))}
          />
        </div>
        <div>
          <Label htmlFor="api-n-type">Type *</Label>
          <select
            id="api-n-type"
            className={selectClass}
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as AdminNotificationType }))
            }
          >
            {ADMIN_NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="api-n-cible">Destinataires</Label>
          <select
            id="api-n-cible"
            className={selectClass}
            value={form.cibleMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cibleMode: e.target.value as "TOUS" | "UTILISATEUR",
                authId: e.target.value === "TOUS" ? "" : f.authId,
              }))
            }
          >
            <option value="TOUS">Tous les comptes actifs</option>
            <option value="UTILISATEUR">Un utilisateur précis</option>
          </select>
        </div>
        {form.cibleMode === "UTILISATEUR" && (
          <div>
            <Label htmlFor="api-n-user">Utilisateur *</Label>
            <select
              id="api-n-user"
              className={selectClass}
              value={form.authId}
              disabled={loadingUsers}
              onChange={(e) => setForm((f) => ({ ...f, authId: e.target.value }))}
            >
              <option value="">
                {loadingUsers ? "Chargement…" : "Choisir un utilisateur"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom} — {u.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Formulaire mock (brouillon / programmer / envoyer) ───────────────────────

type ModeEnvoi = "brouillon" | "programmer" | "envoyer";

type NotifFormState = {
  titre: string;
  message: string;
  cible: CibleNotification;
  mode: ModeEnvoi;
  programmeLe: string;
};

function defaultNotifForm(): NotifFormState {
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  demain.setHours(9, 0, 0, 0);
  return {
    titre: "",
    message: "",
    cible: "TOUS",
    mode: "brouillon",
    programmeLe: demain.toISOString().slice(0, 16),
  };
}

function notifToForm(n: MockNotification): NotifFormState {
  return {
    titre: n.titre,
    message: n.message,
    cible: n.cible,
    mode: n.statut === "PROGRAMMEE" ? "programmer" : n.statut === "ENVOYEE" ? "envoyer" : "brouillon",
    programmeLe: n.programmeLe ? n.programmeLe.slice(0, 16) : defaultNotifForm().programmeLe,
  };
}

function NotificationForm({
  initial,
  onSubmit,
  onCancel,
  title,
  submitLabel,
}: {
  initial?: MockNotification;
  onSubmit: (data: MockNotification) => void;
  onCancel: () => void;
  title: string;
  submitLabel: string;
}) {
  const [form, setForm] = useState<NotifFormState>(() =>
    initial ? notifToForm(initial) : defaultNotifForm()
  );
  const lectureSeule = initial?.statut === "ENVOYEE";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) { toast.error("Le titre est obligatoire."); return; }
    if (form.mode === "programmer" && !form.programmeLe) {
      toast.error("Indiquez une date de programmation."); return;
    }

    let statut: StatutNotification = "BROUILLON";
    let envoyeLe: string | null = null;
    let programmeLe: string | null = null;

    if (form.mode === "envoyer") {
      statut = "ENVOYEE"; envoyeLe = new Date().toISOString();
    } else if (form.mode === "programmer") {
      statut = "PROGRAMMEE"; programmeLe = new Date(form.programmeLe).toISOString();
    }

    onSubmit({
      id: initial?.id ?? `n-new-${Date.now()}`,
      titre: form.titre.trim(),
      message: form.message.trim(),
      cible: form.cible,
      statut,
      envoyeLe,
      programmeLe,
      lus: initial?.lus ?? 0,
      totalCibles: initial?.totalCibles ?? 1847,
      deletedAt: null,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
      {lectureSeule && (
        <p className="mt-2 text-sm text-warning-600 dark:text-warning-400">
          Cette notification a déjà été envoyée — consultation uniquement.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="n-titre">Titre *</Label>
          <Input id="n-titre" type="text" required value={form.titre}
            onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="n-msg">Message</Label>
          <TextArea rows={4} value={form.message}
            onChange={(v) => setForm((f) => ({ ...f, message: v }))} />
        </div>
        <div>
          <Label htmlFor="n-cible">Cible</Label>
          <select id="n-cible" className={selectClass} value={form.cible}
            disabled={lectureSeule}
            onChange={(e) => setForm((f) => ({ ...f, cible: e.target.value as CibleNotification }))}>
            {(Object.keys(CIBLE_LABELS) as CibleNotification[]).map((k) => (
              <option key={k} value={k}>{CIBLE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        {!lectureSeule && (
          <>
            <div>
              <Label htmlFor="n-mode">Action</Label>
              <select id="n-mode" className={selectClass} value={form.mode}
                onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as ModeEnvoi }))}>
                <option value="brouillon">Enregistrer en brouillon</option>
                <option value="programmer">Programmer l&apos;envoi</option>
                <option value="envoyer">Envoyer immédiatement</option>
              </select>
            </div>
            {form.mode === "programmer" && (
              <div>
                <Label htmlFor="n-prog">Date et heure d&apos;envoi</Label>
                <Input id="n-prog" type="datetime-local" required value={form.programmeLe}
                  onChange={(e) => setForm((f) => ({ ...f, programmeLe: e.target.value }))} />
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          {!lectureSeule && (
            <button type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600">
              {submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Table historique API ─────────────────────────────────────────────────────

function ApiHistoriqueTable({
  items,
  loading,
  meta,
  page,
  onPageChange,
  onDelete,
}: {
  items: AdminNotificationGroupItem[];
  loading: boolean;
  meta: PaginationMeta | null;
  page: number;
  onPageChange: (p: number) => void;
  onDelete: (item: AdminNotificationGroupItem) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellIcon className="size-7" />}
        message="Aucune notification envoyée pour l'instant."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Titre", "Contenu", "Type", "Cible", "Destinataires", "Lus", "Envoyée le", ""].map((c) => (
                  <TableCell key={c} isHeader
                    className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {n.titre}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {n.contenu || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge color={TYPE_BADGE_COLOR[n.type]} size="sm" variant="light">
                      {TYPE_LABELS[n.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {n.cible === "TOUS" ? "Tous les comptes actifs" : "Utilisateur ciblé"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center text-theme-sm font-medium text-gray-800 dark:text-white/80">
                    {n.total_destinataires}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-600 dark:text-gray-400">
                    {n.nb_lus}
                    {n.total_destinataires > 0 && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({Math.round((n.nb_lus / n.total_destinataires) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {formatDateHeure(n.envoyeLe)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={() => onDelete(n)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meta.total} envoi(s) au total
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-700"
            >
              ← Préc.
            </button>
            <span className="flex items-center px-2 text-xs text-gray-600 dark:text-gray-400">
              {page} / {meta.total_pages}
            </span>
            <button
              type="button"
              disabled={page >= meta.total_pages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-700"
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const apiMode = isApiConfigured();

  // ── État API mode ──
  const [apiItems, setApiItems] = useState<AdminNotificationGroupItem[]>([]);
  const [apiMeta, setApiMeta] = useState<PaginationMeta | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [apiTypeFilter, setApiTypeFilter] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<AdminNotificationGroupItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── État mock mode ──
  const [notifications, setNotifications] = useState<MockNotification[]>(() =>
    apiMode ? [] : mockNotifications.map((n) => ({ ...n, deletedAt: n.deletedAt ?? null }))
  );
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreCible, setFiltreCible] = useState<FiltreCible>("tous");

  // ── Modal ──
  const [modalMode, setModalMode] = useState<"creer" | "modifier" | null>(null);
  const [edition, setEdition] = useState<MockNotification | null>(null);
  const [supprimerCible, setSupprimerCible] = useState<MockNotification | null>(null);

  // ── Chargement historique API ──
  const loadApiHistory = useCallback(
    async (p = 1, type = apiTypeFilter) => {
      setApiLoading(true);
      try {
        const res = await fetchAdminNotifications({ page: p, limit: 20, type: type || undefined });
        setApiItems(res.data);
        setApiMeta(res.meta);
        setApiPage(p);
      } catch {
        toast.error("Impossible de charger l'historique des notifications.");
      } finally {
        setApiLoading(false);
      }
    },
    [apiTypeFilter]
  );

  useEffect(() => {
    if (apiMode) loadApiHistory(1, "");
  }, [apiMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApiTypeFilter = (type: string) => {
    setApiTypeFilter(type);
    loadApiHistory(1, type);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteAdminNotification(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${res.deleted} notification(s) supprimée(s).`);
    // Retirer du tableau local sans recharger
    setApiItems((prev) => prev.filter((n) => n.id !== deleteTarget.id));
    setApiMeta((m) => m ? { ...m, total: Math.max(0, m.total - 1) } : m);
  };

  // ── Stats ──
  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous"); setFiltreCible("tous");
  }, []);

  const listeFiltree = useMemo(() => {
    if (apiMode) return [];
    return notifications.filter((n) => {
      if (isSoftDeleted(n.deletedAt)) return false;
      const okStat = filtreStatut === "tous" || n.statut === filtreStatut;
      const okCible = filtreCible === "tous" || n.cible === filtreCible;
      return okStat && okCible;
    });
  }, [notifications, filtreStatut, filtreCible, apiMode]);

  const stats = useMemo(() => {
    if (apiMode) {
      return {
        envoyees: apiMeta?.total ?? apiItems.length,
        destinataires: apiItems.reduce((s, n) => s + n.total_destinataires, 0),
        lus: apiItems.reduce((s, n) => s + n.nb_lus, 0),
      };
    }
    const actives = notifications.filter((n) => !isSoftDeleted(n.deletedAt));
    return {
      envoyees: actives.filter((n) => n.statut === "ENVOYEE").length,
      programmees: actives.filter((n) => n.statut === "PROGRAMMEE").length,
      brouillons: actives.filter((n) => n.statut === "BROUILLON").length,
    };
  }, [notifications, apiMode, apiItems, apiMeta]);

  const envoyerMaintenant = (n: MockNotification) => {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === n.id
          ? { ...row, statut: "ENVOYEE" as const, envoyeLe: new Date().toISOString(), programmeLe: null }
          : row
      )
    );
    toast.success("Notification envoyée.");
  };

  const annulerProgrammation = (n: MockNotification) => {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === n.id ? { ...row, statut: "BROUILLON" as const, programmeLe: null } : row
      )
    );
    toast.success("Programmation annulée — repassée en brouillon.");
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Notifications")} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/15">
            <BellIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {apiMode ? "Notifications in-app — envoi immédiat via l'API" : "Push et messages in-app"}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEdition(null); setModalMode("creer"); }}>
          Nouvelle notification
        </Button>
      </div>

      {/* Stats */}
      <div className={apiMode ? "grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6" : "grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6"}>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {apiMode ? "Envois total" : "Envoyées"}
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {apiMode ? (stats as { envoyees: number }).envoyees : (stats as { envoyees: number }).envoyees}
          </p>
        </div>
        {apiMode ? (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">Destinataires (page)</span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {(stats as { destinataires: number }).destinataires}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">Lectures (page)</span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {(stats as { lus: number }).lus}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">Programmées</span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {(stats as { programmees: number }).programmees}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">Brouillons</span>
              <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {(stats as { brouillons: number }).brouillons}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filtres */}
      {apiMode ? (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] sm:flex-row sm:items-end">
          <div className="w-full sm:w-52">
            <Label htmlFor="api-notif-type">Filtrer par type</Label>
            <select
              id="api-notif-type"
              className={selectClass}
              value={apiTypeFilter}
              onChange={(e) => handleApiTypeFilter(e.target.value)}
            >
              <option value="">Tous les types</option>
              {ADMIN_NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadApiHistory(apiPage, apiTypeFilter)}
            className="h-11 shrink-0 rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            ↺ Actualiser
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
          <div className="w-full min-w-[140px] sm:w-44">
            <Label htmlFor="notif-statut">Statut</Label>
            <select id="notif-statut" className={selectClass} value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}>
              <option value="tous">Tous</option>
              <option value="ENVOYEE">Envoyée</option>
              <option value="PROGRAMMEE">Programmée</option>
              <option value="BROUILLON">Brouillon</option>
            </select>
          </div>
          <div className="w-full min-w-[160px] sm:w-52">
            <Label htmlFor="notif-cible">Cible</Label>
            <select id="notif-cible" className={selectClass} value={filtreCible}
              onChange={(e) => setFiltreCible(e.target.value as FiltreCible)}>
              <option value="tous">Toutes</option>
              <option value="TOUS">Tous les utilisateurs</option>
              <option value="ABONNES">Abonnés</option>
              <option value="NON_ABONNES">Non abonnés</option>
              <option value="ECOLE">École</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      {apiMode ? (
        <ApiHistoriqueTable
          items={apiItems}
          loading={apiLoading}
          meta={apiMeta}
          page={apiPage}
          onPageChange={(p) => loadApiHistory(p, apiTypeFilter)}
          onDelete={(item) => setDeleteTarget(item)}
        />
      ) : listeFiltree.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="size-7" />}
          message="Aucune notification pour ce filtre."
          onReset={reinitialiserFiltres}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1040px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {["Titre","Message","Cible","Statut","Envoi / prog.","Lecture","Actions"].map((c) => (
                      <TableCell key={c} isHeader
                        className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {listeFiltree.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {n.titre}
                      </TableCell>
                      <TableCell className="max-w-xs px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {n.message}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {CIBLE_LABELS[n.cible]}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {n.statut === "ENVOYEE" && <Badge color="success" size="sm" variant="light">Envoyée</Badge>}
                        {n.statut === "PROGRAMMEE" && <Badge color="info" size="sm" variant="light">Programmée</Badge>}
                        {n.statut === "BROUILLON" && <Badge color="warning" size="sm" variant="light">Brouillon</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {n.statut === "ENVOYEE" ? formatDateHeure(n.envoyeLe) : formatDateHeure(n.programmeLe)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {n.lus} / {n.totalCibles}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" title="Modifier"
                            onClick={() => { setEdition(n); setModalMode("modifier"); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/5 dark:hover:text-brand-400">
                            <PencilIcon className="size-4" />
                          </button>
                          {n.statut === "BROUILLON" && (
                            <button type="button" onClick={() => envoyerMaintenant(n)}
                              className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-theme-xs font-medium text-white hover:bg-brand-600">
                              Envoyer
                            </button>
                          )}
                          {n.statut === "PROGRAMMEE" && (
                            <>
                              <button type="button" onClick={() => envoyerMaintenant(n)}
                                className="rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-theme-xs font-medium text-brand-600">
                                Envoyer maintenant
                              </button>
                              <button type="button" onClick={() => annulerProgrammation(n)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-theme-xs text-gray-600 dark:border-gray-700">
                                Annuler prog.
                              </button>
                            </>
                          )}
                          <button type="button" title="Supprimer" onClick={() => setSupprimerCible(n)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-error-500/10 dark:hover:text-error-400">
                            <TrashBinIcon className="size-4" />
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

      {/* Modal création / modification */}
      <Modal isOpen={modalMode != null}
        onClose={() => { setModalMode(null); setEdition(null); }}
        className="max-w-lg p-6 sm:p-8">
        {apiMode ? (
          <ApiNotificationForm
            onCancel={() => { setModalMode(null); setEdition(null); }}
            onSubmit={(item) => {
              setApiItems((prev) => [item, ...prev]);
              setApiMeta((m) => m ? { ...m, total: m.total + 1 } : m);
              setModalMode(null);
              setEdition(null);
            }}
          />
        ) : (
          <NotificationForm
            key={edition?.id ?? "new"}
            initial={edition ?? undefined}
            title={modalMode === "modifier" ? "Modifier la notification" : "Composer une notification"}
            submitLabel="Enregistrer"
            onCancel={() => { setModalMode(null); setEdition(null); }}
            onSubmit={(data) => {
              if (modalMode === "modifier") {
                setNotifications((prev) => prev.map((row) => (row.id === data.id ? data : row)));
                toast.success("Notification mise à jour.");
              } else {
                setNotifications((prev) => [data, ...prev]);
                toast.success(
                  data.statut === "ENVOYEE" ? "Notification envoyée."
                    : data.statut === "PROGRAMMEE" ? "Notification programmée."
                    : "Brouillon enregistré."
                );
              }
              setModalMode(null); setEdition(null);
            }}
          />
        )}
      </Modal>

      {/* Confirm delete API */}
      <ConfirmDialog
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cet envoi ?"
        description={
          deleteTarget ? (
            <>
              « {deleteTarget.titre} » — envoyé à{" "}
              <strong>{deleteTarget.total_destinataires}</strong> utilisateur(s). Cette
              action supprimera toutes les notifications de ce groupe.
            </>
          ) : null
        }
        confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        variant="danger"
      />

      {/* Confirm delete mock */}
      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={() => {
          if (!supprimerCible) return;
          setNotifications((prev) =>
            prev.map((row) =>
              row.id === supprimerCible.id ? { ...row, deletedAt: softDeleteTimestamp() } : row
            )
          );
          toast.success("Notification supprimée.");
          setSupprimerCible(null);
        }}
        title="Supprimer cette notification ?"
        description={supprimerCible ? <>« {supprimerCible.titre} » sera supprimée.</> : null}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
