"use client";

import { useAuth } from "@/context/AuthContext";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { admin, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const apiMode = isApiConfigured();
  const sessionOk = !apiMode || hasApiSession();

  useEffect(() => {
    if (!isReady) return;
    if (!admin || !sessionOk) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/signin?redirect=${redirect}`);
    }
  }, [admin, isReady, pathname, router, sessionOk]);

  if (!isReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chargement…
        </p>
      </div>
    );
  }

  if (!admin || !sessionOk) {
    return null;
  }

  return <>{children}</>;
}
