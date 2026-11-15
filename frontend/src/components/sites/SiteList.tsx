import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { Pair } from "../../hooks/usePairs";
import { formatPercent } from "../../lib/format";
import { SWAP_EASE } from "../../lib/motion";

interface SiteListProps {
  pairs: Pair[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * En escritorio, columna entre los dos globos; en móvil y tablet, bloques que se reparten
 * en varias líneas. En ningún caso hay scroll propio: todos los sitios del modo quedan a la vista.
 */
export default function SiteList({ pairs, selectedId, onSelect, className = "" }: SiteListProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const indicatorId = useId();

  return (
    <ol aria-label={t("home.globe.listLabel")} className={`flex flex-wrap gap-2 lg:flex-col ${className}`}>
      {pairs.map(({ site, match }, i) => {
        const active = site.id === selectedId;
        return (
          <motion.li
            key={site.id}
            className="grow basis-[10rem] lg:basis-auto"
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: reduce ? 0.15 : 0.28, delay: reduce ? 0 : Math.min(i, 6) * 0.04, ease: SWAP_EASE }}
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(site.id)}
              className={`relative flex w-full items-baseline justify-between gap-3 bg-night-800 px-4 py-3 text-left text-sm transition-[color,transform] duration-200 active:scale-[0.98] ${
                active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden
                  className="absolute inset-0 bg-accent"
                  transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
                />
              )}
              <span className="relative font-semibold text-balance">{site.name}</span>
              <span className="relative tabular-nums">{formatPercent(match.score)}</span>
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
