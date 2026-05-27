import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { BrandMark } from "@/components/common/BrandMark";
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
          {/* Panneau gauche : formulaire */}
          {children}

          {/* Panneau droit : branding immersif */}
          <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:items-center lg:justify-center">
            {/* Fond navy avec gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f2744] via-[#162d4a] to-[#1a3a5c]" />

            {/* Motif géométrique subtil */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Cercles décoratifs */}
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/5" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-400/5" />
            <div className="absolute right-20 bottom-32 h-40 w-40 rounded-full bg-amber-300/5" />

            {/* Contenu central */}
            <div className="relative z-10 flex max-w-sm flex-col items-center px-8 text-center">
              <BrandMark href="" showText={false} theme="auth" size="xl" className="mb-8" />

              <h2 className="text-3xl font-bold tracking-tight text-white">
                Biblio<span className="text-amber-300">Tech</span>
              </h2>
              <p className="mt-2 text-sm font-medium text-blue-200/80">
                Console d&apos;administration
              </p>

              <div className="mt-10 w-full space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/80">Gestion complète du catalogue</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/80">Suivi des lecteurs & abonnés</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/80">Statistiques & analyses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </ThemeProvider>
    </div>
  );
}
