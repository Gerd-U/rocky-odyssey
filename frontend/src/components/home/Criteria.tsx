import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { usePairs, type Pair } from "../../hooks/usePairs";
import type { Target } from "../../types/site";
import { formatPrecip, formatTempSpan, terrainLabel } from "../../lib/format";
import SectionHeading from "../ui/SectionHeading";

interface ExampleLine {
  place: string;
  value: string;
  /** Destino del lugar si está en la Luna o Marte: su color sale de ahí y no del modo activo */
  body?: Target;
}

const BODY_TINT: Record<Target, string> = {
  mars: "text-plum-200",
  moon: "text-indigo-200",
};

interface Criterion {
  term: string;
  text: string;
  /** id del sitio de la Tierra que sirve de ejemplo */
  siteId: string;
  example: (pair: Pair) => ExampleLine[];
}

const criteria = (t: TFunction): Criterion[] => [
  {
    term: t("common.factors.rain"),
    text: t("home.criteria.rain"),
    siteId: "atacama",
    example: ({ site, base }) => [
      { place: site.name, value: formatPrecip(site.factors.precipMm) },
      { place: base.name, value: formatPrecip(base.factors.precipMm), body: base.body },
    ],
  },
  {
    term: t("common.factors.temperature"),
    text: t("home.criteria.temperature"),
    siteId: "altiplanodeltibet",
    example: ({ site, base }) => [
      { place: site.name, value: formatTempSpan(site.factors.tempMin, site.factors.tempMax) },
      { place: base.name, value: formatTempSpan(base.factors.tempMin, base.factors.tempMax), body: base.body },
    ],
  },
  {
    term: t("common.factors.terrain"),
    text: t("home.criteria.terrain"),
    siteId: "mcmurdo",
    example: ({ site, base }) => [
      { place: site.name, value: terrainLabel(site.factors.terrain) },
      { place: base.name, value: terrainLabel(base.factors.terrain), body: base.body },
    ],
  },
  {
    term: t("home.criteria.historyTerm"),
    text: t("home.criteria.history"),
    siteId: "devon",
    example: ({ site }) => [{ place: site.name, value: site.missions[0] ?? t("home.criteria.noMissions") }],
  },
];

function Example({ lines }: { lines: ExampleLine[] }) {
  // Un único ejemplo (Historial) va en dos líneas: nombre arriba y misión debajo, sin partirse a lo raro
  if (lines.length === 1) {
    const [line] = lines;
    return (
      <p>
        <span className="block text-ink-soft">{line.place}</span>
        <span className="block text-ink">{line.value}</span>
      </p>
    );
  }
  return (
    <ul className="space-y-2 tabular-nums">
      {lines.map((line) => (
        <li key={line.place} className="flex items-baseline justify-between gap-4">
          <span className={`min-w-0 ${line.body ? BODY_TINT[line.body] : "text-ink-soft"}`}>{line.place}</span>
          {/* Las cifras cortas no se parten; los textos largos (misiones) sí pueden */}
          <span className={`text-right text-balance text-ink ${line.value.length <= 16 ? "shrink-0 whitespace-nowrap" : "min-w-0"}`}>
            {line.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Criteria() {
  const { t } = useTranslation();
  const { data: pairs } = usePairs();
  const pairById = new Map((pairs ?? []).map((pair) => [pair.site.id, pair]));

  return (
    <section id="criterios" aria-labelledby="criteria-title" className="mt-section scroll-mt-24 bg-night-800 py-section">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading id="criteria-title" title={t("home.criteria.title")}>
          <p>{t("home.criteria.intro")}</p>
        </SectionHeading>

        <dl className="mt-14 grid gap-y-12 lg:gap-y-14">
          {criteria(t).map((c) => {
            const pair = pairById.get(c.siteId);
            return (
              <div
                key={c.siteId}
                data-reveal
                className="grid gap-x-10 gap-y-3 md:grid-cols-[10rem_1fr] lg:grid-cols-[11rem_1fr_22rem]"
              >
                <dt className="text-h3 font-extrabold font-stretch-[75%] text-ink">{c.term}</dt>
                <dd className="max-w-prose text-ink">{c.text}</dd>
                <dd className="md:col-start-2 lg:col-start-auto" aria-label={t("home.criteria.exampleOf", { term: c.term.toLowerCase() })}>
                  {pair ? <Example lines={c.example(pair)} /> : <div className="h-12" aria-hidden />}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
