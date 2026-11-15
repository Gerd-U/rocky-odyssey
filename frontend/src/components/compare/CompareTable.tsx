import { useTranslation } from "react-i18next";
import type { Pair } from "../../hooks/usePairs";
import { bodyLabel, formatPrecip, formatTempSpan, terrainLabel } from "../../lib/format";

interface CompareTableProps {
  pair: Pair;
  className?: string;
}

export default function CompareTable({ pair, className = "" }: CompareTableProps) {
  const { t } = useTranslation();
  const { site, base } = pair;

  const rows = [
    {
      label: t("common.factors.rain"),
      earth: formatPrecip(site.factors.precipMm),
      target: formatPrecip(base.factors.precipMm),
    },
    {
      label: t("common.factors.temperature"),
      earth: formatTempSpan(site.factors.tempMin, site.factors.tempMax),
      target: formatTempSpan(base.factors.tempMin, base.factors.tempMax),
    },
    {
      label: t("common.factors.terrain"),
      earth: terrainLabel(site.factors.terrain),
      target: terrainLabel(base.factors.terrain),
    },
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
