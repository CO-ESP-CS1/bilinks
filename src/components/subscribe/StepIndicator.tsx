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
  sticky?: boolean;
};

export function StepIndicator({ current, sticky = true }: StepIndicatorProps) {
  return (
    <div
      className={cn(
        "flex justify-center px-1 py-3 sm:py-4",
        sticky && "sticky top-14 z-30"
      )}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-[2rem] border border-blue-100/80 bg-white/95 px-3 py-3 shadow-[0_8px_32px_rgba(0,74,198,0.07)] backdrop-blur-md sm:max-w-3xl sm:rounded-full sm:px-5 sm:py-3.5",
          sticky && "ring-1 ring-white/80"
        )}
      >
        <div className="flex items-start justify-between gap-1">
          {STEPS.map((step, index) => {
            const done = step.id < current;
            const active = step.id === current;
            const future = step.id > current;

            return (
              <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 rounded-full",
                        done ? "bg-[#004AC6]" : "bg-zinc-200",
                        active && "bg-gradient-to-r from-blue-300 to-zinc-200"
                      )}
                    />
                  )}
                  <motion.div
                    layout
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:h-8 sm:w-8 sm:text-xs",
                      done && "bg-[#004AC6] text-white shadow-sm",
                      active &&
                        "bg-[#004AC6] text-white shadow-[0_4px_14px_rgba(0,74,198,0.30)]",
                      future && "border border-zinc-200 bg-zinc-50 text-zinc-400"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} /> : step.id}
                  </motion.div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 rounded-full",
                        done ? "bg-[#004AC6]" : "bg-zinc-200",
                        active && "bg-zinc-200"
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 max-w-[4.5rem] truncate text-center text-[10px] leading-tight sm:mt-2 sm:max-w-none sm:text-xs",
                    active && "font-semibold text-[#004AC6]",
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
    </div>
  );
}
