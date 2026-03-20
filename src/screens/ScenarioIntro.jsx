import { de } from "../i18n/de";
import Header from "../components/Header";
import PatientBanner from "../components/PatientBanner";
import BarrierTape from "../components/BarrierTape";

export default function ScenarioIntro({ simulator }) {
  const { state, actions } = simulator;
  const t = de;

  const counterText = t.scenarioIntro.patientCounter
    .replace("{current}", state.scenarioIndex)
    .replace("{total}", state.totalScenarios);

  return (
    <>
      <Header badge={t.triage.headerTitle} title={counterText} />

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3">
        <PatientBanner
          description={state.scenario.description}
          label={t.scenarioIntro.missionLabel}
        />

        <BarrierTape />

        <div className="bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/15 rounded-lg px-3 py-2 text-[0.82rem] leading-snug text-[var(--color-text-muted)]">
          {t.scenarioIntro.info}
        </div>
      </div>

      <div className="sticky-actions">
        <button
          onClick={actions.beginScenario}
          className="w-full py-3.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
        >
          {t.scenarioIntro.button}
        </button>
      </div>
    </>
  );
}
