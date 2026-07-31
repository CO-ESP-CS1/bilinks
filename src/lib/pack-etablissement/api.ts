import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError } from "@/lib/api/errors";

export type OffreEtablissement = {
  id: string;
  nom: string;
  nb_users_max: number;
  prix: number;
  devise: string;
  duree_jours: number;
};

/** GET /etablissements/offres — retourne un tableau brut (pas d'enveloppe `data`). */
export async function fetchOffresPubliques(): Promise<OffreEtablissement[]> {
  if (!isApiConfigured()) return [];
  try {
    return await apiRequest<OffreEtablissement[]>("/etablissements/offres");
  } catch {
    return [];
  }
}

export type PayerEtablissementInput = {
  offre_id: string;
  nom_etablissement: string;
  email_contact: string;
  telephone_contact?: string;
  operator?: "MTN" | "AIRTEL";
  phonenumber?: string;
  country?: string;
};

export type PayerEtablissementResult = {
  ref_transaction: string;
  paiement_id: string;
  payment_url?: string;
};

export async function payerEtablissement(
  input: PayerEtablissementInput
): Promise<
  { ok: true; data: PayerEtablissementResult } | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return { ok: false, error: "Service indisponible pour le moment." };
  }
  try {
    const data = await apiRequest<PayerEtablissementResult>(
      "/etablissements/payer",
      {
        method: "POST",
        body: JSON.stringify({
          ...input,
          operator:
            input.operator === "MTN"
              ? "MTN_MOMO_COG"
              : input.operator === "AIRTEL"
                ? "AIRTEL_COG"
                : undefined,
        }),
      }
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Impossible d'initier le paiement."),
    };
  }
}

export type StatutPaiementEtablissement = {
  ref_transaction: string;
  statut: "EN_ATTENTE" | "SUCCES" | "ECHEC";
  etablissement: {
    code_invitation: string;
    nom: string;
    date_debut: string;
    date_fin: string;
  } | null;
};

export async function fetchStatutPaiementEtablissement(
  ref: string
): Promise<StatutPaiementEtablissement | null> {
  if (!isApiConfigured()) return null;
  try {
    return await apiRequest<StatutPaiementEtablissement>(
      `/etablissements/paiements/${encodeURIComponent(ref)}/statut`
    );
  } catch {
    return null;
  }
}
