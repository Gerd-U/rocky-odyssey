import { useMemo, type CSSProperties } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useMode } from "../../context/ModeContext";
import { bodyName, formatNumber, formatPercent } from "../../lib/format";
import { MODE_DIRECTION } from "../../lib/motion";
import { marsToday, moonToday } from "../../lib/sky";
import type { Target } from "../../types/site";
import { ButtonLink } from "../ui/Button";
import Swap from "../ui/Swap";
import EarthLoop from "./EarthLoop";

/** Una frase sobre el destino calculada para hoy (cambia cada día) */
function todayLine(mode: Target, t: TFunction): string {
  if (mode === "mars") {
    const { distanceKm, lightMinutes } = marsToday();
    return t("home.hero.todayMars", {
      millions: formatNumber(distanceKm / 1e6),
      minutes: Math.round(lightMinutes),
    });
  }
  const { distanceKm, illuminated, waxing } = moonToday();
  const rounded = Math.round(distanceKm / 1000) * 1000;
  return t("home.hero.todayMoon", {
    km: formatNumber(rounded),
    percent: formatPercent(Math.round(illuminated * 100) / 100),
    phase: t(waxing ? "home.hero.waxing" : "home.hero.waning"),
  });
}

export default function Hero() {
  const { t } = useTranslation();
  const { mode } = useMode();
  const direction = MODE_DIRECTION[mode];
  // t cambia con el idioma: la frase se vuelve a armar al cambiar de idioma
  const today = useMemo(() => todayLine(mode, t), [mode, t]);

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
        {/* Entrada en 1,2 s: el titular sube desde su línea y luego llegan frase, controles y dato de hoy */}
        <div className="max-w-[34rem]">
          <h1 id="hero-title" className="max-w-[13ch] text-display font-extrabold font-stretch-[75%] text-ink">
            <span className="block overflow-clip pb-[0.08em] -mb-[0.08em]">
              <span className="load-line block">
                <Swap as="span" swapKey={mode} direction={direction} blur={false}>
                  {t(`home.hero.headline.${mode}`)}
                </Swap>
              </span>
            </span>
          </h1>

          <div className="load-rise" style={{ "--d": "420ms" } as CSSProperties}>
            <Swap swapKey={mode} direction={direction} delay={0.06}>
              <p className="mt-6 text-lead text-ink">
                {t("home.hero.lead", { body: bodyName(mode) })}
              </p>
            </Swap>
          </div>

          <div className="load-rise mt-8 flex flex-wrap items-center gap-3" style={{ "--d": "480ms" } as CSSProperties}>
            <ButtonLink to="/#globo" size="md">
              {t("home.hero.explore")}
            </ButtonLink>
          </div>

          <div className="load-rise" style={{ "--d": "540ms" } as CSSProperties}>
            <Swap swapKey={mode} direction={direction} delay={0.1}>
              <p className="mt-8 text-base text-ink-soft">{today}</p>
            </Swap>
          </div>
        </div>
      </div>
    </section>
  );
}
