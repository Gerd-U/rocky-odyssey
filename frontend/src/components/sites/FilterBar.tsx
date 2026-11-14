import type { Target } from "../../types/site";

export type TargetFilter = Target | "all";
export type SortKey = "similarity" | "name";

export interface Filters {
  query: string;
  target: TargetFilter;
  sort: SortKey;
}

interface FilterBarProps {
  value: Filters;
  onChange: (next: Filters) => void;
}

const fieldClass =
  "rounded-lg bg-panel px-3 py-2 text-sm text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-accent";

export default function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Buscar por nombre o país"
        aria-label="Buscar"
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        className={`${fieldClass} min-w-56 flex-1`}
      />
      <select
        aria-label="Destino"
        value={value.target}
        onChange={(e) => onChange({ ...value, target: e.target.value as TargetFilter })}
        className={fieldClass}
      >
        <option value="all">Luna y Marte</option>
        <option value="moon">Luna</option>
        <option value="mars">Marte</option>
      </select>
      <select
        aria-label="Ordenar"
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
        className={fieldClass}
      >
        <option value="similarity">Más similares</option>
        <option value="name">Nombre</option>
      </select>
    </div>
  );
}
