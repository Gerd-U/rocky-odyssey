import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { formatCelsiusSpan, formatKelvin, formatMeters, formatPercentValue, formatDecimal } from "../../lib/format";
import type { Source } from "../../types/site";
import ApproxTag from "../ui/ApproxTag";

/** "earth": valores de la Tierra (°C); "base": de la Luna o Marte (K) */
type Kind = "earth" | "base";

/** Nombre y formato de cada variable de los sources_log */
const VARIABLES = {
  rugosidad: { label: "sources.variables.rugosidad", format: () => formatMeters },
  elevacion_m: { label: "sources.variables.elevacion_m", format: () => formatMeters },
  rango_termico: {
    label: "sources.variables.rango_termico",
    format: (kind: Kind) => (kind === "earth" ? formatCelsiusSpan : formatKelvin),
  },
  temp_min_c: { label: "sources.variables.temp_min_c", format: () => formatCelsiusSpan },
  temp_max_c: { label: "sources.variables.temp_max_c", format: () => formatCelsiusSpan },
  tmin_k: { label: "sources.variables.tmin_k", format: () => formatKelvin },
  tmax_k: { label: "sources.variables.tmax_k", format: () => formatKelvin },
  hielo: { label: "sources.variables.hielo", format: () => formatPercentValue },
  hielo_favorabilidad: {
    label: "sources.variables.hielo_favorabilidad",
    format: () => (v: number | null) => (v === null ? null : `${formatDecimal(v)} / 100`),
  },
} as const;

function describe(source: Source, kind: Kind, t: TFunction): { label: string; value: string } {
  if (source.variable === "coordenadas") {
    return { label: t("sources.variables.coordenadas"), value: String(source.value ?? t("common.noData")) };
  }
  const known = VARIABLES[source.variable as keyof typeof VARIABLES];
  if (typeof source.value === "string") {
    return { label: known ? t(known.label) : source.variable, value: source.value };
  }
  const value = known ? known.format(kind)(source.value) : source.value === null ? null : formatDecimal(source.value);
  return {
    label: known ? t(known.label) : source.variable,
    value: value ?? t("common.noData"),
  };
}

/** Dominio del enlace, para que se lea de dónde sale el dato sin mostrar la URL entera */
function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface SourcesListProps {
  title: string;
  sources: Source[];
  kind: Kind;
  className?: string;
}

export default function SourcesList({ title, sources, kind, className = "" }: SourcesListProps) {
  const { t } = useTranslation();

  return (
    <section className={className}>
      <h3 className="text-lg font-extrabold font-stretch-[75%] text-ink">{title}</h3>
      {sources.length === 0 ? (
        <p className="mt-3 text-ink-soft">{t("common.noData")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
          {sources.map((source) => {
            const { label, value } = describe(source, kind, t);
            return (
              <li key={`${source.variable}-${source.url}`} className="py-3">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-ink-soft">{label}</span>
                  <span className="font-semibold text-ink tabular-nums">{value}</span>
                  {source.provisional && <ApproxTag />}
                </p>
                <p className="mt-1 text-small text-ink-soft">{source.note}</p>
                {(source.url || source.date) && (
                  <p className="mt-1 text-small text-ink-soft">
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-soft underline underline-offset-2 hover:text-ink"
                      >
                        {host(source.url)}
                      </a>
                    )}
                    {source.url && source.date && " · "}
                    {source.date && t("sources.consulted", { date: source.date })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
