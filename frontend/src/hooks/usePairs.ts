import { useMemo } from "react";
import type { Base, Match, Site, Target } from "../types/site";
import { useBases, useSites, type AsyncState } from "./useSites";

const BODIES: Target[] = ["moon", "mars"];

export interface Pair {
  site: Site;
  base: Base;
  /** Similitud del sitio con esa base (site.matches[base.body]) */
  match: Match;
}

/**
 * Un par por sitio, ordenados por similitud.
 * Con `target`, cada sitio va con su base más parecida de ese cuerpo.
 * Sin `target`, con la más parecida de los dos cuerpos.
 */
export function usePairs(target?: Target): AsyncState<Pair[]> {
  const sites = useSites();
  const bases = useBases();

  const pairs = useMemo(() => {
    if (!sites.data || !bases.data) return null;
    const basesById = new Map(bases.data.map((base) => [base.id, base]));

    return sites.data
      .flatMap((site) => {
        const options = (target ? [target] : BODIES).flatMap((body) => {
          const match = site.matches[body];
          const base = match && basesById.get(match.baseId);
          return match && base ? [{ site, base, match }] : [];
        });
        options.sort((a, b) => b.match.score - a.match.score);
        return options.slice(0, 1);
      })
      .sort((a, b) => b.match.score - a.match.score);
  }, [sites.data, bases.data, target]);

  return {
    data: pairs,
    loading: sites.loading || bases.loading,
    error: sites.error ?? bases.error,
  };
}
