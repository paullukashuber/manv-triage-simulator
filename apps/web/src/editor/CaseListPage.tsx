import { CASE_STATUSES, caseFilterSchema, CATEGORIES, STEP_KEYS, type CaseFilter, type CaseSummary } from '@manv/triage'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { Card } from '../components/ui/Card.tsx'
import { CategoryBadge } from '../components/ui/CategoryBadge.tsx'
import { useCaseList } from './api.ts'
import { CaseStatusChip, UnpublishedChangesChip } from './CaseStatusChip.tsx'

const FILTER_KEYS = ['status', 'category', 'decisiveStep', 'tag', 'q'] as const
type FilterKey = (typeof FILTER_KEYS)[number]

const INPUT_CLASS =
  'w-full bg-surface border border-border-light rounded-lg px-3 py-2 text-[0.88rem] text-text focus:outline-2 focus:outline-accent'
const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' })

/** Reads the filter from the URL; each param is validated on its own, invalid ones are ignored. */
function parseFilter(params: URLSearchParams): CaseFilter {
  const valid = FILTER_KEYS.flatMap((key) => {
    const raw = params.get(key)
    return raw !== null && caseFilterSchema.shape[key].safeParse(raw).success ? [[key, raw] as const] : []
  })
  return caseFilterSchema.parse(Object.fromEntries(valid))
}

export function CaseListPage() {
  const { t } = useTranslation()
  const id = useId()
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params)
  const cases = useCaseList(filter)
  const hasFilter = FILTER_KEYS.some((key) => params.has(key))

  function setParam(key: FilterKey, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-muted" aria-live="polite">
          {cases.data && t('editor.list.count', { count: cases.data.length })}
        </p>
        <Link
          to="/editor/cases/new"
          className="rounded-lg bg-accent px-4 py-2 text-[0.88rem] font-bold text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('editor.list.newCase')}
        </Link>
      </div>

      <Card>
        <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <legend className="sr-only">{t('editor.list.filters')}</legend>
          <SelectFilter
            id={`${id}-status`}
            label={t('editor.list.status')}
            value={filter.status ?? ''}
            options={CASE_STATUSES.map((status) => [status, t(`editor.status.${status}`)])}
            onChange={(value) => setParam('status', value)}
          />
          <SelectFilter
            id={`${id}-category`}
            label={t('editor.list.category')}
            value={filter.category ?? ''}
            options={CATEGORIES.map((category) => [category, t(`categories.${category}.short`)])}
            onChange={(value) => setParam('category', value)}
          />
          <SelectFilter
            id={`${id}-step`}
            label={t('editor.list.decisiveStep')}
            value={filter.decisiveStep ?? ''}
            options={[
              ...STEP_KEYS.map((key) => [key, t(`editor.stepNames.${key}`)] as const),
              ['none', t('editor.noDecisiveStep')] as const,
            ]}
            onChange={(value) => setParam('decisiveStep', value)}
          />
          <TextFilter
            id={`${id}-tag`}
            label={t('editor.list.tag')}
            value={params.get('tag') ?? ''}
            onChange={(value) => setParam('tag', value)}
          />
          <TextFilter
            id={`${id}-q`}
            label={t('editor.list.search')}
            placeholder={t('editor.list.searchPlaceholder')}
            value={params.get('q') ?? ''}
            onChange={(value) => setParam('q', value)}
          />
        </fieldset>
        {hasFilter && (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="self-start text-[0.82rem] text-accent underline cursor-pointer"
          >
            {t('editor.list.resetFilters')}
          </button>
        )}
      </Card>

      {cases.isPending && (
        <p role="status" className="text-[0.82rem] text-muted">
          {t('editor.list.loading')}
        </p>
      )}
      {cases.isError && (
        <p role="alert" className="text-[0.82rem] text-wrong">
          {t('editor.list.loadError')}
        </p>
      )}
      {cases.data?.length === 0 && <p className="text-[0.82rem] text-muted">{t('editor.list.empty')}</p>}
      {cases.data && cases.data.length > 0 && (
        <ul className={`flex flex-col gap-2 ${cases.isPlaceholderData ? 'opacity-60' : ''}`}>
          {cases.data.map((summary) => (
            <CaseListItem key={summary.id} summary={summary} onTagClick={(tag) => setParam('tag', tag)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SelectFilter({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: readonly (readonly [string, string])[]
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.75rem] font-bold text-muted">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS}>
        <option value="">{t('editor.list.all')}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextFilter({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.75rem] font-bold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
    </div>
  )
}

function CaseListItem({ summary, onTagClick }: { summary: CaseSummary; onTagClick: (tag: string) => void }) {
  const { t } = useTranslation()
  const mismatch = summary.expectedCategory !== summary.computedCategory
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 hover:border-border-light">
      <div className="flex flex-wrap items-center gap-2">
        <CaseStatusChip status={summary.status} />
        <CategoryBadge category={summary.computedCategory} size="sm" />
        <span className="text-[0.78rem] text-muted">
          {summary.decisiveStep ? t(`editor.stepNames.${summary.decisiveStep}`) : t('editor.noDecisiveStep')}
        </span>
        {mismatch && (
          <span className="rounded-full border border-wrong/50 px-2 py-px text-[0.7rem] font-bold text-wrong">
            {t('editor.list.expectedMismatch', { expected: t(`categories.${summary.expectedCategory}.short`) })}
          </span>
        )}
        {summary.hasUnpublishedChanges && <UnpublishedChangesChip />}
        <span className="ml-auto text-[0.7rem] text-dim">
          {summary.slug && <span className="font-mono">{summary.slug} · </span>}
          {t('editor.list.updatedAt', { date: DATE_FORMAT.format(new Date(summary.updatedAt)) })}
        </span>
      </div>
      <Link
        to={`/editor/cases/${summary.id}`}
        className="line-clamp-2 text-[0.88rem] leading-snug hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        {summary.description}
      </Link>
      {summary.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {summary.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              aria-label={t('editor.list.filterByTag', { tag })}
              className="rounded-full bg-elevated px-2.5 py-0.5 text-[0.72rem] text-muted hover:text-text cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
