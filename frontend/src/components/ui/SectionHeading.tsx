import type { CSSProperties, ReactNode } from "react";

interface SectionHeadingProps {
  id?: string;
  title: ReactNode;
  as?: "h1" | "h2";
  /** Frase de introducción bajo el titular */
  children?: ReactNode;
  className?: string;
}

const TITLE_SIZE = {
  h1: "text-h1",
  h2: "text-h2",
};

/**
 * Encabezado común de sección: titular condensado y una intro corta en tinta suave.
 * Al entrar en pantalla, el titular sube desde detrás de su línea (data-mask) y la intro
 * llega justo después (data-reveal); ver useScrollReveal e index.css.
 * Un h1 es siempre el título de la página y está en la primera pantalla: no espera al scroll,
 * entra con la animación de carga (load-line / load-rise) y se lee en menos de 1,2 s.
 */
export default function SectionHeading({ id, title, as: Tag = "h2", children, className = "" }: SectionHeadingProps) {
  const pageTitle = Tag === "h1";

  return (
    <div className={className}>
      <Tag
        id={id}
        className={`${TITLE_SIZE[Tag]} font-extrabold tracking-[-0.02em] text-balance font-stretch-[75%] text-ink`}
      >
        {pageTitle ? (
          <span className="block overflow-clip pb-[0.1em] -mb-[0.1em]">
            <span className="load-line block">{title}</span>
          </span>
        ) : (
          <span data-mask>
            <span>{title}</span>
          </span>
        )}
      </Tag>
      {children && (
        <div
          data-reveal={pageTitle ? undefined : true}
          className={`mt-4 max-w-2xl text-lead text-ink-soft ${pageTitle ? "load-rise" : ""}`}
          style={(pageTitle ? { "--d": "360ms" } : { "--i": 2 }) as unknown as CSSProperties}
        >
          {children}
        </div>
      )}
    </div>
  );
}
