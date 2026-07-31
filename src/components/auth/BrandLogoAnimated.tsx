"use client";

import { BRAND_NAME } from "@/config/brand";
import Image from "next/image";

type BrandLogoAnimatedProps = {
  size?: "default" | "large" | "xl";
  variant?: "hero" | "compact";
  className?: string;
};

const ICON = { default: 34, large: 44, xl: 56 } as const;
const RING = { default: 56, large: 72, xl: 88 } as const;

/** Marque B LINKS — sobre, une seule apparition au montage, pas d'animation continue. */
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
      className={`flex items-center justify-center ${className}`}
      style={{ width: ringPx, height: ringPx }}
    >
      <div
        className={`animate-fade-in-up rounded-2xl p-2.5 ${
          isHero
            ? "bg-white/[0.08] shadow-lg shadow-black/20 backdrop-blur-sm"
            : "bg-brand-50/80 dark:bg-brand-500/10"
        }`}
      >
        <Image
          src="/images/logo/bibliotech-logo.png"
          alt={BRAND_NAME}
          width={iconPx}
          height={iconPx}
          className="rounded-lg"
          priority
        />
      </div>
    </div>
  );
}
