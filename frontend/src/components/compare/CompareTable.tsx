import { useTranslation } from "react-i18next";
import type { Pair } from "../../hooks/usePairs";
import {
  bodyLabel,
  formatCelsiusSpan,
  formatKelvin,
  formatMeters,
  formatPercentValue,
} from "../../lib/format";
import type { CriterionId } from "../../types/site";
import ApproxTag from "../ui/ApproxTag";

interface CompareTableProps {
  pair: Pair;
  className?: string;
}

/** Variable del sources_log de la base que corresponde a cada criterio */
const BASE_SOURCE: Record<CriterionId, string> = {
  topography: "rugosidad",
  temperature: "rango_termico",
  ice_water: "hielo",
};

function Value({ value }: { value: string | null }) {
  const { t } = useTranslation();
  if (value !== null) return <>{value}</>;
  return (
    <span className="text-ink-soft">
      <span aria-hidden>— </span>
      <span className="text-small">{t("common.noData")}</span>
    </span>
  );
}

export default function CompareTable({ pair, className = "" }: CompareTableProps) {
  const { t } = useTranslation();
  const { site, base, match } = pair;
  const approx = (criterion: CriterionId) =>
    base.sources.some((source) => source.variable === BASE_SOURCE[criterion] && source.provisional);

  const rows: { id: CriterionId; earth: string | null; target: string | null }[] = [
    {
      id: "topography",
      earth: formatMeters(site.metrics.roughnessM),
      target: formatMeters(base.metrics.roughnessM),
    },
    {
      id: "temperature",
      earth: formatCelsiusSpan(site.metrics.thermalRange),
      target: formatKelvin(base.metrics.thermalRange),
    },
    {
      id: "ice_water",
      earth: formatPercentValue(site.metrics.coldIndex),
      target: formatPercentValue(base.metrics.coldIndex),
    },
  ];

  return (
    <div className={className}>
      <table className="w-full text-left text-sm tabular-nums">
        <caption className="sr-only">{t("compare.caption", { site: site.name, base: base.name })}</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 pb-2">
              <span className="sr-only">{t("compare.factor")}</span>
            </th>
            <th scope="col" className="px-2 pb-2 font-semibold text-ink-soft">
              {t("common.earth")}
            </th>
            <th scope="col" className="px-2 pb-2 font-semibold text-accent-soft">
              {bodyLabel(base.body)}
            </th>
            <th scope="col" className="px-2 pb-2 text-right font-semibold text-ink-soft">
              {t("compare.similarity")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="odd:bg-night-800">
              <th scope="row" className="px-2 py-2.5 font-normal text-ink-soft">
                {t(`criteria.${row.id}.label`)}
              </th>
              <td className="px-2 py-2.5 whitespace-nowrap text-ink">
                <Value value={row.earth} />
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap text-ink">
                <Value value={row.target} />
                {row.target !== null && approx(row.id) && (
                  <span className="mt-1 block">
                    <ApproxTag />
                  </span>
                )}
              </td>
              <td className="px-2 py-2.5 text-right whitespace-nowrap text-ink">
                <Value value={formatPercentValue(match.criteria[row.id])} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-small text-ink-soft">{t("compare.thermalNote")}</p>
    </div>
  );
}
