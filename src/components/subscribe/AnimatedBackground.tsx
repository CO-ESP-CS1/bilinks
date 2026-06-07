"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-[0.04] blur-[80px]"
        style={{ background: "#7C3AED" }}
      />
      <div
        className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full opacity-[0.04] blur-[80px]"
        style={{ background: "#6366F1" }}
      />
    </div>
  );
}
