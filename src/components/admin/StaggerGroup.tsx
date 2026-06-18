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
  const childArray = React.Children.toArray(children);

  const enhanced = childArray.map((child, i) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment) return child;

    const validIndex = childArray
      .slice(0, i)
      .filter((c) => React.isValidElement(c)).length;
    const delay = baseDelayMs + validIndex * staggerMs;

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
