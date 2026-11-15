import { Link } from "react-router-dom";
import type { Pair } from "../../hooks/usePairs";
import { BODY_LABEL, formatPercent } from "../../lib/format";

export default function SiteCard({ pair }: { pair: Pair }) {
  const { site, base } = pair;

  return (
    <Link to={`/ubicacion/${site.id}`} className="rise group block focus-visible:outline-offset-4">
      <div className="relative aspect-4/3 overflow-hidden bg-night-800">
        <img
          src={site.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-strong group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-extrabold font-stretch-[75%] text-ink underline-offset-4 group-hover:underline">
            {site.name}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{site.country}</p>
        </div>
        <p className="shrink-0 text-3xl leading-none font-extrabold font-stretch-[75%] text-ink tabular-nums">
          <span className="sr-only">Similitud </span>
          {formatPercent(site.similarity)}
        </p>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Análogo de <span className="text-ink">{base.name}</span> ·{" "}
        <span className={base.body === "mars" ? "text-plum-200" : "text-indigo-200"}>{BODY_LABEL[base.body]}</span>
      </p>
    </Link>
  );
}
