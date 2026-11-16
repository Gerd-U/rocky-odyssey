import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useMode } from "../../context/ModeContext";
import { useBases, useSites } from "../../hooks/useSites";
import { formatCredit } from "../../lib/format";
import { IMAGE_SIZES } from "../../lib/images";
import type { Target } from "../../types/site";
import { ButtonLink } from "../ui/Button";
import { Picture } from "../ui/Photo";
import SectionHeading from "../ui/SectionHeading";

/** Foto de un ensayo real en la Tierra para cada destino, sacada de los sitios */
const PHOTO_SITE: Record<Target, string> = {
  mars: "devon",
  moon: "atacama",
};

const MODES: Target[] = ["mars", "moon"];

export default function Closing() {
  const { t } = useTranslation();
  const { mode } = useMode();
  const { data: sites } = useSites();
  const { data: bases } = useBases();

  const photoSite = sites?.find((s) => s.id === PHOTO_SITE[mode]);

  return (
    <section aria-labelledby="closing-title" className="relative isolate mt-section flex min-h-[70svh] items-end overflow-clip">
      {MODES.map((m) => {
        const site = sites?.find((s) => s.id === PHOTO_SITE[m]);
        return (
          <Picture
            key={m}
            src={site?.image ?? `/images/${PHOTO_SITE[m]}.jpg`}
            sizes={IMAGE_SIZES.full}
            alt={m === mode ? t(`home.closing.photoAlt.${m}`) : ""}
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
          title={<span className="block text-display">{t("home.closing.title")}</span>}
        >
          {sites && bases && (
            <p className="text-lg text-ink">
              {t("home.closing.summary", { sites: new Set(sites.map((s) => s.id)).size, bases: bases.length })}
            </p>
          )}
        </SectionHeading>
        <ButtonLink to="/ubicaciones" size="lg" className="mt-8" data-reveal style={{ "--i": 3 } as CSSProperties}>
          {t("common.seeAllLocations")}
        </ButtonLink>
        {photoSite && (
          <p className="mt-10 text-small text-ink-soft">
            {t("common.photo", { place: photoSite.name, credit: formatCredit(photoSite.imageAuthor, photoSite.imageLicense) })}
          </p>
        )}
      </div>
    </section>
  );
}
