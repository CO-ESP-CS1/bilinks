"use client";

import Link from "next/link";
import type { SubscribePlan } from "@/lib/subscribe/plans";
import { formatXaf } from "@/lib/subscribe/plans";

type PaymentSummaryProps = {
  plan: SubscribePlan;
};

export function PaymentSummary({ plan }: PaymentSummaryProps) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-indigo-500/[0.05] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800">{plan.name}</p>
          <Link href="/subscribe" className="text-xs text-zinc-400 underline">
            Modifiez
          </Link>
        </div>
        <p className="text-lg font-bold text-violet-700">
          {formatXaf(plan.price)} <span className="text-sm font-semibold">F CFA</span>
        </p>
      </div>
    </div>
  );
}
