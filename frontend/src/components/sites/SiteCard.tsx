import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Pair } from "../../hooks/usePairs";
import { bodyLabel, formatPercent } from "../../lib/format";

export default function SiteCard({ pair }: { pair: Pair }) {
  const { t } = useTranslation();
  const { site, base } = pair;

  return (
    <Link
      to={`/ubicacion/${site.id}`}
      className="group block focus-visible:outline-offset-4"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-night-800">
        <img
          src={site.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-strong group-hover:scale-[1.03]"
        />
        {/* El gemelo en la esquina: cada lugar de la Tierra se ve junto a su base */}
        <img
          src={base.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute right-3 bottom-3 aspect-square w-[30%] object-cover ring-2 ring-night-900"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-extrabold font-stretch-[75%] text-ink underline-offset-4 group-hover:underline">
            {site.name}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{site.country}</p>
        </div>
        {/* Cifra más contenida y siempre con "provisional": aún no es el resultado de un modelo */}
        <p className="shrink-0 text-right">
          <span className="block text-2xl leading-none font-extrabold font-stretch-[75%] text-ink tabular-nums">
            <span className="sr-only">{t("locations.card.similarity")}</span>
            {formatPercent(site.similarity)}
          </span>
          <span className="mt-1 block text-small text-ink-soft">{t("locations.card.provisional")}</span>
        </p>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {t("locations.card.looksLike")} <span className="text-ink">{base.name}</span> ·{" "}
        <span className={base.body === "mars" ? "text-plum-200" : "text-indigo-200"}>{bodyLabel(base.body)}</span>
      </p>
    </Link>
  );
}
