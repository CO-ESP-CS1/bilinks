import { isSoftDeleted, softDeleteTimestamp } from "@/lib/soft-delete";

export type StatutAdmin = "ACTIF" | "SUSPENDU";

export interface AdminAccount {
  id: string;
  email: string;
  password: string;
  prenom: string;
  nom: string;
  fonction: string;
  localisation: string;
  avatarUrl: string;
  isSuperAdmin: boolean;
  statut: StatutAdmin;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminSession {
  adminId: string;
  expiresAt: number;
}

const ADMINS_KEY = "bibliotech_admins";
const SESSION_KEY = "bibliotech_session";

export const DEFAULT_ADMIN_EMAIL = "admin@bibliotech.app";
export const DEFAULT_ADMIN_PASSWORD = "Admin2025!";

const DEFAULT_AVATAR = "/images/logo/logo-icon.svg";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAdmins(): AdminAccount[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ADMINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAdmins(admins: AdminAccount[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
}

function normalizeAdmin(a: AdminAccount): AdminAccount {
  return {
    ...a,
    statut: a.statut ?? "ACTIF",
    fonction: a.fonction ?? "Administrateur",
    localisation: a.localisation ?? "Brazzaville, Congo",
    avatarUrl: a.avatarUrl ?? DEFAULT_AVATAR,
    deletedAt: a.deletedAt ?? null,
  };
}

export function ensureDefaultAdmins(): AdminAccount[] {
  let admins = readAdmins().map(normalizeAdmin);
  const hasDefault = admins.some(
    (a) => a.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()
  );
  if (!hasDefault) {
    const defaultAdmin: AdminAccount = {
      id: "admin-default",
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      prenom: "Administrateur",
      nom: "BiblioTech",
      fonction: "Responsable catalogue",
      localisation: "Brazzaville, Congo",
      avatarUrl: DEFAULT_AVATAR,
      isSuperAdmin: true,
      statut: "ACTIF",
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    admins = [defaultAdmin, ...admins];
    writeAdmins(admins);
  } else {
    writeAdmins(admins);
  }
  return admins;
}

export function getAllAdmins(includeDeleted = false): AdminAccount[] {
  const admins = ensureDefaultAdmins();
  return includeDeleted
    ? admins
    : admins.filter((a) => !isSoftDeleted(a.deletedAt));
}

export function getAdminById(id: string): AdminAccount | null {
  return ensureDefaultAdmins().find((a) => a.id === id) ?? null;
}

export function login(
  email: string,
  password: string
): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  const admins = ensureDefaultAdmins();
  const admin = admins.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!admin) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }
  if (admin.password !== password) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }
  if (isSoftDeleted(admin.deletedAt)) {
    return { ok: false, error: "Ce compte administrateur n'existe plus." };
  }
  if (admin.statut === "SUSPENDU") {
    return { ok: false, error: "Ce compte administrateur est suspendu." };
  }
  const session: AdminSession = {
    adminId: admin.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  if (isBrowser()) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return { ok: true, admin };
}

export function logout(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): AdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session?.adminId || session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getCurrentAdmin(): AdminAccount | null {
  const session = getSession();
  if (!session) return null;
  return getAdminById(session.adminId);
}

export function updateAdminProfile(
  id: string,
  patch: Partial<
    Pick<
      AdminAccount,
      "prenom" | "nom" | "fonction" | "localisation" | "avatarUrl"
    >
  >
): AdminAccount | null {
  const admins = ensureDefaultAdmins();
  let updated: AdminAccount | null = null;
  const next = admins.map((a) => {
    if (a.id !== id) return a;
    updated = { ...a, ...patch };
    return updated;
  });
  if (!updated) return null;
  writeAdmins(next);
  return updated;
}

export function updateAdminAvatar(
  id: string,
  dataUrl: string
): AdminAccount | null {
  return updateAdminProfile(id, { avatarUrl: dataUrl });
}

export function createAdmin(input: {
  email: string;
  password: string;
  prenom: string;
  nom: string;
}): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 6) {
    return {
      ok: false,
      error: "E-mail valide et mot de passe (6 caractères min.) requis.",
    };
  }
  const admins = ensureDefaultAdmins();
  if (admins.some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
  }
  const admin: AdminAccount = {
    id: `admin-${Date.now()}`,
    email,
    password: input.password,
    prenom: input.prenom.trim() || "Admin",
    nom: input.nom.trim() || "BiblioTech",
    fonction: "Administrateur",
    localisation: "Brazzaville, Congo",
    avatarUrl: DEFAULT_AVATAR,
    isSuperAdmin: false,
    statut: "ACTIF",
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  writeAdmins([...admins, admin]);
  return { ok: true, admin };
}

export function updateAdminAccount(
  id: string,
  patch: Partial<
    Pick<
      AdminAccount,
      | "email"
      | "password"
      | "prenom"
      | "nom"
      | "fonction"
      | "localisation"
      | "avatarUrl"
      | "statut"
    >
  >,
): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  const admins = ensureDefaultAdmins();
  const target = admins.find((a) => a.id === id);
  if (!target) {
    return { ok: false, error: "Administrateur introuvable." };
  }

  const email = patch.email?.trim().toLowerCase();
  if (email) {
    const duplicate = admins.some(
      (a) => a.id !== id && a.email.toLowerCase() === email
    );
    if (duplicate) {
      return { ok: false, error: "Un compte utilise déjà cet e-mail." };
    }
  }

  if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 6) {
    return { ok: false, error: "Mot de passe : 6 caractères minimum." };
  }

  let updated: AdminAccount | null = null;
  const next = admins.map((a) => {
    if (a.id !== id) return a;
    updated = {
      ...a,
      ...patch,
      email: email ?? a.email,
      password:
        patch.password && patch.password.length > 0 ? patch.password : a.password,
      prenom: patch.prenom !== undefined ? patch.prenom.trim() || a.prenom : a.prenom,
      nom: patch.nom !== undefined ? patch.nom.trim() || a.nom : a.nom,
    };
    return updated;
  });

  if (!updated) {
    return { ok: false, error: "Mise à jour impossible." };
  }
  writeAdmins(next);
  return { ok: true, admin: updated };
}

export function setAdminStatut(
  id: string,
  statut: StatutAdmin,
  currentAdminId?: string
): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  const admins = ensureDefaultAdmins();
  const target = admins.find((a) => a.id === id);
  if (!target) {
    return { ok: false, error: "Administrateur introuvable." };
  }
  if (target.isSuperAdmin && statut === "SUSPENDU") {
    return { ok: false, error: "Le super administrateur ne peut pas être suspendu." };
  }
  if (currentAdminId === id && statut === "SUSPENDU") {
    return { ok: false, error: "Vous ne pouvez pas suspendre votre propre compte." };
  }
  return updateAdminAccount(id, { statut });
}

export function deleteAdminAccount(
  id: string,
  currentAdminId?: string
): { ok: true } | { ok: false; error: string } {
  const admins = ensureDefaultAdmins();
  const target = admins.find((a) => a.id === id);
  if (!target) {
    return { ok: false, error: "Administrateur introuvable." };
  }
  if (target.isSuperAdmin) {
    return { ok: false, error: "Le super administrateur ne peut pas être supprimé." };
  }
  if (currentAdminId === id) {
    return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
  }
  const next = admins.map((a) =>
    a.id === id ? { ...a, deletedAt: softDeleteTimestamp() } : a
  );
  writeAdmins(next);
  if (currentAdminId === id) {
    logout();
  }
  return { ok: true };
}

export function getDisplayName(admin: AdminAccount): string {
  return `${admin.prenom} ${admin.nom}`.trim();
}
