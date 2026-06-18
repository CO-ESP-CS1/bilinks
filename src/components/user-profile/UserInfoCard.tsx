"use client";

import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ProfileEditModal } from "./ProfileEditModal";
import { useAuth } from "@/context/AuthContext";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import toast from "react-hot-toast";

export default function UserInfoCard() {
  const { admin, updateProfile } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!admin) return null;

  const apiMode = isApiConfigured();
  const apiSessionReady = !apiMode || hasApiSession();

  const openEdit = () => {
    setPrenom(admin.prenom);
    setNom(admin.nom);
    setEmail(admin.email);
    openModal();
  };

  const handleSave = async () => {
    const nextPrenom = prenom.trim();
    const nextNom = nom.trim();

    if (!nextPrenom) {
      toast.error("Le prénom est obligatoire.");
      return;
    }
    if (!nextNom) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    if (apiMode && !apiSessionReady) {
      toast.error("Connectez-vous pour modifier votre profil.");
      return;
    }

    setSubmitting(true);
    const result = await updateProfile({
      prenom: nextPrenom,
      nom: nextNom,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Informations mises à jour.");
    closeModal();
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Informations personnelles
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Prénom
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {admin.prenom}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Nom
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {admin.nom}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                E-mail (identifiant de connexion)
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {admin.email}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 lg:inline-flex lg:w-auto"
        >
          Modifier
        </button>
      </div>

      <ProfileEditModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        submitting={submitting}
        title="Modifier les informations"
        description="Le prénom et le nom sont enregistrés sur le serveur (l'e-mail ne change pas ici)."
        maxWidth="md"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="profil-prenom">Prénom</Label>
            <Input
              id="profil-prenom"
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="profil-nom">Nom</Label>
            <Input
              id="profil-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="profil-email">E-mail</Label>
            <Input
              id="profil-email"
              type="email"
              value={email}
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Pour changer l&apos;e-mail, créez un nouvel administrateur.
            </p>
          </div>
        </div>
      </ProfileEditModal>
    </div>
  );
}
