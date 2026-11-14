import { SIMILARITY_LEVELS } from "../../lib/similarity";
import type { Target } from "../../types/site";
import { LEVEL_COLOR, SELECTED_COLOR } from "./colors";

export default function Legend({ mode }: { mode: Target }) {
  return (
    <ul aria-label="Leyenda del globo" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
      {SIMILARITY_LEVELS.map((level) => (
        <li key={level.id} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: LEVEL_COLOR[mode][level.id] }} />
          Similitud {level.label.toLowerCase()}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: SELECTED_COLOR }} />
        Seleccionado
      </li>
    </ul>
  );
}
