import {
  mockUtilisateurs,
  type MockUtilisateur,
  type RoleUser,
  type StatutUser,
} from "@/lib/mock-data";
import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";
import { mapAdminUserToMockUser } from "@/lib/api/adapters";
import { apiRequest } from "@/lib/api/client";

const USERS_KEY = "bibliotech_users";

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

export function ensureUsers(): MockUtilisateur[] {
  let users = readUsers();
  if (users.length === 0) {
    users = mockUtilisateurs.map((u) => ({ ...u }));
    writeUsers(users);
  }
  return users;
}

export function getAllUsers(includeDeleted = false): MockUtilisateur[] {
  const users = ensureUsers().map((u) => ({
    ...u,
    deletedAt: u.deletedAt ?? null,
  }));
  return includeDeleted
    ? users
    : users.filter((u) => !isSoftDeleted(u.deletedAt));
}

export function getUserById(id: string): MockUtilisateur | null {
  return getAllUsers(true).find((u) => u.id === id) ?? null;
}

export function createUser(input: {
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
    deletedAt: null,
  };
  writeUsers([...users, user]);
  return { ok: true, user };
}

export function updateUser(
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
  writeUsers(next);
  return { ok: true, user: updated };
}

export function setUserStatut(
  id: string,
  statut: StatutUser
): { ok: true; user: MockUtilisateur } | { ok: false; error: string } {
  return updateUser(id, { statut });
}

export function toggleUserBan(
  id: string
): { ok: true; user: MockUtilisateur } | { ok: false; error: string } {
  const user = getUserById(id);
  if (!user) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const next: StatutUser = user.statut === "ACTIF" ? "BANNI" : "ACTIF";
  return updateUser(id, { statut: next });
}

export function deleteUser(
  id: string
): { ok: true } | { ok: false; error: string } {
  const users = ensureUsers();
  if (!users.some((u) => u.id === id)) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const next = users.map((u) =>
    u.id === id ? { ...u, deletedAt: softDeleteTimestamp() } : u
  );
  writeUsers(next);
  return { ok: true };
}

type AdminUsersListResponse = {
  items: Array<{
    id: string;
    email: string;
    role: "ADMIN" | "USER";
    statut: "ACTIF" | "BANNI";
    date_inscription: string;
    personne: { nom: string; prenom: string; points: number };
    abonnement_actif: unknown | null;
  }>;
};

export async function fetchUsers(): Promise<MockUtilisateur[]> {
  try {
    const payload = await apiRequest<AdminUsersListResponse>("/admin/users");
    if (!Array.isArray(payload?.items)) {
      return getAllUsers();
    }
    const mapped = payload.items.map(mapAdminUserToMockUser);
    if (mapped.length > 0) {
      writeUsers(mapped);
      return mapped;
    }
    return getAllUsers();
  } catch {
    return getAllUsers();
  }
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
  try {
    await apiRequest("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: "Temporaire123!",
        nom: input.nom.trim(),
        prenom: input.prenom.trim(),
      }),
    });
  } catch {
    // fallback local
  }
  return createUser(input);
}

export async function toggleUserBanPersisted(
  id: string
): Promise<{ ok: true; user: MockUtilisateur } | { ok: false; error: string }> {
  const user = getUserById(id);
  if (!user) {
    return { ok: false, error: "Utilisateur introuvable." };
  }
  const local = toggleUserBan(id);
  if (!local.ok) return local;
  try {
    if (local.user.statut === "BANNI") {
      await apiRequest(`/admin/users/${id}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ reason: "Modération admin" }),
      });
    } else {
      await apiRequest(`/admin/users/${id}/unban`, { method: "PATCH" });
    }
  } catch {
    // fallback local
  }
  return local;
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
  return updateUser(id, patch);
}

export async function deleteUserPersisted(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return deleteUser(id);
}
