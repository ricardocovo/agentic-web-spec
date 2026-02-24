"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ActiveRepo,
  getActiveRepo,
  saveActiveRepo,
  clearActiveRepo,
  getPat,
  savePat,
  clearPat,
  getUsername,
  saveUsername,
} from "@/lib/storage";
import { clearRepoCache } from "@/lib/repo-cache";
import { clearSpacesCache } from "@/lib/spaces-cache";

interface AppContextValue {
  hydrated: boolean;
  pat: string | null;
  username: string | null;
  activeRepo: ActiveRepo | null;
  setPat: (pat: string, username: string) => void;
  clearAuth: () => void;
  setActiveRepo: (repo: ActiveRepo) => void;
  removeActiveRepo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [pat, setPATState] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [activeRepo, setActiveRepoState] = useState<ActiveRepo | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPATState(getPat());
    setUsernameState(getUsername());
    setActiveRepoState(getActiveRepo());
    setHydrated(true);
  }, []);

  function setPat(newPat: string, newUsername: string) {
    savePat(newPat);
    saveUsername(newUsername);
    setPATState(newPat);
    setUsernameState(newUsername);
  }

  function clearAuth() {
    clearPat();
    clearActiveRepo();
    clearRepoCache();
    clearSpacesCache();
    setPATState(null);
    setUsernameState(null);
    setActiveRepoState(null);
  }

  function setActiveRepo(repo: ActiveRepo) {
    saveActiveRepo(repo);
    setActiveRepoState(repo);
  }

  function removeActiveRepo() {
    clearActiveRepo();
    setActiveRepoState(null);
  }

  return (
    <AppContext.Provider
      value={{
        hydrated,
        pat,
        username,
        activeRepo,
        setPat,
        clearAuth,
        setActiveRepo,
        removeActiveRepo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
