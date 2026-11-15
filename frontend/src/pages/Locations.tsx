import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FilterBar, { type Filters } from "../components/sites/FilterBar";
import SiteCard from "../components/sites/SiteCard";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import SectionHeading from "../components/ui/SectionHeading";
import Skeleton from "../components/ui/Skeleton";
import { useMode } from "../context/ModeContext";
import { usePairs } from "../hooks/usePairs";
import { SWAP_EASE } from "../lib/motion";

const INITIAL_FILTERS: Filters = { query: "", target: "all", sort: "similarity" };

const GRID = "mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";

/** Quita tildes y mayúsculas para que "islandia" encuentre "Islandia" y "rio" encuentre "Río" */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function Locations() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { setMode } = useMode();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  // Con "Todos", cada sitio con su base más parecida de los dos cuerpos; con un destino, la de ese cuerpo
  const { data: pairs, loading, error } = usePairs(filters.target === "all" ? undefined : filters.target);
  const reduce = useReducedMotion() ?? false;

  const results = useMemo(() => {
    const q = normalize(filters.query.trim());
    return (pairs ?? [])
      .filter(({ site, base }) => !q || normalize(`${site.name} ${site.country} ${base.name}`).includes(q))
      .sort((a, b) =>
        filters.sort === "name" ? a.site.name.localeCompare(b.site.name, lang) : b.match.score - a.match.score,
      );
  }, [pairs, filters, lang]);

  const onFiltersChange = (next: Filters) => {
    // El acento de toda la web sigue al destino elegido; "Todos" deja el modo como está
    if (next.target !== filters.target && next.target !== "all") setMode(next.target);
    setFilters(next);
  };

  const filtered = filters.query.trim() !== "" || filters.target !== "all";
  const count = results.length;

  return (
    <section aria-labelledby="locations-title" className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16">
      <SectionHeading id="locations-title" as="h1" title={t("locations.title")}>
        <p>{t("locations.intro")}</p>
      </SectionHeading>

      <div className="mt-10">
        <FilterBar value={filters} onChange={onFiltersChange} />
      </div>

      <p aria-live="polite" className="mt-6 text-sm text-ink-soft tabular-nums">
        {pairs && t("locations.count", { count })}
      </p>

      {error ? (
        <ErrorState message={error} className="mt-6" />
      ) : loading || !pairs ? (
        <div aria-busy="true" aria-label={t("locations.loading")} className={GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-4/3" />
              <Skeleton className="mt-4 h-6 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="mt-10 border-t border-ink/10 pt-10">
          <p className="text-lg text-ink">{t("locations.emptyTitle")}</p>
          <p className="mt-1 text-ink-soft">{t("locations.emptyHint")}</p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={() => setFilters(INITIAL_FILTERS)}>
            {t("locations.clearFilters")}
          </Button>
        </div>
      ) : (
        <ul className={GRID}>
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((pair) => (
              <motion.li
                key={pair.site.id}
                layout={!reduce}
                initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
                animate={{ opacity: 1, transform: "scale(1)" }}
                exit={{ opacity: 0, transform: reduce ? "none" : "scale(0.96)" }}
                transition={{ duration: reduce ? 0.15 : 0.3, ease: SWAP_EASE }}
              >
                <SiteCard pair={pair} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {filtered && count > 0 && (
        <Button variant="ghost" className="mt-12 text-sm" onClick={() => setFilters(INITIAL_FILTERS)}>
          {t("locations.clearFilters")}
        </Button>
      )}
    </section>
  );
}
