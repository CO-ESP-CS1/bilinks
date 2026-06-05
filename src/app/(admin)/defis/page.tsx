"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type {
  MockDefi,
  MockBadge,
  StatutDefi,
  RareteBadge,
  TypeDefi,
} from "@/lib/mock-data";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { fetchAuteursPersisted } from "@/lib/auteurs-store";
import {
  fetchBadgesPersisted,
  createBadgePersisted,
  updateBadgePersisted,
} from "@/lib/badges-store";
import { fetchCategoriesPersisted } from "@/lib/categories-store";
import {
  cancelChallengePersisted,
  createChallengePersisted,
  fetchChallengeParticipantsPersisted,
  fetchChallengesPersisted,
  updateChallengePersisted,
} from "@/lib/challenges-store";
import type {
  AdminChallengeParticipantItemApi,
  StatutChallengeParticipant,
} from "@/lib/api/admin-types";
import type { PaginationMeta } from "@/lib/api/pagination";
import { fetchLivres } from "@/lib/livres-store";
import type { MockAuteur, MockCategorie, MockLivre } from "@/types/admin";
import { BadgeIconUploader } from "@/components/badges/BadgeIconUploader";
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
import {
  BADGE_ICONE_MAX_BYTES,
  BADGE_NOM_MAX_LENGTH,
  CHALLENGE_TITRE_MAX_LENGTH,
} from "@/lib/admin/validators";
import { isSoftDeleted } from "@/lib/soft-delete";
import { BoltIcon, GroupIcon, PencilIcon, TrashBinIcon } from "@/icons";

type Onglet = "defis" | "badges";
type FiltreDefi = "tous" | StatutDefi | "ANNULE";
type ModalBadgeMode = "creer" | "modifier";

type BadgeFormState = {
  nom: string;
  couleur: string;
  points: string;
  description: string;
  iconeFile: File | null;
  iconePreview: string | null;
};

function defaultBadgeForm(): BadgeFormState {
  return {
    nom: "",
    couleur: "#3B82F6",
    points: "10",
    description: "",
    iconeFile: null,
    iconePreview: null,
  };
}

function badgeToForm(b: MockBadge): BadgeFormState {
  return {
    nom: b.nom,
    couleur: b.couleur ?? "#3B82F6",
    points: String(b.points ?? 0),
    description: b.description === "—" ? "" : b.description,
    iconeFile: null,
    iconePreview: b.icone || null,
  };
}

const RARETE_LABELS: Record<RareteBadge, string> = {
  COMMUN: "Commun",
  RARE: "Rare",
  EPIC: "Épique",
};

const RARETE_COLORS: Record<
  RareteBadge,
  "light" | "info" | "warning" | "error" | "success" | "primary"
> = {
  COMMUN: "light",
  RARE: "info",
  EPIC: "warning",
};

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function participantNom(p: AdminChallengeParticipantItemApi): string {
  const { prenom, nom } = p.auth.personne;
  const full = `${prenom ?? ""} ${nom ?? ""}`.trim();
  return full || p.auth.email;
}

const PARTICIPANT_STATUT_LABELS: Record<StatutChallengeParticipant, string> = {
  EN_COURS: "En cours",
  COMPLETE: "Complété",
  ECHOUE: "Échoué",
};

const PARTICIPANT_STATUT_COLORS: Record<
  StatutChallengeParticipant,
  "light" | "info" | "warning" | "error" | "success" | "primary"
> = {
  EN_COURS: "warning",
  COMPLETE: "success",
  ECHOUE: "error",
};

type FiltreParticipant = "tous" | StatutChallengeParticipant;

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

type DefiFormState = {
  titre: string;
  description: string;
  objectif: string;
  points: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutDefi;
  type: TypeDefi;
  badgeId: string;
  categorieId: string;
  auteurId: string;
  livreId: string;
};

