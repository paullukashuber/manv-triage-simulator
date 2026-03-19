import { de } from "../i18n/de";

export default function ScenarioIntro({ simulator }) {
  const { state, actions } = simulator;
  const t = de;

  const counterText = t.scenarioIntro.patientCounter
    .replace("{current}", state.scenarioIndex)
    .replace("{total}", state.totalScenarios);

  return (
    <>
      <div className="text-center py-2 border-b border-[var(--color-border)]">
        <span className="inline-block text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
          {t.triage.headerTitle}
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">
          {counterText}
        </h1>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex-1 flex flex-col gap-4">
        <p className="text-[0.6rem] font-bold tracking-widest uppercase text-[var(--color-accent)]">
          {t.scenarioIntro.missionLabel}
        </p>
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-accent)] rounded-lg p-3 text-sm leading-relaxed">
          {state.scenario.description}
        </div>

        <div className="barrier-tape my-1" />

        <div className="bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20 rounded-xl p-3.5 text-sm leading-relaxed">
          {t.scenarioIntro.info}
        </div>

        <div className="flex-1" />

        <button
          onClick={actions.beginScenario}
          className="w-full py-4.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97] transition-transform cursor-pointer"
        >
          {t.scenarioIntro.button}
        </button>
      </div>
    </>
  );
}
