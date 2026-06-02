"use client";

import { BRAND_NAME } from "@/config/brand";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export function BrandName({
  className = "",
  accentClassName = "",
}: {
  className?: string;
  accentClassName?: string;
}) {
  return (
    <span className={className}>
      B <span className={accentClassName}>LINKS</span>
    </span>
  );
}

type BrandMarkProps = {
  href?: string;
  showText?: boolean;
  theme?: "sidebar" | "auth" | "light";
  size?: "default" | "large" | "xl";
  className?: string;
};

export function BrandMark({
  href = "/admin",
  showText = true,
  theme = "sidebar",
  size = "default",
  className = "",
}: BrandMarkProps) {
  const iconPx = size === "xl" ? 56 : size === "large" ? 44 : 34;
  const textSize = size === "xl" ? "text-2xl" : size === "large" ? "text-xl" : "text-base";

  const titleClass =
    theme === "auth"
      ? "text-white"
      : theme === "light"
      ? "text-gray-900"
      : "text-gray-900 dark:text-white";

  const subtitleClass =
    theme === "auth"
      ? "text-amber-300"
      : theme === "light"
      ? "text-amber-600"
      : "text-amber-500 dark:text-amber-400";

  const inner = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/images/logo/bibliotech-logo.png"
        alt={BRAND_NAME}
        width={iconPx}
        height={iconPx}
        className="shrink-0 rounded-lg"
      />
      {showText && (
        <span className={`whitespace-nowrap font-bold tracking-tight ${textSize} ${titleClass}`}>
          <BrandName accentClassName={subtitleClass} />
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {inner}
      </Link>
    );
  }

  return inner;
}
