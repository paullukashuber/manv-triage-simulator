import { de } from "../i18n/de";
import { CATEGORIES } from "../utils/constants";
import { truncate } from "../utils/helpers";

function CategoryBadge({ categoryId, small = false }) {
  const cat = CATEGORIES[categoryId];
  const label = de.categories[categoryId]?.short ?? categoryId;
  const sizeClasses = small ? "text-[0.7rem] px-2 py-0.5" : "text-base px-4.5 py-1.5";

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

  // Rating message
  let rating;
  if (scorePercent === 100) rating = t.summary.ratings.perfect;
  else if (scorePercent >= 75) rating = t.summary.ratings.good;
  else if (scorePercent >= 50) rating = t.summary.ratings.okay;
  else rating = t.summary.ratings.needsPractice;

  return (
    <>
      {/* Header */}
      <div className="text-center py-2 border-b border-[var(--color-border)]">
        <span className="inline-block text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-full mb-2">
          {t.summary.badge}
        </span>
        <h1 className="text-xl font-extrabold tracking-tight">
          {t.summary.heading}
        </h1>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex-1 flex flex-col gap-3">
        {/* Score */}
        <div className="text-center p-5 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)]">
          <p className="text-5xl font-extrabold text-[var(--color-accent)] leading-none">
            {correctCount}/{totalCompleted}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t.summary.patientsCorrect} ({scorePercent}%)
          </p>
        </div>

        {/* Rating */}
        <p className="text-sm text-center leading-relaxed">{rating}</p>

        {/* Category Distribution */}
        <div className="bg-[var(--color-accent)]/8 border border-[var(--color-accent)]/20 rounded-xl p-3.5 text-sm">
          <strong className="text-[var(--color-accent)]">
            {t.summary.distributionLabel}:
          </strong>
          <br />
          SK 1: {categoryDistribution.red} · SK 2: {categoryDistribution.yellow} · Weiß: {categoryDistribution.white} · Tot: {categoryDistribution.dead}
        </div>

        {/* Detail List */}
        <p className="text-[0.75rem] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
          {t.summary.detailHeading}
        </p>

        {state.results.map((r, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg bg-[var(--color-bg-surface)] border-l-4 text-sm leading-snug ${
              r.isCorrect
                ? "border-l-[var(--color-correct)]"
                : "border-l-[var(--color-wrong)]"
            }`}
          >
            <p className="font-bold">
              {r.isCorrect ? "✓" : "✗"} {t.summary.patientPrefix} {i + 1}:{" "}
              {truncate(r.scenario.description)}
            </p>
            <p className="text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5 flex-wrap">
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

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={actions.startTraining}
            className="flex-1 py-4 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold rounded-xl shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.summary.retryButton}
          </button>
          <button
            onClick={actions.reset}
            className="flex-1 py-4 bg-[var(--color-bg-surface)] text-[var(--color-text)] font-bold rounded-xl border border-[var(--color-border)] active:scale-[0.97] transition-transform cursor-pointer"
          >
            {t.summary.homeButton}
          </button>
        </div>
      </div>
    </>
  );
}
