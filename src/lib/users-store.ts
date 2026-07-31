import {
  mockUtilisateurs,
  type MockUtilisateur,
  type RoleUser,
  type StatutUser,
} from "@/lib/mock-data";
import {
  mapAdminUserDetailToMockUser,
  mapAdminUserToMockUser,
} from "@/lib/api/adapters";
import {
  buildAdminCreateBody,
  buildBanUserBody,
  validateAdminCreateBody,
} from "@/lib/admin/validators";
import type {
  AdminCreateAdminResponse,
  AdminUserDetailResponse,
  AdminUsersListResponse,
  AdminUserStatutResponse,
} from "@/lib/api/admin-types";
import { isAdminListApiReady , API_REQUIRED_MESSAGE } from "@/lib/api/admin-list-fetch";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import { messageFromApiError, SESSION_REQUIRED_MESSAGE } from "@/lib/api/errors";
import { buildAdminUsersQuery } from "@/lib/admin/validators";
import {
  unwrapListData,
  unwrapPaginationMeta,
  type PaginationMeta,
} from "@/lib/api/pagination";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

const USERS_KEY = "bibliotech_users";
const USERS_PAGE_LIMIT = 20;

let apiCache: MockUtilisateur[] | null = null;

export function resetUsersListCache(): void {
  apiCache = null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readUsers(): MockUtilisateur[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockUtilisateur[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: MockUtilisateur[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setCache(users: MockUtilisateur[]): void {
  apiCache = users;
}

export function ensureUsers(): MockUtilisateur[] {
  return apiCache ?? [];
}

export function getAllUsers(includeDeleted = false): MockUtilisateur[] {
  const list = (apiCache ?? []).map((u) => ({
    ...u,
    deletedAt: u.deletedAt ?? null,
  }));
  return includeDeleted ? list : list.filter((u) => !isSoftDeleted(u.deletedAt));
}

export function getUserById(id: string): MockUtilisateur | null {
  return getAllUsers(true).find((u) => u.id === id) ?? null;
}

function createUserLocal(input: {
  nom: string;
  prenom: string;
  email: string;
  ecole: string;
  niveau: string;
  role?: RoleUser;
  points?: number;
  abonnementActif?: boolean;
}): { ok: true; user: MockUtilisateur } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.nom.trim() || !input.prenom.trim()) {
    return { ok: false, error: "Nom, prénom et e-mail sont requis." };
  }
  const users = ensureUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "Un utilisateur utilise déjà cet e-mail." };
  }
  const user: MockUtilisateur = {
    id: `u-${Date.now()}`,
    nom: input.nom.trim(),
    prenom: input.prenom.trim(),
    email,
    ecole: input.ecole.trim() || "—",
    niveau: input.niveau.trim() || "—",
    role: input.role ?? "USER",
    statut: "ACTIF",
    points: input.points ?? 0,
    dateInscription: new Date().toISOString().slice(0, 10),
    abonnementActif: input.abonnementActif ?? false,
    membreEtablissement: false,
    deletedAt: null,
  };
  setCache([...users, user]);
  return { ok: true, user };
}

function updateUserLocal(
  id: string,
  patch: Partial<
    Pick<
      MockUtilisateur,
      | "nom"
      | "prenom"
      | "email"
      | "ecole"
      | "niveau"
      | "role"
      | "statut"
      | "points"
      | "abonnementActif"
    >
  >
): { ok: true; user: MockUtilisateur } | { ok: false; error: string } {
  const users = ensureUsers();
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const email = patch.email?.trim().toLowerCase();
  if (email && users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
    return { ok: false, error: "Un utilisateur utilise déjà cet e-mail." };
  }
  let updated: MockUtilisateur | null = null;
  const next = users.map((u) => {
    if (u.id !== id) return u;
    updated = {
      ...u,
      ...patch,
      nom: patch.nom !== undefined ? patch.nom.trim() : u.nom,
      prenom: patch.prenom !== undefined ? patch.prenom.trim() : u.prenom,
      email: email ?? u.email,
      ecole: patch.ecole !== undefined ? patch.ecole.trim() : u.ecole,
      niveau: patch.niveau !== undefined ? patch.niveau.trim() : u.niveau,
    };
    return updated;
  });
  if (!updated) {
    return { ok: false, error: "Mise à jour impossible." };
  }
  setCache(next);
  return { ok: true, user: updated };
}

