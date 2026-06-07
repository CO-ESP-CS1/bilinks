"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { SuccessAnimation } from "@/components/subscribe/SuccessAnimation";
import { PrimaryButton } from "@/components/subscribe/PrimaryButton";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribePageSkeleton } from "@/components/subscribe/SubscribePageSkeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { formatXaf } from "@/lib/subscribe/plans";
import { subscribeStorage } from "@/lib/subscribe/storage";
import { cn } from "@/lib/cn";

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const { isHydrated, plan, firstName, transactionId } = useSubscription();
  const [showContent, setShowContent] = useState(false);
  const [deepLinkFailed, setDeepLinkFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const txId = transactionId ?? subscribeStorage.getTransactionId();
  const now = new Date();

  useEffect(() => {
    if (!isHydrated) return;
    if (!plan || !txId) router.replace("/subscribe");
  }, [isHydrated, plan, txId, router]);

  const handleReturn = () => {
    const ref = txId ?? "BL-00000000";
    window.location.href = `bilinks://payment-success?ref=${ref}`;
    setTimeout(() => setDeepLinkFailed(true), 1000);
  };

  if (!isHydrated || !plan) {
    return <SubscribePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      <StepIndicator current={4} />

      <div className="px-4 pt-10">
        <SuccessAnimation onComplete={() => setShowContent(true)} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-8"
        >
          <h1 className="text-center text-2xl font-bold text-zinc-900">Paiement réussi !</h1>
          <p className="mt-2 text-center text-base text-zinc-500">
            {formatXaf(plan.price)} F CFA — {plan.name}
          </p>

          <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-800">Reçu de paiement</span>
            </div>

            <ReceiptRow label="N° référence" value={txId ?? "—"} mono />
            <ReceiptRow label="Marchand" value="BI LINKS" />
            <ReceiptRow
              label="Date"
              value={now.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <ReceiptRow
              label="Heure"
              value={now.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <ReceiptRow label="Payeur" value={firstName ?? "Lecteur"} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-zinc-500">Statut</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                Confirmé <Check className="h-3 w-3" />
              </span>
            </div>
          </div>

          {!deepLinkFailed ? (
            <PrimaryButton className="mx-auto mt-6 max-w-sm" onClick={handleReturn}>
              Retour à l&apos;application
            </PrimaryButton>
          ) : (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-zinc-50 p-4 text-center">
              <ArrowLeft className="mx-auto h-5 w-5 text-zinc-500" />
              <p className="mt-2 text-sm text-zinc-600">
                Appuyez sur ← pour revenir dans l&apos;application BI LINKS
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mx-auto mt-3 flex h-14 w-full max-w-sm items-center justify-center rounded-2xl border border-zinc-200 text-base font-semibold text-zinc-700"
          >
            Voir le détail
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-3xl bg-white p-6 pb-10"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />
              <h3 className="text-lg font-semibold text-zinc-900">Détail de la transaction</h3>
              <div className="mt-4 space-y-3 text-sm">
                <ReceiptRow label="Formule" value={plan.name} />
                <ReceiptRow label="Montant" value={`${formatXaf(plan.price)} F CFA`} />
                <ReceiptRow label="Référence" value={txId ?? "—"} mono />
                <ReceiptRow label="Statut" value="Confirmé" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={cn("text-sm font-medium text-zinc-900", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}
