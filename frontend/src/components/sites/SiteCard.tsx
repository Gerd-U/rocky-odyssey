import { Link } from "react-router-dom";
import type { Site } from "../../types/site";

export default function SiteCard({ site }: { site: Site }) {
  return (
    <Link
      to={`/ubicacion/${site.id}`}
      className="group block rounded-2xl bg-panel p-5 ring-1 ring-white/5 transition hover:ring-accent/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white group-hover:text-accent">{site.name}</h3>
          <p className="text-sm text-slate-400">{site.country}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
          {Math.round(site.similarity * 100)}%
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-300">{site.description}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
        Análogo de {site.target === "mars" ? "Marte" : "la Luna"}
      </p>
    </Link>
  );
}
