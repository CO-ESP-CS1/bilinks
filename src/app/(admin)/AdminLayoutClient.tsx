"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { AdminPageTransition } from "@/components/admin/AdminPageTransition";
import { ApiSessionBanner } from "@/components/admin/ApiSessionBanner";
import React from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <AuthGuard>
      <div className="min-h-screen xl:flex">
        <AppSidebar />
        <Backdrop />
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <ApiSessionBanner />
            <AdminPageTransition>{children}</AdminPageTransition>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
