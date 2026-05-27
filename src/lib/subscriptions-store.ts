import type {
  MockAbonnement,
  StatutAbonnement,
  TypeRenouvellement,
} from "@/lib/mock-data";
import { apiRequest } from "@/lib/api/client";

type AdminSubscriptionApi = {
  id: string;
  plan: { plan: string; prix: number };
  date_debut: string;
  date_fin: string;
  statut: StatutAbonnement;
  type_renouvellement: TypeRenouvellement;
  auth: {
    email: string;
    personne: { nom: string; prenom: string };
  };
};

export async function fetchSubscriptionsPersisted(): Promise<MockAbonnement[]> {
  try {
    const payload = await apiRequest<{ items: AdminSubscriptionApi[] }>(
      "/admin/subscriptions"
    );
    if (!Array.isArray(payload?.items)) return [];
    return payload.items.map((row) => ({
      id: row.id,
      utilisateurNom: `${row.auth.personne.prenom} ${row.auth.personne.nom}`.trim(),
      utilisateurEmail: row.auth.email,
      plan: row.plan.plan,
      typeRenouvellement: row.type_renouvellement,
      statut: row.statut,
      dateDebut: row.date_debut.slice(0, 10),
      dateFin: row.date_fin.slice(0, 10),
      montant: Number(row.plan.prix),
      deletedAt: null,
    }));
  } catch {
    return [];
  }
}

export async function cancelSubscriptionPersisted(id: string): Promise<void> {
  try {
    await apiRequest(`/admin/subscriptions/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason: "Annulation depuis admin web" }),
    });
  } catch {
    // fallback handled by caller
  }
}

