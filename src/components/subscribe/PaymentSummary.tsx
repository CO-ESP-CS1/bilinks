"use client";

import Link from "next/link";
import type { SubscribePlan } from "@/lib/subscribe/plans";
import { formatXaf } from "@/lib/subscribe/plans";

type PaymentSummaryProps = {
  plan: SubscribePlan;
};

export function PaymentSummary({ plan }: PaymentSummaryProps) {
  return (
    <div className="w-full rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-indigo-500/[0.05] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-800 sm:text-base">{plan.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{plan.period.replace("/", "par ")}</p>
          <Link href="/subscribe" className="mt-1 inline-block text-xs text-violet-600 underline">
            Modifiez
          </Link>
        </div>
        <p className="shrink-0 text-right text-lg font-bold text-violet-700 sm:text-xl">
          {formatXaf(plan.price)}
          <span className="block text-xs font-semibold sm:text-sm">F CFA</span>
        </p>
      </div>
    </div>
  );
}
