/** Mode test local sans backend — activer via NEXT_PUBLIC_SUBSCRIBE_MOCK=true */
export const SUBSCRIBE_MOCK = process.env.NEXT_PUBLIC_SUBSCRIBE_MOCK === "true";

export function mockTransactionId(): string {
  return `BL-${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
