import type { Target } from "../../types/site";
import { SITE_COLOR } from "./colors";

export default function Legend({ mode }: { mode: Target }) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-slate-400">
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: SITE_COLOR[mode] }} />
        Análogo de {mode === "mars" ? "Marte" : "la Luna"}
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-white" />
        Seleccionado
      </li>
    </ul>
  );
}