function deleteUserLocal(
  id: string
): { ok: true } | { ok: false; error: string } {
  const users = ensureUsers();
  if (!users.some((u) => u.id === id)) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const next = users.map((u) =>
    u.id === id ? { ...u, deletedAt: softDeleteTimestamp() } : u
  );
  setCache(next);
  return { ok: true };
}

export type FetchUsersOptions = {
  statut?: StatutUser | "PENDING";
  role?: RoleUser;
  q?: string;
  abonnement_actif?: boolean;
  page?: number;
  limit?: number;
};

export type FetchUsersResult = {
  users: MockUtilisateur[];
  meta: PaginationMeta | null;
};

/**
 * Liste admin — GET /admin/users ({ data, meta }).
 * Filtres : statut, role (USER|ADMIN), q. Tous statuts par défaut.
 */
export async function fetchUsersPersisted(
  options?: FetchUsersOptions
): Promise<FetchUsersResult> {
  if (!isApiConfigured()) {
    return { users: [], meta: null };
  }
  if (!isAdminListApiReady()) {
    return { users: [], meta: null };
  }

  try {
    const params = buildAdminUsersQuery({
      statut: options?.statut,
      role: options?.role,
      q: options?.q,
      abonnement_actif: options?.abonnement_actif,
      page: options?.page ?? 1,
      limit: options?.limit ?? USERS_PAGE_LIMIT,
    });

    const payload = await apiRequest<AdminUsersListResponse>(
      `${ADMIN_ROUTES.users.list}?${params.toString()}`
    );
    const rows = unwrapListData(payload);
    const mapped = rows.map(mapAdminUserToMockUser);
    setCache(mapped);
    return {
      users: mapped,
      meta: unwrapPaginationMeta(payload),
    };
  } catch {
    return { users: [], meta: null };
  }
}

/** Alias historique */
export const fetchUsers = fetchUsersPersisted;

export async function fetchUserDetailPersisted(
  id: string
): Promise<
  | { ok: true; user: MockUtilisateur; detail: AdminUserDetailResponse }
  | { ok: false; error: string }
> {
  if (!isApiConfigured()) {
    return { ok: false, error: API_REQUIRED_MESSAGE };
  }

  if (!isAdminListApiReady()) {
    return { ok: false, error: SESSION_REQUIRED_MESSAGE };
  }

  try {
    const detail = await apiRequest<AdminUserDetailResponse>(
      ADMIN_ROUTES.users.byId(id)
    );
    const user = mapAdminUserDetailToMockUser(detail);
    const next = getAllUsers().map((u) => (u.id === id ? user : u));
    setCache(next.length ? next : [user]);
    return { ok: true, user, detail };
  } catch (err) {
    return {
      ok: false,
      error: messageFromApiError(err, "Chargement du profil impossible."),
    };
  }
}

/**
 * Création admin — POST /admin/users.
 * role=ADMIN, statut=ACTIF, email_verified=true (côté serveur).
 */
export async function createAdminPersisted(input: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  const apiMode = isApiConfigured();
  const validationError = validateAdminCreateBody(input, apiMode);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (apiMode) {
    if (!isAdminListApiReady()) {
      return { ok: false, error: SESSION_REQUIRED_MESSAGE };
    }

    try {
      const created = await apiRequest<AdminCreateAdminResponse>(
        ADMIN_ROUTES.users.create,
        {
          method: "POST",
          body: JSON.stringify(buildAdminCreateBody(input)),
        }
      );

      await fetchUsersPersisted({ role: "ADMIN", limit: 100 });

      const user: MockUtilisateur = {
        id: created.id,
        nom: input.nom.trim(),
        prenom: input.prenom.trim(),
        email: created.email,
        ecole: "—",
        niveau: "—",
        role: created.role === "ADMIN" ? "ADMIN" : "USER",
        statut: created.statut,
        points: 0,
        dateInscription: new Date().toISOString().slice(0, 10),
        abonnementActif: false,
        membreEtablissement: false,
        deletedAt: null,
      };
      return { ok: true, user };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Création administrateur impossible."),
      };
    }
  }

  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function createUserPersisted(input: {
  nom: string;
  prenom: string;
  email: string;
  ecole: string;
  niveau: string;
  role?: RoleUser;
  points?: number;
  abonnementActif?: boolean;
}): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  if (isApiConfigured() && input.role === "ADMIN") {
    return {
      ok: false,
      error:
        "Création admin : utilisez la page Administrateurs avec mot de passe.",
    };
  }
  if (isApiConfigured()) {
    return {
      ok: false,
      error:
        "La création de comptes utilisateurs se fait depuis l'application mobile, pas depuis l'administration.",
    };
  }
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

