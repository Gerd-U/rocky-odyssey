import { useMemo } from "react";
import type { Base, Site, Target } from "../types/site";
import { useBases, useSites, type AsyncState } from "./useSites";

export interface Pair {
  site: Site;
  base: Base;
}

export function usePairs(target?: Target): AsyncState<Pair[]> {
  const sites = useSites();
  const bases = useBases();

  const pairs = useMemo(() => {
    if (!sites.data || !bases.data) return null;
    const basesById = new Map(bases.data.map((base) => [base.id, base]));

    return sites.data
      .filter((site) => !target || site.target === target)
      .flatMap((site) => {
        const base = basesById.get(site.analogOf);
        return base ? [{ site, base }] : [];
      })
      .sort((a, b) => b.site.similarity - a.site.similarity);
  }, [sites.data, bases.data, target]);

  return {
    data: pairs,
    loading: sites.loading || bases.loading,
    error: sites.error ?? bases.error,
  };
}