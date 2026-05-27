"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { BrandMark } from "@/components/common/BrandMark";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from "@/lib/auth/admin-auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SignInForm() {
  const { login, admin, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && admin) {
      const redirect = searchParams.get("redirect") || "/admin";
      router.replace(redirect);
    }
  }, [admin, isReady, router, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Bienvenue, ${result.admin.prenom} !`);
    const redirect = searchParams.get("redirect") || "/admin";
    router.push(redirect);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
      <div className="mx-auto w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-10">
          <BrandMark href="" showText theme="light" size="large" />
        </div>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Bon retour
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Connectez-vous à votre espace d&apos;administration
          </p>
        </div>

        {/* Identifiants démo */}
        <div className="mb-8 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
              <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-800 dark:text-white/90">
                Compte démo
              </p>
              <p className="mt-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                {DEFAULT_ADMIN_EMAIL}
              </p>
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {DEFAULT_ADMIN_PASSWORD}
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="signin-email">Adresse e-mail</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="admin@bibliotech.app"
              defaultValue={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password">Mot de passe</Label>
            </div>
            <div className="relative">
              <Input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Rester connecté
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#2563a0] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a3a5c]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#1a3a5c]/30 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connexion en cours…
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          BiblioTech &copy; {new Date().getFullYear()} — Plateforme de lecture numérique
        </p>
      </div>
    </div>
  );
}
