import { de } from "../i18n/de";

export default function BarrierTape({ showHint = false }) {
  const t = de.barrierTape;

  return (
    <>
      <div className="barrier-tape" />
      {showHint && (
        <div className="bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/15 rounded-lg px-3 py-2 text-[0.8rem] leading-snug">
          <strong className="text-[var(--color-accent)]">{t.title}</strong> –{" "}
          <span className="text-[var(--color-text-muted)]">{t.hint}</span>
        </div>
      )}
    </>
  );
}
