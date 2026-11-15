import type { CSSProperties } from "react";
import { useMode } from "../../context/ModeContext";
import { useBases, useSites } from "../../hooks/useSites";
import type { Target } from "../../types/site";
import { ButtonLink } from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

/** Foto de un ensayo real en la Tierra para cada destino, sacada de los sitios */
const PHOTO_SITE: Record<Target, { id: string; alt: string }> = {
  mars: { id: "devon", alt: "Dos rovers de prueba en el cráter Haughton, isla Devon, Canadá" },
  moon: { id: "hiseas", alt: "Prueba de un traje espacial análogo en las laderas del Mauna Loa, Hawái" },
};

const MODES: Target[] = ["mars", "moon"];

export default function Closing() {
  const { mode } = useMode();
  const { data: sites } = useSites();
  const { data: bases } = useBases();

  const photoSite = sites?.find((s) => s.id === PHOTO_SITE[mode].id);

  return (
    <section aria-labelledby="closing-title" className="relative isolate mt-section flex min-h-[70svh] items-end overflow-hidden">
      {MODES.map((m) => {
        const site = sites?.find((s) => s.id === PHOTO_SITE[m].id);
        return (
          <img
            key={m}
            src={site?.image ?? `/images/${PHOTO_SITE[m].id}.jpg`}
            alt={m === mode ? PHOTO_SITE[m].alt : ""}
            aria-hidden={m !== mode}
            loading="lazy"
            decoding="async"
            className={`drift absolute inset-0 -z-20 size-full object-cover transition-opacity duration-700 ease-out-strong ${
              m === mode ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-night-900 via-night-900/30 to-night-900"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-night-900/80 via-night-900/20 to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-6 pt-40 pb-16 lg:pb-24">
        <SectionHeading
          id="closing-title"
          title={<span className="block text-display">Cada misión se ensaya aquí primero</span>}
        >
          {sites && bases && (
            <p className="text-lg text-ink">
              {sites.length} lugares de la Tierra comparados con {bases.length} bases en la Luna y Marte.
            </p>
          )}
        </SectionHeading>
        <ButtonLink to="/ubicaciones" size="lg" className="rise mt-8" style={{ "--i": 2 } as CSSProperties}>
          Ver todas las ubicaciones
        </ButtonLink>
        {photoSite && (
          <p className="mt-10 text-small text-ink-soft">
            Foto: {photoSite.name} · {photoSite.imageCredit}
          </p>
        )}
      </div>
    </section>
  );
}
