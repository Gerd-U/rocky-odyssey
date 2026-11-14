import type { Pair } from "../../hooks/usePairs";
import { formatPercent } from "../../lib/format";

interface SiteListProps {
  pairs: Pair[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export default function SiteList({ pairs, selectedId, onSelect, className = "" }: SiteListProps) {
  return (
    <ol
      aria-label="Lugares análogos"
      className={`flex snap-x gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0 ${className}`}
    >
      {pairs.map(({ site }) => {
        const active = site.id === selectedId;
        return (
          <li key={site.id} className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(site.id)}
              className={`flex w-full items-baseline justify-between gap-4 px-4 py-3 text-left transition-colors duration-200 active:scale-[0.98] ${
                active ? "bg-accent text-ink" : "bg-night-800 text-ink-soft hover:text-ink"
              }`}
            >
              <span className="font-semibold whitespace-nowrap lg:whitespace-normal">{site.name}</span>
              <span className="tabular-nums">{formatPercent(site.similarity)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
