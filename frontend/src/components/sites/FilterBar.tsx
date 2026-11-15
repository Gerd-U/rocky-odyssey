import { motion, useReducedMotion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { bodyLabel } from "../../lib/format";
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

interface ChipGroupProps<T extends string> {
  label: string;
  /** Opciones que no son un destino: su indicador va en tono neutro y no con el color del modo */
  neutral?: (value: T) => boolean;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Grupo de opciones excluyentes en píldora, con indicador que se desliza y flechas del teclado. */
function ChipGroup<T extends string>({ label, options, value, onChange, neutral = () => false }: ChipGroupProps<T>) {
  const indicatorId = useId();
  const reduceMotion = useReducedMotion();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const current = options.findIndex((o) => o.value === value);
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    buttonsRef.current[next]?.focus();
  };

  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="text-small text-ink-soft">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inline-flex rounded-full bg-night-800 p-1 ring-1 ring-ink/10"
      >
        {options.map((option, i) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={`relative h-9 rounded-full px-4 text-sm font-semibold transition-colors duration-200 active:scale-[0.97] ${
                active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={indicatorId}
                  className={`absolute inset-0 rounded-full ${neutral(option.value) ? "bg-ink/15" : "bg-accent"}`}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar({ value, onChange }: FilterBarProps) {
  const { t } = useTranslation();

  const targetOptions: { value: TargetFilter; label: string }[] = [
    { value: "all", label: t("locations.filters.all") },
    { value: "moon", label: bodyLabel("moon") },
    { value: "mars", label: bodyLabel("mars") },
  ];

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "similarity", label: t("locations.filters.mostSimilar") },
    { value: "name", label: t("locations.filters.az") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-60 flex-1">
        <span className="sr-only">{t("locations.filters.search")}</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 fill-none stroke-ink-soft stroke-[1.75]"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13.2 13.2 3.3 3.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder={t("locations.filters.search")}
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          className="h-11 w-full rounded-full bg-ink/10 pr-4 pl-11 text-sm text-ink placeholder:text-ink-soft transition-colors duration-200 hover:bg-ink/15 focus:bg-ink/15 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent-soft"
        />
      </label>
      <ChipGroup
        label={t("locations.filters.target")}
        options={targetOptions}
        value={value.target}
        onChange={(target) => onChange({ ...value, target })}
        neutral={(target) => target === "all"}
      />
      <ChipGroup
        label={t("locations.filters.sort")}
        options={sortOptions}
        value={value.sort}
        onChange={(sort) => onChange({ ...value, sort })}
        neutral={() => true}
      />
    </div>
  );
}
