import { Trans } from "react-i18next";
import { useMode } from "../../context/ModeContext";
import { bodyName, formatPercent } from "../../lib/format";
import type { Base, Site, Target } from "../../types/site";
import { SITE_COLOR } from "../globe/colors";

const OTHER: Record<Target, Target> = { mars: "moon", moon: "mars" };

/**
 * El gemelo del sitio elegido en el otro destino ("En la Luna se parece a Peary · 84 %").
 * Al pulsarlo se cambia de destino con el mismo sitio elegido. Sin gemelo allí, no se muestra.
 */
export default function OtherTwin({ site, bases, className = "" }: { site: Site; bases: Base[]; className?: string }) {
  const { setMode, setSelectedSiteId } = useMode();
  const other = OTHER[site.target];
  const twin = site.twins?.[other];
  const base = twin && bases.find((b) => b.id === twin.analogOf);
  if (!twin || !base) return null;

  const go = () => {
    // setMode borra la selección: se vuelve a poner el mismo sitio justo después
    setMode(other);
    setSelectedSiteId(site.id);
  };

  return (
    <button
      type="button"
      onClick={go}
      className={`flex w-full items-baseline gap-2.5 px-1 py-1 text-left text-sm text-ink-soft transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-[0.98] ${className}`}
    >
      <span aria-hidden className="size-2 shrink-0 translate-y-[-1px] rounded-full" style={{ background: SITE_COLOR[other] }} />
      <span className="text-balance">
        <Trans
          i18nKey="home.globe.otherTwin"
          values={{ body: bodyName(other), base: base.name, percent: formatPercent(twin.similarity) }}
          components={{ strong: <span className="font-semibold text-ink" /> }}
        />
      </span>
    </button>
  );
}
