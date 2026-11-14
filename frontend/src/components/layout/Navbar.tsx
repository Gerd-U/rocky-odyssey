import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `h-9 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
    isActive
      ? "bg-ink/10 text-ink"
      : "text-ink-soft hover:bg-ink/5 hover:text-ink"
  }`;

export default function Navbar() {
  return (
    <header className="sticky top-3 z-30 px-3 sm:top-4 sm:px-6">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-14 max-w-4xl items-center gap-2 rounded-full bg-night-900/75 pr-2 pl-5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-ink/10 backdrop-blur-md sm:pl-6"
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
            Inicio
          </NavLink>
          <NavLink to="/ubicaciones" className={(s) => `${linkClass(s)} inline-flex`}>
            Ubicaciones
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
