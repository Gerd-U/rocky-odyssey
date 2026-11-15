import { usePairs, type Pair } from "../../hooks/usePairs";
import { TERRAIN_LABEL, formatPrecip, formatTempSpan } from "../../lib/format";
import SectionHeading from "../ui/SectionHeading";

interface ExampleLine {
  place: string;
  value: string;
  /** true si el lugar está en la Luna o Marte */
  away?: boolean;
}

interface Criterion {
  term: string;
  text: string;
  /** id del sitio de la Tierra que sirve de ejemplo */
  siteId: string;
  example: (pair: Pair) => ExampleLine[];
}

const CRITERIA: Criterion[] = [
  {
    term: "Aridez",
    text: "En la Luna y Marte no llueve, así que buscamos los lugares más secos del planeta.",
    siteId: "atacama",
    example: ({ site, base }) => [
      { place: site.name, value: formatPrecip(site.factors.precipMm) },
      { place: base.name, value: formatPrecip(base.factors.precipMm), away: true },
    ],
  },
  {
    term: "Temperatura",
    text: "El frío y la diferencia entre la mínima y la máxima ponen a prueba equipos y tripulaciones.",
    siteId: "concordia",
    example: ({ site, base }) => [
      { place: site.name, value: formatTempSpan(site.factors.tempMin, site.factors.tempMax) },
      { place: base.name, value: formatTempSpan(base.factors.tempMin, base.factors.tempMax), away: true },
    ],
  },
  {
    term: "Terreno",
    text: "Relieve, tipo de roca y lo difícil que es moverse por él: cráteres, lava, permafrost.",
    siteId: "devon",
    example: ({ site, base }) => [
      { place: site.name, value: TERRAIN_LABEL[site.factors.terrain] },
      { place: base.name, value: TERRAIN_LABEL[base.factors.terrain], away: true },
    ],
  },
  {
    term: "Historial",
    text: "Misiones y estudios que ya usaron el lugar para ensayar la exploración de otro mundo.",
    siteId: "meteorcrater",
    example: ({ site }) => [{ place: site.name, value: site.missions[0] ?? "Sin misiones registradas" }],
  },
];

function Example({ lines }: { lines: ExampleLine[] }) {
  return (
    <ul className="space-y-2 tabular-nums">
      {lines.map((line) => (
        <li key={line.place} className="flex items-baseline justify-between gap-4">
          <span className={`min-w-0 ${line.away ? "text-accent-soft" : "text-ink-soft"}`}>{line.place}</span>
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
  const { data: pairs } = usePairs();
  const pairById = new Map((pairs ?? []).map((pair) => [pair.site.id, pair]));

  return (
    <section id="criterios" aria-labelledby="criteria-title" className="mt-section scroll-mt-24 bg-night-800 py-section">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading id="criteria-title" title="Cómo medimos la similitud">
          <p>
            Comparamos cada lugar de la Tierra con su base gemela usando los mismos cuatro factores. Los porcentajes son
            provisionales: todavía estamos definiendo cómo se combinan.
          </p>
        </SectionHeading>

        <dl className="mt-14 grid gap-y-12 lg:gap-y-14">
          {CRITERIA.map((c) => {
            const pair = pairById.get(c.siteId);
            return (
              <div
                key={c.term}
                data-reveal
                className="grid gap-x-10 gap-y-3 md:grid-cols-[10rem_1fr] lg:grid-cols-[11rem_1fr_22rem]"
              >
                <dt className="text-h3 font-extrabold font-stretch-[75%] text-ink">{c.term}</dt>
                <dd className="max-w-prose text-ink">{c.text}</dd>
                <dd className="md:col-start-2 lg:col-start-auto" aria-label={`Ejemplo de ${c.term.toLowerCase()}`}>
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
