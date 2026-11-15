import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Target } from "../types/site";

interface ModeContextValue {
  mode: Target;
  setMode: (mode: Target) => void;
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Target>("mars");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // El color de acento sale de data-mode (ver index.css)
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  // Estable entre renders: así se puede usar en efectos sin provocar bucles
  const setMode = useCallback((next: Target) => {
    setModeState(next);
    setSelectedSiteId(null);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, selectedSiteId, setSelectedSiteId }),
    [mode, setMode, selectedSiteId],
  );

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode debe usarse dentro de <ModeProvider>");
  return ctx;
}
