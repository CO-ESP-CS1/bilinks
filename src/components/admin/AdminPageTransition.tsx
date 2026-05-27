"use client";

import { usePathname } from "next/navigation";
import React from "react";

/**
 * Ré-anime le contenu à chaque changement de route admin.
 */
export function AdminPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="admin-page-enter">
      {children}
    </div>
  );
}
