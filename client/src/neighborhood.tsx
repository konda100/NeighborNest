import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type NeighborhoodSummary } from "./api";
import { useAuth } from "./auth";

interface NeighborhoodContextValue {
  all: NeighborhoodSummary[];
  active: NeighborhoodSummary | null;
  setActive: (n: NeighborhoodSummary) => void;
  loading: boolean;
}

const Ctx = createContext<NeighborhoodContextValue | undefined>(undefined);

export function NeighborhoodProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [all, setAll] = useState<NeighborhoodSummary[]>([]);
  const [active, setActiveState] = useState<NeighborhoodSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ neighborhoods: NeighborhoodSummary[] }>("/geo/neighborhoods")
      .then((res) => setAll(res.data.neighborhoods))
      .finally(() => setLoading(false));
  }, []);

  // Choose active neighborhood: user's > saved > first.
  useEffect(() => {
    if (all.length === 0) return;
    if (active && all.some((n) => n.id === active.id)) return;
    const savedId = localStorage.getItem("nn_active_hood");
    const userHoodId = user?.neighborhoodId;
    const chosen =
      all.find((n) => n.id === userHoodId) ||
      all.find((n) => n.id === savedId) ||
      all.find((n) => n.slug === "corbett-landing") ||
      all[0];
    if (chosen) setActiveState(chosen);
  }, [all, user, active]);

  function setActive(n: NeighborhoodSummary) {
    setActiveState(n);
    localStorage.setItem("nn_active_hood", n.id);
  }

  return (
    <Ctx.Provider value={{ all, active, setActive, loading }}>{children}</Ctx.Provider>
  );
}

export function useNeighborhood() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNeighborhood must be used within NeighborhoodProvider");
  return ctx;
}
