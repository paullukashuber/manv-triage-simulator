import { de } from "../i18n/de";
import Header from "../components/Header";
import PatientBanner from "../components/PatientBanner";
import ProgressBar from "../components/ProgressBar";
import StepBadge from "../components/StepBadge";

export default function TriageStep({ simulator }) {
  const { state, actions, currentStep, totalSteps } = simulator;
  const t = de;

  if (!currentStep) return null;

  const stepText = t.steps[currentStep.key];

  return (
    <>
      <Header
        badge={`${t.triage.patientLabel} ${state.scenarioIndex}/${state.totalScenarios}`}
      >
        <span className="text-base">{t.triage.headerTitle}</span>
      </Header>

      <PatientBanner description={state.scenario.description} />

      <ProgressBar current={state.stepIndex + 1} total={totalSteps} />

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <StepBadge type={currentStep.badgeType} label={currentStep.badgeLabel} />
          <div className="min-w-0">
            <p className="text-base font-bold leading-snug">
              {stepText?.question}
            </p>
            {stepText?.hint && (
              <p className="text-[0.78rem] text-[var(--color-text-muted)] mt-1 leading-snug whitespace-pre-line">
                {stepText.hint}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky-actions">
        <div className="flex gap-2.5">
          <button
            onClick={() => actions.answer(true)}
            className="flex-1 py-3.5 bg-[var(--color-correct)] text-white font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.triage.yes}
          </button>
          <button
            onClick={() => actions.answer(false)}
            className="flex-1 py-3.5 bg-[var(--color-wrong)] text-white font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.triage.no}
          </button>
        </div>
      </div>
    </>
  );
}
