/**
 * Screen header with badge and title. Compact and utilitarian.
 */
export default function Header({ badge, title, subtitle, children }) {
  return (
    <div className="text-center py-1.5 border-b border-[var(--color-border)]">
      <span className="inline-block text-[0.6rem] font-bold tracking-[0.14em] uppercase text-[var(--color-accent)] bg-[var(--color-accent-muted)] px-2.5 py-0.5 rounded mb-1.5">
        {badge}
      </span>
      <h1 className="text-lg font-bold tracking-tight leading-tight">
        {children || title}
      </h1>
      {subtitle && (
        <p className="text-[0.7rem] text-[var(--color-text-muted)] mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
