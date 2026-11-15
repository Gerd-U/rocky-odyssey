import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";

export interface CompareSide {
  src: string;
  alt: string;
  label: string;
  caption: string;
}

interface CompareSliderProps {
  earth: CompareSide;
  target: CompareSide;
  className?: string;
}

const STEP = 5;

const KEY_MOVES: Record<string, (position: number) => number> = {
  ArrowLeft: (p) => p - STEP,
  ArrowDown: (p) => p - STEP,
  ArrowRight: (p) => p + STEP,
  ArrowUp: (p) => p + STEP,
  Home: () => 0,
  End: () => 100,
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export default function CompareSlider({ earth, target, className = "" }: CompareSliderProps) {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);

  const moveTo = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const onHandle = (e.target as HTMLElement).closest("[data-handle]") !== null;
    if (e.pointerType !== "mouse" && !onHandle) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setTouched(true);
    moveTo(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) moveTo(e.clientX);
  };

  const stopDragging = () => setDragging(false);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = KEY_MOVES[e.key];
    if (!move) return;
    e.preventDefault();
    setTouched(true);
    setPosition((p) => clamp(move(p)));
  };

  const shown = Math.round(position);

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      className={`relative touch-pan-y overflow-hidden bg-night-800 select-none ${
        dragging ? "cursor-grabbing" : "cursor-ew-resize"
      } ${className}`}
    >
      <img
        src={earth.src}
        alt={earth.alt}
        draggable={false}
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={target.src}
        alt={target.alt}
        draggable={false}
        fetchPriority="high"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        className="absolute inset-0 size-full object-cover"
      />

      <SideLabel side={earth} align="left" visible={position > 22} />
      <SideLabel side={target} align="right" visible={position < 78} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: `translateX(${position - 50}%)` }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            data-handle
            role="slider"
            tabIndex={0}
            aria-label={t("compare.sliderLabel")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={shown}
            aria-valuetext={t("compare.sliderValue", {
              earth: earth.label,
              earthPercent: shown,
              target: target.label,
              targetPercent: 100 - shown,
            })}
            onKeyDown={onKeyDown}
            className={`pointer-events-auto grid size-14 cursor-grab touch-none place-items-center rounded-full border-2 border-ink bg-violet text-ink transition-transform duration-150 ease-out-strong active:scale-95 ${
              dragging ? "scale-95" : ""
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p
            aria-hidden={touched}
            className={`absolute top-full left-1/2 mt-3 -translate-x-1/2 bg-night-900/85 px-3 py-1.5 text-sm whitespace-nowrap text-ink transition-opacity duration-200 ease-out-strong ${
              touched ? "opacity-0" : "opacity-100"
            }`}
          >
            {t("compare.dragHint")}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SideLabelProps {
  side: CompareSide;
  align: "left" | "right";
  visible: boolean;
}

function SideLabel({ side, align, visible }: SideLabelProps) {
  return (
    <div
      className={`pointer-events-none absolute top-5 max-w-[45%] bg-night-900/85 px-3 py-2 transition-opacity duration-200 ${
        align === "left" ? "left-5" : "right-5 text-right"
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <p className="text-sm font-semibold text-ink">{side.label}</p>
      <p className="hidden text-small text-ink-soft sm:block">{side.caption}</p>
    </div>
  );
}