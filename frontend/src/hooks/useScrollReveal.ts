import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-mask], [data-shutter]";

/**
 * Revela una sola vez los elementos marcados con data-reveal, data-mask o data-shutter
 * cuando su borde superior llega al 88 % de la pantalla (receta "Reveal on scroll (once)"
 * de design-taste-frontend). Se monta una vez en App y vigila también lo que aparece al
 * cambiar de ruta.
 *
 * Los estados ocultos solo existen con .js-reveal en <html>: si este hook no corre
 * (sin IntersectionObserver o con movimiento reducido), todo se ve desde el principio.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const watched = new WeakSet<Element>();

    const reveal = (el: Element) => {
      el.classList.add("is-in");
      io.unobserve(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    // Red de seguridad: nada que ya esté en pantalla puede quedarse oculto si el observer
    // tarda en avisar (pestaña en segundo plano, panel oculto)
    const revealVisibleNow = () => {
      for (const el of document.querySelectorAll(SELECTOR)) {
        if (el.classList.contains("is-in")) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.top < window.innerHeight && rect.bottom > 0) reveal(el);
      }
    };

    let fallback = 0;
    let queued = false;
    const scan = () => {
      queued = false;
      for (const el of document.querySelectorAll(SELECTOR)) {
        if (watched.has(el)) continue;
        watched.add(el);
        io.observe(el);
      }
      window.clearTimeout(fallback);
      fallback = window.setTimeout(revealVisibleNow, 900);
    };
    const queueScan = () => {
      if (queued) return;
      queued = true;
      // setTimeout y no requestAnimationFrame: rAF no corre con la pestaña en segundo plano
      window.setTimeout(scan, 16);
    };

    // Al parar el scroll se revisa también: un salto rápido (o un ancla) puede pasar por
    // encima de un elemento sin que el observer llegue a avisar
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(revealVisibleNow, 150);
    };

    root.classList.add("js-reveal");
    scan();
    const mo = new MutationObserver(queueScan);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(fallback);
      window.clearTimeout(settle);
      root.classList.remove("js-reveal");
    };
  }, []);
}
