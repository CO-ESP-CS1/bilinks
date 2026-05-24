"use client";

import React from "react";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserAddressCard from "@/components/user-profile/UserAddressCard";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={adminCrumb("Profil")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Informations affichées et modifiables pour votre compte administrateur
          (mode démo).
        </p>
      </div>

      <UserMetaCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UserInfoCard />
        <UserAddressCard />
      </div>
    </div>
  );
}
