import { motion, useReducedMotion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMode } from "../../context/ModeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { usePairs } from "../../hooks/usePairs";
import { useBases } from "../../hooks/useSites";
import { bodyLabel, formatPercent } from "../../lib/format";
import { MODE_DIRECTION, SWAP_EASE, SWAP_EXIT_S } from "../../lib/motion";
import { similarityLevel } from "../../lib/similarity";
import type { Target } from "../../types/site";
import type { GlobePoint } from "../globe/GlobeView";
import { LEVEL_COLOR, LEVEL_SIZE, SITE_COLOR } from "../globe/colors";
import Legend from "../globe/Legend";
import ModeToggle from "../globe/ModeToggle";
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

const ALL_TARGET_TEXTURES = Object.values(TARGET_TEXTURE);

// Los dos globos siempre lado a lado (también en móvil, más pequeños) y la lista debajo hasta lg
const STAGE_GRID = "grid grid-cols-2 gap-x-4 gap-y-6 md:gap-x-6 lg:grid-cols-[1fr_16rem_1fr]";
const LIST_CELL = "order-last col-span-2 min-w-0 lg:order-none lg:col-span-1";
const GLOBE_SKELETON = "h-[200px] md:h-[360px] lg:h-[440px]";

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
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { mode, selectedSiteId, setSelectedSiteId } = useMode();
  const { data: pairs, loading, error } = usePairs(mode);
  const { data: bases } = useBases();
  const medium = useMediaQuery("(min-width: 768px)");
  const large = useMediaQuery("(min-width: 1024px)");
  const globeHeight = large ? 440 : medium ? 360 : 200;

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
      (pairs ?? []).map(({ site, match }) => {
        const level = similarityLevel(match.score);
        return {
          id: site.id,
          lat: site.lat,
          lng: site.lng,
          label: `${site.name} · ${formatPercent(match.score, lang)}`,
          color: LEVEL_COLOR[mode][level.id],
          size: LEVEL_SIZE[level.id],
        };
      }),
    // lang: la etiqueta lleva el porcentaje formateado en el idioma activo
    [pairs, mode, lang],
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
    <section id="globo" aria-labelledby="stage-title" className="scroll-mt-20 pt-section">
      <div className="mx-auto max-w-6xl px-6">
        {/* El selector también aquí: cambiar de destino no obliga a volver al hero */}
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <SectionHeading id="stage-title" title={t("home.globe.title")}>
            <Swap swapKey={mode} direction={direction}>
              <p>{t(`home.globe.hint.${mode}`)}</p>
            </Swap>
          </SectionHeading>
          <ModeToggle size="sm" />
        </div>

        {error ? (
          <ErrorState message={error} className="mt-8" />
        ) : loading || !pairs || !selected ? (
          <div aria-busy="true" aria-label={t("common.loading")} className={`mt-8 ${STAGE_GRID}`}>
            <Skeleton className={GLOBE_SKELETON} />
            <Skeleton className={`h-14 lg:h-[440px] ${LIST_CELL}`} />
            <Skeleton className={GLOBE_SKELETON} />
          </div>
        ) : (
          <>
            <div data-reveal className={`mt-8 ${STAGE_GRID} lg:items-center`}>
              <figure>
                <Suspense fallback={<Skeleton className={GLOBE_SKELETON} />}>
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
                <GlobeCaption body={t("common.earth")} place={selected.site.name} />
              </figure>

              <Swap swapKey={mode} direction={direction} className={LIST_CELL}>
                <SiteList pairs={pairs} selectedId={selected.site.id} onSelect={setSelectedSiteId} />
              </Swap>

              {/* Globo del destino: también en móvil, que es donde más se comparte la web */}
              <figure>
                <motion.div
                  initial={false}
                  animate={
                    switching && !reduce
                      ? { opacity: 0, transform: `scale(0.97) translateX(${-direction * 12}px)` }
                      : { opacity: switching ? 0 : 1, transform: "scale(1) translateX(0px)" }
                  }
                  transition={
                    switching
                      ? { duration: SWAP_EXIT_S, ease: SWAP_EASE }
                      : { duration: reduce ? 0.15 : 0.5, ease: SWAP_EASE }
                  }
                >
                  <Suspense fallback={<Skeleton className={GLOBE_SKELETON} />}>
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
                <GlobeCaption body={bodyLabel(mode)} place={selected.base.name} accent />
              </figure>
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
