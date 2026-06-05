"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { MockCategorie } from "@/lib/mock-data";
import {
  fetchCategoriesPersisted,
  getCategoryById,
} from "@/lib/categories-store";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon } from "@/icons";

function formatLivres(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} livre${n > 1 ? "s" : ""}`;
}

export default function CategorieDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [categorie, setCategorie] = useState<MockCategorie | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchCategoriesPersisted();
      if (cancelled) return;
      setCategorie(getCategoryById(id));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!categorie) {
    notFound();
  }

  const crumbs = [
    { label: "Administration", href: "/admin" },
    { label: "Catégories", href: "/admin/categories" },
    { label: categorie.nom },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={crumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {categorie.nom}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {categorie.description || "—"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge color="primary" size="sm" variant="light">
              {formatLivres(categorie.nbLivres)}
            </Badge>
            {categorie.deletedAt != null ? (
              <Badge color="error" size="sm" variant="light">
                Supprimée (soft delete)
              </Badge>
            ) : (
              <Badge color="success" size="sm" variant="light">
                Active
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categorie.deletedAt == null && (
            <Link href={`/admin/categories/${categorie.id}/modifier`}>
              <Button
                size="sm"
                variant="outline"
                startIcon={<PencilIcon className="size-4" />}
              >
                Modifier
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
              Identifiant
            </dt>
            <dd className="mt-1 font-mono text-sm text-gray-800 dark:text-white/90">
              {categorie.id}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
              Nombre de livres
            </dt>
            <dd className="mt-1 text-sm text-gray-800 dark:text-white/90">
              {formatLivres(categorie.nbLivres)}
            </dd>
          </div>
        </dl>
        {categorie.deletedAt && (
          <p className="mt-4 text-sm text-error-500">
            Supprimée le{" "}
            {new Date(categorie.deletedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>
    </div>
  );
}
