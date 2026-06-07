"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: 1, label: "Formule" },
  { id: 2, label: "Connexion" },
  { id: 3, label: "Paiement" },
  { id: 4, label: "Accès" },
] as const;

type StepIndicatorProps = {
  current: 1 | 2 | 3 | 4;
};

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200/60 bg-[rgba(250,250,250,0.85)] px-6 py-4 backdrop-blur-[12px]">
      <div className="mx-auto flex max-w-[380px] items-start justify-between">
        {STEPS.map((step, index) => {
          const done = step.id < current;
          const active = step.id === current;
          const future = step.id > current;

          return (
            <div key={step.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      done ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-zinc-200",
                      active && index > 0 && "bg-gradient-to-r from-emerald-400 to-zinc-200"
                    )}
                  />
                )}
                <motion.div
                  layout
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-emerald-500 text-white",
                    active &&
                      "bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-[0_4px_12px_rgba(124,58,237,0.35)]",
                    future && "border border-zinc-200 text-zinc-400"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.id}
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      done ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-zinc-200",
                      active && "bg-gradient-to-r from-zinc-200 to-zinc-200"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-center text-[10px]",
                  active && "font-semibold text-zinc-800",
                  done && "text-zinc-500",
                  future && "text-zinc-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
