"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, TrendingDown, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SubscribePlan } from "@/lib/subscribe/plans";
import { formatXaf } from "@/lib/subscribe/plans";

type PlanCardProps = {
  plan: SubscribePlan;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function PlanCard({ plan, selected, disabled, onSelect }: PlanCardProps) {
  const isHighlight = plan.highlight;
  const isWarm = plan.accent === "green"; // Annuel

  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "relative flex h-full w-full flex-col rounded-2xl p-4 text-left transition-shadow duration-200 sm:p-6",
        isHighlight
          ? "border border-[#003494]/20 bg-[#004AC6] text-white shadow-[0_8px_32px_rgba(0,74,198,0.22)]"
          : "border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_24px_rgba(0,74,198,0.09),0_1px_3px_rgba(0,0,0,0.04)]",
        selected && "ring-2 ring-offset-2",
        selected && (isHighlight ? "ring-blue-200" : isWarm ? "ring-orange-400" : "ring-[#004AC6]")
      )}
    >
      {isHighlight && (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#004AC6] shadow-sm">
          <Sparkles className="h-3 w-3" /> Populaire
        </span>
      )}

      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            isHighlight ? "bg-white/15" : isWarm ? "bg-orange-50" : "bg-blue-50"
          )}
        >
          {isWarm ? (
            <Trophy className={cn("h-4 w-4", isHighlight ? "text-white" : "text-[#EF5A28]")} />
          ) : (
            <Zap className={cn("h-4 w-4", isHighlight ? "text-white" : "text-[#004AC6]")} />
          )}
        </div>
        {plan.badge && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              isHighlight
                ? "bg-white/15 text-white/85"
                : isWarm
                  ? "bg-orange-50 text-[#D14B1E]"
                  : "bg-blue-50 text-[#004AC6]"
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
        <span className={cn("text-3xl font-black sm:text-4xl", isHighlight ? "text-white" : "text-zinc-900")}>
          {formatXaf(plan.price)}
        </span>
        <span className={cn("pb-1 text-base font-semibold sm:text-lg", isHighlight ? "text-white/65" : "text-zinc-500")}>
          F CFA
        </span>
        <span className={cn("pb-1 text-sm", isHighlight ? "text-white/55" : "text-zinc-400")}>
          {plan.period}
        </span>
      </div>

      {plan.monthlyNote && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#D14B1E]">
          <TrendingDown className="h-3.5 w-3.5" />
          {plan.monthlyNote}
        </p>
      )}

      <div className={cn("my-4 border-t", isHighlight ? "border-white/15" : "border-zinc-100")} />

      <ul className="flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isHighlight ? "bg-white/15" : isWarm ? "bg-orange-50" : "bg-blue-50"
              )}
            >
              <Check
                className={cn(
                  "h-3 w-3",
                  isHighlight ? "text-white" : isWarm ? "text-[#EF5A28]" : "text-[#004AC6]"
                )}
                strokeWidth={3}
              />
            </span>
            <span className={isHighlight ? "text-white/82" : "text-zinc-600"}>{feature}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "mt-5 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition",
          isHighlight
            ? "bg-white text-[#004AC6] shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
            : isWarm
              ? "bg-[#EF5A28] text-white shadow-[0_4px_16px_rgba(239,90,40,0.25)]"
              : "border-[1.5px] border-[#004AC6] text-[#004AC6] hover:bg-blue-50"
        )}
      >
        Choisir {plan.name.toLowerCase()}
      </div>
    </motion.button>
  );
}
