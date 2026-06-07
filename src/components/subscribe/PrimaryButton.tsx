"use client";

import { cn } from "@/lib/cn";
import { motion, type HTMLMotionProps } from "framer-motion";

type PrimaryButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
};

export function PrimaryButton({
  className,
  children,
  loading,
  loadingText = "Chargement…",
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-base font-semibold tracking-wide text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] transition hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
