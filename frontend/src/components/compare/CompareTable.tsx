import { useTranslation } from "react-i18next";
import type { Pair } from "../../hooks/usePairs";
import { bodyLabel, formatTempSpan } from "../../lib/format";
import { baseMeasure, formatMeasure, MEASURE_KEYS, siteMeasure } from "../../lib/measures";

interface CompareTableProps {
  pair: Pair;
  className?: string;
}

export default function CompareTable({ pair, className = "" }: CompareTableProps) {
  const { t } = useTranslation();
  const { site, base } = pair;

  // Solo datos medidos: la temperatura, el rango térmico y la rugosidad
  const rows = [
    {
      label: t("common.factors.temperature"),
      earth: formatTempSpan(site.factors.tempMin, site.factors.tempMax),
      target: formatTempSpan(base.factors.tempMin, base.factors.tempMax),
    },
    ...MEASURE_KEYS.map((key) => ({
      label: t(`common.factors.${key}`),
      earth: formatMeasure(key, siteMeasure(site, key)),
      target: formatMeasure(key, baseMeasure(base, key)),
    })),
  ];

  return (
    <table className={`w-full text-left text-sm tabular-nums ${className}`}>
      <caption className="sr-only">
        {t("compare.caption", { site: site.name, base: base.name })}
      </caption>
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