/**
 * Bannir — PATCH /admin/users/{id}/ban.
 * Corps optionnel `{ raison }` (journalisée, non persistée). Réponse `{ id, statut }`.
 */
export async function banUserPersisted(
  id: string,
  raison?: string
): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return { ok: false, error: SESSION_REQUIRED_MESSAGE };
    }

    try {
      const res = await apiRequest<AdminUserStatutResponse>(
        ADMIN_ROUTES.users.ban(id),
        {
          method: "PATCH",
          body: JSON.stringify(buildBanUserBody(raison)),
        }
      );

      const refreshed = await fetchUserDetailPersisted(id);
      if (refreshed.ok) {
        return { ok: true, user: refreshed.user };
      }

      const cached = getUserById(id);
      if (cached) {
        return {
          ok: true,
          user: { ...cached, statut: res.statut === "BANNI" ? "BANNI" : cached.statut },
        };
      }

      return { ok: false, error: "Utilisateur introuvable." };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Bannissement impossible."),
      };
    }
  }

  const user = getUserById(id);
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

/**
 * Débannir — PATCH /admin/users/{id}/unban.
 * Sans corps. Réponse `{ id, statut }` avec `statut` → ACTIF.
 */
export async function unbanUserPersisted(
  id: string
): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    if (!isAdminListApiReady()) {
      return { ok: false, error: SESSION_REQUIRED_MESSAGE };
    }

    try {
      const res = await apiRequest<AdminUserStatutResponse>(
        ADMIN_ROUTES.users.unban(id),
        { method: "PATCH" }
      );

      const refreshed = await fetchUserDetailPersisted(id);
      if (refreshed.ok) {
        return { ok: true, user: refreshed.user };
      }

      const cached = getUserById(id);
      if (cached) {
        return {
          ok: true,
          user: { ...cached, statut: res.statut === "ACTIF" ? "ACTIF" : cached.statut },
        };
      }

      return { ok: false, error: "Utilisateur introuvable." };
    } catch (err) {
      return {
        ok: false,
        error: messageFromApiError(err, "Débannissement impossible."),
      };
    }
  }

  const user = getUserById(id);
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function toggleUserBanPersisted(
  id: string,
  raison?: string,
  currentStatut?: StatutUser | "PENDING"
): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    if (currentStatut === "BANNI") {
      return unbanUserPersisted(id);
    }
    return banUserPersisted(id, raison);
  }

  const user = getUserById(id);
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  if (user.statut === "BANNI") {
    return unbanUserPersisted(id);
  }
  return banUserPersisted(id, raison);
}

export async function updateUserPersisted(
  id: string,
  patch: Partial<
    Pick<
      MockUtilisateur,
      | "nom"
      | "prenom"
      | "email"
      | "ecole"
      | "niveau"
      | "role"
      | "statut"
      | "points"
      | "abonnementActif"
    >
  >
): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    return {
      ok: false,
      error:
        "Modification profil non exposée par l’API (ban / unban uniquement).",
    };
  }
  return { ok: false, error: API_REQUIRED_MESSAGE };
}

export async function deleteUserPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isApiConfigured()) {
    return {
      ok: false,
      error: "Suppression compte non disponible via l’API admin.",
    };
  }
  return { ok: false, error: API_REQUIRED_MESSAGE };
}
