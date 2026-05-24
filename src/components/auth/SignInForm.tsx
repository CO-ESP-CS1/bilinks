"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from "@/lib/auth/admin-auth";
import Link from "next/link";
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
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
            Connexion admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accédez à la console d&apos;administration BiblioTech.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-brand-500/25 bg-brand-500/5 p-4 text-sm dark:border-brand-500/20 dark:bg-brand-500/10">
          <p className="font-medium text-gray-800 dark:text-white/90">
            Compte par défaut (démo)
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            E-mail :{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-brand-600 dark:bg-gray-900 dark:text-brand-400">
              {DEFAULT_ADMIN_EMAIL}
            </code>
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Mot de passe :{" "}
            <code className="rounded bg-white/80 px-1.5 py-0.5 text-brand-600 dark:bg-gray-900 dark:text-brand-400">
              {DEFAULT_ADMIN_PASSWORD}
            </code>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="signin-email">
                E-mail <span className="text-error-500">*</span>
              </Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="admin@bibliotech.app"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signin-password">
                Mot de passe <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <span className="text-theme-sm text-gray-700 dark:text-gray-400">
                Rester connecté
              </span>
            </div>
            <Button className="w-full" size="sm" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
