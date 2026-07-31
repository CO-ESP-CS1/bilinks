"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { PencilIcon, TrashBinIcon, VideoIcon } from "@/icons";
import { isApiConfigured } from "@/lib/api/client";
import {
  activateChannel,
  createChannel,
  deactivateChannel,
  deleteChannel,
  fetchChannels,
  resolveChannels,
  triggerSync,
  updateChannelMaxVideos,
  type AdminChannel,
  type ResolvedChannel,
  type SyncResult,
} from "@/lib/youtube-store";
import { useAdminPageSearch } from "@/context/AdminPageSearchContext";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Icônes inline ────────────────────────────────────────────────────────────

function PlayCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 8.5l6 3.5-6 3.5V8.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToggleIcon({ actif }: { actif: boolean }) {
  return actif ? (
    // Pause / désactiver
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  ) : (
    // Play / activer
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
    </svg>
  );
}

// ─── Formulaire ajout chaîne ──────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function fmtSubscribers(n: number | null): string | null {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M abonnés`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k abonnés`;
  return `${n} abonnés`;
}

function ChannelForm({
  onSave,
  onCancel,
}: {
  onSave: (data: {
    channel_id: string;
    nom: string;
    description: string;
    thumbnail_url: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ResolvedChannel[]>([]);
  const [searched, setSearched] = useState(false);

  const [selected, setSelected] = useState<ResolvedChannel | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    const result = await resolveChannels(query.trim());
    setSearching(false);
    setSearched(true);
    if (!result.ok) {
      setSearchError(result.error);
      setResults([]);
      return;
    }
    setResults(result.data);
  };

  const pickChannel = (channel: ResolvedChannel) => {
    setSelected(channel);
    setNom(channel.nom);
    setDescription(channel.description);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !nom.trim()) return;
    setSubmitting(true);
    await onSave({
      channel_id: selected.channel_id,
      nom: nom.trim(),
      description: description.trim(),
      thumbnail_url: selected.thumbnail_url ?? "",
    });
    setSubmitting(false);
  };

  // ─── Étape 2 : confirmation de la chaîne sélectionnée ──────────────────────
  if (selected) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Confirmer la chaîne
        </h2>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          {selected.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.thumbnail_url}
              alt={selected.nom}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <PlayCircleIcon className="size-6 text-brand-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
              {selected.nom}
            </p>
            <p className="truncate text-xs text-gray-400">{selected.channel_id}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Changer
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="yt-nom">Nom affiché *</Label>
            <Input
              id="yt-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              error={!nom.trim()}
            />
            {!nom.trim() && (
              <p className="mt-1 text-sm text-error-500">Le nom est obligatoire.</p>
            )}
          </div>

          <div>
            <Label htmlFor="yt-desc">Description</Label>
            <TextArea
              rows={3}
              value={description}
              onChange={setDescription}
              placeholder="Brève présentation de la chaîne…"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <button
              type="submit"
              disabled={submitting || !nom.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? "Import des vidéos…" : "Référencer la chaîne"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Étape 1 : recherche ────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Référencer une chaîne YouTube
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Collez le lien de la chaîne, son @identifiant, ou tapez simplement son nom.
      </p>

      <form onSubmit={(e) => void runSearch(e)} className="mt-4 flex gap-2">
        <Input
          id="yt-query"
          type="text"
          placeholder="Ex : Khan Academy France, @KhanAcademyFr, ou un lien youtube.com/…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          <SearchIcon className={`size-4 ${searching ? "animate-pulse" : ""}`} />
          {searching ? "…" : "Chercher"}
        </button>
      </form>

      {searchError && (
        <p className="mt-3 text-sm text-error-500">{searchError}</p>
      )}

      {searched && !searching && !searchError && results.length === 0 && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Aucune chaîne trouvée pour « {query} ». Essayez un autre nom ou collez
          directement le lien de la chaîne.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r) => (
            <button
              key={r.channel_id}
              type="button"
              onClick={() => pickChannel(r)}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5"
            >
              {r.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.thumbnail_url}
                  alt={r.nom}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                  <PlayCircleIcon className="size-5 text-brand-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                  {r.nom}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {fmtSubscribers(r.subscriber_count) ?? r.channel_id}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

// ─── Carte chaîne ─────────────────────────────────────────────────────────────

function ChannelCard({
  channel,
  onToggle,
  onDelete,
  onEditMaxVideos,
}: {
  channel: AdminChannel;
  onToggle: (ch: AdminChannel) => void;
  onDelete: (ch: AdminChannel) => void;
  onEditMaxVideos: (ch: AdminChannel) => void;
}) {
  const ytUrl = `https://www.youtube.com/channel/${channel.channel_id}`;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Overlay grisé si inactif */}
      {!channel.actif && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-gray-100/75 dark:bg-gray-900/65"
          aria-hidden
        />
      )}

      <div className={`relative z-[2] flex flex-1 flex-col p-5 md:p-6 ${!channel.actif ? "opacity-80" : ""}`}>
        {/* En-tête : avatar + badges */}
        <div className="flex items-start gap-3">
          {channel.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.thumbnail_url}
              alt={channel.nom}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 ring-2 ring-gray-100 dark:bg-brand-500/10 dark:ring-gray-800">
              <PlayCircleIcon className="size-6 text-brand-500" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                {channel.nom}
              </h2>
              <Badge
                color={channel.actif ? "success" : "light"}
                size="sm"
                variant="light"
              >
                {channel.actif ? "Active" : "Inactive"}
              </Badge>
            </div>

            <a
              href={ytUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors"
              title="Voir la chaîne sur YouTube"
            >
              <svg className="size-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 4.84 4.84 0 00-4.82 0 4.83 4.83 0 01-3.77 2.75A4.78 4.78 0 005.5 12a4.78 4.78 0 002.73 4.31 4.83 4.83 0 013.77 2.75 4.84 4.84 0 004.82 0 4.83 4.83 0 013.77-2.75A4.78 4.78 0 0022.5 12a4.78 4.78 0 00-2.91-5.31z" />
              </svg>
              {channel.channel_id}
            </a>
          </div>
        </div>

        {/* Description */}
        {channel.description && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {channel.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Vidéos indexées</p>
            <p className="mt-0.5 text-lg font-bold text-gray-800 dark:text-white/90">
              {channel.nb_videos.toLocaleString("fr-FR")}
              <span className="ml-1 text-xs font-normal text-gray-400">
                / {channel.max_videos ?? 20}
              </span>
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">Dernière sync</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              {fmtDate(channel.last_synced_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            title={channel.actif ? "Désactiver la chaîne" : "Activer la chaîne"}
            onClick={() => onToggle(channel)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition hover:bg-gray-50 dark:hover:bg-white/5 ${
              channel.actif
                ? "text-warning-500 ring-warning-200 hover:text-warning-600 dark:ring-warning-800"
                : "text-success-500 ring-success-200 hover:text-success-600 dark:ring-success-800"
            }`}
          >
            <ToggleIcon actif={channel.actif} />
          </button>

          <button
            type="button"
            title="Modifier le nombre de vidéos conservées"
            onClick={() => onEditMaxVideos(channel)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 hover:text-brand-500 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/5"
          >
            <PencilIcon className="size-4" />
          </button>

          <button
            type="button"
            title="Supprimer la chaîne et ses vidéos"
            onClick={() => onDelete(channel)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-error-500 ring-1 ring-error-200 transition hover:bg-error-50 hover:text-error-600 dark:ring-error-800 dark:hover:bg-error-500/10"
          >
            <TrashBinIcon className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function VideosEducativesPage() {
  const apiMode = isApiConfigured();
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleCible, setToggleCible] = useState<AdminChannel | null>(null);
  const [deleteCible, setDeleteCible] = useState<AdminChannel | null>(null);
  const [editCible, setEditCible] = useState<AdminChannel | null>(null);
  const [maxVideosInput, setMaxVideosInput] = useState("20");
  const [editEnCours, setEditEnCours] = useState(false);
  const { query: search, setQuery: setSearch } = useAdminPageSearch({
    placeholder: "Rechercher une chaîne YouTube…",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchChannels();
    setLoading(false);
    if (result.ok) {
      setChannels(result.data);
    } else {
      toast.error(result.error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = channels.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nom.toLowerCase().includes(q) ||
      c.channel_id.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  const handleAddChannel = async (data: {
    channel_id: string;
    nom: string;
    description: string;
    thumbnail_url: string;
  }) => {
    const result = await createChannel({
      channel_id: data.channel_id,
      nom: data.nom,
      description: data.description || undefined,
      thumbnail_url: data.thumbnail_url || undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const { nom, videos_importees } = result.data;
    toast.success(
      videos_importees > 0
        ? `Chaîne « ${nom} » référencée, ${videos_importees} vidéo${videos_importees > 1 ? "s" : ""} importée${videos_importees > 1 ? "s" : ""}.`
        : `Chaîne « ${nom} » référencée avec succès.`
    );
    setModalOpen(false);
    await refresh();
  };

  const handleToggle = async () => {
    if (!toggleCible) return;
    const fn = toggleCible.actif ? deactivateChannel : activateChannel;
    const result = await fn(toggleCible.id);
    if (!result.ok) {
      toast.error(result.error);
      setToggleCible(null);
      return;
    }
    toast.success(
      toggleCible.actif
        ? `« ${toggleCible.nom} » désactivée.`
        : `« ${toggleCible.nom} » activée.`
    );
    setToggleCible(null);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteCible) return;
    const result = await deleteChannel(deleteCible.id);
    if (!result.ok) {
      toast.error(result.error);
      setDeleteCible(null);
      return;
    }
    toast.success(`« ${deleteCible.nom} » et ses vidéos supprimées.`);
    setDeleteCible(null);
    await refresh();
  };

  const openEditMaxVideos = (ch: AdminChannel) => {
    setEditCible(ch);
    setMaxVideosInput(String(ch.max_videos ?? 20));
  };

  const handleEditMaxVideos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCible || editEnCours) return;
    const n = Number(maxVideosInput);
    if (!Number.isInteger(n) || n < 5 || n > 60) {
      toast.error("Choisissez un nombre entier entre 5 et 60.");
      return;
    }
    setEditEnCours(true);
    try {
      const result = await updateChannelMaxVideos(editCible.id, n);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `« ${editCible.nom} » : ${result.data.upserted} vidéo${result.data.upserted > 1 ? "s" : ""} désormais conservée${result.data.upserted > 1 ? "s" : ""} (limite : ${n}).`
      );
      setEditCible(null);
      await refresh();
    } finally {
      setEditEnCours(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const result = await triggerSync();
    setSyncing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSyncResult(result.data);
    toast.success(
      `Synchronisation terminée, ${result.data.videos_upserted} vidéo${result.data.videos_upserted > 1 ? "s" : ""} mises à jour.`
    );
    await refresh();
  };

  const totalVideos = channels.reduce((acc, c) => acc + c.nb_videos, 0);
  const activeChannels = channels.filter((c) => c.actif).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Vidéos éducatives")} />

      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Vidéos éducatives
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les chaînes YouTube éducatives synchronisées dans l&apos;application.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing || !apiMode}
            onClick={() => void handleSync()}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-500/40 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-500/10 disabled:opacity-50 dark:text-brand-400"
          >
            <RefreshIcon className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
          </button>
          <Button onClick={() => setModalOpen(true)}>
            + Référencer une chaîne
          </Button>
        </div>
      </div>

      {/* Résultat sync */}
      {syncResult && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-success-500/30 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10">
          <div className="flex items-center gap-2 text-success-700 dark:text-success-300">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold">Synchronisation réussie</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-success-700 dark:text-success-300">
            <span>
              <strong>{syncResult.chaines_traitees}</strong> chaîne{syncResult.chaines_traitees > 1 ? "s" : ""} traitée{syncResult.chaines_traitees > 1 ? "s" : ""}
            </span>
            <span>
              <strong>{syncResult.videos_upserted}</strong> vidéo{syncResult.videos_upserted > 1 ? "s" : ""} synchronisée{syncResult.videos_upserted > 1 ? "s" : ""}
            </span>
            {syncResult.erreurs > 0 && (
              <span className="text-warning-600 dark:text-warning-400">
                <strong>{syncResult.erreurs}</strong> erreur{syncResult.erreurs > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSyncResult(null)}
            className="ml-auto text-success-500 hover:text-success-700"
            aria-label="Fermer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Chaînes totales</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {channels.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Chaînes actives</p>
          <p className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
            {activeChannels}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Vidéos indexées</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalVideos.toLocaleString("fr-FR")}
          </p>
        </div>
      </div>

      {/* Bannière non configuré */}
      {!apiMode && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 p-4 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          <strong>API non configurée</strong> : configurez{" "}
          <code className="rounded bg-warning-100 px-1 dark:bg-warning-500/20">
            NEXT_PUBLIC_API_BASE_URL
          </code>{" "}
          pour piloter les chaînes via l&apos;API.
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<VideoIcon className="size-7" />}
          message={
            search
              ? "Aucune chaîne ne correspond à cette recherche."
              : "Aucune chaîne référencée : ajoutez votre première chaîne YouTube éducative."
          }
          onReset={search ? () => setSearch("") : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {filtered.map((ch) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              onToggle={setToggleCible}
              onDelete={setDeleteCible}
              onEditMaxVideos={openEditMaxVideos}
            />
          ))}
        </div>
      )}

      {/* Modal ajout */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <ChannelForm
          onSave={handleAddChannel}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Modal édition nombre de vidéos */}
      <Modal
        isOpen={editCible != null}
        onClose={() => {
          if (editEnCours) return;
          setEditCible(null);
        }}
        className="max-w-sm p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Nombre de vidéos conservées
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          « {editCible?.nom} » : les vidéos les plus récentes au-delà de cette
          limite sont masquées de l&apos;application (pas supprimées).
        </p>
        <form onSubmit={(e) => void handleEditMaxVideos(e)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="max-videos">Nombre de vidéos (5 à 60) *</Label>
            <Input
              id="max-videos"
              type="number"
              min="5"
              max="60"
              value={maxVideosInput}
              onChange={(e) => setMaxVideosInput(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Plafonné à 60 pour protéger le quota gratuit de l&apos;API YouTube.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              variant="outline"
              type="button"
              disabled={editEnCours}
              onClick={() => setEditCible(null)}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </Button>
            <button
              type="submit"
              disabled={editEnCours}
              className="inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editEnCours ? "Mise à jour…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        isOpen={toggleCible != null}
        onClose={() => setToggleCible(null)}
        onConfirm={() => void handleToggle()}
        title={
          toggleCible?.actif
            ? "Désactiver cette chaîne ?"
            : "Activer cette chaîne ?"
        }
        description={
          toggleCible ? (
            toggleCible.actif ? (
              <>
                « {toggleCible.nom} » sera masquée de l&apos;application mobile.
                Les vidéos déjà indexées restent en base.
              </>
            ) : (
              <>
                « {toggleCible.nom} » sera de nouveau visible dans l&apos;onglet
                Vidéos éducatives. La prochaine sync récupérera les nouvelles vidéos.
              </>
            )
          ) : null
        }
        confirmLabel={toggleCible?.actif ? "Désactiver" : "Activer"}
        variant={toggleCible?.actif ? "warning" : "primary"}
      />

      {/* Confirm suppression */}
      <ConfirmDialog
        isOpen={deleteCible != null}
        onClose={() => setDeleteCible(null)}
        onConfirm={() => void handleDelete()}
        title="Supprimer cette chaîne ?"
        description={
          deleteCible ? (
            <>
              <strong>Action irréversible</strong> : « {deleteCible.nom} » et
              toutes ses {deleteCible.nb_videos} vidéo{deleteCible.nb_videos > 1 ? "s" : ""} indexées seront
              définitivement supprimées de la base de données.
            </>
          ) : null
        }
        confirmLabel="Supprimer définitivement"
        variant="danger"
      />
    </div>
  );
}
