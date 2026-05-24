"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type BrandMarkProps = {
  href?: string;
  /** Affiche le libellé à côté de l’icône */
  showText?: boolean;
  /** Panneau auth (fond sombre) vs barre latérale / header */
  theme?: "sidebar" | "auth";
  size?: "default" | "large";
  className?: string;
};

export function BrandMark({
  href = "/admin",
  showText = true,
  theme = "sidebar",
  size = "default",
  className = "",
}: BrandMarkProps) {
  const iconPx = size === "large" ? 48 : 32;
  const textSize = size === "large" ? "text-xl" : "text-lg";
  const titleClass =
    theme === "auth"
      ? "text-white"
      : "text-gray-900 dark:text-white";
  const accentClass =
    theme === "auth" ? "text-blue-200" : "text-brand-500";

  const inner = (
    <span className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/logo/logo-icon.svg"
        alt=""
        width={iconPx}
        height={iconPx}
        className="shrink-0"
      />
      {showText && (
        <span
          className={`whitespace-nowrap font-bold tracking-tight ${textSize} ${titleClass}`}
        >
          BiblioTech{" "}
          <span className={accentClass}>Admin</span>
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
