import { lazy, Suspense, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import type { GlobePoint } from "../components/globe/GlobeView";
import { SITE_COLOR } from "../components/globe/colors";
import CompareBars from "../components/sites/CompareBars";
import { useBases, useSite } from "../hooks/useSites";

const GlobeView = lazy(() => import("../components/globe/GlobeView"));

const BODY_TEXTURE = {
  moon: "/textures/moon.jpg",
  mars: "/textures/mars.jpg",
} as const;

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: site, loading, error } = useSite(id);
  const { data: bases } = useBases();

  const base = useMemo(() => bases?.find((b) => b.id === site?.analogOf) ?? null, [bases, site]);
  const basePoints = useMemo<GlobePoint[]>(
    () =>
      base ? [{ id: base.id, lat: base.lat, lng: base.lng, label: base.name, color: SITE_COLOR[base.body], size: 2 }] : [],
    [base],
  );

  if (loading) return <p className="mx-auto max-w-6xl px-6 py-16 text-slate-400">Cargando...</p>;
  if (error || !site) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-red-400">{error ?? "Ubicación no encontrada"}</p>
        <Link to="/ubicaciones" className="mt-4 inline-block text-accent hover:underline">
          ← Volver a ubicaciones
        </Link>
      </div>
    );
  }

  const bodyName = site.target === "mars" ? "Marte" : "la Luna";

  return (
    <article className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/ubicaciones" className="text-sm text-slate-400 hover:text-white">
        ← Ubicaciones
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-white">{site.name}</h1>
      <p className="mt-1 text-slate-400">
        {site.country} · {site.lat.toFixed(2)}, {site.lng.toFixed(2)}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <p className="text-slate-300">{site.description}</p>
          <div className="rounded-2xl bg-panel p-6 ring-1 ring-white/5">
            <h2 className="mb-4 font-semibold text-white">Factores</h2>
            <CompareBars site={site} />
          </div>
          {site.missions.length > 0 && (
            <div className="rounded-2xl bg-panel p-6 ring-1 ring-white/5">
              <h2 className="mb-3 font-semibold text-white">Misiones y estudios</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                {site.missions.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-panel/40 p-6 ring-1 ring-white/5">
          <h2 className="font-semibold text-white">Análogo de: {base?.name ?? site.analogOf}</h2>
          <p className="mt-1 text-sm text-slate-400">Base propuesta en {bodyName}</p>
          <Suspense fallback={<div className="h-[380px]" />}>
            <GlobeView
              texture={BODY_TEXTURE[site.target]}
              points={basePoints}
              selectedId={base?.id ?? null}
              height={380}
              atmosphereColor={SITE_COLOR[site.target]}
            />
          </Suspense>
          {base && <p className="mt-4 text-sm text-slate-300">{base.description}</p>}
        </section>
      </div>
    </article>
  );
}
