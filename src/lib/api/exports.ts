import { getApiBearerToken } from "@/lib/api/auth-token";
import { getApiBaseUrl } from "@/lib/api/client";

/** Télécharge un export admin (PDF/Excel) — nécessite le bearer token, donc fetch+blob plutôt qu'un simple <a href>. */
export async function downloadAdminExport(
  path: string,
  filename: string
): Promise<void> {
  const base = getApiBaseUrl();
  const token = getApiBearerToken();
  if (!base || !token) {
    throw new Error("Session admin requise pour exporter.");
  }

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Échec de l'export (HTTP ${res.status}).`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
