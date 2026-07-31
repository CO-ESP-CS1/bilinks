"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import { PlanCard } from "@/components/subscribe/PlanCard";
import { PoweredByPawapay } from "@/components/subscribe/PoweredByPawapay";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribeLogo } from "@/components/subscribe/SubscribeLogo";
import { SubscribePageSkeleton } from "@/components/subscribe/SubscribePageSkeleton";
import { EtablissementPurchaseFlow } from "@/components/subscribe/EtablissementPurchaseFlow";
import { useSubscription } from "@/context/SubscriptionContext";
import { fetchSubscribePlans, SUBSCRIBE_MOCK } from "@/lib/subscribe/api";
import { staggerContainer, fadeUp } from "@/lib/subscribe/motion";
import { SUBSCRIBE_PLANS, type SubscribePlan } from "@/lib/subscribe/plans";

type Mode = "particulier" | "etablissement";

function ModeSwitcher({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="mx-auto mt-5 flex w-fit rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
      {(
        [
          { id: "particulier" as const, label: "Particulier" },
          { id: "etablissement" as const, label: "Établissement" },
        ]
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            mode === tab.id
              ? "bg-[#004AC6] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPlan } = useSubscription();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("type") === "etablissement" ? "etablissement" : "particulier"
  );
  const [plans, setPlans] = useState<SubscribePlan[]>(SUBSCRIBE_PLANS);
  const [loading, setLoading] = useState(!SUBSCRIBE_MOCK);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlans = useCallback(() => {
    setLoading(true);
    setLoadError(null);

    fetchSubscribePlans()
      .then((apiPlans) => {
        const merged = SUBSCRIBE_PLANS.map((plan) => {
          const api = apiPlans.find((item) => item.plan === plan.id);
          if (!api) return plan;
          return {
            ...plan,
            apiId: api.id,
            price: Number(api.prix),
          };
        });
        setPlans(merged);

        const missing = merged.filter((plan) => !plan.apiId);
        if (missing.length > 0) {
          setLoadError(
            "Certaines formules sont indisponibles sur le serveur. Réessayez dans un instant."
          );
        }
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les formules depuis le serveur."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (SUBSCRIBE_MOCK) return;
    loadPlans();
  }, [loadPlans]);

  const handleSelect = (plan: SubscribePlan) => {
    if (!SUBSCRIBE_MOCK && !plan.apiId) {
      return;
    }
    setPlan(plan.id, plan.apiId);
    router.push("/subscribe/auth");
  };

  if (loading) {
    return <SubscribePageSkeleton />;
  }

  if (mode === "etablissement") {
    return (
      <div className="pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="pt-6 sm:pt-8 md:pt-10">
          <div className="md:hidden">
            <SubscribeLogo />
          </div>
          <ModeSwitcher mode={mode} onChange={setMode} />
          <div className="mx-auto mt-2 max-w-3xl">
            <EtablissementPurchaseFlow />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StepIndicator current={1} />

      <div className="pt-6 sm:pt-8 md:pt-10">
        <div className="md:hidden">
          <SubscribeLogo />
        </div>

        <ModeSwitcher mode={mode} onChange={setMode} />

        <div className="mx-auto max-w-3xl text-center md:max-w-none">
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
            Choisissez votre formule
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Lecture illimitée · Hors-ligne · Sans publicité
          </p>
        </div>

        {loadError && (
          <div
            role="alert"
            className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <p>{loadError}</p>
            <button
              type="button"
              onClick={loadPlans}
              className="mt-2 font-semibold text-red-900 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-2 md:gap-6"
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={fadeUp} className="flex">
              <PlanCard
                plan={plan}
                onSelect={() => handleSelect(plan)}
                disabled={!SUBSCRIBE_MOCK && !plan.apiId}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mx-auto mt-10 max-w-3xl">
          <h2 className="text-center text-lg font-bold text-zinc-900">
            Comment ça marche
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#004AC6]/10 text-[#004AC6]">
                <Smartphone className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-800">
                Mobile Money
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Payez directement avec MTN Mobile Money ou Airtel Money depuis
                votre téléphone.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#004AC6]/10 text-[#004AC6]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-800">
                Activation immédiate
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Dès la confirmation du paiement, votre abonnement est activé
                automatiquement, sans attente.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#004AC6]/10 text-[#004AC6]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-800">
                Paiement sécurisé
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Vos paiements sont traités par PawaPay — B LINKS n&apos;a
                jamais accès à vos identifiants Mobile Money.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <PoweredByPawapay />
        </div>
        <p className="mb-4 mt-2 text-center text-xs text-zinc-300">
          Conditions · Confidentialité
        </p>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribePageSkeleton />}>
      <SubscribePageContent />
    </Suspense>
  );
}
