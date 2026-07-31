"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { isApiConfigured } from "@/lib/api/client";
import type {
  AdminEtablissementApi,
  AdminEtablissementDetailApi,
  AdminEtablissementPerformanceApi,
} from "@/lib/api/admin-types";
import {
  attachMembrePersisted,
  createEtablissementPersisted,
  detachMembrePersisted,
  fetchEtablissementDetailPersisted,
  fetchEtablissementPerformancePersisted,
  fetchEtablissementsPersisted,
  prolongerEtablissementPersisted,
} from "@/lib/etablissements-store";
import { formatXaf } from "@/lib/abonnements-utils";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GroupIcon } from "@/icons";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statutBadge(statut: AdminEtablissementApi["statut"]) {
  if (statut === "ACTIF") {
    return (
      <Badge color="success" size="sm" variant="light">
        Actif
      </Badge>
    );
  }
  if (statut === "SUSPENDU") {
    return (
      <Badge color="warning" size="sm" variant="light">
        Suspendu
      </Badge>
    );
  }
  return (
    <Badge color="light" size="sm" variant="light">
      Expiré
    </Badge>
  );
}

type CreateForm = {
  nom: string;
  email_contact: string;
  telephone_contact: string;
  nb_users_max: string;
  prix: string;
  devise: string;
  duree_jours: string;
};

const EMPTY_FORM: CreateForm = {
  nom: "",
  email_contact: "",
  telephone_contact: "",
  nb_users_max: "",
  prix: "",
  devise: "XAF",
  duree_jours: "365",
};

function CreateEtablissementForm({
  onSave,
  onCancel,
}: {
  onSave: (form: CreateForm) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Nouveau pack établissement
      </h2>

      <div>
        <Label htmlFor="etab-nom">Nom *</Label>
        <Input id="etab-nom" value={form.nom} onChange={set("nom")} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="etab-email">Email contact</Label>
          <Input
            id="etab-email"
            type="email"
            value={form.email_contact}
            onChange={set("email_contact")}
          />
        </div>
        <div>
          <Label htmlFor="etab-tel">Téléphone contact</Label>
          <Input
            id="etab-tel"
            value={form.telephone_contact}
            onChange={set("telephone_contact")}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="etab-places">Places max *</Label>
          <Input
            id="etab-places"
            type="number"
            value={form.nb_users_max}
            onChange={set("nb_users_max")}
          />
        </div>
        <div>
          <Label htmlFor="etab-prix">Prix *</Label>
          <Input
            id="etab-prix"
            type="number"
            value={form.prix}
            onChange={set("prix")}
          />
        </div>
        <div>
          <Label htmlFor="etab-devise">Devise</Label>
          <Input id="etab-devise" value={form.devise} onChange={set("devise")} />
        </div>
      </div>
      <div>
        <Label htmlFor="etab-duree">Durée (jours) *</Label>
        <Input
          id="etab-duree"
          type="number"
          value={form.duree_jours}
          onChange={set("duree_jours")}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          Créer
        </button>
      </div>
    </form>
  );
}

function statutPaiementBadge(statut: "EN_ATTENTE" | "SUCCES" | "ECHEC") {
  if (statut === "SUCCES") {
    return (
      <Badge color="success" size="sm" variant="light">
        Encaissé
      </Badge>
    );
  }
  if (statut === "EN_ATTENTE") {
    return (
      <Badge color="warning" size="sm" variant="light">
        En attente
      </Badge>
    );
  }
  return (
    <Badge color="error" size="sm" variant="light">
      Échec
    </Badge>
  );
}

