import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, formatPercent } from "../../lib/format";
import CompareTable from "../compare/CompareTable";
import { ButtonLink } from "../ui/Button";
import Photo from "../ui/Photo";
import Swap from "../ui/Swap";

interface TwinRowProps {
  pair: Pair;
  className?: string;
}

export default function TwinRow({ pair, className = "" }: TwinRowProps) {
  const { site, base } = pair;

  return (
    <article
      aria-labelledby="twin-title"
      className={`grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-[1fr_20rem_1fr] lg:items-start lg:gap-x-10 ${className}`}
    >
      <Swap swapKey={site.id}>
        <Photo
          src={site.image}
          alt={`${site.name}, ${site.country}`}
          caption={`Tierra · ${site.name}`}
          credit={site.imageCredit}
          ratio="1 / 1"
        />
      </Swap>

      <Swap swapKey={base.id} delay={0.1} className="lg:order-last">
        <Photo
          src={base.image}
          alt={`${base.name}, ${BODY_LABEL[base.body]}`}
          caption={`${BODY_LABEL[base.body]} · ${base.name}`}
          credit={base.imageCredit}
          ratio="1 / 1"
        />
      </Swap>

      <Swap swapKey={site.id} delay={0.05} className="col-span-2 lg:col-span-1">
        <h3 id="twin-title" className="text-2xl leading-tight font-extrabold font-stretch-[75%] text-ink">
          {site.name} y {base.name}
        </h3>
        <p className="mt-5 text-sm text-ink-soft">Similitud</p>
        <p className="text-6xl leading-none font-extrabold font-stretch-[75%] text-ink tabular-nums">
          {formatPercent(site.similarity)}
        </p>
        <CompareTable pair={pair} className="mt-6" />
        <ButtonLink to={`/ubicacion/${site.id}`} variant="secondary" size="sm" className="mt-6">
          Ver detalle →
        </ButtonLink>
      </Swap>
    </article>
  );
}
