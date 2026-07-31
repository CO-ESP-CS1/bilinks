"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReadingHabitsPanel } from "@/components/admin/ReadingHabitsPanel";
import { ExportDropdownButton } from "@/components/admin/ExportDropdownButton";
import type { MockUtilisateur } from "@/lib/mock-data";
import type { AdminUserDetailResponse } from "@/lib/api/admin-types";
import { isApiConfigured } from "@/lib/api/client";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserDetailPersisted,
  toggleUserBanPersisted,
} from "@/lib/users-store";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { formatXaf } from "@/lib/abonnements-utils";
import { getPlanLabel } from "@/lib/plans-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShootingStarIcon } from "@/icons";

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

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function UtilisateurProfilPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const apiMode = isApiConfigured();
  const { admin: currentAdmin } = useAuth();
  const [utilisateur, setUtilisateur] = useState<
    MockUtilisateur | null | undefined
  >(undefined);
  const [detail, setDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [raisonBan, setRaisonBan] = useState("");

  const recharger = useCallback(async () => {
    setLoadError(null);
    const result = await fetchUserDetailPersisted(id);
    if (!result.ok) {
      setUtilisateur(null);
      setDetail(null);
      setLoadError(result.error);
      return;
    }
    setUtilisateur(result.user);
    setDetail(result.detail);
  }, [id]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  const confirmerBanUnban = async () => {
    if (!utilisateur) return;
    if (
      apiMode &&
      currentAdmin?.id === utilisateur.id &&
      utilisateur.statut === "ACTIF"
    ) {
      toast.error("Vous ne pouvez pas vous bannir vous-même.");
      setBanDialogOpen(false);
      setRaisonBan("");
      return;
    }
    const result = await toggleUserBanPersisted(
      utilisateur.id,
      utilisateur.statut === "ACTIF" ? raisonBan : undefined,
      utilisateur.statut
    );
    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success(
        result.user.statut === "BANNI"
          ? `${utilisateur.prenom} ${utilisateur.nom} a été banni.`
          : `${utilisateur.prenom} ${utilisateur.nom} a été réactivé.`
      );
      await recharger();
    }
    setBanDialogOpen(false);
    setRaisonBan("");
  };

  if (utilisateur === undefined) {
    return null;
  }

  if (!utilisateur) {
    if (loadError && apiMode) {
      return (
        <div className="space-y-4 p-6">
          <p className="text-sm text-warning-600 dark:text-warning-400">
            {loadError}
          </p>
          <Link href="/admin/utilisateurs">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
        </div>
      );
    }
    notFound();
  }

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Utilisateurs", href: "/admin/utilisateurs" },
    { label: nomComplet },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold ${couleurAvatar(utilisateur.id)}`}
          >
            {initiales(utilisateur.nom, utilisateur.prenom)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {nomComplet}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {utilisateur.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {utilisateur.role === "ADMIN" ? (
                <Badge color="info" size="sm" variant="light">
                  Admin
                </Badge>
              ) : (
                <Badge color="light" size="sm" variant="light">
                  Utilisateur
                </Badge>
              )}
              {utilisateur.statut === "ACTIF" && (
                <Badge color="success" size="sm" variant="light">
                  Actif
                </Badge>
              )}
              {utilisateur.statut === "PENDING" && (
                <Badge color="warning" size="sm" variant="light">
                  En attente
                </Badge>
              )}
              {utilisateur.statut === "BANNI" && (
                <Badge color="error" size="sm" variant="light">
                  Banni
                </Badge>
              )}
              {utilisateur.abonnementActif ? (
                <Badge color="success" size="sm" variant="light">
                  Abonné
                </Badge>
              ) : (
                <Badge color="light" size="sm" variant="light">
                  Non abonné
                </Badge>
              )}
              {utilisateur.membreEtablissement && (
                <Badge color="info" size="sm" variant="light">
                  Membre du pack établissement
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ExportDropdownButton
            pdfPath={ADMIN_ROUTES.exports.userPdf(utilisateur.id)}
            xlsxPath={ADMIN_ROUTES.exports.userXlsx(utilisateur.id)}
            filenameBase={`blinks-utilisateur-${utilisateur.id}`}
          />
          <Link href="/admin/utilisateurs">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
          {apiMode &&
            (utilisateur.statut === "BANNI" || utilisateur.statut === "ACTIF") && (
              <Button
                variant={utilisateur.statut === "BANNI" ? "primary" : "outline"}
                disabled={
                  utilisateur.statut === "ACTIF" &&
                  currentAdmin?.id === utilisateur.id
                }
                onClick={() => {
                  setRaisonBan("");
                  setBanDialogOpen(true);
                }}
              >
                {utilisateur.statut === "BANNI" ? "Réactiver" : "Bannir"}
              </Button>
            )}
          <Link href={`/admin/utilisateurs/${utilisateur.id}/abonnement`}>
            <Button startIcon={<ShootingStarIcon className="size-5" />}>
              Voir l&apos;abonnement
            </Button>
          </Link>
        </div>
      </div>

      <ConfirmDialog
        isOpen={banDialogOpen}
        onClose={() => {
          setBanDialogOpen(false);
          setRaisonBan("");
        }}
        onConfirm={confirmerBanUnban}
        title={
          utilisateur.statut === "ACTIF"
            ? "Bannir cet utilisateur ?"
            : "Réactiver cet utilisateur ?"
        }
        description={
          utilisateur.statut === "ACTIF" ? (
            <>
              <p>
                « {utilisateur.prenom} {utilisateur.nom} » ne pourra plus
                accéder à l&apos;application.
              </p>
              <div className="mt-4">
                <Label htmlFor="profil-ban-raison">Raison (optionnelle)</Label>
                <Input
                  id="profil-ban-raison"
                  value={raisonBan}
                  onChange={(e) => setRaisonBan(e.target.value)}
                  placeholder="Ex. violation des conditions d'utilisation"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Journalisée côté serveur (non stockée en base).
                </p>
              </div>
            </>
          ) : (
            <>
              « {utilisateur.prenom} {utilisateur.nom} » retrouvera
              l&apos;accès à l&apos;application.
            </>
          )
        }
        confirmLabel={utilisateur.statut === "ACTIF" ? "Bannir" : "Réactiver"}
        variant={utilisateur.statut === "ACTIF" ? "danger" : "primary"}
      />

      <div className="grid grid-cols-1 gap-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="École" value={utilisateur.ecole} />
        <DetailItem label="Niveau" value={utilisateur.niveau} />
        <DetailItem
          label="Points"
          value={`★ ${formatEntier(utilisateur.points)}`}
        />
        <DetailItem
          label="Date d'inscription"
          value={formatDate(utilisateur.dateInscription)}
        />
        <DetailItem label="Identifiant" value={utilisateur.id} />
        {apiMode && detail && (
          <>
            <DetailItem
              label="Provider"
              value={detail.auth.auth_provider ?? "—"}
            />
            <DetailItem
              label="E-mail vérifié"
              value={detail.auth.email_verified ? "Oui" : "Non"}
            />
            <DetailItem
              label="Téléphone"
              value={detail.auth.numero_telephone ?? "—"}
            />
            {detail.personne.bio && (
              <DetailItem label="Bio" value={String(detail.personne.bio)} />
            )}
            {detail.personne.deleted_at && (
              <DetailItem
                label="Personne supprimée"
                value={formatDate(detail.personne.deleted_at)}
              />
            )}
          </>
        )}
      </div>

      {apiMode && detail && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Commentaires"
              value={detail.nb_commentaires ?? 0}
            />
            <StatCard label="Notes données" value={detail.nb_notes ?? 0} />
            <StatCard
              label="Défis complétés"
              value={detail.nb_defis_completes ?? 0}
            />
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
              Historique abonnements ({detail.abonnements.length})
            </h2>
            {detail.abonnements.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun abonnement.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Plan", "Statut", "Début", "Fin", "Renouvellement"].map(
                        (h) => (
                          <TableCell
                            key={h}
                            isHeader
                            className="px-4 py-3 text-theme-xs font-medium text-gray-500"
                          >
                            {h}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.abonnements.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {getPlanLabel(a.plan)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {a.statut}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                          {formatDate(a.date_debut)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                          {formatDate(a.date_fin)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                          {a.type_renouvellement}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
              Historique paiements ({detail.paiements.length})
            </h2>
            {detail.paiements.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun paiement.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        "Réf.",
                        "Plan",
                        "Montant",
                        "Statut",
                        "Opérateur",
                        "Date",
                      ].map((h) => (
                        <TableCell
                          key={h}
                          isHeader
                          className="px-4 py-3 text-theme-xs font-medium text-gray-500"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.paiements.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-4 py-3 text-theme-sm font-mono text-xs">
                          {p.ref_transaction}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {getPlanLabel(p.plan)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {formatXaf(p.montant)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {p.statut}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                          {p.operateur ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600">
                          {formatDate(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
              Habitudes de lecture
            </h2>
            <ReadingHabitsPanel userId={id} />
          </section>
        </>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
        {formatEntier(value)}
      </p>
    </div>
  );
}
