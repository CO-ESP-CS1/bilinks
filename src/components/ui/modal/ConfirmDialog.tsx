"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

export type ConfirmDialogVariant = "danger" | "primary" | "warning";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
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
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${confirmButtonClass[variant]}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
