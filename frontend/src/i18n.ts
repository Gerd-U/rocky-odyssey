import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

export const SUPPORTED_LANGS = ["en", "es"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

/**
 * La web arranca en inglés. La elección se guarda en localStorage (clave i18nextLng)
 * y no se mira el idioma del navegador.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGS],
    detection: { order: ["localStorage"], caches: ["localStorage"] },
    interpolation: { escapeValue: false },
  });

// <html lang> sigue al idioma activo (lectores de pantalla, separación de palabras)
const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = lng;
};
syncHtmlLang(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", () => syncHtmlLang(i18n.resolvedLanguage ?? "en"));

/** Idioma activo ("en" o "es"); también para los formateadores Intl */
export function getLang(): Lang {
  return (i18n.resolvedLanguage as Lang | undefined) ?? "en";
}

export default i18n;
