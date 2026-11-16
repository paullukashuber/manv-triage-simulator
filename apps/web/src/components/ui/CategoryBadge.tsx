import type { Category } from '@manv/triage'
import { useTranslation } from 'react-i18next'

const STYLES: Record<Category, string> = {
  red: 'bg-sk1 text-white',
  yellow: 'bg-sk2 text-black',
  white: 'bg-white-tag text-[#333333] border-2 border-[#aaaaaa]',
  dead: 'bg-dead text-white',
}

type CategoryBadgeProps = { category: Category; size?: 'sm' | 'md' }

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const { t } = useTranslation()
  const sizeClass = size === 'sm' ? 'text-[0.65rem] px-1.5 py-px' : 'text-sm px-3.5 py-1'
  return (
    <span className={`inline-block font-bold tracking-wide rounded ${sizeClass} ${STYLES[category]}`}>
      {t(`categories.${category}.short`)}
    </span>
  )
}
