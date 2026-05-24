"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

export default function AccountSettingsPage() {
  const [langue, setLangue] = useState("fr");
  const [fuseau, setFuseau] = useState("Africa/Brazzaville");

  return (
    <div className="space-y-8">
      <Breadcrumb items={adminCrumb("Paramètres du compte")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Paramètres du compte
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sécurité, préférences et session (données locales en démo).
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sécurité
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Modifiez votre mot de passe administrateur.
        </p>
        <form
          className="mt-6 grid max-w-lg grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Mot de passe mis à jour (simulation).");
          }}
        >
          <div>
            <Label htmlFor="pwd-actuel">Mot de passe actuel</Label>
            <Input
              id="pwd-actuel"
              type="password"
              className="mt-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="pwd-nouveau">Nouveau mot de passe</Label>
            <Input
              id="pwd-nouveau"
              type="password"
              className="mt-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="pwd-confirm">Confirmer</Label>
            <Input
              id="pwd-confirm"
              type="password"
              className="mt-2"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              Enregistrer le mot de passe
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Préférences
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Langue d&apos;interface et fuseau horaire pour les rapports.
        </p>
        <div className="mt-6 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="langue">Langue</Label>
            <select
              id="langue"
              value={langue}
              onChange={(e) => setLangue(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <Label htmlFor="fuseau">Fuseau horaire</Label>
            <select
              id="fuseau"
              value={fuseau}
              onChange={(e) => setFuseau(e.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="Africa/Brazzaville">Africa/Brazzaville</option>
              <option value="Africa/Kinshasa">Africa/Kinshasa</option>
              <option value="Europe/Paris">Europe/Paris</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <Button
            onClick={() => toast.success("Préférences enregistrées (simulation).")}
          >
            Enregistrer les préférences
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sessions
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestion des connexions actives (à brancher sur votre API).
        </p>
        <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-4 py-3 dark:border-white/[0.06]">
            <span>Navigateur actuel — session active</span>
            <span className="text-theme-xs text-success-500">En ligne</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
