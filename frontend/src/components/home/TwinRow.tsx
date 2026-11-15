import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { Pair } from "../../hooks/usePairs";
import { bodyLabel, formatPercent } from "../../lib/format";
import { SWAP_EASE } from "../../lib/motion";
import CompareTable from "../compare/CompareTable";
import { ButtonLink } from "../ui/Button";
import Photo from "../ui/Photo";
import Swap from "../ui/Swap";

interface TwinRowProps {
  pair: Pair;
  className?: string;
}

/** El porcentaje cuenta desde el del par anterior hasta el nuevo (400 ms) */
function CountUp({ from, to }: { from: number; to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || from === to) return;
    const controls = animate(from, to, {
      duration: 0.4,
      ease: SWAP_EASE,
      onUpdate: (value) => {
        el.textContent = formatPercent(value);
      },
    });
    return () => controls.stop();
  }, [from, to, reduce]);

  return (
    <span ref={ref} aria-hidden>
      {formatPercent(reduce ? to : from)}
    </span>
  );
}

export default function TwinRow({ pair, className = "" }: TwinRowProps) {
  const { t } = useTranslation();
  const { site, base } = pair;

  // Al cambiar de par, el porcentaje nuevo cuenta desde el anterior
  // (estado derivado durante el render, el patrón que recomienda React)
  const [shown, setShown] = useState(site.similarity);
  const [from, setFrom] = useState(site.similarity);
  if (shown !== site.similarity) {
    setFrom(shown);
    setShown(site.similarity);
  }

  return (
    <article aria-labelledby="twin-title" className={className}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-[1fr_21rem_1fr] lg:items-center lg:gap-x-10">
        {/* Las dos fotos gemelas se abren como una persiana al entrar en pantalla (data-shutter) */}
        <div data-shutter>
          <Swap swapKey={site.id}>
            <Photo
              src={site.image}
              alt={t("common.imageAlt", { name: site.name, place: site.country })}
              caption={t("home.twin.caption", { body: t("common.earth"), name: site.name })}
              ratio="1 / 1"
            />
          </Swap>
        </div>

        <div data-shutter className="lg:order-last" style={{ "--i": 1 } as CSSProperties}>
          <Swap swapKey={base.id} delay={0.1}>
            <Photo
              src={base.image}
              alt={t("common.imageAlt", { name: base.name, place: bodyLabel(base.body) })}
              caption={t("home.twin.caption", { body: bodyLabel(base.body), name: base.name })}
              ratio="1 / 1"
            />
          </Swap>
        </div>

        <div data-reveal className="col-span-2 lg:col-span-1" style={{ "--i": 2 } as CSSProperties}>
          <Swap swapKey={site.id} delay={0.05}>
            <h3 id="twin-title" className="text-h3 font-extrabold text-balance font-stretch-[75%] text-ink">
              {t("home.twin.title", { site: site.name, base: base.name })}
            </h3>
            <p className="mt-5">
              <span className="block text-figure font-extrabold font-stretch-[75%] text-ink tabular-nums">
                <span className="sr-only">{formatPercent(site.similarity)}</span>
                <CountUp from={from} to={site.similarity} />
              </span>
              <span className="mt-1 block text-sm text-ink-soft">{t("common.similarityProvisional")}</span>
            </p>
            <CompareTable pair={pair} className="mt-6" />
            <ButtonLink to={`/ubicacion/${site.id}`} variant="secondary" size="sm" className="mt-6">
              {t("home.twin.seeDetail")}
            </ButtonLink>
          </Swap>
        </div>
      </div>

      <p className="mt-6 text-small text-ink-soft">
        {t("common.photos", { earth: site.imageCredit, target: base.imageCredit })}
      </p>
    </article>
  );
}
