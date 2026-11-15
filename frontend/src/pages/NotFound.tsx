import { useTranslation } from "react-i18next";
import { ButtonLink } from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";

/** Cualquier ruta que no existe: mismo estilo que el "no encontrado" de la ficha de un sitio */
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
      <SectionHeading as="h1" title={t("notFound.title")} className="mt-6">
        <p>{t("notFound.text")}</p>
      </SectionHeading>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/">{t("notFound.home")}</ButtonLink>
        <ButtonLink to="/ubicaciones" variant="secondary">
          {t("common.seeAllLocations")}
        </ButtonLink>
      </div>
    </div>
  );
}
