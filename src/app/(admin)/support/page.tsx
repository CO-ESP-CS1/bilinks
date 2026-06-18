"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb, adminCrumb } from "@/components/Breadcrumb";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={adminCrumb("Support")} />
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Support B LINKS
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Aide, contact et ressources pour les administrateurs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Contact
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Écrivez à l&apos;équipe produit pour un incident ou une question
            fonctionnelle.
          </p>
          <a
            href="mailto:support@bibliotech.app"
            className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            support@bibliotech.app
          </a>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Documentation
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Guides d&apos;utilisation de l&apos;administration (à compléter avec
            votre base de connaissances).
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-6 dark:border-gray-700 dark:bg-white/[0.02]">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          FAQ rapide
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            Les données proviennent du backend lorsque{" "}
            <code>NEXT_PUBLIC_API_BASE_URL</code> est configuré.
          </li>
          <li>
            Pour la modération, privilégiez la page &quot;Commentaires&quot; du
            menu.
          </li>
        </ul>
      </div>
    </div>
  );
}
