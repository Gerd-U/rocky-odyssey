import { lazy, Suspense, useMemo } from "react";
import { useMode } from "../../context/ModeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePairs } from "../../hooks/usePairs";
import { useBases } from "../../hooks/useSites";
import { BODY_LABEL, formatPercent } from "../../lib/format";
import { similarityLevel } from "../../lib/similarity";
import type { Target } from "../../types/site";
import type { GlobePoint } from "../globe/GlobeView";
import { LEVEL_COLOR, LEVEL_SIZE, SITE_COLOR } from "../globe/colors";
import Legend from "../globe/Legend";
import SiteList from "../sites/SiteList";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";
import TwinRow from "./TwinRow";

const GlobeView = lazy(() => import("../globe/GlobeView"));

const EARTH_TEXTURE = "/textures/earth.jpg";
const EARTH_FALLBACK = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

const TARGET_TEXTURE: Record<Target, string> = {
  moon: "/textures/moon.jpg",
  mars: "/textures/mars.jpg",
};

const STAGE_HINT: Record<Target, string> = {
  mars: "Toca un punto del globo o un nombre de la lista para ver su gemelo en Marte.",
  moon: "Toca un punto del globo o un nombre de la lista para ver su gemelo en la Luna.",
};

const STAGE_GRID = "grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_15rem_1fr]";

function GlobeCaption({ body, place, accent = false }: { body: string; place: string; accent?: boolean }) {
  return (
    <figcaption className="mt-3 text-center">
      <span className={`block text-sm ${accent ? "text-accent-soft" : "text-ink-soft"}`}>{body}</span>
      <span className="block font-semibold text-ink">{place}</span>
    </figcaption>
  );
}

export default function GlobeSection() {
  const { mode, selectedSiteId, setSelectedSiteId } = useMode();
  const { data: pairs, loading, error } = usePairs(mode);
  const { data: bases } = useBases();
  const twoGlobes = useMediaQuery("(min-width: 768px)");
  const large = useMediaQuery("(min-width: 1024px)");
  const globeHeight = large ? 440 : twoGlobes ? 360 : 320;

  const selected = pairs?.find((p) => p.site.id === selectedSiteId) ?? pairs?.[0] ?? null;

  const earthPoints = useMemo<GlobePoint[]>(
    () =>
      (pairs ?? []).map(({ site }) => {
        const level = similarityLevel(site.similarity);
        return {
          id: site.id,
          lat: site.lat,
          lng: site.lng,
          label: `${site.name} · ${formatPercent(site.similarity)}`,
          color: LEVEL_COLOR[mode][level.id],
          size: LEVEL_SIZE[level.id],
        };
      }),
    [pairs, mode],
  );

  const targetPoints = useMemo<GlobePoint[]>(
    () =>
      (bases ?? [])
        .filter((base) => base.body === mode)
        .map((base) => ({
          id: base.id,
          lat: base.lat,
          lng: base.lng,
          label: base.name,
          color: SITE_COLOR[mode],
          size: 1.2,
        })),
    [bases, mode],
  );

  return (
    <section id="globo" aria-labelledby="stage-title" className="scroll-mt-20 py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="stage-title" className="text-3xl font-extrabold font-stretch-[75%] text-ink md:text-4xl">
          Elige un lugar y mira su gemelo
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">{STAGE_HINT[mode]}</p>

        {error ? (
          <ErrorState message={error} className="mt-8" />
        ) : loading || !pairs || !selected ? (
          <div aria-busy="true" aria-label="Cargando" className={`mt-8 ${STAGE_GRID}`}>
            <Skeleton className="h-[320px] md:h-[360px] lg:h-[440px]" />
            <Skeleton className="h-14 md:order-last md:col-span-2 lg:order-none lg:col-span-1 lg:h-[440px]" />
            <Skeleton className="hidden h-[360px] md:block lg:h-[440px]" />
          </div>
        ) : (
          <>
            <div className={`mt-8 ${STAGE_GRID} lg:items-center`}>
              <figure>
                <Suspense fallback={<Skeleton className="h-[320px] md:h-[360px] lg:h-[440px]" />}>
                  <GlobeView
                    texture={EARTH_TEXTURE}
                    fallbackTexture={EARTH_FALLBACK}
                    points={earthPoints}
                    selectedId={selected.site.id}
                    onSelect={setSelectedSiteId}
                    height={globeHeight}
                    atmosphereColor={SITE_COLOR.moon}
                    initialAltitude={1.9}
                  />
                </Suspense>
                <GlobeCaption body="Tierra" place={selected.site.name} />
              </figure>

              <SiteList
                pairs={pairs}
                selectedId={selected.site.id}
                onSelect={setSelectedSiteId}
                className="md:order-last md:col-span-2 lg:order-none lg:col-span-1"
              />

              {twoGlobes && (
                <figure>
                  <Suspense fallback={<Skeleton className="h-[360px] lg:h-[440px]" />}>
                    <GlobeView
                      texture={TARGET_TEXTURE[mode]}
                      points={targetPoints}
                      selectedId={selected.base.id}
                      height={globeHeight}
                      atmosphereColor={SITE_COLOR[mode]}
                      initialAltitude={1.9}
                    />
                  </Suspense>
                  <GlobeCaption body={BODY_LABEL[mode]} place={selected.base.name} accent />
                </figure>
              )}
            </div>

            <div className="mt-6">
              <Legend mode={mode} />
            </div>

            <TwinRow key={selected.site.id} pair={selected} className="mt-12" />
          </>
        )}
      </div>
    </section>
  );
}
