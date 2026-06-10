"use client";

import { Inter } from "next/font/google";
import { AnimatedBackground } from "@/components/subscribe/AnimatedBackground";
import { SubscribePageTransition } from "@/components/subscribe/SubscribePageTransition";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { BrandMark } from "@/components/common/BrandMark";
import { cn } from "@/lib/cn";

const inter = Inter({ subsets: ["latin"] });

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      {/* Fond pleine page BILINKS — plus de boîte centrée sur fond sombre */}
      <div
        className={cn(inter.className, "relative min-h-screen w-full bg-[#FAFAF8] text-zinc-900 selection:bg-blue-500/20")}
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          ["--color-primary" as string]: "#004AC6",
          ["--color-primary-light" as string]: "#3B82F6",
          ["--color-primary-dark" as string]: "#003494",
        }}
      >
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-[#FAFAF8]">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8">
            <BrandMark href="/subscribe" theme="auth" size="default" />
          </div>
        </header>

        <AnimatedBackground />

        <div className="relative z-0 mx-auto w-full max-w-6xl px-4 pb-10 pt-1 sm:px-6 lg:px-8">
          <SubscribePageTransition>{children}</SubscribePageTransition>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
