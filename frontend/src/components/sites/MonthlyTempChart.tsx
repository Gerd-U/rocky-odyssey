import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDecimal, formatTemp } from "../../lib/format";
import type { MonthlyTemp } from "../../types/site";

// Lienzo del SVG; se escala al ancho del contenedor (~1100 px en escritorio, así el texto queda cerca de 14 px)
const W = 960;
const H = 320;
const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const SERIES = [
  { key: "dayC", color: "var(--color-plum-200)", label: "chart.day" },
  { key: "nightC", color: "var(--color-indigo-200)", label: "chart.night" },
] as const;

/** Límites redondeados a la decena y paso de las marcas del eje */
function scale(values: number[]) {
  const min = Math.floor(Math.min(...values) / 10) * 10;
  const max = Math.ceil(Math.max(...values) / 10) * 10;
  const span = Math.max(max - min, 10);
  const step = span > 60 ? 20 : 10;
  const ticks: number[] = [];
  for (let v = min; v <= min + span; v += step) ticks.push(v);
  return { min, max: min + span, ticks };
}

/** Tramos de la línea: un mes sin dato la corta */
function segments(points: ({ x: number; y: number } | null)[]): string[] {
  const out: string[] = [];
  let current: string[] = [];
  for (const p of points) {
    if (p) current.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    else if (current.length) {
      out.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) out.push(current.join(" "));
  return out;
}

interface MonthlyTempChartProps {
  data: MonthlyTemp[];
  /** Nombre del lugar, para el título accesible */
  place: string;
  className?: string;
}

/** Temperatura media de día y de noche por mes (MODIS, 2023). Sin librerías: SVG propio. */
export default function MonthlyTempChart({ data, place, className = "" }: MonthlyTempChartProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";
  const titleId = useId();

  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang, { month: "short", timeZone: "UTC" });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2023, i, 1))));
  }, [lang]);

  const values = data.flatMap((m) => [m.dayC, m.nightC]).filter((v): v is number => v !== null);
  if (values.length === 0) {
    return <p className={`text-ink-soft ${className}`}>{t("common.noData")}</p>;
  }

  const { min, max, ticks } = scale(values);
  const x = (month: number) => PAD.left + ((month - 1) / 11) * PLOT_W;
  const y = (value: number) => PAD.top + (1 - (value - min) / (max - min)) * PLOT_H;
  const byMonth = new Map(data.map((m) => [m.month, m]));

  return (
    <figure className={className}>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-5 rounded-full" style={{ background: s.color }} />
            {t(s.label)}
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId} className="block h-auto w-full overflow-visible">
        <title id={titleId}>{t("chart.title", { place })}</title>

        {/* Rejilla y eje de temperaturas */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-ink)"
              strokeOpacity={tick === 0 ? 0.35 : 0.1}
              strokeDasharray={tick === 0 ? "4 4" : undefined}
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-ink-soft text-[13px] tabular-nums"
            >
              {formatTemp(tick)}
            </text>
          </g>
        ))}

        {/* Meses */}
        {months.map((label, i) => (
          <text
            key={label + i}
            x={x(i + 1)}
            y={H - 8}
            textAnchor="middle"
            className="fill-ink-soft text-[13px]"
          >
            {label}
          </text>
        ))}

        {SERIES.map((s) => {
          const points = Array.from({ length: 12 }, (_, i) => {
            const value = byMonth.get(i + 1)?.[s.key] ?? null;
            return value === null ? null : { x: x(i + 1), y: y(value) };
          });
          return (
            <g key={s.key}>
              {segments(points).map((pts) => (
                <polyline
                  key={pts}
                  points={pts}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
              {points.map((p, i) =>
                p ? <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={s.color} /> : null,
              )}
            </g>
          );
        })}
      </svg>

      {/* Los mismos datos en tabla para lectores de pantalla */}
      <table className="sr-only">
        <caption>{t("chart.title", { place })}</caption>
        <thead>
          <tr>
            <th scope="col">{t("chart.month")}</th>
            <th scope="col">{t("chart.day")}</th>
            <th scope="col">{t("chart.night")}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((label, i) => {
            const m = byMonth.get(i + 1);
            const cell = (v: number | null | undefined) =>
              v === null || v === undefined ? t("common.noData") : `${formatDecimal(v)} °C`;
            return (
              <tr key={label + i}>
                <th scope="row">{label}</th>
                <td>{cell(m?.dayC)}</td>
                <td>{cell(m?.nightC)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="mt-3 text-small text-ink-soft">{t("chart.caption")}</figcaption>
    </figure>
  );
}
