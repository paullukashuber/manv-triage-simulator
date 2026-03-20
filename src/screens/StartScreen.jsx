import { de } from "../i18n/de";
import Header from "../components/Header";
import BarrierTape from "../components/BarrierTape";

export default function StartScreen({ simulator }) {
  const { actions } = simulator;
  const t = de;

  return (
    <>
      <Header badge={t.app.badge} subtitle={t.app.subtitle}>
        ManV <span className="text-[var(--color-sk1)]">Triage</span> Simulator
      </Header>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3">
        <div className="bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/15 rounded-lg px-3 py-2.5 text-[0.82rem] leading-snug">
          <strong className="text-[var(--color-accent)]">
            {t.start.heading}
          </strong>
          <br />
          <span className="text-[var(--color-text-muted)]">
            {t.start.description}
          </span>
        </div>

        <BarrierTape />

        <div className="flex flex-col gap-1.5">
          {t.start.features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[0.82rem] text-[var(--color-text-muted)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[var(--color-text-dim)] text-[0.65rem]">
        {t.app.version}
      </p>

      <div className="sticky-actions">
        <button
          onClick={actions.startTraining}
          className="w-full py-3.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
        >
          {t.start.button}
        </button>
      </div>
    </>
  );
}
