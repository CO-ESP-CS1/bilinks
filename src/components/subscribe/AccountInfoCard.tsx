"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SubscribeMeProfile } from "@/lib/subscribe/api";
import {
  formatExpiryDate,
  formatPlanLabel,
  getSubscriptionStatus,
  maskDisplayName,
  maskEmail,
} from "@/lib/subscribe/user";

type AccountInfoCardProps = {
  profile: SubscribeMeProfile | null;
  loading?: boolean;
};

export function AccountInfoCard({ profile, loading }: AccountInfoCardProps) {
  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-zinc-100" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const status = getSubscriptionStatus(profile.abonnement_actif);

  return (
    <section className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
          <User className="h-4 w-4 text-violet-600" />
        </span>
        <h2 className="text-base font-semibold text-zinc-900 sm:text-lg">
          Informations client
        </h2>
      </div>

      <dl className="space-y-3 text-sm">
        <InfoRow
          label="Nom"
          value={maskDisplayName(profile.personne?.prenom, profile.personne?.nom)}
        />
        <InfoRow label="E-mail" value={maskEmail(profile.email)} />
        <InfoRow
          label="Formule"
          value={formatPlanLabel(profile.abonnement_actif?.plan)}
        />
        <InfoRow
          label="Expire le"
          value={formatExpiryDate(profile.abonnement_actif?.date_fin)}
        />
        <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3">
          <dt className="font-medium text-zinc-500">Statut</dt>
          <dd>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                status.tone === "active"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {status.label}
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-zinc-400">
        L&apos;abonnement sera activé sur ce compte après confirmation du paiement.
      </p>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 font-medium text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
