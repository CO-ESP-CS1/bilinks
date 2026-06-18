import { cn } from "@/lib/cn";

type PoweredByPawapayProps = {
  className?: string;
  size?: "xs" | "sm";
};

/**
 * Mention « Propulsé par PawaPay » — style marque (gris + violet).
 */
export function PoweredByPawapay({
  className,
  size = "sm",
}: PoweredByPawapayProps) {
  return (
    <p
      className={cn(
        "text-center font-normal tracking-tight",
        size === "xs" ? "text-xs" : "text-sm",
        className
      )}
      aria-label="Propulsé par PawaPay"
    >
      <span className="text-zinc-400 dark:text-zinc-500">Propulsé par </span>
      <span className="font-bold text-[#8B3FC8] dark:text-[#C4A3E8]">PawaPay</span>
    </p>
  );
}
