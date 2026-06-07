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
  | "network_error";

const ERROR_COPY: Record<
  ErrorReason,
  { title: string; description: string; advice: string; emoji: string; accent: string }
> = {
  payment_cancelled: {
    title: "Paiement annulé",
    description: "Vous avez refusé la demande de paiement sur votre téléphone.",
    advice: "Réessayez et acceptez la notification MTN/Airtel.",
    emoji: "✕",
    accent: "from-red-500 to-red-600",
  },
  timeout: {
    title: "Délai dépassé",
    description: "La demande a expiré après 2 minutes.",
    advice: "Assurez-vous d'avoir votre téléphone à portée.",
    emoji: "⏱",
    accent: "from-orange-400 to-orange-500",
  },
  insufficient_funds: {
    title: "Solde insuffisant",
    description: "Votre compte MTN/Airtel ne dispose pas des fonds suffisants.",
    advice: "Rechargez votre compte et réessayez.",
    emoji: "💳",
    accent: "from-red-500 to-red-600",
  },
  network_error: {
    title: "Erreur de connexion",
    description: "Impossible de contacter le service de paiement.",
    advice: "Vérifiez votre connexion internet.",
    emoji: "📶",
    accent: "from-red-500 to-red-600",
  },
};

function SubscribeErrorContent() {
  const searchParams = useSearchParams();
  const { provider } = useSubscription();

  const reason = (searchParams.get("reason") ?? "payment_cancelled") as ErrorReason;
  const copy = useMemo(() => ERROR_COPY[reason] ?? ERROR_COPY.payment_cancelled, [reason]);

  const providerLabel = provider === "AIRTEL" ? "Airtel" : "MTN";

  return (
    <div className="min-h-screen bg-white px-6 pb-10 pt-10">
      <StepIndicator current={3} />

      <div className="flex flex-col items-center text-center">
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

        <Link href="/subscribe/payment" className="mt-8 block w-full">
          <PrimaryButton>Réessayer</PrimaryButton>
        </Link>

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
