import { useTranslation } from "react-i18next";

/** Etiqueta visible para los valores que el log del equipo marca como PROVISIONAL */
export default function ApproxTag({ className = "" }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <span
      title={t("sources.approximationHint")}
      className={`inline-block rounded-full bg-ink/10 px-2 py-0.5 text-small font-semibold whitespace-nowrap text-accent-soft ${className}`}
    >
      {t("sources.approximation")}
    </span>
  );
}
