"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import type { MockAuteur } from "@/lib/mock-data";
import {
  createAuteur,
  getAllAuteurs,
  softDeleteAuteur,
} from "@/lib/auteurs-store";
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
import { PencilIcon } from "@/icons";

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

export default function AuteursPage() {
  const router = useRouter();
  const [auteurs, setAuteurs] = useState<MockAuteur[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [supprimerCible, setSupprimerCible] = useState<MockAuteur | null>(null);

  const refresh = useCallback(() => {
    setAuteurs(getAllAuteurs(true));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const confirmerSuppression = useCallback(() => {
    if (!supprimerCible) return;
    softDeleteAuteur(supprimerCible.id);
    refresh();
    toast.success(
      `« ${[supprimerCible.prenom, supprimerCible.nom].filter(Boolean).join(" ")} » marqué comme supprimé (soft delete).`
    );
    setSupprimerCible(null);
  }, [supprimerCible, refresh]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Auteurs")} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Auteurs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion des auteurs du catalogue
          </p>
        </div>
        <Button
          onClick={() => {
            setModalKey((k) => k + 1);
            setModalOuvert(true);
          }}
        >
          Ajouter un auteur
        </Button>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
        La suppression est un <strong>soft delete</strong> : la donnée reste
        en base, les livres liés restent cohérents.
      </div>

      {auteurs.length === 0 ? (
        <EmptyState
          icon={<PencilIcon className="size-7" />}
          message="Aucun auteur à afficher."
          onReset={refresh}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      "Avatar initiales",
                      "Nom",
                      "Prénom",
                      "Nb livres",
                      "Statut (soft delete)",
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
                  {auteurs.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="px-4 py-3 text-start">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${couleurAvatar(a.id)}`}
                        >
                          {initiales(a.nom, a.prenom)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {a.nom}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                        {a.prenom}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {a.nbLivres}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        {a.deletedAt == null ? (
                          <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                            Actif
                          </span>
                        ) : (
                          <Badge color="error" size="sm" variant="light">
                            Supprimé
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/auteurs/${a.id}/modifier`)
                            }
                            disabled={a.deletedAt != null}
                            className="rounded-lg bg-brand-500/15 px-3 py-1.5 text-theme-xs font-medium text-brand-600 hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400"
                          >
                            Modifier
                          </button>
                          {a.deletedAt == null ? (
                            <button
                              type="button"
                              onClick={() => setSupprimerCible(a)}
                              className="rounded-lg bg-error-500/15 px-3 py-1.5 text-theme-xs font-medium text-error-600 hover:bg-error-500/25 dark:text-error-400"
                            >
                              Supprimer
                            </button>
                          ) : (
                            <span className="text-theme-xs text-gray-400">—</span>
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

      <ConfirmDialog
        isOpen={supprimerCible != null}
        onClose={() => setSupprimerCible(null)}
        onConfirm={confirmerSuppression}
        title="Supprimer cet auteur ?"
        description={
          supprimerCible ? (
            <>
              « {[supprimerCible.prenom, supprimerCible.nom]
                .filter(Boolean)
                .join(" ")} » sera marqué comme supprimé (soft delete). Les livres
              liés restent en base.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        variant="danger"
      />

      <Modal
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <AjouterAuteurForm
          key={modalKey}
          onSuccess={() => {
            refresh();
            setModalOuvert(false);
            toast.success("Auteur enregistré.");
          }}
        />
      </Modal>

    </div>
  );
}

function AjouterAuteurForm({ onSuccess }: { onSuccess: () => void }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [bio, setBio] = useState("");
  const [errNom, setErrNom] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setErrNom(true);
      return;
    }
    setErrNom(false);
    const result = createAuteur({
      prenom: prenom.trim(),
      nom: nom.trim(),
    });
    if (!result.ok) {
      setErrNom(true);
      return;
    }
    onSuccess();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Ajouter un auteur
      </h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="auteur-prenom">Prénom</Label>
          <Input
            id="auteur-prenom"
            type="text"
            onChange={(e) => setPrenom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="auteur-nom">Nom *</Label>
          <Input
            id="auteur-nom"
            type="text"
            onChange={(e) => {
              setNom(e.target.value);
              setErrNom(false);
            }}
            error={errNom}
          />
          {errNom && (
            <p className="mt-1 text-sm text-error-500">Le nom est obligatoire.</p>
          )}
        </div>
        <div>
          <Label htmlFor="auteur-bio">Bio</Label>
          <TextArea
            rows={4}
            value={bio}
            onChange={setBio}
            placeholder="Biographie optionnelle…"
          />
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
