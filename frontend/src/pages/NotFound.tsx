import { useTranslation } from "react-i18next";
import SiteCard from "../components/sites/SiteCard";
import { ButtonLink } from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";
import { useMode } from "../context/ModeContext";
import { usePairs } from "../hooks/usePairs";

/** Cuántos lugares se sugieren para seguir explorando */
const SUGGESTIONS = 3;

/**
 * Cualquier ruta que no existe. En vez de dejar al visitante en un callejón sin salida, le
 * ofrece los lugares más parecidos del destino activo: lo mismo que encontraría en Ubicaciones.
 * Si los datos no cargan, quedan solo los dos botones.
 */
export default function NotFound() {
  const { t } = useTranslation();
  const { mode } = useMode();
  const { data: pairs } = usePairs(mode);
  // usePairs ya viene ordenado de más a menos parecido
  const suggestions = (pairs ?? []).slice(0, SUGGESTIONS);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16">
      <SectionHeading as="h1" title={t("notFound.title")} className="mt-6">
        <p>{t("notFound.text")}</p>
      </SectionHeading>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/">{t("notFound.home")}</ButtonLink>
        <ButtonLink to="/ubicaciones" variant="secondary">
          {t("common.seeAllLocations")}
        </ButtonLink>
      </div>

      {suggestions.length > 0 && (
        <section aria-labelledby="not-found-suggestions" className="mt-section">
          <h2 id="not-found-suggestions" className="text-h3 font-extrabold font-stretch-[75%] text-ink">
            {t("notFound.suggestions")}
          </h2>
          <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((pair) => (
              <li key={`${pair.site.id}-${pair.site.target}`}>
                <SiteCard pair={pair} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
