"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { admin, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!admin) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/signin?redirect=${redirect}`);
    }
  }, [admin, isReady, pathname, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chargement…
        </p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return <>{children}</>;
}
