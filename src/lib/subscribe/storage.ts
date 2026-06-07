import type { PaymentProvider, SubscribePlanId } from "@/lib/subscribe/plans";

const KEYS = {
  token: "bilinks_subscribe_token",
  planId: "bilinks_subscribe_plan",
  userId: "bilinks_subscribe_user_id",
  firstName: "bilinks_subscribe_first_name",
  provider: "bilinks_subscribe_provider",
  phone: "bilinks_subscribe_phone",
  transactionId: "bilinks_subscribe_transaction_id",
  pollCount: "bilinks_subscribe_poll_count",
} as const;

function ss(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export const subscribeStorage = {
  getToken(): string | null {
    return ss()?.getItem(KEYS.token) ?? null;
  },
  setToken(token: string) {
    ss()?.setItem(KEYS.token, token);
  },
  clearToken() {
    ss()?.removeItem(KEYS.token);
  },

  getPlanId(): SubscribePlanId | null {
    const v = ss()?.getItem(KEYS.planId);
    return v as SubscribePlanId | null;
  },
  setPlanId(id: SubscribePlanId) {
    ss()?.setItem(KEYS.planId, id);
  },

  getUserId(): string | null {
    return ss()?.getItem(KEYS.userId) ?? null;
  },
  setUserId(id: string) {
    ss()?.setItem(KEYS.userId, id);
  },

  getFirstName(): string | null {
    return ss()?.getItem(KEYS.firstName) ?? null;
  },
  setFirstName(name: string) {
    ss()?.setItem(KEYS.firstName, name);
  },

  getProvider(): PaymentProvider | null {
    const v = ss()?.getItem(KEYS.provider);
    return v as PaymentProvider | null;
  },
  setProvider(p: PaymentProvider) {
    ss()?.setItem(KEYS.provider, p);
  },

  getPhone(): string | null {
    return ss()?.getItem(KEYS.phone) ?? null;
  },
  setPhone(phone: string) {
    ss()?.setItem(KEYS.phone, phone);
  },

  getTransactionId(): string | null {
    return ss()?.getItem(KEYS.transactionId) ?? null;
  },
  setTransactionId(id: string) {
    ss()?.setItem(KEYS.transactionId, id);
  },

  getPollCount(): number {
    return Number(ss()?.getItem(KEYS.pollCount) ?? "0");
  },
  incrementPollCount(): number {
    const next = subscribeStorage.getPollCount() + 1;
    ss()?.setItem(KEYS.pollCount, String(next));
    return next;
  },
  resetPollCount() {
    ss()?.removeItem(KEYS.pollCount);
  },

  setSession(data: {
    token: string;
    userId: string;
    firstName: string;
  }) {
    subscribeStorage.setToken(data.token);
    subscribeStorage.setUserId(data.userId);
    subscribeStorage.setFirstName(data.firstName);
  },

  clearPayment() {
    ss()?.removeItem(KEYS.transactionId);
    subscribeStorage.resetPollCount();
  },
};

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    ""
  );
}
