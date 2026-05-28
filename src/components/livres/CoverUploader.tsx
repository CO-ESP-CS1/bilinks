"use client";

import React, { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BookCover } from "@/components/livres/BookCover";
import {
  COVER_EXPORT_HEIGHT,
  COVER_EXPORT_WIDTH,
  formatCoverSize,
  processCoverImage,
  type ProcessedCover,
} from "@/lib/cover-image";
import { PencilIcon } from "@/icons";

type CoverUploaderProps = {
  value: string | null;
  onChange: (dataUrl: string | null, meta?: ProcessedCover | null) => void;
  bookTitle?: string;
};

export function CoverUploader({ value, onChange, bookTitle = "Aperçu" }: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [meta, setMeta] = useState<ProcessedCover | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setProcessing(true);
      try {
        const result = await processCoverImage(file);
        setMeta(result);
        onChange(result.dataUrl, result);
        toast.success(
          `Couverture optimisée (${result.width}×${result.height}, ${formatCoverSize(result.bytesApprox)})`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec du traitement.");
      } finally {
        setProcessing(false);
      }
    },
    [onChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const clear = () => {
    onChange(null, null);
    setMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6">
        {/* Zone principale */}
        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Couverture du livre
          </p>

          {value ? (
            <div className="group relative animate-scale-in">
              <BookCover
                src={value}
                title={bookTitle}
                variant="form"
                rounded="xl"
                hoverZoom
                showShine
                className="shadow-xl shadow-brand-900/15 ring-1 ring-black/5 dark:ring-white/10"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={processing}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-lg transition hover:scale-105"
                  title="Changer"
                >
                  <PencilIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={clear}
                  disabled={processing}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-error-600 shadow-lg transition hover:scale-105"
                  title="Supprimer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {meta && (
                <p className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
                  {meta.width}×{meta.height} · {formatCoverSize(meta.bytesApprox)} · prêt mobile
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !processing && inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              disabled={processing}
              className={`relative flex h-[240px] w-40 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ${
                processing
                  ? "border-brand-400 bg-brand-50/80 dark:bg-brand-500/10"
                  : isDragging
                    ? "scale-[1.02] border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/20 dark:border-brand-400 dark:bg-brand-500/15"
                    : "border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-25 dark:border-gray-700 dark:bg-gray-800/50"
              }`}
            >
              {processing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                    Optimisation…
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md transition-transform duration-300 dark:bg-gray-800 ${
                      isDragging ? "scale-110" : ""
                    }`}
                  >
                    <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                  <span className="px-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Glissez ou cliquez
                  </span>
                  <span className="mt-1 px-2 text-center text-[10px] leading-tight text-gray-400">
                    Recadrage auto 2:3 · max {COVER_EXPORT_WIDTH}×{COVER_EXPORT_HEIGHT}
                  </span>
                </>
              )}
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={onInputChange}
          />
        </div>

        {/* Aperçu mobile */}
        {value && (
          <div className="flex-1 animate-fade-in-up">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Aperçu application mobile
            </p>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-white/[0.06] dark:from-gray-900 dark:to-gray-950">
              <div className="flex flex-wrap items-start gap-6">
                {/* Mini carrousel */}
                <div>
                  <p className="mb-2 text-[10px] font-medium text-gray-400">Carrousel</p>
                  <div className="w-[100px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <BookCover src={value} title={bookTitle} variant="carousel" rounded="md" className="!rounded-b-none" />
                    <div className="space-y-1 p-2">
                      <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-2 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Mini grille */}
                <div>
                  <p className="mb-2 text-[10px] font-medium text-gray-400">Grille d&apos;accueil</p>
                  <div className="w-[88px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <BookCover src={value} title={bookTitle} variant="grid" rounded="md" className="!rounded-b-none" />
                    <div className="space-y-1 p-2">
                      <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-2 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Fiche détail */}
                <div>
                  <p className="mb-2 text-[10px] font-medium text-gray-400">Fiche livre</p>
                  <div className="h-24 w-16 overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700">
                    <BookCover src={value} title={bookTitle} variant="hero" rounded="md" className="!h-24 !w-16" />
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                Format exporté <strong className="text-gray-700 dark:text-gray-300">2:3</strong> ({COVER_EXPORT_WIDTH}×{COVER_EXPORT_HEIGHT} max),
                identique au stockage Cloudinary. L&apos;app mobile recadre en <em>cover</em> selon l&apos;écran.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
