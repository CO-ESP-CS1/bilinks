import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <ThemeProvider>
        <div className="flex min-h-screen">
          {children}
          <AuthBrandPanel />
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </ThemeProvider>
    </div>
  );
}
