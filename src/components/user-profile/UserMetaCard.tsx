"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ProfileEditModal } from "./ProfileEditModal";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/lib/auth/admin-auth";
import toast from "react-hot-toast";

const MAX_AVATAR_BYTES = 800_000;

export default function UserMetaCard() {
  const { admin, updateProfile, setAvatar } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [localisation, setLocalisation] = useState("");

  if (!admin) return null;

  const displayName = getDisplayName(admin);

  const openEditModal = () => {
    setNom(displayName);
    setFonction(admin.fonction);
    setLocalisation(admin.localisation);
    openModal();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image trop lourde (max. 800 Ko).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      toast.success("Photo de profil mise à jour.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    const parts = nom.trim().split(/\s+/);
    const prenom = parts[0] ?? admin.prenom;
    const nomFamille = parts.slice(1).join(" ") || admin.nom;
    updateProfile({
      prenom,
      nom: nomFamille,
      fonction: fonction.trim(),
      localisation: localisation.trim(),
    });
    toast.success("Profil mis à jour.");
    closeModal();
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col items-center gap-5 xl:flex-row">
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
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
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full bg-brand-500 px-2 py-1 text-[10px] font-medium text-white shadow hover:bg-brand-600"
              >
                Photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
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
        title="Modifier le profil public"
        description="Nom affiché et localisation."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="meta-nom">Nom affiché</Label>
            <Input
              id="meta-nom"
              type="text"
              defaultValue={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="meta-role">Fonction</Label>
            <Input
              id="meta-role"
              type="text"
              defaultValue={fonction}
              onChange={(e) => setFonction(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="meta-lieu">Localisation</Label>
            <Input
              id="meta-lieu"
              type="text"
              defaultValue={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
            />
          </div>
        </div>
      </ProfileEditModal>
    </>
  );
}
