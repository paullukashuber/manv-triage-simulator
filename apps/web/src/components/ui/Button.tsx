import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'yes' | 'no' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg',
  secondary: 'bg-elevated text-text border border-border-light',
  yes: 'bg-correct text-white',
  no: 'bg-wrong text-white',
  danger: 'bg-sk1 text-white',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`w-full py-3.5 font-bold text-base rounded-lg active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}
