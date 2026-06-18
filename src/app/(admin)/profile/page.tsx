"use client";

import React, { useEffect } from "react";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import { useAuth } from "@/context/AuthContext";
import { isApiConfigured } from "@/lib/api/client";
import { hasApiSession } from "@/lib/api/session";

export default function ProfilePage() {
  const { syncAdminFromApi } = useAuth();

  useEffect(() => {
    if (!isApiConfigured() || !hasApiSession()) return;
    void syncAdminFromApi();
  }, [syncAdminFromApi]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Profil")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Informations affichées et modifiables pour votre compte administrateur.
        </p>
      </div>

      <UserMetaCard />

      <UserInfoCard />
    </div>
  );
}
