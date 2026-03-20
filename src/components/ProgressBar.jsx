import { de } from "../i18n/de";

export default function ProgressBar({ current, total }) {
  const percent = (current / total) * 100;
  const label = de.triage.stepProgress
    .replace("{current}", current)
    .replace("{total}", total);

  return (
    <div className="flex items-center gap-2 text-[0.7rem] text-[var(--color-text-dim)]">
      <span className="font-medium tabular-nums">{label}</span>
      <div className="flex-1 h-1 bg-[var(--color-bg-surface)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
