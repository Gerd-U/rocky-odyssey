import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, formatPercent } from "../../lib/format";
import CompareTable from "../compare/CompareTable";
import { ButtonLink } from "../ui/Button";
import Photo from "../ui/Photo";

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
      <Photo
        src={site.image}
        alt={`${site.name}, ${site.country}`}
        caption={`Tierra · ${site.name}`}
        credit={site.imageCredit}
        ratio="1 / 1"
      />

      <Photo
        src={base.image}
        alt={`${base.name}, ${BODY_LABEL[base.body]}`}
        caption={`${BODY_LABEL[base.body]} · ${base.name}`}
        credit={base.imageCredit}
        ratio="1 / 1"
        className="lg:order-last"
      />

      <div className="col-span-2 lg:col-span-1">
        <h3 id="twin-title" className="text-2xl leading-tight font-extrabold font-stretch-[75%] text-ink">
          {site.name} y {base.name}
        </h3>
        <p className="mt-5 text-sm text-ink-soft">Similitud</p>
        <p className="text-6xl leading-none font-extrabold font-stretch-[75%] text-ink tabular-nums">
          {formatPercent(site.similarity)}
        </p>
        <CompareTable pair={pair} className="mt-6" />
        <ButtonLink to={`/ubicacion/${site.id}`} variant="ghost" className="mt-6">
          Ver detalle →
        </ButtonLink>
      </div>
    </article>
  );
}
