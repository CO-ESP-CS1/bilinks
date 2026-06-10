"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlanCard } from "@/components/subscribe/PlanCard";
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

  useEffect(() => {
    if (SUBSCRIBE_MOCK) return;

    fetchSubscribePlans()
      .then((apiPlans) => {
        setPlans(
          SUBSCRIBE_PLANS.map((plan) => {
            const api = apiPlans.find((item) => item.plan === plan.id);
            if (!api) return plan;
            return {
              ...plan,
              apiId: api.id,
              price: Number(api.prix),
            };
          })
        );
      })
      .catch(() => {
        /* garde les plans statiques si l'API est indisponible */
      })
      .finally(() => setLoading(false));
  }, []);

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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
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

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-zinc-400 sm:text-sm">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          Paiement 100% sécurisé · MTN MoMo &amp; Airtel Money
        </p>
        <p className="mb-4 mt-2 text-center text-xs text-zinc-300">
          Conditions · Confidentialité
        </p>
      </div>
    </div>
  );
}
