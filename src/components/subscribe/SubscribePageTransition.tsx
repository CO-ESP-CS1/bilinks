"use client";

import { motion } from "framer-motion";

/** Transition légère sans AnimatePresence — évite les écrans blancs entre routes. */
export function SubscribePageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
