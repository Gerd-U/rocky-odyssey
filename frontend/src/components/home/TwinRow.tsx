import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, formatPercent } from "../../lib/format";
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
        <Swap swapKey={site.id} className="rise">
          <Photo src={site.image} alt={`${site.name}, ${site.country}`} caption={`Tierra · ${site.name}`} ratio="1 / 1" />
        </Swap>

        <Swap swapKey={base.id} delay={0.1} className="rise lg:order-last">
          <Photo
            src={base.image}
            alt={`${base.name}, ${BODY_LABEL[base.body]}`}
            caption={`${BODY_LABEL[base.body]} · ${base.name}`}
            ratio="1 / 1"
          />
        </Swap>

        <Swap swapKey={site.id} delay={0.05} className="col-span-2 lg:col-span-1">
          <h3 id="twin-title" className="text-h3 font-extrabold text-balance font-stretch-[75%] text-ink">
            {site.name} y {base.name}
          </h3>
          <p className="mt-5">
            <span className="block text-figure font-extrabold font-stretch-[75%] text-ink tabular-nums">
              <span className="sr-only">{formatPercent(site.similarity)}</span>
              <CountUp from={from} to={site.similarity} />
            </span>
            <span className="mt-1 block text-sm text-ink-soft">de similitud (valor provisional)</span>
          </p>
          <CompareTable pair={pair} className="mt-6" />
          <ButtonLink to={`/ubicacion/${site.id}`} variant="secondary" size="sm" className="mt-6">
            Ver detalle →
          </ButtonLink>
        </Swap>
      </div>

      <p className="mt-6 text-small text-ink-soft">
        Fotos: {site.imageCredit} · {base.imageCredit}
      </p>
    </article>
  );
}
