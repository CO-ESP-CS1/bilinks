"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type SuccessAnimationProps = {
  onComplete?: () => void;
};

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const colors = ["#7C3AED", "#6366F1", "#10B981", "#F59E0B", "#EC4899"];
    const particles = Array.from({ length: 40 }, () => ({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 12,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: Math.random() * 6 + 3,
      rotation: Math.random() * Math.PI,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life -= 0.012;
        p.rotation += 0.08;
        if (p.life <= 0) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      frame += 1;
      if (frame < 90) requestAnimationFrame(animate);
      else onComplete?.();
    };
    animate();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-32 w-full max-w-xs items-center justify-center"
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_16px_48px_rgba(16,185,129,0.35)]"
      >
        <motion.svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <motion.path
            d="M12 25 L21 34 L36 16"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.55 }}
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}
