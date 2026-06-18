"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { isApiConfigured } from "@/lib/api/client";
import { changePasswordViaApi, hasApiSession } from "@/lib/api/session";

type FormErr = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;

export default function AccountSettingsPage() {
  const apiMode = isApiConfigured();
  const apiSessionReady = !apiMode || hasApiSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErr>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErr = {};

    if (!currentPassword.trim()) {
      next.currentPassword = "Le mot de passe actuel est obligatoire.";
    }
    if (!newPassword.trim()) {
      next.newPassword = "Le nouveau mot de passe est obligatoire.";
    } else if (newPassword.length < 8) {
      next.newPassword = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
    }
    if (!confirmPassword.trim()) {
      next.confirmPassword = "Confirmez le nouveau mot de passe.";
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (
      currentPassword &&
      newPassword &&
      currentPassword === newPassword
    ) {
      next.newPassword = "Le nouveau mot de passe doit être différent de l'actuel.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!apiMode) {
      toast.error("API non configurée — impossible de modifier le mot de passe.");
      return;
    }
    if (!apiSessionReady) {
      toast.error("Connectez-vous pour modifier votre mot de passe.");
      return;
    }

    setSubmitting(true);
    const result = await changePasswordViaApi({
      currentPassword,
      newPassword,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    toast.success("Mot de passe mis à jour avec succès.");
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={adminCrumb("Paramètres du compte")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Paramètres du compte
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sécurité et session de votre compte administrateur.
        </p>
      </div>

      {!apiMode && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          Configurez{" "}
          <code className="rounded bg-warning-100 px-1 dark:bg-warning-500/20">
            NEXT_PUBLIC_API_BASE_URL
          </code>{" "}
          pour modifier le mot de passe via l&apos;API.
        </div>
      )}

      {apiMode && !apiSessionReady && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          Connectez-vous avec un compte <strong>ADMIN</strong> pour modifier votre
          mot de passe.
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sécurité
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Modifiez votre mot de passe administrateur.
        </p>
        <form
          className="mt-6 grid max-w-lg grid-cols-1 gap-4"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div>
            <Label htmlFor="pwd-actuel">Mot de passe actuel</Label>
            <Input
              id="pwd-actuel"
              type="password"
              className="mt-2"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={!!errors.currentPassword}
              disabled={submitting}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-error-500">{errors.currentPassword}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pwd-nouveau">Nouveau mot de passe</Label>
            <Input
              id="pwd-nouveau"
              type="password"
              className="mt-2"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={!!errors.newPassword}
              disabled={submitting}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-error-500">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">8 caractères minimum.</p>
          </div>
          <div>
            <Label htmlFor="pwd-confirm">Confirmer</Label>
            <Input
              id="pwd-confirm"
              type="password"
              className="mt-2"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              disabled={submitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error-500">{errors.confirmPassword}</p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting || !apiMode || !apiSessionReady}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sessions
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestion des connexions actives.
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
