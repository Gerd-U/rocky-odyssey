import { Link } from "react-router-dom";
import type { Site } from "../../types/site";
import CompareBars from "./CompareBars";

interface SitePanelProps {
  site: Site | null;
  onClose?: () => void;
}

export default function SitePanel({ site, onClose }: SitePanelProps) {
  if (!site) {
    return (
      <aside className="rounded-2xl bg-panel p-6 text-sm text-slate-400 ring-1 ring-white/5">
        Haz clic en un punto del globo para ver la ubicación.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl bg-panel p-6 ring-1 ring-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{site.name}</h3>
          <p className="text-sm text-slate-400">{site.country}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-white">
            ✕
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-300">{site.description}</p>
      <div className="mt-5">
        <CompareBars site={site} />
      </div>
      <Link to={`/ubicacion/${site.id}`} className="mt-5 inline-block text-sm font-medium text-accent hover:underline">
        Ver detalle →
      </Link>
    </aside>
  );
}
