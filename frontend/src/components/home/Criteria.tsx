import Reveal from "../ui/Reveal";

const CRITERIA = [
  { title: "Clima", text: "Precipitación y rango de temperaturas parecidos al destino." },
  { title: "Terreno", text: "Geología, relieve y dificultad de acceso comparables." },
  { title: "Aislamiento", text: "Distancia a zonas pobladas y condiciones de operación." },
  { title: "Historial", text: "Misiones y estudios análogos que ya se hicieron ahí." },
];

export default function Criteria() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-bold text-white">Cómo medimos la similitud</h2>
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CRITERIA.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08} className="rounded-2xl bg-panel p-6 ring-1 ring-white/5">
            <h3 className="font-semibold text-accent">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{c.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
