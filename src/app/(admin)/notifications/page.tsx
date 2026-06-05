"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { BellIcon, PencilIcon, TrashBinIcon } from "@/icons";

type FiltreStatut = "tous" | StatutNotification;
type FiltreCible = "tous" | CibleNotification;

const CIBLE_LABELS: Record<CibleNotification, string> = {
  TOUS: "Tous les utilisateurs",
  ABONNES: "Abonnés actifs",
  NON_ABONNES: "Non abonnés",
  ECOLE: "Étudiants UMNG",
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
    mode:
      n.statut === "PROGRAMMEE"
        ? "programmer"
        : n.statut === "ENVOYEE"
          ? "envoyer"
          : "brouillon",
    programmeLe: n.programmeLe
      ? n.programmeLe.slice(0, 16)
      : defaultNotifForm().programmeLe,
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
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    if (form.mode === "programmer" && !form.programmeLe) {
      toast.error("Indiquez une date de programmation.");
      return;
    }

    let statut: StatutNotification = "BROUILLON";
    let envoyeLe: string | null = null;
    let programmeLe: string | null = null;

    if (form.mode === "envoyer") {
      statut = "ENVOYEE";
      envoyeLe = new Date().toISOString();
    } else if (form.mode === "programmer") {
      statut = "PROGRAMMEE";
      programmeLe = new Date(form.programmeLe).toISOString();
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
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      {lectureSeule && (
        <p className="mt-2 text-sm text-warning-600 dark:text-warning-400">
          Cette notification a déjà été envoyée : seuls le titre et le message
          peuvent être consultés ici (modification limitée en démo).
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="n-titre">Titre *</Label>
          <Input
            id="n-titre"
            type="text"
            required
            value={form.titre}
            onChange={(e) =>
              setForm((f) => ({ ...f, titre: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="n-msg">Message</Label>
          <TextArea
            rows={4}
            value={form.message}
            onChange={(v) => setForm((f) => ({ ...f, message: v }))}
          />
        </div>
        <div>
          <Label htmlFor="n-cible">Cible</Label>
          <select
            id="n-cible"
            className={selectClass}
            value={form.cible}
            disabled={lectureSeule}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cible: e.target.value as CibleNotification,
              }))
            }
          >
            {(Object.keys(CIBLE_LABELS) as CibleNotification[]).map((k) => (
              <option key={k} value={k}>
                {CIBLE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        {!lectureSeule && (
          <>
            <div>
              <Label htmlFor="n-mode">Action</Label>
              <select
                id="n-mode"
                className={selectClass}
                value={form.mode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mode: e.target.value as ModeEnvoi,
                  }))
                }
              >
                <option value="brouillon">Enregistrer en brouillon</option>
                <option value="programmer">Programmer l&apos;envoi</option>
                <option value="envoyer">Envoyer immédiatement</option>
              </select>
            </div>
            {form.mode === "programmer" && (
              <div>
                <Label htmlFor="n-prog">Date et heure d&apos;envoi</Label>
                <Input
                  id="n-prog"
                  type="datetime-local"
                  required
                  value={form.programmeLe}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, programmeLe: e.target.value }))
                  }
                />
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          {!lectureSeule && (
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function NotificationsPage() {
  const apiMode = isApiConfigured();
  const [notifications, setNotifications] = useState<MockNotification[]>(() =>
    apiMode
      ? []
      : mockNotifications.map((n) => ({ ...n, deletedAt: n.deletedAt ?? null }))
  );
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreCible, setFiltreCible] = useState<FiltreCible>("tous");
  const [modalMode, setModalMode] = useState<"creer" | "modifier" | null>(null);
  const [edition, setEdition] = useState<MockNotification | null>(null);
  const [supprimerCible, setSupprimerCible] =
    useState<MockNotification | null>(null);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setFiltreCible("tous");
  }, []);

  const listeFiltree = useMemo(() => {
    return notifications.filter((n) => {
      if (isSoftDeleted(n.deletedAt)) return false;
      const okStat = filtreStatut === "tous" || n.statut === filtreStatut;
      const okCible = filtreCible === "tous" || n.cible === filtreCible;
      return okStat && okCible;
    });
  }, [notifications, filtreStatut, filtreCible]);

  const stats = useMemo(() => {
    const actives = notifications.filter((n) => !isSoftDeleted(n.deletedAt));
    const envoyees = actives.filter((n) => n.statut === "ENVOYEE").length;
    const programmees = actives.filter((n) => n.statut === "PROGRAMMEE").length;
    const brouillons = actives.filter((n) => n.statut === "BROUILLON").length;
    return { envoyees, programmees, brouillons };
  }, [notifications]);

  const envoyerMaintenant = (n: MockNotification) => {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === n.id
          ? {
              ...row,
              statut: "ENVOYEE" as const,
              envoyeLe: new Date().toISOString(),
              programmeLe: null,
            }
          : row
      )
    );
    toast.success("Notification envoyée.");
  };

  const annulerProgrammation = (n: MockNotification) => {
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === n.id
          ? {
              ...row,
              statut: "BROUILLON" as const,
              programmeLe: null,
            }
          : row
      )
    );
    toast.success("Programmation annulée — repassée en brouillon.");
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Notifications")} />
      {apiMode && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          La gestion des notifications push n&apos;est pas encore disponible
          depuis cette interface.
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/15">
            <BellIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Push et messages in-app
            </p>
          </div>
        </div>
        <Button
          disabled={apiMode}
          onClick={() => {
            setEdition(null);
            setModalMode("creer");
          }}
        >
          Nouvelle notification
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Envoyées
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.envoyees}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Programmées
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.programmees}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Brouillons
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.brouillons}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
        <div className="w-full min-w-[140px] sm:w-44">
          <Label htmlFor="notif-statut">Statut</Label>
          <select
            id="notif-statut"
            className={selectClass}
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
          >
            <option value="tous">Tous</option>
            <option value="ENVOYEE">Envoyée</option>
            <option value="PROGRAMMEE">Programmée</option>
            <option value="BROUILLON">Brouillon</option>
          </select>
        </div>
        <div className="w-full min-w-[160px] sm:w-52">
          <Label htmlFor="notif-cible">Cible</Label>
          <select
            id="notif-cible"
            className={selectClass}
            value={filtreCible}
            onChange={(e) => setFiltreCible(e.target.value as FiltreCible)}
          >
            <option value="tous">Toutes</option>
            <option value="TOUS">Tous les utilisateurs</option>
            <option value="ABONNES">Abonnés</option>
            <option value="NON_ABONNES">Non abonnés</option>
            <option value="ECOLE">École</option>
          </select>
        </div>
      </div>

      {listeFiltree.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="size-7" />}
          message={
            apiMode
              ? "Aucune notification disponible pour le moment."
              : "Aucune notification pour ce filtre."
          }
          onReset={apiMode ? undefined : reinitialiserFiltres}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1040px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Titre",
                      "Message",
                      "Cible",
                      "Statut",
                      "Envoi / prog.",
                      "Lecture",
                      "Actions",
                    ].map((c) => (
                      <TableCell
                        key={c}
                        isHeader
                        className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                      >
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
                        {n.statut === "ENVOYEE" && (
                          <Badge color="success" size="sm" variant="light">
                            Envoyée
                          </Badge>
                        )}
                        {n.statut === "PROGRAMMEE" && (
                          <Badge color="info" size="sm" variant="light">
                            Programmée
                          </Badge>
                        )}
                        {n.statut === "BROUILLON" && (
                          <Badge color="warning" size="sm" variant="light">
                            Brouillon
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {n.statut === "ENVOYEE"
                          ? formatDateHeure(n.envoyeLe)
                          : formatDateHeure(n.programmeLe)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {n.lus} / {n.totalCibles}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            title="Modifier"
                            disabled={apiMode}
                            onClick={() => {
                              if (apiMode) return;
                              setEdition(n);
                              setModalMode("modifier");
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-gray-200 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:ring-gray-700"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          {n.statut === "BROUILLON" && !apiMode && (
                            <button
                              type="button"
                              onClick={() => envoyerMaintenant(n)}
                              className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-theme-xs font-medium text-white hover:bg-brand-600"
                            >
                              Envoyer
                            </button>
                          )}
                          {n.statut === "PROGRAMMEE" && !apiMode && (
                            <>
                              <button
                                type="button"
                                onClick={() => envoyerMaintenant(n)}
                                className="rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-theme-xs font-medium text-brand-600"
                              >
                                Envoyer maintenant
                              </button>
                              <button
                                type="button"
                                onClick={() => annulerProgrammation(n)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-theme-xs text-gray-600 dark:border-gray-700"
                              >
                                Annuler prog.
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="Supprimer"
                            disabled={apiMode}
                            onClick={() => {
                              if (apiMode) return;
                              setSupprimerCible(n);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-gray-200 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:ring-gray-700"
                          >
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

      <Modal
        isOpen={modalMode != null}
        onClose={() => {
          setModalMode(null);
          setEdition(null);
        }}
        className="max-w-lg p-6 sm:p-8"
      >
        <NotificationForm
          key={edition?.id ?? "new"}
          initial={edition ?? undefined}
          title={
            modalMode === "modifier"
              ? "Modifier la notification"
              : "Composer une notification"
          }
          submitLabel="Enregistrer"
          onCancel={() => {
            setModalMode(null);
            setEdition(null);
          }}
          onSubmit={(data) => {
            if (modalMode === "modifier") {
              setNotifications((prev) =>
                prev.map((row) => (row.id === data.id ? data : row))
              );
              toast.success("Notification mise à jour.");
            } else {
              setNotifications((prev) => [data, ...prev]);
              toast.success(
                data.statut === "ENVOYEE"
                  ? "Notification envoyée."
                  : data.statut === "PROGRAMMEE"
                    ? "Notification programmée."
                    : "Brouillon enregistré."
              );
            }
            setModalMode(null);
            setEdition(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={() => {
          if (!supprimerCible) return;
          setNotifications((prev) =>
            prev.map((row) =>
              row.id === supprimerCible.id
                ? { ...row, deletedAt: softDeleteTimestamp() }
                : row
            )
          );
          toast.success("Notification supprimée (soft delete).");
          setSupprimerCible(null);
        }}
        title="Supprimer cette notification ?"
        description={
          supprimerCible ? (
            <>« {supprimerCible.titre} » sera marquée comme supprimée (soft delete).</>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
