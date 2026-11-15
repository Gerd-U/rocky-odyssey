import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `h-9 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
    isActive
      ? "bg-ink/10 text-ink"
      : "text-ink-soft hover:bg-ink/5 hover:text-ink"
  }`;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  // La ficha de un sitio (/ubicacion/:id) cuenta como parte de "Ubicaciones"
  const { pathname } = useLocation();
  const inLocations = pathname.startsWith("/ubicacion/");

  // El botón muestra el idioma al que se cambia, no el actual
  const nextLang = i18n.resolvedLanguage === "es" ? "en" : "es";

  return (
    <header className="sticky top-3 z-30 px-2 sm:top-4">
      {/*
        La píldora sobresale 0.5rem a cada lado del contenido (max-w-6xl + px-6) y su
        padding izquierdo compensa la diferencia: el nombre cae en la misma vertical
        que los titulares de todas las secciones, en cualquier ancho.
      */}
      <nav
        aria-label={t("nav.label")}
        style={{ paddingLeft: "calc((min(100vw - 1rem, 73rem) - min(100vw, 72rem)) / 2 + 1.5rem)" }}
        className="mx-auto flex h-14 max-w-[73rem] items-center gap-2 rounded-full bg-night-900/75 pr-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-ink/10 backdrop-blur-md"
      >
        <NavLink
          to="/"
          className="mr-auto text-lg leading-none font-extrabold tracking-[-0.01em] font-stretch-[75%] text-ink"
        >
          Rocky Odyssey
        </NavLink>

        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={(s) => `${linkClass(s)} hidden sm:inline-flex`}
          >
            {t("nav.home")}
          </NavLink>
          <NavLink
            to="/ubicaciones"
            className={({ isActive }) => `${linkClass({ isActive: isActive || inLocations })} inline-flex`}
          >
            {t("nav.locations")}
          </NavLink>
          <button
            type="button"
            onClick={() => void i18n.changeLanguage(nextLang)}
            aria-label={t("nav.switchLanguage")}
            title={t("nav.switchLanguage")}
            lang={nextLang}
            className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold tracking-wide text-ink-soft ring-1 ring-ink/15 transition-[color,background-color,transform] duration-200 hover:bg-ink/5 hover:text-ink active:scale-[0.96]"
          >
            {nextLang.toUpperCase()}
          </button>
        </div>
      </nav>
    </header>
  );
}
