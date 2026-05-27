"use client";

import React from "react";

type StaggerGroupProps = {
  children: React.ReactNode;
  className?: string;
  /** Délai entre chaque enfant (ms) */
  staggerMs?: number;
  /** Délai avant le premier enfant (ms) */
  baseDelayMs?: number;
};

/**
 * Applique une entrée décalée (fade-in-up) à chaque enfant direct.
 */
export function StaggerGroup({
  children,
  className = "",
  staggerMs = 70,
  baseDelayMs = 80,
}: StaggerGroupProps) {
  let index = 0;

  const enhanced = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const delay = baseDelayMs + index * staggerMs;
    index += 1;

    const el = child as React.ReactElement<{
      className?: string;
      style?: React.CSSProperties;
    }>;

    return React.cloneElement(el, {
      className: `${el.props.className ?? ""} animate-fade-in-up`.trim(),
      style: { ...el.props.style, animationDelay: `${delay}ms` },
    });
  });

  return <div className={className}>{enhanced}</div>;
}
