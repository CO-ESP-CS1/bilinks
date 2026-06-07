"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PrimaryButton } from "@/components/subscribe/PrimaryButton";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribeLogo } from "@/components/subscribe/SubscribeLogo";
import { SubscribePageSkeleton } from "@/components/subscribe/SubscribePageSkeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  fetchSubscribeMe,
  loginSubscribeUser,
  SUBSCRIBE_MOCK,
} from "@/lib/subscribe/api";
import { subscribeStorage } from "@/lib/subscribe/storage";

const loginSchema = z.object({
  email: z.string().email("E-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function SubscribeAuthPage() {
  const router = useRouter();
  const { isHydrated, planId, setAuth } = useSubscription();
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!planId) {
      router.replace("/subscribe");
      return;
    }
    const storedToken = subscribeStorage.getToken();
    if (!storedToken) {
      setChecking(false);
      return;
    }
    if (SUBSCRIBE_MOCK) {
      router.replace("/subscribe/payment");
      return;
    }
    fetchSubscribeMe(storedToken)
      .then(() => router.replace("/subscribe/payment"))
      .catch(() => setChecking(false));
  }, [isHydrated, planId, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const onLogin = loginForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const session = await loginSubscribeUser(values.email, values.password);
      setAuth(session);
      router.push("/subscribe/payment");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  });

  if (!isHydrated || checking) {
    return <SubscribePageSkeleton />;
  }

  return (
    <div className="pb-8">
      <StepIndicator current={2} />
      <div className="px-6 pt-8">
        <SubscribeLogo />
        <h1 className="mt-6 text-center text-2xl font-bold text-zinc-900">Bon retour</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Connectez-vous avec votre compte BI LINKS pour continuer
        </p>

        <form
          onSubmit={onLogin}
          className="mt-6 rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]"
        >
          <Field label="E-mail" error={loginForm.formState.errors.email?.message}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                {...loginForm.register("email")}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="votre@email.com"
                className="input-subscribe input-with-icon-left"
              />
            </div>
          </Field>
          <Field label="Mot de passe" error={loginForm.formState.errors.password?.message}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                {...loginForm.register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="input-subscribe input-with-icon-left input-with-icon-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-zinc-400"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <p className="mt-1 text-right text-xs font-medium text-violet-600">
            Mot de passe oublié ?
          </p>
          <PrimaryButton type="submit" className="mt-4" loading={loading} loadingText="Connexion…">
            Se connecter
          </PrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Vous devez déjà posséder un compte BI LINKS pour vous abonner.
        </p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .input-subscribe {
          height: 52px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e4e4e7;
          background: white;
          padding: 0 1rem;
          font-size: 1rem;
          color: #09090b;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-subscribe.input-with-icon-left {
          padding-left: 2.75rem;
        }
        .input-subscribe.input-with-icon-right {
          padding-right: 2.75rem;
        }
        .input-subscribe::placeholder {
          color: #a1a1aa;
        }
        .input-subscribe:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 flex items-center gap-1 text-xs text-red-500"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
