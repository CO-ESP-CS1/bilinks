"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isApiConfigured } from "@/lib/api/client";
import {
  API_SESSION_EXPIRED_EVENT,
  hasApiSession,
  loginAdminViaApi,
  logoutApiSession,
} from "@/lib/api/session";
import {
  banUserPersisted,
  createAdminPersisted,
  unbanUserPersisted,
} from "@/lib/users-store";
import {
  type AdminAccount,
  type StatutAdmin,
  getCurrentAdmin,
  logout as authLogout,
  updateAdminAvatar,
  updateAdminProfile,
} from "@/lib/auth/admin-auth";
import {
  applyProfileToLocalAdmin,
  avatarUrlFromPersonne,
  deleteMyProfilePhoto,
  hydrateAdminSessionFromApi,
  isPlaceholderAdmin,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "@/lib/profile-store";

type AuthContextValue = {
  admin: AdminAccount | null;
  admins: AdminAccount[];
  isReady: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<
    { ok: true; admin: AdminAccount } | { ok: false; error: string }
  >;
  logout: () => void;
  refresh: () => Promise<void>;
  syncAdminFromApi: () => Promise<void>;
  updateProfile: (
    patch: Partial<
      Pick<
        AdminAccount,
        "prenom" | "nom" | "fonction" | "localisation" | "avatarUrl"
      >
    >
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  uploadAvatar: (
    file: File
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeAvatar: () => Promise<{ ok: true } | { ok: false; error: string }>;
  setAvatar: (dataUrl: string) => void;
  addAdmin: (input: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
  }) => Promise<
    { ok: true; admin: AdminAccount } | { ok: false; error: string }
  >;
  editAdmin: (
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
    >
  ) => { ok: true; admin: AdminAccount } | { ok: false; error: string };
  suspendAdmin: (
    id: string,
    suspend: boolean
  ) => Promise<
    { ok: true; admin: AdminAccount } | { ok: false; error: string }
  >;
  removeAdmin: (id: string) => { ok: true } | { ok: false; error: string };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isReady, setIsReady] = useState(false);

  const syncAdminFromApi = useCallback(async () => {
    if (!isApiConfigured() || !hasApiSession()) return;
    const result = await hydrateAdminSessionFromApi();
    if (result.ok) setAdmin(result.data);
  }, []);

  const refresh = useCallback(async () => {
    if (!isApiConfigured()) {
      setAdmin(null);
      setAdmins([]);
      setIsReady(true);
      return;
    }

    if (!hasApiSession()) {
      authLogout();
      setAdmin(null);
      setAdmins([]);
      setIsReady(true);
      return;
    }

    const current = getCurrentAdmin();
    if (!current || isPlaceholderAdmin(current)) {
      const hydrated = await hydrateAdminSessionFromApi();
      setAdmin(hydrated.ok ? hydrated.data : null);
      setAdmins([]);
      setIsReady(true);
      return;
    }

    setAdmin(current);
    setAdmins([]);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onExpired = () => {
      authLogout();
      logoutApiSession();
      setAdmin(null);
    };
    window.addEventListener(API_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(API_SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isApiConfigured()) {
      return {
        ok: false as const,
        error:
          "API non configurée. Définissez NEXT_PUBLIC_API_BASE_URL dans .env.local.",
      };
    }

    const result = await loginAdminViaApi(email, password);
    if (result.ok) {
      setAdmin(result.admin);
      setAdmins([]);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    logoutApiSession();
    setAdmin(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Parameters<AuthContextValue["updateProfile"]>[0]) => {
      if (!admin) {
        return { ok: false as const, error: "Session introuvable." };
      }

      const hasNameChange =
        patch.prenom !== undefined || patch.nom !== undefined;

      if (isApiConfigured() && hasApiSession() && hasNameChange) {
        const result = await updateMyProfile({
          prenom: patch.prenom?.trim(),
          nom: patch.nom?.trim(),
        });
        if (!result.ok) return result;

        let updated = applyProfileToLocalAdmin(admin.id, result.data.personne);
        if (
          updated &&
          (patch.fonction !== undefined ||
            patch.localisation !== undefined ||
            patch.avatarUrl !== undefined)
        ) {
          updated =
            updateAdminProfile(admin.id, {
              ...(patch.fonction !== undefined
                ? { fonction: patch.fonction }
                : {}),
              ...(patch.localisation !== undefined
                ? { localisation: patch.localisation }
                : {}),
              ...(patch.avatarUrl !== undefined
                ? { avatarUrl: patch.avatarUrl }
                : {}),
            }) ?? updated;
        }
        if (updated) setAdmin(updated);
        return updated
          ? { ok: true as const }
          : { ok: false as const, error: "Mise à jour impossible." };
      }

      const updated = updateAdminProfile(admin.id, patch);
      if (!updated) {
        return { ok: false as const, error: "Mise à jour impossible." };
      }
      setAdmin(updated);
      return { ok: true as const };
    },
    [admin]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!admin) {
        return { ok: false as const, error: "Session introuvable." };
      }
      if (!isApiConfigured() || !hasApiSession()) {
        return {
          ok: false as const,
          error: "Connectez-vous pour modifier votre photo de profil.",
        };
      }

      const result = await uploadMyProfilePhoto(file);
      if (!result.ok) return result;

      const updated = updateAdminProfile(admin.id, {
        avatarUrl: result.data.photo_profil_url,
      });
      if (updated) setAdmin(updated);
      return updated
        ? { ok: true as const }
        : { ok: false as const, error: "Mise à jour impossible." };
    },
    [admin]
  );

  const removeAvatar = useCallback(async () => {
    if (!admin) {
      return { ok: false as const, error: "Session introuvable." };
    }
    if (!isApiConfigured() || !hasApiSession()) {
      return {
        ok: false as const,
        error: "Connectez-vous pour modifier votre photo de profil.",
      };
    }

    const result = await deleteMyProfilePhoto();
    if (!result.ok) return result;

    const updated = updateAdminProfile(admin.id, {
      avatarUrl: avatarUrlFromPersonne(result.data.personne),
    });
    if (updated) setAdmin(updated);
    return updated
      ? { ok: true as const }
      : { ok: false as const, error: "Mise à jour impossible." };
  }, [admin]);

  const setAvatar = useCallback(
    (dataUrl: string) => {
      if (!admin) return;
      const updated = updateAdminAvatar(admin.id, dataUrl);
      if (updated) setAdmin(updated);
    },
    [admin]
  );

  const addAdmin = useCallback(
    async (input: Parameters<AuthContextValue["addAdmin"]>[0]) => {
      if (!isApiConfigured() || !hasApiSession()) {
        return {
          ok: false as const,
          error: "Session API requise pour créer un administrateur.",
        };
      }

      const apiResult = await createAdminPersisted(input);
      if (!apiResult.ok) return apiResult;
      return {
        ok: true as const,
        admin: {
          id: apiResult.user.id,
          email: apiResult.user.email,
          password: "",
          prenom: apiResult.user.prenom,
          nom: apiResult.user.nom,
          fonction: "Administrateur",
          localisation: "Brazzaville, Congo",
          avatarUrl: "/images/logo/logo-icon.svg",
          isSuperAdmin: false,
          statut: "ACTIF" as StatutAdmin,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        } satisfies AdminAccount,
      };
    },
    []
  );

  const editAdmin = useCallback(
    (
      _id: string,
      _patch: Partial<
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
      >
    ) => {
      return {
        ok: false as const,
        error:
          "Modification d'administrateur : gérez le compte via la base ou l'API backend.",
      };
    },
    []
  );

  const suspendAdmin = useCallback(
    async (id: string, suspend: boolean) => {
      if (!isApiConfigured() || !hasApiSession()) {
        return {
          ok: false as const,
          error: "Session API requise.",
        };
      }

      const result = suspend
        ? await banUserPersisted(id)
        : await unbanUserPersisted(id);

      if (!result.ok) return result;

      if (admin?.id === id && suspend) {
        authLogout();
        logoutApiSession();
        setAdmin(null);
        return { ok: true as const, admin };
      }

      const current = getCurrentAdmin();
      if (current) setAdmin(current);
      return current
        ? { ok: true as const, admin: current }
        : { ok: false as const, error: "Session introuvable." };
    },
    [admin]
  );

  const removeAdmin = useCallback(
    (_id: string) => {
      return {
        ok: false as const,
        error:
          "Suppression d'administrateur : utilisez bannir le compte via l'API.",
      };
    },
    []
  );

  const value = useMemo(
    () => ({
      admin,
      admins,
      isReady,
      login,
      logout,
      refresh,
      syncAdminFromApi,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      setAvatar,
      addAdmin,
      editAdmin,
      suspendAdmin,
      removeAdmin,
    }),
    [
      admin,
      admins,
      isReady,
      login,
      logout,
      refresh,
      syncAdminFromApi,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      setAvatar,
      addAdmin,
      editAdmin,
      suspendAdmin,
      removeAdmin,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
