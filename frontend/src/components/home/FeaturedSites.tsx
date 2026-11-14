import { useMemo } from "react";
import { useMode } from "../../context/ModeContext";
import { useSites } from "../../hooks/useSites";
import SiteCard from "../sites/SiteCard";
import Reveal from "../ui/Reveal";

export default function FeaturedSites() {
  const { mode } = useMode();
  const { data: sites, loading, error } = useSites();

  const top = useMemo(
    () =>
      (sites ?? [])
        .filter((s) => s.target === mode)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3),
    [sites, mode],
  );

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-bold text-white">
          Los más parecidos a {mode === "mars" ? "Marte" : "la Luna"}
        </h2>
      </Reveal>
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-6 text-sm text-slate-400">Cargando...</p>}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {top.map((site, i) => (
          <Reveal key={site.id} delay={i * 0.08}>
            <SiteCard site={site} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
