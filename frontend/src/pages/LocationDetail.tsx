import { lazy, Suspense, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import CompareSlider from "../components/compare/CompareSlider";
import CompareTable from "../components/compare/CompareTable";
import type { GlobePoint } from "../components/globe/GlobeView";
import { SITE_COLOR } from "../components/globe/colors";
import { ButtonLink } from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import SectionHeading from "../components/ui/SectionHeading";
import Skeleton from "../components/ui/Skeleton";
import { useMode } from "../context/ModeContext";
import { usePairs } from "../hooks/usePairs";
import { BODY_LABEL, BODY_NAME, formatCoords, formatPercent } from "../lib/format";

const GlobeView = lazy(() => import("../components/globe/GlobeView"));

const BODY_TEXTURE = {
  moon: "/textures/moon.jpg",
  mars: "/textures/mars.jpg",
} as const;

const SLIDER_FRAME = "mt-8 aspect-4/3 w-full md:aspect-video";
const GLOBE_HEIGHT = 380;

function BackLink() {
  return (
    <ButtonLink to="/ubicaciones" variant="ghost" className="text-sm">
      ← Ubicaciones
    </ButtonLink>
  );
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: pairs, loading, error } = usePairs();
  const { setMode, setSelectedSiteId } = useMode();

  const pair = pairs?.find((p) => p.site.id === id) ?? null;

  // Siguiente sitio del mismo destino, por similitud; después del último vuelve al primero
  const next = useMemo(() => {
    if (!pairs || !pair) return null;
    const sameTarget = pairs.filter((p) => p.site.target === pair.site.target);
    const index = sameTarget.indexOf(pair);
    return sameTarget.length > 1 ? sameTarget[(index + 1) % sameTarget.length] : null;
  }, [pairs, pair]);

  const target = pair?.site.target;
  const siteId = pair?.site.id;

  // El acento sigue al destino del sitio, y al volver a la Home se ve este mismo par en el globo
  useEffect(() => {
    if (!target || !siteId) return;
    setMode(target);
    setSelectedSiteId(siteId);
  }, [target, siteId, setMode, setSelectedSiteId]);

  const basePoints = useMemo<GlobePoint[]>(
    () =>
      pair
        ? [
            {
              id: pair.base.id,
              lat: pair.base.lat,
              lng: pair.base.lng,
              label: pair.base.name,
              color: SITE_COLOR[pair.base.body],
              size: 2,
            },
          ]
        : [],
    [pair],
  );

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
        <BackLink />
        <ErrorState message={error} className="mt-8" />
      </div>
    );
  }

  if (loading || !pairs) {
    return (
      <div aria-busy="true" aria-label="Cargando ubicación" className="mx-auto max-w-6xl px-6 pt-12 pb-16">
        <BackLink />
        <Skeleton className="mt-6 h-12 w-2/3 max-w-xl" />
        <Skeleton className="mt-3 h-5 w-1/3 max-w-xs" />
        <Skeleton className={SLIDER_FRAME} />
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
        <BackLink />
        <SectionHeading as="h1" title="No encontramos esta ubicación" className="mt-6">
          <p>Puede que el enlace esté mal escrito o que el lugar ya no esté en la lista.</p>
        </SectionHeading>
        <ButtonLink to="/ubicaciones" className="mt-8">
          Ver todas las ubicaciones
        </ButtonLink>
      </div>
    );
  }

  const { site, base } = pair;

  return (
    <article aria-labelledby="site-title" className="mx-auto max-w-6xl px-6 pt-12 pb-16">
      <BackLink />

      <SectionHeading id="site-title" as="h1" title={site.name} className="mt-6">
        <p>
          {site.country} · <span className="tabular-nums">{formatCoords(site.lat, site.lng)}</span>
        </p>
        <p className="mt-1 text-ink">
          Análogo de <span className="text-accent-soft">{base.name}</span>, en {BODY_NAME[base.body]}
        </p>
      </SectionHeading>

      <CompareSlider
        className={SLIDER_FRAME}
        earth={{
          src: site.image,
          alt: `${site.name}, ${site.country}`,
          label: "Tierra",
          caption: site.name,
        }}
        target={{
          src: base.image,
          alt: `${base.name}, ${BODY_LABEL[base.body]}`,
          label: BODY_LABEL[base.body],
          caption: base.name,
        }}
      />
      <p className="mt-3 text-small text-ink-soft">
        Fotos: {site.imageCredit} · {base.imageCredit}
      </p>

      <div data-reveal className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="factors-title">
          <h2 id="factors-title" className="text-sm text-ink-soft">
            Similitud <span className="text-ink-soft/80">(provisional)</span>
          </h2>
          <p className="text-figure font-extrabold font-stretch-[75%] text-ink tabular-nums">
            {formatPercent(site.similarity)}
          </p>
          <CompareTable pair={pair} className="mt-8" />
          <p className="mt-8 max-w-prose text-ink">{site.description}</p>

          {site.missions.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-extrabold font-stretch-[75%] text-ink">Misiones y estudios</h2>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {site.missions.map((mission) => (
                  <li key={mission} className="py-3 text-ink">
                    {mission}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <figure>
          <Suspense fallback={<Skeleton className="h-[380px]" />}>
            <GlobeView
              texture={BODY_TEXTURE[site.target]}
              points={basePoints}
              selectedId={base.id}
              height={GLOBE_HEIGHT}
              atmosphereColor={SITE_COLOR[site.target]}
            />
          </Suspense>
          <figcaption className="mt-4">
            <span className="block text-sm text-accent-soft">{BODY_LABEL[base.body]}</span>
            <span className="block font-semibold text-ink">{base.name}</span>
            <span className="mt-3 block max-w-prose text-ink-soft">{base.description}</span>
          </figcaption>
        </figure>
      </div>

      {next && (
        <Link
          to={`/ubicacion/${next.site.id}`}
          data-reveal
          className="group mt-20 flex items-center gap-5 border-t border-ink/10 pt-8"
        >
          <img
            src={next.site.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-4/3 w-24 shrink-0 object-cover sm:w-32"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-ink-soft">Siguiente sitio</span>
            <span className="block text-2xl leading-tight font-extrabold font-stretch-[75%] text-ink underline-offset-4 group-hover:underline sm:text-3xl">
              {next.site.name}
            </span>
          </span>
          <span
            aria-hidden
            className="text-3xl text-accent-soft transition-transform duration-200 ease-out-strong group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      )}
    </article>
  );
}
