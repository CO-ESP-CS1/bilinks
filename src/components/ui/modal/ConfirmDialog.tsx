"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

export type ConfirmDialogVariant = "danger" | "primary" | "warning";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  confirming?: boolean;
};

const confirmButtonClass: Record<ConfirmDialogVariant, string> = {
  danger: "bg-error-500 hover:bg-error-600",
  primary: "bg-brand-500 hover:bg-brand-600",
  warning: "bg-warning-500 hover:bg-warning-600",
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "primary",
  confirming = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (confirming) return;
        onClose();
      }}
      className="max-w-md p-6 sm:p-8"
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={confirming}
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={confirming}
          onClick={() => void onConfirm()}
          className={`inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass[variant]}`}
        >
          {confirming ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Traitement…
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
