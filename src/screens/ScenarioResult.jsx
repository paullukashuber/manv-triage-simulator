import { de } from "../i18n/de";
import { CATEGORIES } from "../utils/constants";

function CategoryBadge({ categoryId, small = false }) {
  const cat = CATEGORIES[categoryId];
  const label = de.categories[categoryId]?.short ?? categoryId;
  const sizeClasses = small ? "text-xs px-2 py-0.5" : "text-base px-4.5 py-1.5";

  return (
    <span
      className={`inline-block font-extrabold tracking-wide rounded-md ${sizeClasses}`}
      style={{
        backgroundColor: cat?.color,
        color: cat?.textColor,
        border: cat?.border ? `2px solid ${cat.border}` : undefined,
      }}
    >
      {label}
    </span>
  );
}

export default function ScenarioResult({ simulator }) {
  const { state, actions, currentResult, hasMoreScenarios } = simulator;
  const t = de;

  if (!currentResult) return null;

  const { isCorrect, userCategory, correctCategory, errors, scenario } = currentResult;

  return (
    <>
      {/* Header */}
      <div className="text-center py-2 border-b border-[var(--color-border)]">
        <span className="inline-block text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
          {t.triage.patientLabel} {state.scenarioIndex}/{state.totalScenarios}
        </span>
        <h1 className="text-base font-extrabold">{t.result.headerTitle}</h1>
      </div>

      {/* Patient Banner */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-accent)] rounded-lg p-3">
        <p className="text-[0.6rem] font-bold tracking-widest uppercase text-[var(--color-accent)] mb-1">
          {t.triage.patientLabel}
        </p>
        <p className="text-sm leading-relaxed">{scenario.description}</p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex-1 flex flex-col gap-3">
        {/* Correct / Wrong Banner */}
        <div
          className={`rounded-xl p-4 text-center font-extrabold text-xl ${
            isCorrect
              ? "bg-[var(--color-correct)]/15 text-[var(--color-correct)] border-2 border-[var(--color-correct)]"
              : "bg-[var(--color-wrong)]/15 text-[var(--color-wrong)] border-2 border-[var(--color-wrong)]"
          }`}
        >
          {isCorrect ? t.result.correct : t.result.wrong}
        </div>

        {/* User Category */}
        <div className="text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            {t.result.yourCategory}
          </p>
          <CategoryBadge categoryId={userCategory} />
        </div>

        {/* Correct Category (only if wrong) */}
        {!isCorrect && (
          <div className="text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              {t.result.correctCategory}
            </p>
            <CategoryBadge categoryId={correctCategory} />
          </div>
        )}

        {/* Barrier Tape + Hint */}
        <div className="barrier-tape my-1" />
        <div className="bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20 rounded-xl p-3.5 text-sm leading-relaxed">
          <strong className="text-[var(--color-accent)]">
            {t.barrierTape.title}
          </strong>{" "}
          – {t.barrierTape.hint}
        </div>

        {/* Reasoning */}
        <div className="text-sm leading-relaxed">
          <strong className="text-white">{t.result.reasoning}:</strong>{" "}
          {scenario.reasoning}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <>
            <p className="text-[0.75rem] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
              {t.result.errorsHeading}
            </p>
            {errors.map((err) => (
              <div
                key={err.key}
                className="p-2.5 rounded-md bg-[var(--color-wrong)]/8 border border-[var(--color-wrong)]/20 text-sm"
              >
                <p className="font-semibold">
                  {de.steps[err.key]?.question ?? err.key}
                </p>
                <p className="text-[var(--color-text-muted)] mt-0.5 text-xs">
                  {t.result.errorYourAnswer}: {err.userAnswer ? t.triage.yes : t.triage.no}
                  {" · "}
                  {t.result.errorCorrectAnswer}: {err.correctAnswer ? t.triage.yes : t.triage.no}
                </p>
              </div>
            ))}
          </>
        )}

        <div className="flex-1" />

        {/* Next */}
        <button
          onClick={actions.nextScenario}
          className="w-full py-4 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97] transition-transform cursor-pointer"
        >
          {hasMoreScenarios ? t.result.nextPatient : t.result.toSummary}
        </button>
      </div>
    </>
  );
}
