import { lazy, Suspense, useMemo } from "react";
import { useMode } from "../../context/ModeContext";
import { useSites } from "../../hooks/useSites";
import type { GlobePoint } from "../globe/GlobeView";
import { SITE_COLOR } from "../globe/colors";
import Legend from "../globe/Legend";
import ModeToggle from "../globe/ModeToggle";
import SitePanel from "../sites/SitePanel";
import Reveal from "../ui/Reveal";

// Carga diferida: three + react-globe.gl van en su propio chunk
const GlobeView = lazy(() => import("../globe/GlobeView"));

const EARTH_TEXTURE = "/textures/earth.jpg";
const EARTH_FALLBACK = "https://unpkg.com/three-globe/example/img/earth-night.jpg";

export default function GlobeSection() {
  const { mode, selectedSiteId, setSelectedSiteId } = useMode();
  const { data: sites, loading, error } = useSites();

  const visible = useMemo(() => (sites ?? []).filter((s) => s.target === mode), [sites, mode]);
  const points = useMemo<GlobePoint[]>(
    () =>
      visible.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: `${s.name} · ${Math.round(s.similarity * 100)}%`,
        color: SITE_COLOR[s.target],
      })),
    [visible],
  );
  const selected = visible.find((s) => s.id === selectedSiteId) ?? null;

  return (
    <section id="globo" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Análogos en la Tierra</h2>
          <p className="mt-2 text-slate-400">Elige un destino y toca un punto del globo.</p>
        </div>
        <ModeToggle />
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-panel/40 ring-1 ring-white/5">
          {error ? (
            <p className="p-6 text-sm text-red-400">No se pudieron cargar los sitios: {error}</p>
          ) : loading ? (
            <div className="h-[520px] animate-pulse" />
          ) : (
            <Suspense fallback={<div className="h-[520px]" />}>
              <GlobeView
                texture={EARTH_TEXTURE}
                fallbackTexture={EARTH_FALLBACK}
                points={points}
                selectedId={selectedSiteId}
                onSelect={setSelectedSiteId}
              />
            </Suspense>
          )}
          <div className="px-6 pb-5">
            <Legend mode={mode} />
          </div>
        </div>
        <SitePanel site={selected} onClose={() => setSelectedSiteId(null)} />
      </div>
    </section>
  );
}
