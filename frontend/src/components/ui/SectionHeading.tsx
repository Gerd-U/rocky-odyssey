import type { ReactNode } from "react";

interface SectionHeadingProps {
  id?: string;
  title: ReactNode;
  as?: "h1" | "h2";
  /** Frase de introducción bajo el titular */
  children?: ReactNode;
  className?: string;
}

const TITLE_SIZE = {
  h1: "text-4xl md:text-5xl",
  h2: "text-3xl md:text-4xl",
};

/** Encabezado común de sección: titular condensado y una intro corta en tinta suave. */
export default function SectionHeading({ id, title, as: Tag = "h2", children, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <Tag
        id={id}
        className={`${TITLE_SIZE[Tag]} leading-[0.95] font-extrabold tracking-[-0.02em] text-balance font-stretch-[75%] text-ink`}
      >
        {title}
      </Tag>
      {children && <div className="mt-3 max-w-2xl text-ink-soft">{children}</div>}
    </div>
  );
}
