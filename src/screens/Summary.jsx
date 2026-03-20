import { de } from "../i18n/de";
import Header from "../components/Header";
import CategoryBadge from "../components/CategoryBadge";
import { truncate } from "../utils/helpers";

export default function Summary({ simulator }) {
  const {
    state,
    actions,
    correctCount,
    totalCompleted,
    scorePercent,
    categoryDistribution,
  } = simulator;
  const t = de;

  let rating;
  if (scorePercent === 100) rating = t.summary.ratings.perfect;
  else if (scorePercent >= 75) rating = t.summary.ratings.good;
  else if (scorePercent >= 50) rating = t.summary.ratings.okay;
  else rating = t.summary.ratings.needsPractice;

  return (
    <>
      <Header badge={t.summary.badge} title={t.summary.heading} />

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2.5">
        {/* Score */}
        <div className="text-center py-4 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)]">
          <p className="text-4xl font-bold text-[var(--color-accent)] leading-none tabular-nums">
            {correctCount}/{totalCompleted}
          </p>
          <p className="text-[0.7rem] text-[var(--color-text-dim)] mt-1">
            {t.summary.patientsCorrect} ({scorePercent}%)
          </p>
        </div>

        <p className="text-[0.82rem] text-center text-[var(--color-text-muted)]">
          {rating}
        </p>

        {/* Distribution */}
        <div className="bg-[var(--color-accent-muted)] border border-[var(--color-accent)]/15 rounded-lg px-3 py-2 text-[0.8rem]">
          <strong className="text-[var(--color-accent)]">
            {t.summary.distributionLabel}:
          </strong>{" "}
          <span className="text-[var(--color-text-muted)]">
            SK 1: {categoryDistribution.red} · SK 2:{" "}
            {categoryDistribution.yellow} · Weiß: {categoryDistribution.white} ·
            Tot: {categoryDistribution.dead}
          </span>
        </div>

        {/* Detail */}
        <p className="text-[0.65rem] font-bold text-[var(--color-text-dim)] uppercase tracking-[0.12em]">
          {t.summary.detailHeading}
        </p>

        <div className="flex flex-col gap-1.5">
          {state.results.map((r, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border-l-3 text-[0.8rem] leading-snug ${
                r.isCorrect
                  ? "border-l-[var(--color-correct)]"
                  : "border-l-[var(--color-wrong)]"
              }`}
            >
              <p className="font-medium">
                {r.isCorrect ? "✓" : "✗"} {t.summary.patientPrefix} {i + 1}:{" "}
                {truncate(r.scenario.description)}
              </p>
              <p className="text-[var(--color-text-dim)] mt-0.5 flex items-center gap-1 flex-wrap">
                {t.summary.correctLabel}:{" "}
                <CategoryBadge categoryId={r.correctCategory} small />
                {!r.isCorrect && (
                  <>
                    {" · "}
                    {t.summary.yourAnswerLabel}:{" "}
                    <CategoryBadge categoryId={r.userCategory} small />
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky-actions">
        <div className="flex gap-2.5">
          <button
            onClick={actions.startTraining}
            className="flex-1 py-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold rounded-lg active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.summary.retryButton}
          </button>
          <button
            onClick={actions.reset}
            className="flex-1 py-3 bg-[var(--color-bg-surface)] text-[var(--color-text)] font-bold rounded-lg border border-[var(--color-border)] active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.summary.homeButton}
          </button>
        </div>
      </div>
    </>
  );
}
