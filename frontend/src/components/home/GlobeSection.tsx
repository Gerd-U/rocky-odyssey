import { motion, useReducedMotion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useMode } from "../../context/ModeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePairs } from "../../hooks/usePairs";
import { useBases } from "../../hooks/useSites";
import { BODY_LABEL, formatPercent } from "../../lib/format";
import { MODE_DIRECTION, SWAP_EASE, SWAP_EXIT_S } from "../../lib/motion";
import { similarityLevel } from "../../lib/similarity";
import type { Target } from "../../types/site";
import type { GlobePoint } from "../globe/GlobeView";
import { LEVEL_COLOR, LEVEL_SIZE, SITE_COLOR } from "../globe/colors";
import Legend from "../globe/Legend";
import SiteList from "../sites/SiteList";
import ErrorState from "../ui/ErrorState";
import SectionHeading from "../ui/SectionHeading";
import Skeleton from "../ui/Skeleton";
import Swap from "../ui/Swap";
import TwinRow from "./TwinRow";

// El chunk del globo (three incluido) se pide ya, en paralelo con los datos,
// en vez de esperar a que termine la carga y React llegue al lazy
const loadGlobe = () => import("../globe/GlobeView");
void loadGlobe();
const GlobeView = lazy(loadGlobe);

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

const ALL_TARGET_TEXTURES = Object.values(TARGET_TEXTURE);

const STAGE_GRID = "grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_15rem_1fr]";

function GlobeCaption({ body, place, accent = false }: { body: string; place: string; accent?: boolean }) {
  return (
    <figcaption className="mt-3 text-center">
      <Swap swapKey={`${body}-${place}`}>
        <span className={`block text-sm ${accent ? "text-accent-soft" : "text-ink-soft"}`}>{body}</span>
        <span className="block font-semibold text-ink">{place}</span>
      </Swap>
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

  const reduce = useReducedMotion() ?? false;
  const direction = MODE_DIRECTION[mode];
  const [shownMode, setShownMode] = useState(mode);
  const switching = shownMode !== mode;

  useEffect(() => {
    if (!switching) return;
    const timer = window.setTimeout(() => setShownMode(mode), reduce ? 0 : SWAP_EXIT_S * 1000 + 40);
    return () => window.clearTimeout(timer);
  }, [mode, switching, reduce]);

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
        .filter((base) => base.body === shownMode)
        .map((base) => ({
          id: base.id,
          lat: base.lat,
          lng: base.lng,
          label: base.name,
          color: SITE_COLOR[shownMode],
          size: 1.2,
        })),
    [bases, shownMode],
  );

  return (
    <section id="globo" aria-labelledby="stage-title" className="scroll-mt-20 py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading id="stage-title" title="Elige un lugar y mira su gemelo">
          <Swap swapKey={mode} direction={direction}>
            <p>{STAGE_HINT[mode]}</p>
          </Swap>
        </SectionHeading>

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

              <Swap
                swapKey={mode}
                direction={direction}
                className="min-w-0 md:order-last md:col-span-2 lg:order-none lg:col-span-1"
              >
                <SiteList pairs={pairs} selectedId={selected.site.id} onSelect={setSelectedSiteId} />
              </Swap>

              {twoGlobes && (
                <figure>
                  <motion.div
                    initial={false}
                    animate={
                      switching && !reduce
                        ? { opacity: 0, filter: "blur(8px)", transform: `scale(0.94) translateX(${-direction * 12}px)` }
                        : { opacity: switching ? 0 : 1, filter: "blur(0px)", transform: "scale(1) translateX(0px)" }
                    }
                    transition={
                      switching
                        ? { duration: SWAP_EXIT_S, ease: SWAP_EASE }
                        : { duration: reduce ? 0.15 : 0.5, ease: SWAP_EASE }
                    }
                  >
                    <Suspense fallback={<Skeleton className="h-[360px] lg:h-[440px]" />}>
                      <GlobeView
                        texture={TARGET_TEXTURE[shownMode]}
                        preloadTextures={ALL_TARGET_TEXTURES}
                        points={targetPoints}
                        selectedId={selected.base.id}
                        height={globeHeight}
                        atmosphereColor={SITE_COLOR[shownMode]}
                        initialAltitude={1.9}
                      />
                    </Suspense>
                  </motion.div>
                  <GlobeCaption body={BODY_LABEL[mode]} place={selected.base.name} accent />
                </figure>
              )}
            </div>

            <div className="mt-6">
              <Legend mode={mode} />
            </div>

            <TwinRow pair={selected} className="mt-12" />
          </>
        )}
      </div>
    </section>
  );
}
