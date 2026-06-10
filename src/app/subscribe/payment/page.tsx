"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { AccountInfoCard } from "@/components/subscribe/AccountInfoCard";
import { PaymentMethod } from "@/components/subscribe/PaymentMethod";
import { PaymentSummary } from "@/components/subscribe/PaymentSummary";
import { PrimaryButton } from "@/components/subscribe/PrimaryButton";
import { StepIndicator } from "@/components/subscribe/StepIndicator";
import { SubscribePageSkeleton } from "@/components/subscribe/SubscribePageSkeleton";
import { isValidCongoPhone, maskPhone } from "@/components/subscribe/PhoneInput";
import { useSubscription } from "@/context/SubscriptionContext";
import {
  fetchSubscribeMe,
  initiatePayment,
  fetchPaymentStatus,
  SUBSCRIBE_MOCK,
  type SubscribeMeProfile,
} from "@/lib/subscribe/api";
import type { PaymentProvider } from "@/lib/subscribe/plans";
import { subscribeStorage } from "@/lib/subscribe/storage";

type Phase = "form" | "processing" | "waiting";

export default function SubscribePaymentPage() {
  const router = useRouter();
  const { isHydrated, plan, planId, planApiId, token, userId, setPayment, setTransactionId } =
    useSubscription();
  const [provider, setProvider] = useState<PaymentProvider | null>(
    subscribeStorage.getProvider()
  );
  const [phone, setPhone] = useState(subscribeStorage.getPhone() ?? "");
  const [phase, setPhase] = useState<Phase>("form");
  const [countdown, setCountdown] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SubscribeMeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!planId) {
      router.replace("/subscribe");
      return;
    }
    if (!SUBSCRIBE_MOCK && !planApiId) {
      router.replace("/subscribe");
      return;
    }
    if (!token && !SUBSCRIBE_MOCK) {
      router.replace("/subscribe/auth");
    }
  }, [isHydrated, planId, planApiId, token, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token && !SUBSCRIBE_MOCK) return;

    let cancelled = false;
    setProfileLoading(true);
    fetchSubscribeMe(token ?? undefined)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("session") || msg.includes("connexion")) {
            router.replace("/subscribe/auth");
          } else {
            setError(msg || "Impossible de charger votre profil. Réessayez.");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token]);

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "waiting" || countdown > 0) return;
    router.push("/subscribe/error?reason=timeout");
  }, [phase, countdown, router]);

  useEffect(() => {
    if (phase !== "waiting") return;
    const txId = subscribeStorage.getTransactionId();
    if (!txId) return;

    if (SUBSCRIBE_MOCK) {
      const timer = setTimeout(() => router.push("/subscribe/success"), 2000);
      return () => clearTimeout(timer);
    }

    const poll = setInterval(async () => {
      try {
        const status = await fetchPaymentStatus(txId);
        if (status.status === "success") {
          clearInterval(poll);
          router.push("/subscribe/success");
        } else if (status.status === "failed") {
          clearInterval(poll);
          router.push(
            `/subscribe/error?reason=${status.reason ?? "payment_cancelled"}`
          );
        }
        // EN_ATTENTE → on continue de poller jusqu'au timeout (countdown = 0)
      } catch (err) {
        // Si session expirée → sortir du polling et afficher l'erreur
        if (err instanceof Error && /session|connexion/i.test(err.message)) {
          clearInterval(poll);
          router.push("/subscribe/error?reason=session_expired");
        }
        // Autres erreurs réseau → réessayer au prochain tick
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [phase, router]);

  const canSubmit =
    provider &&
    isValidCongoPhone(phone) &&
    plan &&
    (SUBSCRIBE_MOCK || (userId && token && planApiId));

  const handlePay = async () => {
    if (!canSubmit || !provider) return;
    setError(null);
    setPayment({ provider, phone });
    setPhase("processing");
    subscribeStorage.resetPollCount();

    try {
      const res = await initiatePayment({
        planApiId: planApiId ?? "mock-plan-id",
        phone,
        provider,
      });
      setTransactionId(res.transactionId);
      setPhase("waiting");
    } catch (err) {
      setPhase("form");
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'initier le paiement. Vérifiez votre connexion et réessayez."
      );
    }
  };

  if (!isHydrated || !plan) {
    return <SubscribePageSkeleton />;
  }

  if (phase === "processing") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 sm:px-0">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#004AC6]" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-800">Traitement en cours…</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Connexion au service {provider === "AIRTEL" ? "Airtel" : "MTN"}…
          </p>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    const progress = ((120 - countdown) / 120) * 100;
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:px-0">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-amber-400/15">
            <Smartphone className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">Confirmez sur votre téléphone</h2>
          <p className="mt-2 text-sm text-zinc-500">Envoyé au {maskPhone(phone)}</p>

          <div className="relative mx-auto mt-6 h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="#E4E4E7" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={countdown < 30 ? "#EF4444" : countdown < 60 ? "#F59E0B" : "#004AC6"}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-800">
              {countdown}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-left text-sm text-zinc-600">
            <p>1. Ouvrez votre app {provider === "AIRTEL" ? "Airtel Money" : "MTN MoMo"}</p>
            <p className="mt-2">2. Acceptez la demande de paiement</p>
            <p className="mt-2">3. Revenez ici automatiquement</p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/subscribe/error?reason=payment_cancelled")}
            className="mt-6 text-xs text-zinc-400 underline"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <StepIndicator current={3} />
      <div className="mx-auto w-full max-w-lg pt-6 sm:max-w-xl">
        <AccountInfoCard profile={profile} loading={profileLoading} />

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-zinc-800 sm:text-lg">
            Votre formule
          </h2>
          <PaymentSummary plan={plan} />
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-zinc-800 sm:text-lg">
            Mode de paiement
          </h2>
          <div className="space-y-3">
            <PaymentMethod
              provider="MTN"
              label="MTN Mobile Money"
              logoClass="bg-[#FFCB00] text-black"
              logoText="MoMo"
              selected={provider === "MTN"}
              expanded={provider === "MTN"}
              phone={phone}
              onSelect={() => setProvider("MTN")}
              onPhoneChange={setPhone}
            />
            <PaymentMethod
              provider="AIRTEL"
              label="Airtel Money"
              logoClass="bg-[#E40000] text-white italic"
              logoText="air"
              selected={provider === "AIRTEL"}
              expanded={provider === "AIRTEL"}
              phone={phone}
              onSelect={() => setProvider("AIRTEL")}
              onPhoneChange={setPhone}
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <div className="mt-6">
            <PrimaryButton disabled={!canSubmit || profileLoading} onClick={handlePay}>
              Payer
            </PrimaryButton>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Transaction sécurisée et chiffrée
          </p>
        </section>
      </div>
    </div>
  );
}
