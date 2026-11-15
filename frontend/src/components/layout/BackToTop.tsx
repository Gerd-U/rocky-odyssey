import { useEffect, useState } from "react";

/**
 * Flecha flotante para volver arriba. Aparece después de bajar casi una pantalla,
 * con el mismo vidrio que la navbar (en móvil, solo al subir). Con movimiento reducido
 * sube de golpe.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // En móvil se oculta mientras bajas (tapaba datos de las tarjetas) y vuelve al subir,
    // que es cuando de verdad se busca. En pantallas anchas se queda fija.
    const narrow = window.matchMedia("(max-width: 767px)");
    let lastY = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      const scrollingUp = y < lastY;
      lastY = y;
      const farEnough = y > window.innerHeight * 0.8;
      setVisible(farEnough && (!narrow.matches || scrollingUp));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Volver arriba"
      title="Volver arriba"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-4 z-30 grid size-12 place-items-center rounded-full bg-night-900/75 text-ink shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-ink/10 backdrop-blur-md transition-[opacity,transform,background-color] duration-200 ease-out-strong hover:bg-night-800 active:scale-[0.94] sm:right-6 sm:bottom-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="size-5 fill-none stroke-current stroke-[1.75]"
      >
        <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
