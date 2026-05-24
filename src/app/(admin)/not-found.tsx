import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Retour au tableau de bord
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
      >
        Tableau de bord
      </Link>
    </div>
  );
}
