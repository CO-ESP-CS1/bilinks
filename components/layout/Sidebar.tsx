import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-slate-200 bg-white px-6 py-8">
      <div className="mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        BiblioTech
      </div>
      <nav className="space-y-3 text-sm text-slate-700">
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/">
          Tableau de bord
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/users">
          Utilisateurs
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/catalogue">
          Catalogue
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/subscriptions">
          Abonnements
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/reviews">
          Avis
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/notifications">
          Notifications
        </Link>
        <Link className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/analytics">
          Analytics
        </Link>
      </nav>
    </aside>
  );
}
