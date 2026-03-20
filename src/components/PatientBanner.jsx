import { de } from "../i18n/de";

export default function PatientBanner({ description, label }) {
  const displayLabel = label ?? de.triage.patientLabel;

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] border-l-3 border-l-[var(--color-accent)] rounded-lg px-3 py-2">
      <p className="text-[0.55rem] font-bold tracking-[0.14em] uppercase text-[var(--color-accent)] mb-0.5">
        {displayLabel}
      </p>
      <p className="text-[0.82rem] leading-snug">{description}</p>
    </div>
  );
}
