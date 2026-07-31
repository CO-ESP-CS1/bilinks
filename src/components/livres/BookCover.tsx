"use client";

import React, { useState } from "react";

export type BookCoverVariant =
  | "grid"
  | "carousel"
  | "thumbnail"
  | "hero"
  | "form";

const variantStyles: Record<
  BookCoverVariant,
  { wrapper: string; img: string }
> = {
  /** Grille admin — ratio 2:3 (identique export Cloudinary / mobile API) */
  grid: {
    wrapper: "aspect-[2/3] w-full",
    img: "h-full w-full object-cover",
  },
  /** Aperçu carrousel mobile (ratio ~0,82) */
  carousel: {
    wrapper: "aspect-[41/50] w-full",
    img: "h-full w-full object-cover",
  },
  thumbnail: {
    wrapper: "h-14 w-[42px] shrink-0",
    img: "h-full w-full object-cover",
  },
  hero: {
    wrapper: "h-56 w-40 shrink-0",
    img: "h-full w-full object-cover",
  },
  form: {
    wrapper: "h-[240px] w-40 shrink-0",
    img: "h-full w-full object-cover",
  },
};

function initialeTitre(titre: string): string {
  const t = titre.trim();
  if (!t) return "?";
  return t[0]!.toUpperCase();
}

export type BookCoverProps = {
  src?: string | null;
  title: string;
  variant?: BookCoverVariant;
  className?: string;
  rounded?: "none" | "md" | "lg" | "xl";
  hoverZoom?: boolean;
  showShine?: boolean;
};

export function BookCover({
  src,
  title,
  variant = "grid",
  className = "",
  rounded = "lg",
  hoverZoom = false,
  showShine = false,
}: BookCoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const styles = variantStyles[variant];
  const roundClass =
    rounded === "none"
      ? ""
      : rounded === "xl"
        ? "rounded-xl"
        : rounded === "md"
          ? "rounded-md"
          : "rounded-lg";

  const showImage = src && !error;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-brand-50 via-gray-100 to-gray-50 dark:from-brand-950/40 dark:via-gray-800 dark:to-gray-900 ${styles.wrapper} ${roundClass} ${className}`}
    >
      {!loaded && showImage && (
        <div className={`absolute inset-0 overflow-hidden ${roundClass}`} aria-hidden>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/15" />
        </div>
      )}

      {showImage ? (
        <img
          src={src}
          alt={title ? `Couverture de ${title}` : "Couverture"}
          className={`${styles.img} transition-all duration-500 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
          } ${hoverZoom ? "group-hover:scale-105" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span
            className={`font-bold text-brand-200 dark:text-brand-800 ${
              variant === "thumbnail" ? "text-sm" : variant === "hero" ? "text-5xl" : "text-4xl"
            }`}
          >
            {initialeTitre(title)}
          </span>
        </div>
      )}

      {showShine && showImage && loaded && (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />
      )}

      {/* Ombre type livre */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}
