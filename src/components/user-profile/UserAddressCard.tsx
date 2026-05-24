"use client";

import React from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { ProfileEditModal } from "./ProfileEditModal";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSave = () => {
    console.log("Saving changes...");
    closeModal();
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Adresse
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Pays
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Congo
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Ville
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Brazzaville
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Code postal
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                —</p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Quartier
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Centre-ville
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 lg:inline-flex lg:w-auto"
        >
          Modifier
        </button>
      </div>

      <ProfileEditModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        title="Modifier l'adresse"
        description="Coordonnées affichées sur votre profil."
        maxWidth="md"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="addr-pays">Pays</Label>
            <Input id="addr-pays" type="text" defaultValue="Congo" />
          </div>
          <div>
            <Label htmlFor="addr-ville">Ville</Label>
            <Input id="addr-ville" type="text" defaultValue="Brazzaville" />
          </div>
          <div>
            <Label htmlFor="addr-cp">Code postal</Label>
            <Input id="addr-cp" type="text" placeholder="Optionnel" />
          </div>
          <div>
            <Label htmlFor="addr-quartier">Quartier</Label>
            <Input id="addr-quartier" type="text" defaultValue="Centre-ville" />
          </div>
        </div>
      </ProfileEditModal>
    </div>
  );
}
