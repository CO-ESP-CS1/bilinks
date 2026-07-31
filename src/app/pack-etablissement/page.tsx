"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Ancienne page dédiée aux packs établissement, désormais fusionnée dans
 * l'interface d'achat unique de /subscribe (onglet « Établissement »).
 * Conservée comme redirection pour ne pas casser les liens déjà partagés.
 */
export default function PackEtablissementPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/subscribe?type=etablissement");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#004AC6]" />
    </div>
  );
}
