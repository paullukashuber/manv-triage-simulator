import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 flex flex-col gap-3 ${className}`}
      {...rest}
    />
  )
}
