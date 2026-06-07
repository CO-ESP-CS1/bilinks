"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlanCard } from "@/components/subscribe/PlanCard";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribeLogo } from "@/components/subscribe/SubscribeLogo";
import { useSubscription } from "@/context/SubscriptionContext";
import { staggerContainer, fadeUp } from "@/lib/subscribe/motion";
import { SUBSCRIBE_PLANS, type SubscribePlanId } from "@/lib/subscribe/plans";

export default function SubscribePage() {
  const router = useRouter();
  const { setPlan } = useSubscription();

  const handleSelect = (id: SubscribePlanId) => {
    setPlan(id);
    router.push("/subscribe/auth");
  };

  return (
    <div className="pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StepIndicator current={1} />

      <div className="px-6 pt-8">
        <SubscribeLogo />

        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">
          Choisissez votre formule
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-500">
          Lecture illimitée · Hors-ligne · Sans publicité
        </p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6 flex flex-col gap-4"
        >
          {SUBSCRIBE_PLANS.map((plan) => (
            <motion.div key={plan.id} variants={fadeUp}>
              <PlanCard plan={plan} onSelect={() => handleSelect(plan.id)} />
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <Shield className="h-3.5 w-3.5" />
          Paiement 100% sécurisé
        </p>
        <p className="mb-8 mt-2 text-center text-xs text-zinc-300">
          Conditions · Confidentialité
        </p>
      </div>
    </div>
  );
}
