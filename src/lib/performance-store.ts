import type {
  AdminPerformanceOverviewApi,
  AdminPerformancePeriode,
} from "@/lib/api/admin-types";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export async function fetchPerformanceOverviewPersisted(
  periode?: AdminPerformancePeriode
): Promise<AdminPerformanceOverviewApi | null> {
  if (!isApiConfigured()) return null;

  try {
    const query = periode ? `periode=${periode}` : undefined;
    return await apiRequest<AdminPerformanceOverviewApi>(
      ADMIN_ROUTES.performance.overview(query)
    );
  } catch {
    return null;
  }
}
