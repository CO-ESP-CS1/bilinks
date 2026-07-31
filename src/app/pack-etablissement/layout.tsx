"use client";

import { BrandMark } from "@/components/common/BrandMark";
import { AnimatedBackground } from "@/components/subscribe/AnimatedBackground";

export default function PackEtablissementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen w-full bg-[#FAFAF8] text-zinc-900"
      style={{
        ["--color-primary" as string]: "#004AC6",
        ["--color-primary-light" as string]: "#3B82F6",
        ["--color-primary-dark" as string]: "#003494",
      }}
    >
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-[#FAFAF8]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-center px-4 sm:px-6">
          <BrandMark href="/pack-etablissement" theme="auth" size="default" />
        </div>
      </header>

      <AnimatedBackground />

      <div className="relative z-0 mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
        {children}
      </div>
    </div>
  );
}
