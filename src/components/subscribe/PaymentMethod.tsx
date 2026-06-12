"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PaymentProvider } from "@/lib/subscribe/plans";
import { PhoneInput } from "@/components/subscribe/PhoneInput";

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
}: PaymentMethodProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] p-4 transition-all duration-150",
        selected
          ? "border-violet-600 bg-violet-500/[0.02] shadow-[0_4px_16px_rgba(124,58,237,0.12)]"
          : "border-zinc-200 bg-white"
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 text-left">
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
            selected ? "border-violet-600 bg-violet-600" : "border-zinc-300"
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
              <PhoneInput value={phone} onChange={onPhoneChange} provider={provider === "MTN" ? "MTN" : "AIRTEL"} />
              <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Vous recevrez une notification {provider === "MTN" ? "MTN MoMo" : "Airtel Money"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
