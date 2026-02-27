"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ActiveRepo,
  FeatureFlags,
  DEFAULT_FEATURE_FLAGS,
  getActiveRepo,
  saveActiveRepo,
  clearActiveRepo,
  getPat,
  savePat,
  clearPat,
  getUsername,
  saveUsername,
  getFeatureFlags,
  saveFeatureFlags,
} from "@/lib/storage";
import { clearRepoCache } from "@/lib/repo-cache";
import { clearSpacesCache } from "@/lib/spaces-cache";

interface AppContextValue {
  hydrated: boolean;
  pat: string | null;
  username: string | null;
  activeRepo: ActiveRepo | null;
  featureFlags: FeatureFlags;
  setPat: (pat: string, username: string) => void;
  clearAuth: () => void;
  setActiveRepo: (repo: ActiveRepo) => void;
  removeActiveRepo: () => void;
  setFeatureFlags: (flags: FeatureFlags) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [pat, setPATState] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [activeRepo, setActiveRepoState] = useState<ActiveRepo | null>(null);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPATState(getPat());
    setUsernameState(getUsername());
    setActiveRepoState(getActiveRepo());
    setFeatureFlagsState(getFeatureFlags());
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

  function setFeatureFlags(flags: FeatureFlags) {
    saveFeatureFlags(flags);
    setFeatureFlagsState(flags);
  }

  return (
    <AppContext.Provider
      value={{
        hydrated,
        pat,
        username,
        activeRepo,
        featureFlags,
        setPat,
        clearAuth,
        setActiveRepo,
        removeActiveRepo,
        setFeatureFlags,
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
