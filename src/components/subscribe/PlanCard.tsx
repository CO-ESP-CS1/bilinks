"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, TrendingDown, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SubscribePlan } from "@/lib/subscribe/plans";
import { formatXaf } from "@/lib/subscribe/plans";

type PlanCardProps = {
  plan: SubscribePlan;
  selected?: boolean;
  onSelect: () => void;
};

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const isHighlight = plan.highlight;
  const isGreen = plan.accent === "green";

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-3xl p-6 text-left transition-shadow duration-200",
        isHighlight
          ? "border border-white/15 bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-[0_8px_32px_rgba(124,58,237,0.25)]"
          : "border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(124,58,237,0.12),0_1px_3px_rgba(0,0,0,0.04)]",
        selected && "ring-2 ring-offset-2",
        selected && (isHighlight ? "ring-violet-300" : isGreen ? "ring-emerald-400" : "ring-indigo-400")
      )}
    >
      {isHighlight && (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
          <Sparkles className="h-3 w-3" /> Populaire
        </span>
      )}

      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            isHighlight ? "bg-white/20" : plan.accent === "green" ? "bg-emerald-500/10" : "bg-indigo-500/10"
          )}
        >
          {plan.accent === "green" ? (
            <Trophy className="h-4 w-4 text-emerald-600" />
          ) : (
            <Zap className={cn("h-4 w-4", isHighlight ? "text-white" : "text-indigo-600")} />
          )}
        </div>
        {plan.badge && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              isHighlight
                ? "bg-white/20 text-white/80"
                : plan.accent === "green"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-indigo-500/10 text-indigo-600"
            )}
          >
            {plan.savings ? `${plan.savings} · ${plan.badge}` : plan.badge}
          </span>
        )}
      </div>

      <h3 className={cn("mt-4 text-lg font-bold", isHighlight ? "text-white" : "text-zinc-900")}>
        {plan.name}
      </h3>

      <div className="mt-2 flex items-end gap-1.5">
        <span className={cn("text-4xl font-black", isHighlight ? "text-white" : "text-zinc-900")}>
          {formatXaf(plan.price)}
        </span>
        <span className={cn("pb-1 text-lg font-semibold", isHighlight ? "text-white/70" : "text-zinc-500")}>
          F CFA
        </span>
        <span className={cn("pb-1 text-sm", isHighlight ? "text-white/60" : "text-zinc-400")}>
          {plan.period}
        </span>
      </div>

      {plan.monthlyNote && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <TrendingDown className="h-3.5 w-3.5" />
          {plan.monthlyNote}
        </p>
      )}

      <div className={cn("my-4 border-t", isHighlight ? "border-white/20" : "border-zinc-100")} />

      <ul className="space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isHighlight ? "bg-white/20" : "bg-emerald-500/10"
              )}
            >
              <Check className={cn("h-3 w-3", isHighlight ? "text-white" : "text-emerald-600")} strokeWidth={3} />
            </span>
            <span className={isHighlight ? "text-white/85" : "text-zinc-600"}>{feature}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "mt-5 flex h-12 items-center justify-center rounded-2xl text-sm font-semibold transition",
          isHighlight
            ? "bg-white text-violet-700 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
            : isGreen
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)]"
              : "border-[1.5px] border-indigo-500 text-indigo-600"
        )}
      >
        Choisir {plan.name.toLowerCase()}
      </div>
    </motion.button>
  );
}
