"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BADGE_ICONE_MAX_BYTES } from "@/lib/admin/validators";
import { PencilIcon } from "@/icons";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type BadgeIconUploaderProps = {
  value: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  badgeName?: string;
  label?: string;
  required?: boolean;
};

export function BadgeIconUploader({
  value,
  onChange,
  badgeName = "Badge",
  label = "Icône (PNG, JPEG, WebP, SVG)",
  required = false,
}: BadgeIconUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const handleFile = useCallback(
    (file: File) => {
      if (!MIME.has(file.type)) {
        toast.error("Format non supporté : PNG, JPEG, WebP ou SVG.");
        return;
      }
      if (file.size > BADGE_ICONE_MAX_BYTES) {
        toast.error("Icône trop volumineuse : taille maximale 5 Mo.");
        return;
      }
      revokeBlob();
      const preview = URL.createObjectURL(file);
      blobUrlRef.current = preview;
      onChange(file, preview);
      toast.success(`Icône prête (${formatSize(file.size)})`);
    },
    [onChange, revokeBlob]
  );

  const clear = () => {
    revokeBlob();
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required ? " *" : ""}
      </p>

      {value ? (
        <div className="group relative inline-block animate-scale-in">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10">
            <img
              src={value}
              alt={`Icône de ${badgeName}`}
              className="h-full w-full object-contain p-2"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-lg transition hover:scale-105"
              title="Changer"
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={clear}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-error-600 shadow-lg transition hover:scale-105"
              title="Supprimer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 max-w-[7rem] text-center text-[11px] text-gray-500 dark:text-gray-400">
            Aperçu · 256×256 max (Cloudinary)
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "scale-[1.02] border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/20 dark:border-brand-400 dark:bg-brand-500/15"
              : "border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-25 dark:border-gray-700 dark:bg-gray-800/50"
          }`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md dark:bg-gray-800">
            <svg
              className="h-5 w-5 text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <span className="px-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300">
            Glissez ou cliquez
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        id="badge-icone"
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
