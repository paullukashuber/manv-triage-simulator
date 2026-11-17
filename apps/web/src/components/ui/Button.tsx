import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'yes' | 'no' | 'danger'
export type ButtonSize = 'md' | 'sm'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg',
  secondary: 'bg-elevated text-text border border-border-light',
  yes: 'bg-correct text-white',
  no: 'bg-wrong text-white',
  danger: 'bg-sk1 text-white',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'w-full py-3.5 text-base',
  sm: 'px-3 py-2 text-[0.85rem]',
}

type ButtonProps = ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`font-bold rounded-lg active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}
