import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import credits from "../../data/credits.json";
import { useSites } from "../../hooks/useSites";
import type { ImageCredit } from "../../types/credit";
import type { Site } from "../../types/site";
import { ButtonLink } from "../ui/Button";

const YEAR = new Date().getFullYear();

const EXPLORE_LINKS = [
  { label: "Globo interactivo", to: "/#globo" },
  { label: "Todas las ubicaciones", to: "/ubicaciones" },
  { label: "Cómo medimos la similitud", to: "/#criterios" },
];

const SOCIALS: { label: string; href: string; icon: ReactElement }[] = [
  {
    label: "Código en GitHub",
    href: "https://github.com/Gerd-U/rocky-odyssey",
    icon: (
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.62-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.21.69.82.57A12 12 0 0 0 12 .3" />
    ),
  },
  {
    label: "NASA en X",
    href: "https://x.com/NASA",
    icon: (
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
    ),
  },
  {
    label: "NASA en YouTube",
    href: "https://www.youtube.com/@NASA",
    icon: (
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81M9.55 15.57V8.43L15.82 12z" />
    ),
  },
  {
    label: "NASA en Instagram",
    href: "https://www.instagram.com/nasa/",
    icon: (
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88" />
    ),
  },
];

function FooterColumn({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <span aria-hidden className="mt-2 block h-0.5 w-6 bg-accent" />
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </nav>
  );
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-ink-soft transition-colors duration-200 hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}

function SiteLinks({ sites }: { sites: Site[] }) {
  return sites.map((site) => (
    <FooterLink key={site.id} to={`/ubicacion/${site.id}`}>
      {site.name}
    </FooterLink>
  ));
}

export default function Footer() {
  const { data: sites } = useSites();
  const marsSites = sites?.filter((s) => s.target === "mars") ?? [];
  const moonSites = sites?.filter((s) => s.target === "moon") ?? [];

  return (
    <footer className="relative mt-16 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-[calc(104%-1200px)] size-[2400px] lg:top-16 lg:left-[calc(104%-2000px)] lg:size-[4000px]"
      >
        <div
          className="absolute inset-0 rounded-full bg-night-800"
          style={{
            boxShadow:
              "0 -2px 30px 4px rgb(169 188 230 / 0.5), 0 0 160px 40px rgb(66 100 158 / 0.3)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-80"
          style={{
            backgroundImage: "url(/textures/earth.jpg)",
            backgroundSize: "1800px 900px",
            backgroundPosition: "-200px 20px",
            maskImage:
              "radial-gradient(closest-side, transparent 94%, black 99.6%)",
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-night-900 via-night-900/80 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-48 pb-10 lg:pt-72">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div>
            <p className="text-h1 font-extrabold tracking-[-0.02em] font-stretch-[75%] text-ink">Rocky Odyssey</p>
            <p className="mt-4 max-w-sm text-ink-soft">
              Explorador de análogos terrestres. Elige un lugar en el globo y compáralo con su gemelo.
            </p>
            <ButtonLink to="/#globo" className="mt-6">
              Volver al globo
            </ButtonLink>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            <FooterColumn title="Explorar" className="col-span-2 sm:col-span-1">
              {EXPLORE_LINKS.map((link) => (
                <FooterLink key={link.to} to={link.to}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>
            <FooterColumn title="Análogos de Marte">
              <SiteLinks sites={marsSites} />
            </FooterColumn>
            <FooterColumn title="Análogos lunares">
              <SiteLinks sites={moonSites} />
            </FooterColumn>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-ink/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-small text-ink-soft">
            © {YEAR} · NASA Space Apps Challenge · Datos provisionales
          </p>

          <div className="flex items-center gap-3">
            <p className="text-small text-ink-soft">Código y NASA en redes</p>
            <ul className="flex items-center gap-1">
              {SOCIALS.map(({ label, href, icon }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-ink/10 hover:text-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-[18px] fill-current"
                      aria-hidden
                    >
                      {icon}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <details className="group mt-6 text-small text-ink-soft">
          <summary className="w-fit cursor-pointer list-none transition-colors duration-200 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              Créditos de imágenes y texturas
              <svg
                viewBox="0 0 16 16"
                aria-hidden
                className="size-3.5 fill-none stroke-current stroke-[1.5] transition-transform duration-200 group-open:rotate-90"
              >
                <path
                  d="m6 3.5 4.5 4.5L6 12.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </summary>
          <ul className="credits-list mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {(credits as ImageCredit[]).map((c) => (
              <li key={c.path}>
                <a
                  href={c.source}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink"
                >
                  {c.title}
                </a>{" "}
                · {c.author} · {c.license}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </footer>
  );
}
