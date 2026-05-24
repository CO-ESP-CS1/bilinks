"use client";

import Link from "next/link";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500" aria-hidden>
                &gt;
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-800 dark:text-white/90">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const adminCrumb = (pageLabel: string): BreadcrumbItem[] => [
  { label: "Administration", href: "/admin" },
  { label: pageLabel },
];
