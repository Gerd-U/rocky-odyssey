import "i18next";
import type en from "../locales/en.json";

// en.json es la referencia: t() autocompleta sus claves y marca error si una no existe
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}
