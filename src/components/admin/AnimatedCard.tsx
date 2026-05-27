"use client";

import React from "react";

type AnimatedCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Délai d'entrée en ms (stagger) */
  delay?: number;
  hover?: boolean;
};

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
  hover = true,
}: AnimatedCardProps) {
  return (
    <div
      className={`group admin-card animate-fade-in-up ${hover ? "admin-card-hover" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
