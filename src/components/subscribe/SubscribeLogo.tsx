"use client";

import { BookOpen } from "lucide-react";

export function SubscribeLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 shadow-[0_4px_16px_rgba(124,58,237,0.35)]">
          <BookOpen className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900">BI LINKS</span>
      </div>
      <span className="mt-3 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700">
        Bibliothèque Numérique
      </span>
    </div>
  );
}