function defaultDefiForm(): DefiFormState {
  const debut = new Date();
  const fin = new Date();
  fin.setMonth(fin.getMonth() + 1);
  return {
    titre: "",
    description: "",
    objectif: "",
    points: "50",
    dateDebut: debut.toISOString().slice(0, 10),
    dateFin: fin.toISOString().slice(0, 10),
    statut: "BROUILLON",
    type: "NB_LIVRES",
    badgeId: "",
    categorieId: "",
    auteurId: "",
    livreId: "",
  };
}

function defiToForm(d: MockDefi): DefiFormState {
  const desc =
    d.description.startsWith("Badge :") ? "" : d.description;
  return {
    titre: d.titre,
    description: desc,
    objectif:
      d.objectifValeur != null ? String(d.objectifValeur) : d.objectif,
    points: String(d.pointsRecompense),
    dateDebut: d.dateDebut,
    dateFin: d.dateFin,
    statut: d.statut,
    type: d.type ?? "NB_LIVRES",
    badgeId: d.badgeId ?? "",
    categorieId: "",
    auteurId: "",
    livreId: "",
  };
}

function DefiForm({
  initial,
  badges,
  categories,
  auteurs,
  livres,
  apiMode,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: MockDefi;
  badges: MockBadge[];
  categories: MockCategorie[];
  auteurs: MockAuteur[];
  livres: MockLivre[];
  apiMode: boolean;
  onSubmit: (
    data: Omit<MockDefi, "id" | "participants" | "deletedAt"> & {
      type: TypeDefi;
      badgeId: string;
      objectifValeur: number;
      categorieId?: string;
      auteurId?: string;
      livreId?: string;
    }
  ) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<DefiFormState>(() =>
    initial ? defiToForm(initial) : defaultDefiForm()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }
    if (form.dateFin < form.dateDebut) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }
    if (apiMode && initial && initial.statut !== "ACTIF") {
      toast.error("Seuls les défis ACTIF peuvent être modifiés.");
      return;
    }
    if (apiMode && !initial && !form.badgeId) {
      toast.error("Sélectionnez un badge récompense.");
      return;
    }
    const objectifValeur = apiMode
      ? Number(form.objectif)
      : Number(form.objectif) || 1;
    if (apiMode && (!Number.isFinite(objectifValeur) || objectifValeur < 1)) {
      toast.error("La valeur objectif doit être un entier ≥ 1.");
      return;
    }
    if (apiMode && !initial) {
      if (form.type === "CATEGORIE" && !form.categorieId) {
        toast.error("Sélectionnez une catégorie.");
        return;
      }
      if (form.type === "AUTEUR" && !form.auteurId) {
        toast.error("Sélectionnez un auteur.");
        return;
      }
      if (form.type === "LIVRE_SPECIFIQUE" && !form.livreId) {
        toast.error("Sélectionnez un livre.");
        return;
      }
    }
    onSubmit({
      titre: form.titre.trim(),
      description: form.description.trim(),
      objectif: apiMode
        ? String(objectifValeur)
        : form.objectif.trim() || "—",
      objectifValeur,
      type: form.type,
      badgeId: form.badgeId,
      pointsRecompense: Number(form.points) || 50,
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      statut: form.statut,
      categorieId: form.categorieId || undefined,
      auteurId: form.auteurId || undefined,
      livreId: form.livreId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="defi-titre">Titre *</Label>
        <Input
          id="defi-titre"
          type="text"
          required
          maxLength={CHALLENGE_TITRE_MAX_LENGTH}
          value={form.titre}
          onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
        />
      </div>
      {apiMode && (
        <>
          {initial ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Type de défi</Label>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {form.type}
                </p>
              </div>
              <div>
                <Label>Badge récompense</Label>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {initial.badgeNom ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="defi-type">Type de défi *</Label>
              <select
                id="defi-type"
                className={selectClass}
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as TypeDefi;
                  setForm((f) => ({
                    ...f,
                    type,
                    categorieId: "",
                    auteurId: "",
                    livreId: "",
                  }));
                }}
              >
                <option value="NB_LIVRES">Nombre de livres</option>
                <option value="DUREE_LECTURE">Durée de lecture</option>
                <option value="CATEGORIE">Catégorie</option>
                <option value="AUTEUR">Auteur</option>
                <option value="LIVRE_SPECIFIQUE">Livre spécifique</option>
              </select>
            </div>
          )}
          {!initial && (
            <div>
              <Label htmlFor="defi-badge">Badge récompense *</Label>
              <select
                id="defi-badge"
                className={selectClass}
                value={form.badgeId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badgeId: e.target.value }))
                }
              >
                <option value="">Choisir un badge</option>
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!initial && form.type === "CATEGORIE" && (
            <div>
              <Label htmlFor="defi-categorie">Catégorie cible *</Label>
              <select
                id="defi-categorie"
                className={selectClass}
                value={form.categorieId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categorieId: e.target.value }))
                }
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!initial && form.type === "AUTEUR" && (
            <div>
              <Label htmlFor="defi-auteur">Auteur cible *</Label>
              <select
                id="defi-auteur"
                className={selectClass}
                value={form.auteurId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, auteurId: e.target.value }))
                }
              >
                <option value="">Choisir un auteur</option>
                {auteurs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {[a.prenom, a.nom].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!initial && form.type === "LIVRE_SPECIFIQUE" && (
            <div>
              <Label htmlFor="defi-livre">Livre cible *</Label>
              <select
                id="defi-livre"
                className={selectClass}
                value={form.livreId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, livreId: e.target.value }))
                }
              >
                <option value="">Choisir un livre</option>
                {livres.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      <div>
        <Label htmlFor="defi-desc">Description</Label>
        <TextArea
          rows={3}
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        />
      </div>
      <div>
        <Label htmlFor="defi-obj">
          {apiMode ? "Valeur objectif *" : "Objectif"}
        </Label>
        <Input
          id="defi-obj"
          type={apiMode ? "number" : "text"}
          min={apiMode ? "1" : undefined}
          required={apiMode}
          value={form.objectif}
          onChange={(e) => setForm((f) => ({ ...f, objectif: e.target.value }))}
        />
      </div>
      {(!apiMode || !initial) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="defi-pts">
              Points bonus
            </Label>
            <Input
              id="defi-pts"
              type="number"
              min={apiMode ? "0" : "1"}
              value={form.points}
              onChange={(e) =>
                setForm((f) => ({ ...f, points: e.target.value }))
              }
            />
          </div>
          {!apiMode && (
            <div>
              <Label htmlFor="defi-statut">Statut</Label>
              <select
                id="defi-statut"
                className={selectClass}
                value={form.statut}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    statut: e.target.value as StatutDefi,
                  }))
                }
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ACTIF">Actif</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          )}
        </div>
      )}
      {apiMode && initial && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Statut actuel : <strong>{initial.statut}</strong>
        </p>
      )}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Période du défi
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="defi-debut">
              Date de début{apiMode && initial ? " (non modifiable)" : " *"}
            </Label>
            <Input
              id="defi-debut"
              type="date"
              required={!initial || !apiMode}
              disabled={apiMode && !!initial}
              value={form.dateDebut}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateDebut: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="defi-fin">
              Date de fin{apiMode && initial ? " (PATCH)" : " *"}
            </Label>
            <Input
              id="defi-fin"
              type="date"
              required
              value={form.dateFin}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateFin: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function DefisPage() {
  const apiMode = isApiConfigured();
  const apiSessionReady = !apiMode || hasApiSession();
  const [onglet, setOnglet] = useState<Onglet>("defis");
  const [defis, setDefis] = useState<MockDefi[]>([]);
  const [badges, setBadges] = useState<MockBadge[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<FiltreDefi>("tous");
  const [search, setSearch] = useState("");
  const [champRechercheKey, setChampRechercheKey] = useState(0);
  const [modalDefi, setModalDefi] = useState<"creer" | "modifier" | null>(null);
  const [defiEdition, setDefiEdition] = useState<MockDefi | null>(null);
  const [annulerCible, setAnnulerCible] = useState<MockDefi | null>(null);
  const [participantsCible, setParticipantsCible] = useState<MockDefi | null>(
    null
  );
  const [participantsRows, setParticipantsRows] = useState<
    AdminChallengeParticipantItemApi[]
  >([]);
  const [participantsMeta, setParticipantsMeta] = useState<PaginationMeta | null>(
    null
  );
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(
    null
  );
  const [participantsFiltre, setParticipantsFiltre] =
    useState<FiltreParticipant>("tous");
  const [participantsPage, setParticipantsPage] = useState(1);
  const [categories, setCategories] = useState<MockCategorie[]>([]);
  const [auteurs, setAuteurs] = useState<MockAuteur[]>([]);
  const [livres, setLivres] = useState<MockLivre[]>([]);
  const [modalBadge, setModalBadge] = useState<ModalBadgeMode | null>(null);
  const [badgeEdition, setBadgeEdition] = useState<MockBadge | null>(null);
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [badgeForm, setBadgeForm] = useState<BadgeFormState>(defaultBadgeForm);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const statutApi =
        apiMode && filtreStatut !== "tous" && filtreStatut !== "BROUILLON"
          ? filtreStatut
          : undefined;
      const [d, b, c, a, l] = await Promise.all([
        fetchChallengesPersisted(
          apiMode ? { statut: statutApi, page: 1, limit: 100 } : undefined
        ),
        fetchBadgesPersisted(),
        fetchCategoriesPersisted(),
        fetchAuteursPersisted(),
        fetchLivres().then((r) => r.livres),
      ]);
      setDefis(d);
      setBadges(b);
      setCategories(c.filter((x) => !isSoftDeleted(x.deletedAt)));
      setAuteurs(a.filter((x) => !isSoftDeleted(x.deletedAt)));
      setLivres(l);
    } finally {
      setLoading(false);
    }
  }, [apiMode, filtreStatut]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ouvrirParticipants = useCallback(
    (defi: MockDefi) => {
      if (!apiMode) {
        toast.error("Liste des participants indisponible.");
        return;
      }
      setParticipantsFiltre("tous");
      setParticipantsPage(1);
      setParticipantsError(null);
      setParticipantsCible(defi);
    },
    [apiMode]
  );

  const chargerParticipants = useCallback(async () => {
    if (!participantsCible || !apiMode) return;
    setParticipantsLoading(true);
    setParticipantsError(null);
    const result = await fetchChallengeParticipantsPersisted(
      participantsCible.id,
      {
        statut:
          participantsFiltre === "tous" ? undefined : participantsFiltre,
        page: participantsPage,
        limit: 20,
      }
    );
    if (!result.ok) {
      setParticipantsError(result.error);
      setParticipantsRows([]);
      setParticipantsMeta(null);
    } else {
      setParticipantsRows(result.data);
      setParticipantsMeta(result.meta);
    }
    setParticipantsLoading(false);
  }, [participantsCible, apiMode, participantsFiltre, participantsPage]);

  useEffect(() => {
    if (!participantsCible) return;
    void chargerParticipants();
  }, [participantsCible, chargerParticipants]);

  const reinitialiserFiltres = useCallback(() => {
    setFiltreStatut("tous");
    setSearch("");
    setChampRechercheKey((k) => k + 1);
  }, []);

  const listeDefis = useMemo(() => {
    const q = search.trim().toLowerCase();
    return defis.filter((d) => {
      if (isSoftDeleted(d.deletedAt)) return false;
      if (!apiMode) {
        const okStat = filtreStatut === "tous" || d.statut === filtreStatut;
        if (!okStat) return false;
      }
      if (!q) return true;
      return (
        d.titre.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.badgeNom?.toLowerCase().includes(q) ?? false) ||
        (d.type?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [defis, filtreStatut, search, apiMode]);

  const badgesVisibles = useMemo(
    () => badges.filter((b) => !isSoftDeleted(b.deletedAt)),
    [badges]
  );

  const stats = useMemo(() => {
    const defisVisibles = defis.filter((d) => !isSoftDeleted(d.deletedAt));
    const actifs = defisVisibles.filter((d) => d.statut === "ACTIF").length;
    const badgesActifs = badgesVisibles.filter((b) => b.actif).length;
    const participants = defisVisibles.reduce(
      (acc, d) => acc + d.participants,
      0
    );
    return { actifs, badgesActifs, participants };
  }, [defis, badgesVisibles]);

  const enregistrerDefi = async (
    data: Omit<MockDefi, "id" | "participants" | "deletedAt"> & {
      type: TypeDefi;
      badgeId: string;
      objectifValeur: number;
      categorieId?: string;
      auteurId?: string;
      livreId?: string;
    }
  ) => {
    if (modalDefi === "modifier" && defiEdition) {
      if (apiMode && defiEdition.statut !== "ACTIF") {
        toast.error("Seuls les défis ACTIF peuvent être modifiés.");
        return;
      }
      const result = await updateChallengePersisted(defiEdition.id, {
        titre: data.titre,
        description: data.description,
        date_fin: data.dateFin,
        objectif_valeur: data.objectifValeur,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        apiMode && result.updatedAt
          ? `Défi modifié (maj ${new Date(result.updatedAt).toLocaleString("fr-FR")}).`
          : "Défi modifié."
      );
    } else {
      const result = await createChallengePersisted({
        titre: data.titre,
        type: data.type,
        objectif_valeur: data.objectifValeur,
        badge_id: data.badgeId,
        date_debut: data.dateDebut,
        date_fin: data.dateFin,
        description: data.description,
        points_bonus: data.pointsRecompense,
        categorie_id: data.categorieId,
        auteur_id: data.auteurId,
        livre_id: data.livreId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        apiMode
          ? "Défi créé avec succès."
          : "Défi créé."
      );
    }
    await refresh();
    setModalDefi(null);
    setDefiEdition(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Défis & Badges")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Défis &amp; Badges
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gamification et récompenses lecteurs
          </p>
        </div>
        {onglet === "defis" && (
          <Button
            onClick={() => {
              setDefiEdition(null);
              setModalDefi("creer");
            }}
          >
            Créer un défi
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Défis actifs
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.actifs}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Badges actifs
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.badgesActifs}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Participants (tous défis)
          </span>
          <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {stats.participants}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setOnglet("defis")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            onglet === "defis"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Défis
        </button>
        <button
          type="button"
          onClick={() => setOnglet("badges")}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            onglet === "badges"
              ? "border-b-2 border-brand-500 text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Badges
        </button>
      </div>

      {onglet === "defis" && (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] lg:flex-row lg:items-end">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="search-defi">Rechercher</Label>
              <Input
                key={champRechercheKey}
                id="search-defi"
                type="text"
                placeholder="Titre ou description…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full min-w-[140px] sm:w-44">
              <Label htmlFor="defi-statut-filtre">
                Statut
              </Label>
              <select
                id="defi-statut-filtre"
                className={selectClass}
                value={filtreStatut}
                onChange={(e) =>
                  setFiltreStatut(e.target.value as FiltreDefi)
                }
              >
                <option value="tous">Tous</option>
                <option value="ACTIF">Actif</option>
                <option value="TERMINE">Terminé</option>
                {!apiMode && (
                  <option value="BROUILLON">Brouillon (local)</option>
                )}
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement…
            </p>
          ) : listeDefis.length === 0 ? (
            <EmptyState
              icon={<BoltIcon className="size-7" />}
              message={
                apiMode
                  ? "Aucun défi en base (ou filtre trop restrictif)."
                  : "Aucun défi trouvé pour ce filtre."
              }
              onReset={reinitialiserFiltres}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[960px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        {[
                          "Titre",
                          "Objectif",
                          "Points",
                          "Période",
                          "Statut",
                          "Participants",
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
                      {listeDefis.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="px-4 py-3 text-start">
                            <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                              {d.titre}
                            </span>
                            <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                              {d.type ? `${d.type}` : ""}
                              {d.badgeNom ? ` · Badge : ${d.badgeNom}` : ""}
                              {!d.type && !d.badgeNom && d.description
                                ? d.description
                                : ""}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {d.objectif}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-brand-500">
                            {d.pointsRecompense} pts
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {formatDate(d.dateDebut)} — {formatDate(d.dateFin)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            {d.statut === "ACTIF" && (
                              <Badge color="success" size="sm" variant="light">
                                Actif
                              </Badge>
                            )}
                            {d.statut === "TERMINE" && (
                              <Badge color="light" size="sm" variant="light">
                                Terminé
                              </Badge>
                            )}
                            {d.statut === "BROUILLON" && (
                              <Badge color="warning" size="sm" variant="light">
                                Brouillon
                              </Badge>
                            )}
                            {d.statut === "ANNULE" && (
                              <Badge color="error" size="sm" variant="light">
                                Annulé
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-800 dark:text-white/90">
                            {apiMode ? (
                              <button
                                type="button"
                                title="Voir les participants"
                                onClick={() => ouvrirParticipants(d)}
                                className="font-medium text-brand-500 hover:underline"
                              >
                                {d.participants}
                              </button>
                            ) : (
                              d.participants
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex gap-1.5">
                              {apiMode && (
                                <button
                                  type="button"
                                  title="Participants"
                                  onClick={() => ouvrirParticipants(d)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:text-brand-500 dark:ring-gray-700"
                                >
                                  <GroupIcon className="size-4" />
                                </button>
                              )}
                              {(!apiMode || d.statut === "ACTIF") && (
                                <button
                                  type="button"
                                  title="Modifier"
                                  onClick={() => {
                                    setDefiEdition(d);
                                    setModalDefi("modifier");
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:text-brand-500 dark:ring-gray-700"
                                >
                                  <PencilIcon className="size-4" />
                                </button>
                              )}
                              {d.statut === "ACTIF" && (
                                <button
                                  type="button"
                                  title="Annuler le défi"
                                  onClick={() => setAnnulerCible(d)}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 hover:text-error-500 dark:ring-gray-700"
                                >
                                  <TrashBinIcon className="size-4" />
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
        </>
      )}

      {onglet === "badges" && (
        <>
          <div className="flex justify-end">
            <Button
              disabled={apiMode && !apiSessionReady}
              onClick={() => {
                if (apiMode && !apiSessionReady) {
                  toast.error("Connectez-vous avec un compte ADMIN.");
                  return;
                }
                setBadgeEdition(null);
                setBadgeForm(defaultBadgeForm());
                setModalBadge("creer");
              }}
            >
              Créer un badge
            </Button>
          </div>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement…
          </p>
        ) : badgesVisibles.length === 0 ? (
          <EmptyState
            icon={<PencilIcon className="size-7" />}
            message={
              apiMode
                ? "Aucun badge en base. Créez-en un pour l’associer à un défi."
                : "Aucun badge. Créez-en un pour commencer."
            }
            resetLabel="Créer un badge"
            onReset={() => {
              if (apiMode && !apiSessionReady) {
                toast.error("Connectez-vous avec un compte ADMIN.");
                return;
              }
              setBadgeEdition(null);
              setBadgeForm(defaultBadgeForm());
              setModalBadge("creer");
            }}
          />
        ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {badgesVisibles.map((b) => (
            <article
              key={b.id}
              className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 ${
                !b.actif ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {b.nom}
                </h2>
                <Badge
                  color={RARETE_COLORS[b.rarete]}
                  size="sm"
                  variant="light"
                >
                  {RARETE_LABELS[b.rarete]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {b.description}
              </p>
              <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Condition : {b.condition}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Intl.NumberFormat("fr-FR").format(b.nbAttribues)}{" "}
                {apiMode ? "utilisateur(s)" : "attribution(s)"}
              </p>
              {b.icone && (
                <img
                  src={b.icone}
                  alt=""
                  className="mt-3 h-12 w-12 object-contain"
                />
              )}
              <p className="mt-2 text-theme-xs text-gray-500">
                {b.points ?? 0} points · {b.couleur ?? "—"}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  disabled={apiMode && !apiSessionReady}
                  onClick={() => {
                    if (apiMode && !apiSessionReady) {
                      toast.error("Connectez-vous avec un compte ADMIN.");
                      return;
                    }
                    setBadgeEdition(b);
                    setBadgeForm(badgeToForm(b));
                    setModalBadge("modifier");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-1.5 text-theme-xs font-medium text-brand-600 hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-400"
                >
                  <PencilIcon className="size-4" />
                  Modifier
                </button>
              </div>
            </article>
          ))}
        </div>
        )}
        </>
      )}

      <Modal
        isOpen={modalBadge != null}
        onClose={() => {
          setModalBadge(null);
          setBadgeEdition(null);
        }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalBadge === "modifier" ? "Modifier le badge" : "Nouveau badge"}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              const nom = badgeForm.nom.trim();
              if (!nom) {
                toast.error("Le nom est obligatoire.");
                return;
              }
              if (nom.length > BADGE_NOM_MAX_LENGTH) {
                toast.error(
                  `Le nom ne peut pas dépasser ${BADGE_NOM_MAX_LENGTH} caractères.`
                );
                return;
              }
              const couleur = badgeForm.couleur.trim();
              if (!/^#[0-9A-Fa-f]{6}$/.test(couleur)) {
                toast.error("Couleur au format #RRGGBB requis.");
                return;
              }
              const points = Number(badgeForm.points);
              if (!Number.isInteger(points) || points < 0) {
                toast.error("Les points doivent être un entier ≥ 0.");
                return;
              }
              const isEdit = modalBadge === "modifier" && badgeEdition != null;
              if (!isEdit && !badgeForm.iconeFile) {
                toast.error("L’icône (fichier) est obligatoire.");
                return;
              }
              if (
                badgeForm.iconeFile &&
                badgeForm.iconeFile.size > BADGE_ICONE_MAX_BYTES
              ) {
                toast.error("Icône trop volumineuse — taille maximale 5 Mo.");
                return;
              }
              setBadgeSubmitting(true);
              if (isEdit && badgeEdition) {
                const result = await updateBadgePersisted(badgeEdition.id, {
                  nom,
                  couleur,
                  points,
                  description: badgeForm.description.trim(),
                  iconeFile: badgeForm.iconeFile ?? undefined,
                });
                setBadgeSubmitting(false);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  apiMode && result.updatedAt
                    ? `Badge mis à jour (maj ${new Date(result.updatedAt).toLocaleString("fr-FR")}${result.icone ? ", icône Cloudinary remplacée" : ""}).`
                    : "Badge mis à jour."
                );
              } else {
                const result = await createBadgePersisted({
                  nom,
                  couleur,
                  points,
                  description: badgeForm.description.trim() || undefined,
                  iconeFile: badgeForm.iconeFile!,
                });
                setBadgeSubmitting(false);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  apiMode && result.badge.icone
                    ? "Badge créé — icône hébergée sur Cloudinary."
                    : "Badge créé."
                );
              }
              setBadgeForm(defaultBadgeForm());
              setBadgeEdition(null);
              setModalBadge(null);
              await refresh();
            })();
          }}
        >
          <div>
            <Label htmlFor="badge-nom">Nom *</Label>
            <Input
              id="badge-nom"
              type="text"
              required
              maxLength={BADGE_NOM_MAX_LENGTH}
              value={badgeForm.nom}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, nom: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="badge-couleur">Couleur (#RRGGBB) *</Label>
            <Input
              id="badge-couleur"
              type="text"
              required
              value={badgeForm.couleur}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, couleur: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="badge-points">Points *</Label>
            <Input
              id="badge-points"
              type="number"
              min="0"
              required
              value={badgeForm.points}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, points: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="badge-desc">Description</Label>
            <TextArea
              rows={2}
              value={badgeForm.description}
              onChange={(v) =>
                setBadgeForm((f) => ({ ...f, description: v }))
              }
            />
          </div>
          <BadgeIconUploader
            value={badgeForm.iconePreview}
            badgeName={badgeForm.nom.trim() || badgeEdition?.nom || "Badge"}
            required={modalBadge === "creer"}
            onChange={(file, previewUrl) =>
              setBadgeForm((f) => ({
                ...f,
                iconeFile: file,
                iconePreview: previewUrl,
              }))
            }
          />
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => {
                setModalBadge(null);
                setBadgeEdition(null);
              }}
            >
              Annuler
            </Button>
            <button
              type="submit"
              disabled={badgeSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {badgeSubmitting
                ? "Enregistrement…"
                : modalBadge === "modifier"
                  ? "Enregistrer"
                  : "Créer le badge"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalDefi != null}
        onClose={() => {
          setModalDefi(null);
          setDefiEdition(null);
        }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalDefi === "modifier" ? "Modifier le défi" : "Nouveau défi"}
        </h2>
        <DefiForm
          key={defiEdition?.id ?? "new"}
          initial={defiEdition ?? undefined}
          badges={badges}
          categories={categories}
          auteurs={auteurs}
          livres={livres}
          apiMode={apiMode}
          submitLabel="Enregistrer"
          onCancel={() => {
            setModalDefi(null);
            setDefiEdition(null);
          }}
          onSubmit={(data) => void enregistrerDefi(data)}
        />
      </Modal>

      <Modal
        isOpen={participantsCible != null}
        onClose={() => {
          setParticipantsCible(null);
          setParticipantsRows([]);
          setParticipantsMeta(null);
          setParticipantsError(null);
        }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8"
      >
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Participants
        </h2>
        {participantsCible && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Défi : <strong>{participantsCible.titre}</strong>
          </p>
        )}
        <div className="mb-4 w-full sm:w-56">
          <Label htmlFor="participant-statut-filtre">Statut</Label>
          <select
            id="participant-statut-filtre"
            className={selectClass}
            value={participantsFiltre}
            onChange={(e) => {
              setParticipantsFiltre(e.target.value as FiltreParticipant);
              setParticipantsPage(1);
            }}
          >
            <option value="tous">Tous</option>
            <option value="EN_COURS">En cours</option>
            <option value="COMPLETE">Complété</option>
            <option value="ECHOUE">Échoué</option>
          </select>
        </div>
        {participantsLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement…
          </p>
        ) : participantsError ? (
          <p className="text-sm text-error-500">{participantsError}</p>
        ) : participantsRows.length === 0 ? (
          <EmptyState
            icon={<GroupIcon className="size-7" />}
            message="Aucun participant pour ce filtre."
            onReset={() => {
              setParticipantsFiltre("tous");
              setParticipantsPage(1);
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Utilisateur",
                      "Progression",
                      "Statut",
                      "Complétion",
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
                  {participantsRows.map((row) => (
                    <TableRow key={row.auth.id}>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {participantNom(row)}
                        </span>
                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {row.auth.email}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {row.progression}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge
                          color={PARTICIPANT_STATUT_COLORS[row.statut]}
                          size="sm"
                          variant="light"
                        >
                          {PARTICIPANT_STATUT_LABELS[row.statut]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(row.date_completion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {participantsMeta && participantsMeta.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {participantsMeta.page} / {participantsMeta.total_pages} —{" "}
              {participantsMeta.total} participant
              {participantsMeta.total > 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={participantsPage <= 1 || participantsLoading}
                onClick={() => setParticipantsPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  participantsPage >= participantsMeta.total_pages ||
                  participantsLoading
                }
                onClick={() => setParticipantsPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={annulerCible != null}
        onClose={() => setAnnulerCible(null)}
        onConfirm={async () => {
          if (!annulerCible) return;
          const result = await cancelChallengePersisted(annulerCible.id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          await refresh();
          const nb = result.nb_utilisateurs_echoues;
          toast.success(
            nb > 0
              ? `Défi annulé (${result.statut}). ${nb} participant${nb > 1 ? "s" : ""} en cours marqué${nb > 1 ? "s" : ""} comme échoué${nb > 1 ? "s" : ""}.`
              : `Défi annulé (${result.statut}).`
          );
          setAnnulerCible(null);
        }}
        title="Annuler ce défi ?"
        description={
          annulerCible ? (
            <>
              « {annulerCible.titre} » passera au statut <strong>ANNULE</strong>.
              Les participations <strong>EN_COURS</strong> seront marquées{" "}
              <strong>ECHOUE</strong> (RG63).
            </>
          ) : null
        }
        confirmLabel="Annuler le défi"
        variant="warning"
      />
    </div>
  );
}
