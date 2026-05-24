"use client";

import React from "react";

type EmptyStateProps = {
  icon: React.ReactNode;
  message: string;
  onReset: () => void;
  resetLabel?: string;
};

export function EmptyState({
  icon,
  message,
  onReset,
  resetLabel = "Réinitialiser les filtres",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center dark:border-gray-700 dark:bg-white/[0.02]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {icon}
      </div>
      <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
        {message}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
      >
        {resetLabel}
      </button>
    </div>
  );
}
