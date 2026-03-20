import { de } from "../i18n/de";

export default function ErrorList({ errors }) {
  const t = de;

  if (!errors || errors.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.65rem] font-bold text-[var(--color-text-dim)] uppercase tracking-[0.12em]">
        {t.result.errorsHeading}
      </p>
      {errors.map((err) => (
        <div
          key={err.key}
          className="px-2.5 py-1.5 rounded bg-[var(--color-wrong)]/6 border border-[var(--color-wrong)]/15 text-[0.8rem]"
        >
          <p className="font-medium">
            {t.steps[err.key]?.question ?? err.key}
          </p>
          <p className="text-[var(--color-text-muted)] text-[0.72rem] mt-px">
            {t.result.errorYourAnswer}:{" "}
            {err.userAnswer ? t.triage.yes : t.triage.no}
            {" · "}
            {t.result.errorCorrectAnswer}:{" "}
            {err.correctAnswer ? t.triage.yes : t.triage.no}
          </p>
        </div>
      ))}
    </div>
  );
}
