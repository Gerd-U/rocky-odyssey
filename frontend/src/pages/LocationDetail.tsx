import { lazy, Suspense, useEffect, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import CompareSlider from "../components/compare/CompareSlider";
import CompareTable from "../components/compare/CompareTable";
import type { GlobePoint } from "../components/globe/GlobeView";
import { SITE_COLOR } from "../components/globe/colors";
import MonthlyTempChart from "../components/sites/MonthlyTempChart";
import SourcesList from "../components/sites/SourcesList";
import { ButtonLink } from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import { Picture } from "../components/ui/Photo";
import PlaceFallback from "../components/ui/PlaceFallback";
import SectionHeading from "../components/ui/SectionHeading";
import Skeleton from "../components/ui/Skeleton";
import { useMode } from "../context/ModeContext";
import { usePairs } from "../hooks/usePairs";
import { bodyLabel, bodyName, formatCoords, formatCredit, formatMeters, formatPercent } from "../lib/format";
import { IMAGE_SIZES } from "../lib/images";
import type { Site, Target } from "../types/site";

const GlobeView = lazy(() => import("../components/globe/GlobeView"));

const BODY_TEXTURE = {
  moon: "/textures/moon.jpg",
  mars: "/textures/mars.jpg",
} as const;

const OTHER_BODY: Record<Target, Target> = { moon: "mars", mars: "moon" };

const SLIDER_FRAME = "mt-8 aspect-4/3 w-full md:aspect-video";
const GLOBE_HEIGHT = 380;

/** Valores de geología de sitios_candidatos.csv que tienen traducción */
const GEOLOGY = ["sedimentos", "basalto", "hielo", "regolito"] as const;
type Geology = (typeof GEOLOGY)[number];

function BackLink() {
  const { t } = useTranslation();
  return (
    <ButtonLink to="/ubicaciones" variant="ghost" className="text-sm">
      {t("detail.back")}
    </ButtonLink>
  );
}

/** Región, geología y elevación del lugar */
function SiteFacts({ site }: { site: Site }) {
  const { t } = useTranslation();
  const geology = (GEOLOGY as readonly string[]).includes(site.geology ?? "")
    ? t(`geology.${site.geology as Geology}`)
    : site.geology;
  const facts = [
    { label: t("detail.facts.region"), value: site.country || site.region },
    { label: t("detail.facts.geology"), value: geology },
    { label: t("detail.facts.elevation"), value: formatMeters(site.metrics.elevationM) },
  ];

  return (
    <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-ink/10 py-4">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-small text-ink-soft">{fact.label}</dt>
          <dd className="mt-1 text-ink tabular-nums">{fact.value ?? t("common.noData")}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function LocationDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { mode, setMode, setSelectedSiteId } = useMode();
  // Cada lugar se compara con la Luna y con Marte: la ficha muestra la base del destino activo
  const { data: pairs, loading, error } = usePairs(mode);

  const pair = pairs?.find((p) => p.site.id === id) ?? null;

  // Siguiente sitio del mismo destino, por similitud; después del último vuelve al primero
  const next = useMemo(() => {
    if (!pairs || !pair) return null;
    const index = pairs.indexOf(pair);
    return pairs.length > 1 ? pairs[(index + 1) % pairs.length] : null;
  }, [pairs, pair]);

  const siteId = pair?.site.id;

  // Al volver a la Home se ve este mismo lugar en el globo
  useEffect(() => {
    if (siteId) setSelectedSiteId(siteId);
  }, [siteId, setSelectedSiteId]);

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
      <div aria-busy="true" aria-label={t("detail.loading")} className="mx-auto max-w-6xl px-6 pt-12 pb-16">
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
        <SectionHeading as="h1" title={t("detail.notFoundTitle")} className="mt-6">
          <p>{t("detail.notFoundText")}</p>
        </SectionHeading>
        <ButtonLink to="/ubicaciones" className="mt-8">
          {t("common.seeAllLocations")}
        </ButtonLink>
      </div>
    );
  }

  const { site, base, match } = pair;
  const other = OTHER_BODY[base.body];
  const otherMatch = site.matches[other];

  return (
    <article aria-labelledby="site-title" className="mx-auto max-w-6xl px-6 pt-12 pb-16">
      <BackLink />

      <SectionHeading id="site-title" as="h1" title={site.name} className="mt-6">
        <p>
          {site.country} · <span className="tabular-nums">{formatCoords(site.lat, site.lng)}</span>
        </p>
        <p className="mt-1 text-ink">
          <Trans
            i18nKey="detail.resembles"
            values={{ base: base.name, body: bodyName(base.body) }}
            components={{ accent: <span className="text-accent-soft" /> }}
          />
        </p>
        {otherMatch && (
          <p className="mt-1 text-sm">
            <button
              type="button"
              onClick={() => setMode(other)}
              className="text-ink-soft underline underline-offset-4 transition-colors duration-200 hover:text-ink"
            >
              {t("detail.compareOther", { body: bodyName(other), percent: formatPercent(otherMatch.score) })}
            </button>
          </p>
        )}
      </SectionHeading>

      <CompareSlider
        className={SLIDER_FRAME}
        earth={{
          src: site.image,
          place: site,
          alt: t("common.imageAlt", { name: site.name, place: site.country }),
          label: t("common.earth"),
          caption: site.name,
        }}
        target={{
          src: base.image,
          place: base,
          alt: t("common.imageAlt", { name: base.name, place: bodyLabel(base.body) }),
          label: bodyLabel(base.body),
          caption: base.name,
        }}
      />
      <p className="mt-3 text-small text-ink-soft">
        {t("common.photos", {
          earth: formatCredit(site.imageAuthor, site.imageLicense),
          target: formatCredit(base.imageAuthor, base.imageLicense),
        })}
      </p>

      <div data-reveal className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="factors-title">
          {/* La cifra primero y su etiqueta debajo, como en la portada: no es un resultado definitivo */}
          <h2 id="factors-title" className="sr-only">
            {t("detail.factorsTitle")}
          </h2>
          <p>
            <span className="block text-figure font-extrabold font-stretch-[75%] text-ink tabular-nums">
              {formatPercent(match.score)}
            </span>
            <span className="mt-1 block text-sm text-ink-soft">{t("common.similarityProvisional")}</span>
          </p>
          <CompareTable pair={pair} className="mt-8" />
          <p className="mt-8 max-w-prose text-ink">{site.description}</p>
          <SiteFacts site={site} />

          {site.missions.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-extrabold font-stretch-[75%] text-ink">{t("detail.missions")}</h2>
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
              texture={BODY_TEXTURE[base.body]}
              points={basePoints}
              selectedId={base.id}
              height={GLOBE_HEIGHT}
              atmosphereColor={SITE_COLOR[base.body]}
            />
          </Suspense>
          <figcaption className="mt-4">
            <span className="block text-sm text-accent-soft">{bodyLabel(base.body)}</span>
            <span className="block font-semibold text-ink">{base.name}</span>
            <span className="mt-3 block max-w-prose text-ink-soft">{base.description}</span>
          </figcaption>
        </figure>
      </div>

      <section data-reveal aria-labelledby="climate-title" className="mt-20">
        <h2 id="climate-title" className="text-h3 font-extrabold font-stretch-[75%] text-ink">
          {t("detail.climateTitle")}
        </h2>
        <p className="mt-2 max-w-prose text-ink-soft">{t("detail.climateText", { place: site.name })}</p>
        <MonthlyTempChart data={site.monthlyTemp} place={site.name} className="mt-6" />
      </section>

      <section data-reveal aria-labelledby="sources-title" className="mt-20">
        <h2 id="sources-title" className="text-h3 font-extrabold font-stretch-[75%] text-ink">
          {t("sources.title")}
        </h2>
        <p className="mt-2 max-w-prose text-ink-soft">{t("sources.intro")}</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SourcesList title={site.name} sources={site.sources} kind="earth" />
          <SourcesList title={base.name} sources={base.sources} kind="base" />
        </div>
      </section>

      {next && (
        <Link
          to={`/ubicacion/${next.site.id}`}
          data-reveal
          className="group mt-20 flex items-center gap-5 border-t border-ink/10 pt-8"
        >
          {next.site.image ? (
            <Picture
              src={next.site.image}
              sizes={IMAGE_SIZES.thumb}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-4/3 w-24 shrink-0 object-cover sm:w-32"
            />
          ) : (
            <div className="relative aspect-4/3 w-24 shrink-0 sm:w-32">
              <PlaceFallback
                name={next.site.name}
                lat={next.site.lat}
                lng={next.site.lng}
                aspect={3 / 4}
                label="none"
              />
            </div>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-ink-soft">{t("detail.next")}</span>
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
