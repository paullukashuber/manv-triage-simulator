import { de } from "../i18n/de";

export default function FeedbackBanner({ isCorrect }) {
  const t = de.result;

  return (
    <div
      className={`rounded-lg px-4 py-3 text-center font-bold text-base border ${
        isCorrect
          ? "bg-[var(--color-correct)]/10 text-[var(--color-correct)] border-[var(--color-correct)]/40"
          : "bg-[var(--color-wrong)]/10 text-[var(--color-wrong)] border-[var(--color-wrong)]/40"
      }`}
    >
      {isCorrect ? t.correct : t.wrong}
    </div>
  );
}
