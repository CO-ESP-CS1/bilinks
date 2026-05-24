"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  ) => ReturnType<typeof authLogin>;
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
  }) => ReturnType<typeof createAdmin>;
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
    setAdmin(getCurrentAdmin());
    setIsReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    (email: string, password: string) => {
      const result = authLogin(email, password);
      if (result.ok) {
        setAdmin(result.admin);
        setAdmins(getAllAdmins());
      }
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
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

  const addAdmin = useCallback((input: Parameters<AuthContextValue["addAdmin"]>[0]) => {
    const result = createAdmin(input);
    if (result.ok) {
      setAdmins(getAllAdmins());
      setAdmin(getCurrentAdmin());
    }
    return result;
  }, []);

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
