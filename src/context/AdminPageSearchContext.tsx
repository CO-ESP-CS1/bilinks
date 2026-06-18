"use client";

import { usePathname } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AdminPageSearchConfig = {
  enabled: boolean;
  placeholder: string;
};

type AdminPageSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  config: AdminPageSearchConfig;
  registerPageSearch: (patch: Partial<AdminPageSearchConfig>) => void;
};

const DEFAULT_CONFIG: AdminPageSearchConfig = {
  enabled: false,
  placeholder: "Rechercher sur cette page…",
};

const AdminPageSearchContext =
  createContext<AdminPageSearchContextValue | null>(null);

export function AdminPageSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [config, setConfig] = useState<AdminPageSearchConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setQuery("");
    setConfig(DEFAULT_CONFIG);
  }, [pathname]);

  const registerPageSearch = useCallback((patch: Partial<AdminPageSearchConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      config,
      registerPageSearch,
    }),
    [query, config, registerPageSearch]
  );

  return (
    <AdminPageSearchContext.Provider value={value}>
      {children}
    </AdminPageSearchContext.Provider>
  );
}

function useAdminPageSearchContext(): AdminPageSearchContextValue {
  const ctx = useContext(AdminPageSearchContext);
  if (!ctx) {
    throw new Error(
      "useAdminPageSearch doit être utilisé dans AdminPageSearchProvider"
    );
  }
  return ctx;
}

/** Enregistre la recherche header pour la page courante et expose query / setQuery. */
export function useAdminPageSearch(options: {
  placeholder: string;
  enabled?: boolean;
}): { query: string; setQuery: (query: string) => void } {
  const { query, setQuery, registerPageSearch } = useAdminPageSearchContext();
  const enabled = options.enabled ?? true;

  useEffect(() => {
    registerPageSearch({
      enabled,
      placeholder: options.placeholder,
    });
    return () => registerPageSearch(DEFAULT_CONFIG);
  }, [enabled, options.placeholder, registerPageSearch]);

  return { query, setQuery };
}

export function useAdminHeaderSearch(): AdminPageSearchContextValue {
  return useAdminPageSearchContext();
}
