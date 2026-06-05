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
import { createAdminPersisted } from "@/lib/users-store";
import {
  type AdminAccount,
  type StatutAdmin,
  createAdmin,
  deleteAdminAccount,
  getAllAdmins,
  getCurrentAdmin,
  login as authLogin,
  logout as authLogout,
  setAdminStatut,
  updateAdminAccount,
  updateAdminAvatar,
  updateAdminProfile,
  ensureDefaultAdmins,
} from "@/lib/auth/admin-auth";

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
  refresh: () => void;
  updateProfile: (
    patch: Partial<
      Pick<
        AdminAccount,
        "prenom" | "nom" | "fonction" | "localisation" | "avatarUrl"
      >
    >
  ) => void;
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
    patch: Parameters<typeof updateAdminAccount>[1]
  ) => ReturnType<typeof updateAdminAccount>;
  suspendAdmin: (
    id: string,
    suspend: boolean
  ) => ReturnType<typeof setAdminStatut>;
  removeAdmin: (id: string) => ReturnType<typeof deleteAdminAccount>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    ensureDefaultAdmins();
    setAdmins(getAllAdmins());

    if (isApiConfigured()) {
      const current = getCurrentAdmin();
      if (current && !hasApiSession()) {
        authLogout();
        logoutApiSession();
        setAdmin(null);
        setIsReady(true);
        return;
      }
    }

    setAdmin(getCurrentAdmin());
    setIsReady(true);
  }, []);

  useEffect(() => {
    refresh();
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
    if (isApiConfigured()) {
      const result = await loginAdminViaApi(email, password);
      if (result.ok) {
        setAdmin(result.admin);
        setAdmins(getAllAdmins());
      }
      return result;
    }

    const result = authLogin(email, password);
    if (result.ok) {
      setAdmin(result.admin);
      setAdmins(getAllAdmins());
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    logoutApiSession();
    setAdmin(null);
  }, []);

  const updateProfile = useCallback(
    (patch: Parameters<AuthContextValue["updateProfile"]>[0]) => {
      if (!admin) return;
      const updated = updateAdminProfile(admin.id, patch);
      if (updated) {
        setAdmin(updated);
        setAdmins(getAllAdmins());
      }
    },
    [admin]
  );

  const setAvatar = useCallback(
    (dataUrl: string) => {
      if (!admin) return;
      const updated = updateAdminAvatar(admin.id, dataUrl);
      if (updated) {
        setAdmin(updated);
        setAdmins(getAllAdmins());
      }
    },
    [admin]
  );

  const addAdmin = useCallback(
    async (input: Parameters<AuthContextValue["addAdmin"]>[0]) => {
      if (isApiConfigured() && hasApiSession()) {
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
      }

      const result = createAdmin(input);
      if (result.ok) {
        setAdmins(getAllAdmins());
        setAdmin(getCurrentAdmin());
      }
      return result;
    },
    []
  );

  const editAdmin = useCallback(
    (id: string, patch: Parameters<typeof updateAdminAccount>[1]) => {
      const result = updateAdminAccount(id, patch);
      if (result.ok) {
        setAdmins(getAllAdmins());
        if (admin?.id === id) setAdmin(result.admin);
      }
      return result;
    },
    [admin]
  );

  const suspendAdmin = useCallback(
    (id: string, suspend: boolean) => {
      const statut: StatutAdmin = suspend ? "SUSPENDU" : "ACTIF";
      const result = setAdminStatut(id, statut, admin?.id);
      if (result.ok) {
        setAdmins(getAllAdmins());
        if (admin?.id === id && suspend) {
          authLogout();
          setAdmin(null);
        } else {
          setAdmin(getCurrentAdmin());
        }
      }
      return result;
    },
    [admin]
  );

  const removeAdmin = useCallback(
    (id: string) => {
      const result = deleteAdminAccount(id, admin?.id);
      if (result.ok) {
        setAdmins(getAllAdmins());
        setAdmin(getCurrentAdmin());
      }
      return result;
    },
    [admin]
  );

  const value = useMemo(
    () => ({
      admin,
      admins,
      isReady,
      login,
      logout,
      refresh,
      updateProfile,
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
      updateProfile,
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
