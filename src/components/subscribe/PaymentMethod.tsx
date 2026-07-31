"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PaymentProvider } from "@/lib/subscribe/plans";
import { PhoneInput, getCongoPhoneProviderError } from "@/components/subscribe/PhoneInput";

type PaymentMethodProps = {
  provider: PaymentProvider;
  label: string;
  logoClass: string;
  logoText: string;
  selected: boolean;
  expanded: boolean;
  phone: string;
  onSelect: () => void;
  onPhoneChange: (value: string) => void;
  /** Couleur d'accent — "violet" (tunnel Particulier, défaut) ou "blue" (tunnel Établissement, #004AC6). */
  accent?: "violet" | "blue";
};

export function PaymentMethod({
  provider,
  label,
  logoClass,
  logoText,
  selected,
  expanded,
  phone,
  onSelect,
  onPhoneChange,
  accent = "violet",
}: PaymentMethodProps) {
  const inputProvider = provider === "MTN" ? "MTN" : "AIRTEL";
  const phoneError = getCongoPhoneProviderError(phone, inputProvider);

  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] p-4 transition-all duration-150",
        selected
          ? accent === "blue"
            ? "border-[#004AC6] bg-[#004AC6]/[0.02] shadow-[0_4px_16px_rgba(0,74,198,0.12)]"
            : "border-violet-600 bg-violet-500/[0.02] shadow-[0_4px_16px_rgba(124,58,237,0.12)]"
          : "border-zinc-200 bg-white"
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 text-left">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
            selected
              ? accent === "blue"
                ? "border-[#004AC6] bg-[#004AC6]"
                : "border-violet-600 bg-violet-600"
              : "border-zinc-300"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
        <span className={cn("flex h-6 w-10 items-center justify-center rounded-lg text-[10px] font-bold", logoClass)}>
          {logoText}
        </span>
        <span className="flex-1 text-sm font-medium text-zinc-800">{label}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>

      <AnimatePresence>
        {selected && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <PhoneInput value={phone} onChange={onPhoneChange} provider={inputProvider} accent={accent} />
              {phoneError ? (
                <p className="mt-2 text-xs text-red-500">{phoneError}</p>
              ) : (
              <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {provider === "MTN"
                  ? "Numéro MTN Mobile Money : commence par 06"
                  : "Numéro Airtel Money : commence par 05"}
              </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
