"use client";

import { Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PrimaryButton } from "@/components/subscribe/PrimaryButton";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { useSubscription } from "@/context/SubscriptionContext";

type ErrorReason =
  | "payment_cancelled"
  | "timeout"
  | "insufficient_funds"
  | "network_error"
  | "session_expired"
  | "already_subscribed";

const ERROR_COPY: Record<
  ErrorReason,
  { title: string; description: string; advice: string; emoji: string; accent: string }
> = {
  payment_cancelled: {
    title: "Paiement non confirmé",
    description: "La demande de paiement n'a pas été acceptée sur votre téléphone.",
    advice: "Réessayez et pensez à accepter la notification MTN/Airtel dès qu'elle s'affiche.",
    emoji: "✕",
    accent: "from-red-500 to-red-600",
  },
  timeout: {
    title: "Délai dépassé",
    description: "Vous n'avez pas confirmé le paiement à temps (2 minutes).",
    advice: "Gardez votre téléphone à portée et acceptez la notification rapidement.",
    emoji: "⏱",
    accent: "from-orange-400 to-orange-500",
  },
  insufficient_funds: {
    title: "Solde insuffisant",
    description: "Votre compte MTN/Airtel ne dispose pas des fonds nécessaires.",
    advice: "Rechargez votre compte puis revenez réessayer.",
    emoji: "💳",
    accent: "from-red-500 to-red-600",
  },
  network_error: {
    title: "Problème de connexion",
    description: "Votre paiement n'a pas pu aboutir en raison d'un problème réseau.",
    advice: "Vérifiez votre connexion internet et réessayez.",
    emoji: "📶",
    accent: "from-red-500 to-red-600",
  },
  session_expired: {
    title: "Session expirée",
    description: "Votre session a expiré pendant le processus de paiement.",
    advice: "Reconnectez-vous pour reprendre votre abonnement.",
    emoji: "🔒",
    accent: "from-zinc-500 to-zinc-700",
  },
  already_subscribed: {
    title: "Abonnement déjà actif",
    description: "Un abonnement est déjà en cours sur votre compte.",
    advice: "Retournez dans l'application BI LINKS pour accéder à votre bibliothèque.",
    emoji: "✓",
    accent: "from-emerald-500 to-emerald-600",
  },
};

function SubscribeErrorContent() {
  const searchParams = useSearchParams();
  const { provider } = useSubscription();

  const reason = (searchParams.get("reason") ?? "payment_cancelled") as ErrorReason;
  const copy = useMemo(() => ERROR_COPY[reason] ?? ERROR_COPY.payment_cancelled, [reason]);

  const providerLabel = provider === "AIRTEL" ? "Airtel" : "MTN";

  return (
    <div className="pb-10 pt-6 sm:pt-10">
      <StepIndicator current={3} />

      <div className="mx-auto flex max-w-lg flex-col items-center px-4 text-center sm:px-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${copy.accent} text-3xl text-white shadow-[0_16px_48px_rgba(239,68,68,0.35)]`}
        >
          {copy.emoji}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-2xl font-bold text-zinc-900"
        >
          {copy.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-2 text-base text-zinc-500"
        >
          {copy.description.replace("MTN/Airtel", providerLabel)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="mt-6 w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600"
        >
          {copy.advice.replace("MTN/Airtel", providerLabel)}
        </motion.div>

        {reason === "session_expired" ? (
          <Link href="/subscribe/auth" className="mt-8 block w-full">
            <PrimaryButton>Se reconnecter</PrimaryButton>
          </Link>
        ) : reason === "already_subscribed" ? (
          <PrimaryButton className="mt-8" onClick={() => { window.location.href = "bilinks://home"; }}>
            Ouvrir BI LINKS
          </PrimaryButton>
        ) : (
          <Link href="/subscribe/payment" className="mt-8 block w-full">
            <PrimaryButton>Réessayer le paiement</PrimaryButton>
          </Link>
        )}

        <Link
          href="/subscribe"
          className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border border-zinc-200 text-base font-semibold text-zinc-700"
        >
          Changer de formule
        </Link>
      </div>
    </div>
  );
}

export default function SubscribeErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SubscribeErrorContent />
    </Suspense>
  );
}
