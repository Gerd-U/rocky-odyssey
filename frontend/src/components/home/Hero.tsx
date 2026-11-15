import { useMemo, type CSSProperties } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../../lib/format";
import { marsToday, moonToday } from "../../lib/sky";
import { ButtonLink } from "../ui/Button";
import EarthLoop from "./EarthLoop";

/** Distancia de hoy a la Luna y a Marte, en una frase (cambia cada día) */
function todayLine(t: TFunction): string {
  const moon = moonToday();
  const mars = marsToday();
  return t("home.hero.today", {
    km: formatNumber(Math.round(moon.distanceKm / 1000) * 1000),
    millions: formatNumber(mars.distanceKm / 1e6),
    minutes: Math.round(mars.lightMinutes),
  });
}

export default function Hero() {
  const { t } = useTranslation();
  // t cambia con el idioma: la frase se vuelve a armar al cambiar de idioma
  const today = useMemo(() => todayLine(t), [t]);

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-recede relative -mt-14 flex min-h-svh flex-col overflow-x-clip"
    >
      {/*
        El vídeo ocupa todo el hero, también por detrás de la navbar (por eso el margen negativo).
        Sin isolate ni transform en los contenedores: el vídeo usa mix-blend-mode y tiene que
        mezclarse con el fondo real de la página, o su negro se vería como un rectángulo.
      */}
      {/* Al bajar, el vídeo se hunde y se oscurece y el texto se va antes (hero-recede, index.css) */}
      <EarthLoop className="hero-recede__media absolute inset-0 size-full" />

      {/* Velos neutros para leer el texto y fundir el borde inferior con la página */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-tr from-night-900/85 via-night-900/30 to-transparent"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-night-900 to-transparent" />
      <div aria-hidden className="hero-recede__dim pointer-events-none absolute inset-0 bg-night-900 opacity-0" />

      <div className="hero-recede__copy relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pt-40 pb-20 lg:pb-24">
        {/*
          Entrada en 1,2 s: el titular sube desde su línea y luego llegan explicación, botón y dato de hoy.
          El hero no depende del modo Luna/Marte: habla de los dos. El selector está en el globo.
        */}
        <h1 id="hero-title" className="max-w-[18ch] text-display font-extrabold text-balance font-stretch-[75%] text-ink">
          <span className="block overflow-clip pb-[0.08em] -mb-[0.08em]">
            <span className="load-line block">{t("home.hero.title")}</span>
          </span>
        </h1>

        <div className="max-w-[34rem]">
          <p className="load-rise mt-6 text-lead text-ink" style={{ "--d": "420ms" } as CSSProperties}>
            {t("home.hero.lead")}
          </p>

          <div className="load-rise mt-8 flex flex-wrap items-center gap-3" style={{ "--d": "480ms" } as CSSProperties}>
            <ButtonLink to="/#globo" size="md">
              {t("home.hero.explore")}
            </ButtonLink>
          </div>

          <p className="load-rise mt-8 text-base text-ink-soft" style={{ "--d": "540ms" } as CSSProperties}>
            {today}
          </p>
        </div>
      </div>
    </section>
  );
}
