"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearDemoPersistedLists } from "@/lib/api/admin-list-fetch";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";
import { resetAuteursListCache } from "@/lib/auteurs-store";
import { resetCategoriesListCache } from "@/lib/categories-store";
import { resetCommentsListCache } from "@/lib/comments-store";
import { resetLivresListCache } from "@/lib/livres-store";
import { resetPaymentsListCache } from "@/lib/payments-store";
import { resetBadgesListCache } from "@/lib/badges-store";
import { resetChallengesListCache } from "@/lib/challenges-store";
import { resetSubscriptionsListCache } from "@/lib/subscriptions-store";
import { resetUsersListCache } from "@/lib/users-store";

export function ApiSessionBanner() {
  useEffect(() => {
    if (!isApiConfigured() || !hasApiSession()) return;
    clearDemoPersistedLists();
    resetLivresListCache();
    resetAuteursListCache();
    resetUsersListCache();
    resetCategoriesListCache();
    resetSubscriptionsListCache();
    resetPaymentsListCache();
    resetCommentsListCache();
    resetBadgesListCache();
    resetChallengesListCache();
  }, []);

  if (!isApiConfigured() || hasApiSession()) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-warning-500/50 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
    >
      Session expirée ou non connectée. Reconnectez-vous sur{" "}
      <Link href="/signin" className="font-semibold underline">
        la page de connexion
      </Link>{" "}
      avec un compte <strong>ADMIN</strong>.
    </div>
  );
}
