"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockAuteur } from "@/lib/mock-data";
import {
  fetchAuteursPersisted,
  getAuteurById,
  updateAuteurPersisted,
} from "@/lib/auteurs-store";
import { isSoftDeleted } from "@/lib/soft-delete";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";

export default function ModifierAuteurPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [auteur, setAuteur] = useState<MockAuteur | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAuteursPersisted();
      if (cancelled) return;
      setAuteur(getAuteurById(id));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!auteur || isSoftDeleted(auteur.deletedAt)) {
    notFound();
  }

  const nomComplet = [auteur.prenom, auteur.nom].filter(Boolean).join(" ");
  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Auteurs", href: "/admin/auteurs" },
    { label: nomComplet || auteur.nom, href: `/admin/auteurs/${auteur.id}` },
    { label: "Modifier" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Modifier l&apos;auteur
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {nomComplet || auteur.nom}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03] sm:p-8">
        <ModifierAuteurForm
          auteur={auteur}
          onSuccess={() => {
            toast.success("Auteur mis à jour.");
            router.push(`/admin/auteurs/${auteur.id}`);
          }}
          onCancel={() => router.push(`/admin/auteurs/${auteur.id}`)}
        />
      </div>
    </div>
  );
}

function ModifierAuteurForm({
  auteur,
  onSuccess,
  onCancel,
}: {
  auteur: MockAuteur;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [prenom, setPrenom] = useState(auteur.prenom);
  const [nom, setNom] = useState(auteur.nom);
  const [bio, setBio] = useState(auteur.bio ?? "");
  const [errNom, setErrNom] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await updateAuteurPersisted(auteur.id, {
        prenom: prenom.trim(),
        nom: nom.trim(),
        bio,
      });
      if (!result.ok) {
        setErrNom(true);
        toast.error(result.error);
        return;
      }
      setErrNom(false);
      onSuccess();
    },
    [auteur.id, prenom, nom, bio, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-auteur-prenom">Prénom</Label>
        <Input
          id="edit-auteur-prenom"
          type="text"
          defaultValue={prenom}
          onChange={(e) => setPrenom(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="edit-auteur-nom">Nom *</Label>
        <Input
          id="edit-auteur-nom"
          type="text"
          defaultValue={nom}
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
        <Label htmlFor="edit-auteur-bio">Bio</Label>
        <TextArea
          rows={4}
          value={bio}
          onChange={setBio}
          placeholder="Biographie optionnelle…"
        />
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-5 py-3.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
