import type { ReactNode } from 'react'

type HeaderProps = { badge?: string; title?: string; subtitle?: string; children?: ReactNode }

export function Header({ badge, title, subtitle, children }: HeaderProps) {
  return (
    <div className="text-center py-1.5 border-b border-border">
      {badge && (
        <span className="inline-block text-[0.6rem] font-bold tracking-[0.14em] uppercase text-accent bg-accent-muted px-2.5 py-0.5 rounded mb-1.5">
          {badge}
        </span>
      )}
      <h1 className="text-lg font-bold tracking-tight leading-tight">{children ?? title}</h1>
      {subtitle && <p className="text-[0.7rem] text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}
