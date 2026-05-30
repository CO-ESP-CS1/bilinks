"use client";

import React, { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BOOK_FILE_ACCEPT,
  BOOK_FILE_MAX_BYTES,
  bookFileKind,
  formatBookFileSize,
  isAcceptedBookFile,
} from "@/lib/book-file";

type BookFileUploaderProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: boolean;
};

function FileKindIcon({ kind }: { kind: ReturnType<typeof bookFileKind> }) {
  const label = kind === "pdf" ? "PDF" : kind === "epub" ? "EPUB" : kind === "mobi" ? "MOBI" : "DOC";
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
      {label}
    </div>
  );
}

export function BookFileUploader({ value, onChange, error }: BookFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!isAcceptedBookFile(file)) {
        toast.error("Format non pris en charge. Utilisez PDF, EPUB ou MOBI.");
        return;
      }
      if (file.size > BOOK_FILE_MAX_BYTES) {
        toast.error(`Fichier trop volumineux (max ${formatBookFileSize(BOOK_FILE_MAX_BYTES)}).`);
        return;
      }
      onChange(file);
      toast.success(`Fichier sélectionné : ${file.name}`);
    },
    [onChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div
          className={`flex items-center gap-4 rounded-2xl border-2 bg-gray-50/80 p-4 dark:bg-white/[0.03] ${
            error
              ? "border-error-300 dark:border-error-500/50"
              : "border-brand-200 dark:border-brand-500/30"
          }`}
        >
          <FileKindIcon kind={bookFileKind(value)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {value.name}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {formatBookFileSize(value.size)} · prêt pour l&apos;envoi
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-error-600 transition hover:bg-error-50 dark:border-gray-700 dark:bg-gray-800"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition-all ${
            error
              ? "border-error-300 bg-error-25/50 dark:border-error-500/40"
              : isDragging
                ? "border-brand-500 bg-brand-25 dark:border-brand-500 dark:bg-brand-500/5"
                : "border-gray-200 bg-gray-50/50 hover:border-brand-300 hover:bg-brand-25/30 dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-brand-500/40"
          }`}
        >
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-gray-800 ${
              isDragging ? "scale-110" : ""
            }`}
          >
            <svg
              className="h-7 w-7 text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Choisir un fichier sur votre ordinateur
          </span>
          <span className="mt-1 text-center text-[11px] text-gray-400">
            PDF, EPUB ou MOBI · max {formatBookFileSize(BOOK_FILE_MAX_BYTES)}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={BOOK_FILE_ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
