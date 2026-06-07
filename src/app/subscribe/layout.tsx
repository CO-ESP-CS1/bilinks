"use client";

import { Inter } from "next/font/google";
import { AnimatedBackground } from "@/components/subscribe/AnimatedBackground";
import { SubscribePageTransition } from "@/components/subscribe/SubscribePageTransition";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { cn } from "@/lib/cn";

const inter = Inter({ subsets: ["latin"] });

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      <div
        className={cn(
          inter.className,
          "relative mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-[#FAFAFA] text-zinc-900 selection:bg-violet-500/20"
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          ["--color-primary" as string]: "#7C3AED",
          ["--color-primary-light" as string]: "#8B5CF6",
          ["--color-primary-dark" as string]: "#6D28D9",
        }}
      >
        <AnimatedBackground />
        <SubscribePageTransition>{children}</SubscribePageTransition>
      </div>
    </SubscriptionProvider>
  );
}
