"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PlanCard } from "@/components/subscribe/PlanCard";
import { PoweredByPawapay } from "@/components/subscribe/PoweredByPawapay";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribeLogo } from "@/components/subscribe/SubscribeLogo";
import { SubscribePageSkeleton } from "@/components/subscribe/SubscribePageSkeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { fetchSubscribePlans, SUBSCRIBE_MOCK } from "@/lib/subscribe/api";
import { staggerContainer, fadeUp } from "@/lib/subscribe/motion";
import { SUBSCRIBE_PLANS, type SubscribePlan } from "@/lib/subscribe/plans";

export default function SubscribePage() {
  const router = useRouter();
  const { setPlan } = useSubscription();
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

  return (
    <div className="pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StepIndicator current={1} />

      <div className="pt-6 sm:pt-8 md:pt-10">
        <div className="md:hidden">
          <SubscribeLogo />
        </div>

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