function PerformanceTab({ etablissementId }: { etablissementId: string }) {
  const [perf, setPerf] = useState<AdminEtablissementPerformanceApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEtablissementPerformancePersisted(etablissementId).then((data) => {
      if (!cancelled) {
        setPerf(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [etablissementId]);

  if (loading) {
    return (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Chargement…
      </p>
    );
  }

  if (!perf) {
    return (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Impossible de charger les statistiques.
      </p>
    );
  }

  const heures = Math.floor(perf.lecture.minutes_total / 60);
  const minutesRestantes = perf.lecture.minutes_total % 60;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Revenu
          </span>
          {perf.revenu ? (
            <>
              <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
                {formatXaf(perf.revenu.montant)}
              </p>
              <div className="mt-1">{statutPaiementBadge(perf.revenu.statut)}</div>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucun paiement lié.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Membres ayant réellement lu
          </span>
          <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
            {perf.membres.actifs_lecteurs} / {perf.membres.total}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Temps de lecture cumulé
          </span>
          <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
            {heures} h {minutesRestantes} min
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {perf.lecture.sessions_total} session(s)
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Livres les plus lus par les membres
        </h3>
        {perf.livres_populaires.length > 0 ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-white/[0.05] dark:border-gray-800">
            {perf.livres_populaires.map((l) => (
              <li
                key={l.titre}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">{l.titre}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {l.nb_sessions} session(s)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune lecture enregistrée pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}

function MembresModal({
  etablissementId,
  onClose,
}: {
  etablissementId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminEtablissementDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [authIdToAdd, setAuthIdToAdd] = useState("");
  const [tab, setTab] = useState<"membres" | "performance">("membres");

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchEtablissementDetailPersisted(etablissementId);
    setDetail(data);
    setLoading(false);
  }, [etablissementId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const attacher = async () => {
    const authId = authIdToAdd.trim();
    if (!authId) return;
    const result = await attachMembrePersisted(etablissementId, authId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Membre rattaché.");
    setAuthIdToAdd("");
    await refresh();
  };

  const retirer = async (membreId: string) => {
    const result = await detachMembrePersisted(etablissementId, membreId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Membre retiré, une place est libérée.");
    await refresh();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Membres · {detail?.nom ?? "…"}
      </h2>
      {detail && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {detail.nb_membres_actifs} / {detail.nb_users_max} places occupées
        </p>
      )}

      <div className="mt-4 flex gap-1 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setTab("membres")}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "membres"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Membres
        </button>
        <button
          type="button"
          onClick={() => setTab("performance")}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "performance"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Performance
        </button>
      </div>

      {tab === "performance" ? (
        <PerformanceTab etablissementId={etablissementId} />
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="auth_id de l'utilisateur à rattacher"
              value={authIdToAdd}
              onChange={(e) => setAuthIdToAdd(e.target.value)}
            />
            <Button onClick={attacher}>Ajouter</Button>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chargement…
              </p>
            ) : detail && detail.membres.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {detail.membres.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {m.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => retirer(m.id)}
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun membre pour l&apos;instant.
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}

function ProlongerModal({
  etablissement,
  onClose,
  onDone,
}: {
  etablissement: AdminEtablissementApi;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [jours, setJours] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const joursSupplementaires = Number(jours);
    if (!joursSupplementaires || joursSupplementaires < 1) {
      toast.error("Nombre de jours invalide.");
      return;
    }
    setSubmitting(true);
    const result = await prolongerEtablissementPersisted(
      etablissement.id,
      joursSupplementaires
    );
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`« ${etablissement.nom} » prolongé de ${joursSupplementaires} jour(s).`);
    await onDone();
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Prolonger · {etablissement.nom}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Fin actuelle : {formatDate(etablissement.date_fin)}
      </p>
      <div>
        <Label htmlFor="prolonger-jours">Jours supplémentaires *</Label>
        <Input
          id="prolonger-jours"
          type="number"
          value={jours}
          onChange={(e) => setJours(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          Prolonger
        </button>
      </div>
    </form>
  );
}

export default function EtablissementsPage() {
  const apiMode = isApiConfigured();
  const [rows, setRows] = useState<AdminEtablissementApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [membresCible, setMembresCible] = useState<string | null>(null);
  const [prolongerCible, setProlongerCible] = useState<AdminEtablissementApi | null>(
    null
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEtablissementsPersisted();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enregistrer = async (form: CreateForm) => {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    const nb_users_max = Number(form.nb_users_max);
    const prix = Number(form.prix);
    const duree_jours = Number(form.duree_jours);
    if (!nb_users_max || !prix || !duree_jours) {
      toast.error("Places, prix et durée doivent être des nombres valides.");
      return;
    }

    const result = await createEtablissementPersisted({
      nom: form.nom.trim(),
      email_contact: form.email_contact.trim() || undefined,
      telephone_contact: form.telephone_contact.trim() || undefined,
      nb_users_max,
      prix,
      devise: form.devise.trim() || "XAF",
      duree_jours,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Pack établissement créé.");
    setCreateOpen(false);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Établissements")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Établissements
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Packs d&apos;abonnement collectif à places limitées pour les écoles
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Créer un pack</Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<GroupIcon className="size-7" />}
          message={
            apiMode
              ? "Aucun pack établissement en base."
              : "API non configurée : impossible de charger les packs."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Nom",
                  "Code",
                  "Places",
                  "Prix",
                  "Statut",
                  "Fin",
                  "",
                ].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-4 py-3 text-start text-theme-xs font-medium text-gray-500"
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {r.nom}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-theme-sm text-gray-600">
                    {r.code_invitation}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                    {r.nb_membres_actifs} / {r.nb_users_max}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                    {r.prix} {r.devise}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {statutBadge(r.statut)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                    {formatDate(r.date_fin)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setProlongerCible(r)}
                        className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400"
                      >
                        Prolonger
                      </button>
                      <button
                        type="button"
                        onClick={() => setMembresCible(r.id)}
                        className="text-sm font-medium text-brand-500 hover:text-brand-600"
                      >
                        Membres
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <CreateEtablissementForm
          onSave={enregistrer}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={membresCible != null}
        onClose={() => setMembresCible(null)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        {membresCible && (
          <MembresModal
            etablissementId={membresCible}
            onClose={() => setMembresCible(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={prolongerCible != null}
        onClose={() => setProlongerCible(null)}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto p-6 sm:p-8"
      >
        {prolongerCible && (
          <ProlongerModal
            etablissement={prolongerCible}
            onClose={() => setProlongerCible(null)}
            onDone={refresh}
          />
        )}
      </Modal>
    </div>
  );
}
