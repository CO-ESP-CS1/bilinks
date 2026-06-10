"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-[0.06] blur-[100px]"
        style={{ background: "#004AC6" }}
      />
      <div
        className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full opacity-[0.05] blur-[100px]"
        style={{ background: "#EF5A28" }}
      />
    </div>
  );
}
