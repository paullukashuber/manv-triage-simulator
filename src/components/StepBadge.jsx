import { BADGE_STYLES } from "../utils/constants";

export default function StepBadge({ type, label }) {
  const style = BADGE_STYLES[type] || BADGE_STYLES.walk;
  const isEmoji = type === "walk" || type === "dead";

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.text} ${
        isEmoji ? "text-base leading-none" : "text-xs font-bold"
      }`}
    >
      {label}
    </div>
  );
}