"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onSave: () => void;
  children: React.ReactNode;
  maxWidth?: "md" | "lg";
};

const maxWidthClass = {
  md: "max-w-md",
  lg: "max-w-lg",
};

export function ProfileEditModal({
  isOpen,
  onClose,
  title,
  description,
  onSave,
  children,
  maxWidth = "lg",
}: ProfileEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`mx-3 flex w-[calc(100%-1.5rem)] ${maxWidthClass[maxWidth]} max-h-[min(90vh,720px)] flex-col overflow-hidden sm:mx-4`}
    >
      <div className="flex max-h-[min(90vh,720px)] flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-100 px-4 py-4 pr-12 dark:border-gray-800 sm:px-5 sm:py-5">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {children}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:gap-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
