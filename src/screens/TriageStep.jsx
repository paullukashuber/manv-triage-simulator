import { de } from "../i18n/de";
import { BADGE_STYLES } from "../utils/constants";

export default function TriageStep({ simulator }) {
  const { state, actions, currentStep, totalSteps } = simulator;
  const t = de;

  if (!currentStep) return null;

  const stepText = t.steps[currentStep.key];
  const badge = BADGE_STYLES[currentStep.badgeType] || BADGE_STYLES.info;
  const progressPercent = ((state.stepIndex + 1) / totalSteps) * 100;

  const progressLabel = t.triage.stepProgress
    .replace("{current}", state.stepIndex + 1)
    .replace("{total}", totalSteps);

  return (
    <>
      {/* Header */}
      <div className="text-center py-2 border-b border-[var(--color-border)]">
        <span className="inline-block text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
          {t.triage.patientLabel} {state.scenarioIndex}/{state.totalScenarios}
        </span>
        <h1 className="text-base font-extrabold">{t.triage.headerTitle}</h1>
      </div>

      {/* Patient Banner – always visible */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-accent)] rounded-lg p-3">
        <p className="text-[0.6rem] font-bold tracking-widest uppercase text-[var(--color-accent)] mb-1">
          {t.triage.patientLabel}
        </p>
        <p className="text-sm leading-relaxed">{state.scenario.description}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-muted)]">
        <span>{progressLabel}</span>
        <div className="flex-1 h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${badge.bg} ${badge.text}`}
          >
            {currentStep.badgeLabel}
          </div>
          <div>
            <p className="text-lg font-bold leading-snug">
              {stepText?.question}
            </p>
            {stepText?.hint && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed whitespace-pre-line">
                {stepText.hint}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Ja / Nein Buttons */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={() => actions.answer(true)}
            className="flex-1 py-4 bg-[var(--color-correct)] text-white font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-correct)]/30 active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.triage.yes}
          </button>
          <button
            onClick={() => actions.answer(false)}
            className="flex-1 py-4 bg-[var(--color-wrong)] text-white font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-wrong)]/30 active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.triage.no}
          </button>
        </div>
      </div>
    </>
  );
}
