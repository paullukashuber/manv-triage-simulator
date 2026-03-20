import { BADGE_STYLES } from "../utils/constants";

export default function StepBadge({ type, label }) {
  const style = BADGE_STYLES[type] || BADGE_STYLES.info;

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${style.bg} ${style.text}`}
    >
      {label}
    </div>
  );
}
