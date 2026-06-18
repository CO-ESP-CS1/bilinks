"use client";

import { cn } from "@/lib/cn";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  provider?: "MTN" | "AIRTEL";
};

export function PhoneInput({ value, onChange, provider }: PhoneInputProps) {
  // Numéro Congo local: 9 chiffres (ex: 069502385)
  const digits = value.replace(/\D/g, "").slice(0, 9);

  const formatted = digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();

  const placeholder = provider === "AIRTEL" ? "05 XX XX XX XX" : "06 XX XX XX XX";

  return (
    <div className="flex h-[52px] overflow-hidden rounded-xl border-[1.5px] border-zinc-200 focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.10)]">
      <div className="flex items-center gap-2 border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
        <span aria-hidden>🇨🇬</span>
        <span>+242</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        value={formatted}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
        placeholder={placeholder}
        className="flex-1 bg-white px-3 font-mono text-base tracking-wider text-zinc-900 outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}

export function maskPhone(phone: string): string {
  const local = toLocalNineDigits(phone);
  if (!local || local.length < 3) return "+242 …";
  const prefix = local.slice(0, 2);
  return `+242 ${prefix}X XXX XX ${local.slice(-2)}`;
}

function toLocalNineDigits(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (/^0[56]\d{7}$/.test(d)) return d;
  if (/^242[56]\d{7}$/.test(d)) return `0${d.slice(3)}`;
  return null;
}

function localPrefix(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 2) return null;
  if (d.startsWith("242")) {
    if (d.length < 5) return null;
    return d.slice(3, 5);
  }
  if (d.startsWith("0")) return d.slice(0, 2);
  return `0${d[0]}`;
}

export function isValidCongoPhone(
  phone: string,
  provider?: "MTN" | "AIRTEL"
): boolean {
  const local = toLocalNineDigits(phone);
  if (!local) return false;

  if (provider === "MTN") return /^06\d{7}$/.test(local);
  if (provider === "AIRTEL") return /^05\d{7}$/.test(local);
  return /^0[56]\d{7}$/.test(local);
}

export function getCongoPhoneProviderError(
  phone: string,
  provider: "MTN" | "AIRTEL"
): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 2) return null;

  const prefix = localPrefix(phone);
  if (!prefix) return null;

  if (provider === "MTN" && prefix !== "06") {
    return "Les numéros MTN Mobile Money doivent commencer par 06.";
  }
  if (provider === "AIRTEL" && prefix !== "05") {
    return "Les numéros Airtel Money doivent commencer par 05.";
  }

  if (d.length >= 9 && !isValidCongoPhone(phone, provider)) {
    return "Numéro incomplet. Saisissez 9 chiffres (ex. 06 95 02 38 5).";
  }

  return null;
}
