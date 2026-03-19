import { de } from "../i18n/de";

export default function StartScreen({ simulator }) {
  const { actions } = simulator;
  const t = de;

  return (
    <>
      <div className="text-center py-2 border-b border-[var(--color-border)]">
        <span className="inline-block text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
          {t.app.badge}
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">
          ManV <span className="text-[var(--color-sk1)]">Triage</span> Simulator
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {t.app.subtitle}
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex-1 flex flex-col gap-4">
        <div className="bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20 rounded-xl p-3.5 text-sm leading-relaxed">
          <strong className="text-[var(--color-accent)]">{t.start.heading}</strong>
          <br />
          {t.start.description}
        </div>

        <div className="barrier-tape my-1" />

        <div className="flex flex-col gap-2.5">
          {t.start.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={actions.startTraining}
          className="w-full py-4.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97] transition-transform cursor-pointer"
        >
          {t.start.button}
        </button>

        <p className="text-center text-[var(--color-text-muted)] text-xs">
          {t.app.version}
        </p>
      </div>
    </>
  );
}
