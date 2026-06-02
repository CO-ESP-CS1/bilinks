"use client";

import { BRAND_NAME } from "@/config/brand";
import Image from "next/image";

type BrandLogoAnimatedProps = {
  size?: "default" | "large" | "xl";
  variant?: "hero" | "compact";
  className?: string;
};

const ICON = { default: 34, large: 44, xl: 72 } as const;
const RING = { default: 56, large: 72, xl: 120 } as const;

export function BrandLogoAnimated({
  size = "xl",
  variant = "hero",
  className = "",
}: BrandLogoAnimatedProps) {
  const iconPx = ICON[size];
  const ringPx = RING[size];
  const isHero = variant === "hero";

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: ringPx, height: ringPx }}
      aria-hidden
    >
      {isHero && (
        <>
          <div className="absolute inset-0 animate-brand-orbit rounded-full border border-dashed border-amber-400/30" />
          <div className="absolute inset-3 animate-brand-orbit-reverse rounded-full border border-white/10" />
          <div className="absolute inset-0 animate-brand-pulse-ring rounded-full border-2 border-amber-400/40" />
          <div
            className="absolute inset-0 animate-brand-pulse-ring rounded-full border border-amber-300/25"
            style={{ animationDelay: "0.9s" }}
          />
        </>
      )}

      <div
        className={`relative z-10 animate-brand-logo-enter rounded-2xl p-3 ${
          isHero
            ? "bg-white/[0.08] shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-brand-glow"
            : "bg-brand-50/80 shadow-lg shadow-brand-500/10 dark:bg-brand-500/10"
        }`}
      >
        <div className={isHero ? "animate-brand-logo-spin" : "animate-brand-logo-wobble"}>
          <Image
            src="/images/logo/bibliotech-logo.png"
            alt={BRAND_NAME}
            width={iconPx}
            height={iconPx}
            className="rounded-xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}
