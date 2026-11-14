import type { Site, SiteFactors } from "../../types/site";

const TERRAIN_SCORE: Record<SiteFactors["terrain"], number> = {
  moderado: 0.4,
  alto: 0.7,
  extremo: 1,
};

interface Bar {
  label: string;
  value: string;
  /** 0 a 1 */
  ratio: number;
}

function toBars(site: Site): Bar[] {
  const { precipMm, tempMin, tempMax, terrain } = site.factors;
  return [
    { label: "Similitud", value: `${Math.round(site.similarity * 100)}%`, ratio: site.similarity },
    // Menos lluvia = más parecido; 1000 mm/año como tope de la escala
    { label: "Aridez", value: `${precipMm} mm/año`, ratio: 1 - Math.min(precipMm, 1000) / 1000 },
    // Escala de -90 °C a 50 °C para el mínimo
    { label: "Frío", value: `${tempMin} °C / ${tempMax} °C`, ratio: (50 - Math.max(-90, Math.min(50, tempMin))) / 140 },
    { label: "Terreno", value: terrain, ratio: TERRAIN_SCORE[terrain] },
  ];
}

export default function CompareBars({ site }: { site: Site }) {
  return (
    <dl className="space-y-3">
      {toBars(site).map((bar) => (
        <div key={bar.label}>
          <div className="flex justify-between text-xs">
            <dt className="text-slate-400">{bar.label}</dt>
            <dd className="text-slate-200">{bar.value}</dd>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(bar.ratio * 100)}%` }} />
          </div>
        </div>
      ))}
    </dl>
  );
}
