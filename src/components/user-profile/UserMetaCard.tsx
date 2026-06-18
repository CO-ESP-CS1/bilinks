"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ProfileEditModal } from "./ProfileEditModal";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_AVATAR, getDisplayName } from "@/lib/auth/admin-auth";
import { MAX_PROFILE_PHOTO_BYTES } from "@/lib/profile-store";
import toast from "react-hot-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function hasUploadedPhoto(url: string): boolean {
  return url !== DEFAULT_AVATAR && !url.startsWith("data:");
}

export default function UserMetaCard() {
  const { admin, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  if (!admin) return null;

  const displayName = getDisplayName(admin);
  const photoBusy = uploadingPhoto || removingPhoto;

  const openEditModal = () => {
    setNom(displayName);
    setFonction(admin.fonction);
    setLocalisation(admin.localisation);
    openModal();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formats acceptés : JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      toast.error("Image trop lourde (max. 5 Mo).");
      return;
    }

    setUploadingPhoto(true);
    const result = await uploadAvatar(file);
    setUploadingPhoto(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Photo de profil mise à jour.");
  };

  const handleRemovePhoto = async () => {
    if (!hasUploadedPhoto(admin.avatarUrl)) return;

    setRemovingPhoto(true);
    const result = await removeAvatar();
    setRemovingPhoto(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Photo de profil supprimée.");
  };

  const handleSave = async () => {
    const parts = nom.trim().split(/\s+/);
    const prenom = parts[0] ?? admin.prenom;
    const nomFamille = parts.slice(1).join(" ") || admin.nom;

    setSubmitting(true);
    const result = await updateProfile({
      prenom,
      nom: nomFamille,
      fonction: fonction.trim(),
      localisation: localisation.trim(),
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Profil mis à jour.");
    closeModal();
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col items-center gap-5 xl:flex-row">
            <div className="relative shrink-0">
              <div
                className={`h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800 ${
                  photoBusy ? "opacity-60" : ""
                }`}
              >
                <Image
                  width={80}
                  height={80}
                  src={admin.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  unoptimized={admin.avatarUrl.startsWith("data:")}
                />
              </div>
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full bg-brand-500 px-2 py-1 text-[10px] font-medium text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingPhoto ? "…" : "Photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={photoBusy}
                onChange={(e) => void handleAvatarChange(e)}
              />
            </div>
            <div className="text-center xl:text-left">
              <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                {displayName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {admin.fonction} · {admin.localisation}
              </p>
              <p className="mt-1 text-xs text-gray-400">{admin.email}</p>
              {hasUploadedPhoto(admin.avatarUrl) && (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => void handleRemovePhoto()}
                  className="mt-2 text-xs font-medium text-error-500 hover:text-error-600 disabled:opacity-60"
                >
                  {removingPhoto ? "Suppression…" : "Supprimer la photo"}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 lg:inline-flex lg:w-auto"
          >
            Modifier le profil
          </button>
        </div>
      </div>

      <ProfileEditModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        submitting={submitting}
        title="Modifier le profil public"
        description="Le nom affiché est synchronisé avec le serveur. Fonction et localisation restent locales à l'interface admin."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="meta-nom">Nom affiché</Label>
            <Input
              id="meta-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="meta-role">Fonction</Label>
            <Input
              id="meta-role"
              type="text"
              value={fonction}
              onChange={(e) => setFonction(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="meta-lieu">Localisation</Label>
            <Input
              id="meta-lieu"
              type="text"
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      </ProfileEditModal>
    </>
  );
}
