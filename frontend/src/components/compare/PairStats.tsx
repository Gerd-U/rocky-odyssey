import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, TERRAIN_LABEL, formatPercent, formatPrecip, formatTempRange } from "../../lib/format";

type Layout = "row" | "stack";

const LAYOUT: Record<Layout, string> = {
  row: "gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr]",
  stack: "gap-6",
};

interface PairStatsProps {
  pair: Pair;
  layout?: Layout;
  className?: string;
}

export default function PairStats({ pair, layout = "row", className = "" }: PairStatsProps) {
  const { site, base } = pair;

  const rows = [
    {
      label: "Lluvia al año",
      earth: formatPrecip(site.factors.precipMm),
      target: formatPrecip(base.factors.precipMm),
    },
    {
      label: "Temperatura",
      earth: formatTempRange(site.factors.tempMin, site.factors.tempMax),
      target: formatTempRange(base.factors.tempMin, base.factors.tempMax),
    },
    {
      label: "Terreno",
      earth: TERRAIN_LABEL[site.factors.terrain],
      target: TERRAIN_LABEL[base.factors.terrain],
    },
  ];

  return (
    <dl className={`grid ${LAYOUT[layout]} ${className}`}>
      <div>
        <dt className="text-sm text-ink-soft">Similitud</dt>
        <dd className="mt-1 text-6xl font-extrabold font-stretch-[75%] text-ink tabular-nums">
          {formatPercent(site.similarity)}
        </dd>
      </div>
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-sm text-ink-soft">{row.label}</dt>
          <dd className="mt-2 grid grid-cols-[4.5rem_1fr] gap-y-1 text-base text-ink tabular-nums">
            <span className="text-ink-soft">Tierra</span>
            <span>{row.earth}</span>
            <span className="text-accent-soft">{BODY_LABEL[base.body]}</span>
            <span>{row.target}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}