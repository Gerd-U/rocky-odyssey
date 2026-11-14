import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, TERRAIN_LABEL, formatPrecip, formatTempSpan } from "../../lib/format";

interface CompareTableProps {
  pair: Pair;
  className?: string;
}

export default function CompareTable({ pair, className = "" }: CompareTableProps) {
  const { site, base } = pair;

  const rows = [
    {
      label: "Lluvia",
      earth: formatPrecip(site.factors.precipMm),
      target: formatPrecip(base.factors.precipMm),
    },
    {
      label: "Temperatura",
      earth: formatTempSpan(site.factors.tempMin, site.factors.tempMax),
      target: formatTempSpan(base.factors.tempMin, base.factors.tempMax),
    },
    {
      label: "Terreno",
      earth: TERRAIN_LABEL[site.factors.terrain],
      target: TERRAIN_LABEL[base.factors.terrain],
    },
  ];

  return (
    <table className={`w-full text-left text-sm tabular-nums ${className}`}>
      <caption className="sr-only">
        Factores de {site.name} comparados con {base.name}
      </caption>
      <thead>
        <tr>
          <th scope="col" className="px-2 pb-2">
            <span className="sr-only">Factor</span>
          </th>
          <th scope="col" className="px-2 pb-2 font-semibold text-ink-soft">
            Tierra
          </th>
          <th scope="col" className="px-2 pb-2 font-semibold text-accent-soft">
            {BODY_LABEL[base.body]}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="odd:bg-night-800">
            <th scope="row" className="px-2 py-2.5 font-normal text-ink-soft">
              {row.label}
            </th>
            <td className="px-2 py-2.5 text-ink">{row.earth}</td>
            <td className="px-2 py-2.5 text-ink">{row.target}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
