import { de } from "../i18n/de";
import Header from "../components/Header";
import PatientBanner from "../components/PatientBanner";
import FeedbackBanner from "../components/FeedbackBanner";
import CategoryBadge from "../components/CategoryBadge";
import BarrierTape from "../components/BarrierTape";
import ErrorList from "../components/ErrorList";

export default function ScenarioResult({ simulator }) {
  const { state, actions, currentResult, hasMoreScenarios } = simulator;
  const t = de;

  if (!currentResult) return null;

  const { isCorrect, userCategory, correctCategory, errors, scenario } =
    currentResult;

  return (
    <>
      <Header
        badge={`${t.triage.patientLabel} ${state.scenarioIndex}/${state.totalScenarios}`}
      >
        <span className="text-base">{t.result.headerTitle}</span>
      </Header>

      <PatientBanner description={scenario.description} />

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2.5">
        <FeedbackBanner isCorrect={isCorrect} />

        <div className={`flex items-center justify-center gap-4`}>
          <div className="text-center">
            <p className="text-[0.65rem] text-[var(--color-text-dim)] mb-1">
              {t.result.yourCategory}
            </p>
            <CategoryBadge categoryId={userCategory} />
          </div>
          {!isCorrect && (
            <>
              <span className="text-[var(--color-text-dim)] text-lg">→</span>
              <div className="text-center">
                <p className="text-[0.65rem] text-[var(--color-text-dim)] mb-1">
                  {t.result.correctCategory}
                </p>
                <CategoryBadge categoryId={correctCategory} />
              </div>
            </>
          )}
        </div>

        <BarrierTape showHint />

        <div className="text-[0.82rem] leading-snug">
          <strong className="text-[var(--color-text)]">
            {t.result.reasoning}:
          </strong>{" "}
          <span className="text-[var(--color-text-muted)]">
            {scenario.reasoning}
          </span>
        </div>

        <ErrorList errors={errors} />
      </div>

      <div className="sticky-actions">
        <button
          onClick={actions.nextScenario}
          className="w-full py-3.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
        >
          {hasMoreScenarios ? t.result.nextPatient : t.result.toSummary}
        </button>
      </div>
    </>
  );
}
