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
  const d = phone.replace(/\D/g, "");
  if (d.length < 3) return "+242 …";
  const prefix = d.startsWith("5") || d.startsWith("05") ? "05" : "06";
  return `+242 ${prefix}X XXX XX ${d.slice(-2)}`;
}

export function isValidCongoPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  // Accepte:
  // - format local: 06XXXXXXX / 05XXXXXXX (9 chiffres)
  // - format international: 2426XXXXXXX / 2425XXXXXXX (11 chiffres)
  return /^(0[56]\d{7}|242[56]\d{7})$/.test(d);
}
