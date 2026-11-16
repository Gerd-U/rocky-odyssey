import { useTranslation } from "react-i18next";
import { SIMILARITY_LEVELS } from "../../lib/similarity";
import type { Target } from "../../types/site";
import { LEVEL_COLOR, RELATED_COLOR, SELECTED_COLOR } from "./colors";

export default function Legend({ mode }: { mode: Target }) {
  const { t } = useTranslation();

  return (
    <ul aria-label={t("home.globe.legendLabel")} className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
      {SIMILARITY_LEVELS.map((level) => (
        <li key={level.id} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: LEVEL_COLOR[mode][level.id] }} />
          {t(`home.globe.legendLevel.${level.id}`)}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: SELECTED_COLOR }} />
        {t("home.globe.selected")}
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: RELATED_COLOR }} />
        {t("home.globe.sameBase")}
      </li>
    </ul>
  );
}
