import { STEPS, type StepKey } from '@manv/triage'

type BadgeType = (typeof STEPS)[number]['badge']

const LETTERS: Record<BadgeType, string> = {
  x: 'X',
  walk: '🚶',
  dead: '✝',
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
}

const STYLES: Record<BadgeType, string> = {
  x: 'bg-sk1 text-white',
  a: 'bg-sk1 text-white',
  b: 'bg-[#d97706] text-white',
  c: 'bg-[#9333ea] text-white',
  d: 'bg-[#6d28d9] text-white',
  walk: 'bg-elevated text-accent',
  dead: 'bg-dead text-white',
}

export function StepBadge({ stepKey }: { stepKey: StepKey }) {
  const step = STEPS.find((s) => s.key === stepKey)
  if (!step) return null
  const isEmoji = step.badge === 'walk' || step.badge === 'dead'
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${STYLES[step.badge]} ${
        isEmoji ? 'text-base leading-none' : 'text-xs font-bold'
      }`}
    >
      {LETTERS[step.badge]}
    </div>
  )
}
