"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { fetchSubscribePlans } from "@/lib/subscribe/api";
import type { PaymentProvider, SubscribePlan, SubscribePlanId } from "@/lib/subscribe/plans";
import { getPlanById } from "@/lib/subscribe/plans";
import { subscribeStorage } from "@/lib/subscribe/storage";

type SubscriptionContextValue = {
  isHydrated: boolean;
  plan: SubscribePlan | null;
  planId: SubscribePlanId | null;
  planApiId: string | null;
  token: string | null;
  userId: string | null;
  firstName: string | null;
  provider: PaymentProvider | null;
  phone: string | null;
  transactionId: string | null;
  setPlan: (id: SubscribePlanId, apiId?: string) => void;
  setAuth: (data: { token: string; userId: string; firstName: string }) => void;
  setPayment: (data: { provider: PaymentProvider; phone: string }) => void;
  setTransactionId: (id: string) => void;
  hydrate: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function readStorageState() {
  return {
    planId: subscribeStorage.getPlanId(),
    planApiId: subscribeStorage.getPlanApiId(),
    token: subscribeStorage.getToken(),
    userId: subscribeStorage.getUserId(),
    firstName: subscribeStorage.getFirstName(),
    provider: subscribeStorage.getProvider(),
    phone: subscribeStorage.getPhone(),
    transactionId: subscribeStorage.getTransactionId(),
  };
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [planId, setPlanIdState] = useState<SubscribePlanId | null>(null);
  const [planApiId, setPlanApiIdState] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [transactionId, setTransactionIdState] = useState<string | null>(null);
  /** Prix réels côté serveur, par plan (source de vérité pour l'affichage). */
  const [apiPrices, setApiPrices] = useState<Record<string, number>>({});

  // Les prix sont administrables : les constantes locales ne servent que de
  // libellés/fallback. Sans cette récupération, les étapes 2-4 réafficheraient
  // l'ancien prix codé en dur alors que le débit se fait au prix du serveur.
  useEffect(() => {
    let cancelled = false;
    fetchSubscribePlans()
      .then((plans) => {
        if (cancelled) return;
        const prices: Record<string, number> = {};
        for (const p of plans) prices[p.plan] = Number(p.prix);
        setApiPrices(prices);
      })
      .catch(() => {
        /* fallback : prix locaux */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hydrate = useCallback(() => {
    const stored = readStorageState();
    setPlanIdState(stored.planId);
    setPlanApiIdState(stored.planApiId);
    setToken(stored.token);
    setUserId(stored.userId);
    setFirstName(stored.firstName);
    setProvider(stored.provider);
    setPhone(stored.phone);
    setTransactionIdState(stored.transactionId);
  }, []);

  useLayoutEffect(() => {
    hydrate();
    setIsHydrated(true);
  }, [hydrate]);

  const setPlan = useCallback((id: SubscribePlanId, apiId?: string) => {
    subscribeStorage.setPlanId(id);
    setPlanIdState(id);
    if (apiId) {
      subscribeStorage.setPlanApiId(apiId);
      setPlanApiIdState(apiId);
    }
  }, []);

  const setAuth = useCallback(
    (data: { token: string; userId: string; firstName: string }) => {
      subscribeStorage.setSession(data);
      setToken(data.token);
      setUserId(data.userId);
      setFirstName(data.firstName);
    },
    []
  );

  const setPayment = useCallback(
    (data: { provider: PaymentProvider; phone: string }) => {
      subscribeStorage.setProvider(data.provider);
      subscribeStorage.setPhone(data.phone);
      setProvider(data.provider);
      setPhone(data.phone);
    },
    []
  );

  const setTransactionId = useCallback((id: string) => {
    subscribeStorage.setTransactionId(id);
    setTransactionIdState(id);
  }, []);

  const resolvedPlan = useMemo(() => {
    const base = getPlanById(planId);
    if (!base) return null;
    const apiPrice = apiPrices[base.id];
    return apiPrice != null ? { ...base, price: apiPrice } : base;
  }, [planId, apiPrices]);

  const value = useMemo(
    () => ({
      isHydrated,
      plan: resolvedPlan,
      planId,
      planApiId,
      token,
      userId,
      firstName,
      provider,
      phone,
      transactionId,
      setPlan,
      setAuth,
      setPayment,
      setTransactionId,
      hydrate,
    }),
    [
      isHydrated,
      resolvedPlan,
      planId,
      planApiId,
      token,
      userId,
      firstName,
      provider,
      phone,
      transactionId,
      setPlan,
      setAuth,
      setPayment,
      setTransactionId,
      hydrate,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
