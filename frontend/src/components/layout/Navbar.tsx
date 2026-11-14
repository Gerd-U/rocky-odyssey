import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? "text-accent" : "text-slate-300 hover:text-white"}`;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-space/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="font-semibold tracking-wide text-white">
          Rocky <span className="text-accent">Odyssey</span>
        </NavLink>
        <div className="flex gap-6">
          <NavLink to="/" end className={linkClass}>
            Inicio
          </NavLink>
          <NavLink to="/ubicaciones" className={linkClass}>
            Ubicaciones
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
