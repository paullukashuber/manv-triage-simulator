import {
  CATEGORIES,
  LEARNING_FIELDS,
  type CaseInput,
  type Category,
  type Findings,
  type LearningField,
  type StepKey,
} from '@manv/triage'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card.tsx'
import { CategoryBadge } from '../components/ui/CategoryBadge.tsx'
import { StepBadge } from '../components/ui/StepBadge.tsx'

type BooleanFinding = { [K in keyof Findings]: Findings[K] extends boolean ? K : never }[keyof Findings]

type FindingRow =
  | { kind: 'boolean'; key: BooleanFinding; step: StepKey }
  | { kind: 'ageGroup'; step: StepKey }
  | { kind: 'respiratoryRate'; step: StepKey }

/** Findings in algorithm order, each tied to the step that evaluates it. */
const FINDING_ROWS: readonly FindingRow[] = [
  { kind: 'boolean', key: 'lifeThreateningExtremityBleeding', step: 'tourniquet' },
  { kind: 'boolean', key: 'ambulatory', step: 'ambulatory' },
  { kind: 'boolean', key: 'definiteDeathSigns', step: 'deathSigns' },
  { kind: 'boolean', key: 'inhalationTraumaStridor', step: 'stridor' },
  { kind: 'boolean', key: 'airwayNeedsManagement', step: 'airwayBlocked' },
  { kind: 'ageGroup', step: 'abnormalBreathingRate' },
  { kind: 'respiratoryRate', step: 'abnormalBreathingRate' },
  { kind: 'boolean', key: 'lifeThreateningBleeding', step: 'majorBleeding' },
  { kind: 'boolean', key: 'radialPulsePalpable', step: 'noRadialPulse' },
  { kind: 'boolean', key: 'respondsPurposefully', step: 'unresponsive' },
]

const MAX_TAGS = 10
const INPUT_BASE =
  'bg-surface border border-border-light rounded-lg px-3 py-2 text-text focus:outline-2 focus:outline-accent aria-invalid:border-wrong'
const INPUT_CLASS = `w-full ${INPUT_BASE}`
const LABEL_CLASS = 'text-[0.82rem] font-bold'
const HINT_CLASS = 'text-[0.75rem] text-muted leading-snug'

type CaseFormProps = {
  value: CaseInput
  onChange: (value: CaseInput) => void
  /** Field errors keyed by field (`description`, `findings.respiratoryRate`, `tags`, …). */
  errors?: Record<string, string>
}

export function CaseForm({ value, onChange, errors = {} }: CaseFormProps) {
  const { t } = useTranslation()
  const id = useId()

  const set = <K extends keyof CaseInput>(key: K, fieldValue: CaseInput[K]) => onChange({ ...value, [key]: fieldValue })
  const setFinding = <K extends keyof Findings>(key: K, findingValue: Findings[K]) =>
    set('findings', { ...value.findings, [key]: findingValue })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <TextField
          id={`${id}-description`}
          label={t('editor.form.description')}
          hint={t('editor.form.descriptionHint')}
          value={value.description}
          error={errors.description}
          onChange={(text) => set('description', text)}
        />
      </Card>

      <Card>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-bold">{t('editor.form.findings')}</legend>
          <p className={`${HINT_CLASS} mb-1`}>{t('editor.form.findingsHint')}</p>
          {FINDING_ROWS.map((row) => {
            const rowId = `${id}-${row.kind === 'boolean' ? row.key : row.kind}`
            const errorKey = `findings.${row.kind === 'boolean' ? row.key : row.kind}`
            return (
              <FindingRowLayout
                key={rowId}
                step={row.step}
                question={t('editor.form.stepQuestion', { question: t(`steps.${row.step}.question`) })}
                questionId={`${rowId}-question`}
                error={errors[errorKey]}
                errorId={`${rowId}-error`}
              >
                {row.kind === 'boolean' && (
                  <FindingSwitch
                    id={rowId}
                    label={t(`editor.findings.${row.key}`)}
                    checked={value.findings[row.key]}
                    onChange={(checked) => setFinding(row.key, checked)}
                  />
                )}
                {row.kind === 'ageGroup' && (
                  <AgeGroupField
                    id={rowId}
                    value={value.findings.ageGroup}
                    onChange={(ageGroup) => setFinding('ageGroup', ageGroup)}
                  />
                )}
                {row.kind === 'respiratoryRate' && (
                  <RespiratoryRateField
                    id={rowId}
                    value={value.findings.respiratoryRate}
                    invalid={errors[errorKey] !== undefined}
                    onChange={(rate) => setFinding('respiratoryRate', rate)}
                  />
                )}
              </FindingRowLayout>
            )
          })}
        </fieldset>
      </Card>

      <Card>
        <ChoiceFieldset
          legend={t('editor.form.expectedCategory')}
          hint={t('editor.form.expectedCategoryHint')}
          error={errors.expectedCategory}
          errorId={`${id}-expected-error`}
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <label key={category} className="cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-expected`}
                  value={category}
                  checked={value.expectedCategory === category}
                  onChange={() => set('expectedCategory', category satisfies Category)}
                  className="peer sr-only"
                />
                <span className="flex rounded-lg border-2 border-transparent p-1 opacity-60 peer-checked:border-accent peer-checked:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  <CategoryBadge category={category} />
                </span>
              </label>
            ))}
          </div>
        </ChoiceFieldset>
      </Card>

      <Card>
        <ChoiceFieldset
          legend={t('editor.form.focusFields')}
          hint={t('editor.form.focusFieldsHint')}
          error={errors.focusFields}
          errorId={`${id}-focus-error`}
        >
          <div className="grid gap-1 sm:grid-cols-2">
            {LEARNING_FIELDS.map((field) => (
              <label key={field} className="flex items-center gap-2 text-[0.82rem] cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.focusFields.includes(field)}
                  onChange={(event) => set('focusFields', toggleField(value.focusFields, field, event.target.checked))}
                  className="h-4 w-4 accent-accent"
                />
                {t(`training.learningFields.${field}`)}
              </label>
            ))}
          </div>
        </ChoiceFieldset>
      </Card>

      <Card>
        <TagsField
          id={`${id}-tags`}
          tags={value.tags}
          error={errors.tags}
          onChange={(tags) => set('tags', tags)}
        />
      </Card>

      <Card>
        <TextField
          id={`${id}-reasoning`}
          label={t('editor.form.reasoning')}
          hint={t('editor.form.reasoningHint')}
          value={value.reasoning}
          error={errors.reasoning}
          onChange={(text) => set('reasoning', text)}
        />
      </Card>
    </div>
  )
}

function toggleField(fields: LearningField[], field: LearningField, on: boolean): LearningField[] {
  const next = new Set(fields)
  if (on) next.add(field)
  else next.delete(field)
  return LEARNING_FIELDS.filter((f) => next.has(f))
}

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(' ')
  return joined === '' ? undefined : joined
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} className="text-[0.78rem] text-wrong">
      {message}
    </p>
  )
}

function TextField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  error: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <p id={`${id}-hint`} className={HINT_CLASS}>
        {hint}
      </p>
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(`${id}-hint`, error && `${id}-error`)}
        className={`${INPUT_CLASS} resize-y leading-snug`}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function ChoiceFieldset({
  legend,
  hint,
  error,
  errorId,
  children,
}: {
  legend: string
  hint: string
  error: string | undefined
  errorId: string
  children: ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="font-bold">{legend}</legend>
      <p className={HINT_CLASS}>{hint}</p>
      {children}
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}

function FindingRowLayout({
  step,
  question,
  questionId,
  error,
  errorId,
  children,
}: {
  step: StepKey
  question: string
  questionId: string
  error: string | undefined
  errorId: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 border-t border-border py-2 first-of-type:border-t-0">
      <StepBadge stepKey={step} />
      <div className="flex flex-1 flex-col gap-1">
        {children}
        <p id={questionId} className={HINT_CLASS}>
          {question}
        </p>
        <FieldError id={errorId} message={error} />
      </div>
    </div>
  )
}

function FindingSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <span id={`${id}-label`} className="text-[0.88rem] font-medium leading-snug">
        {label}
      </span>
      <label className="flex shrink-0 items-center gap-2 cursor-pointer">
        <span aria-hidden="true" className={`w-10 text-right text-[0.78rem] font-bold ${checked ? 'text-accent' : 'text-muted'}`}>
          {checked ? t('editor.form.yes') : t('editor.form.no')}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-question`}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 rounded-full border border-border-light bg-elevated transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4.5 after:w-4.5 after:rounded-full after:bg-muted after:transition-transform peer-checked:border-accent peer-checked:bg-accent/30 peer-checked:after:translate-x-5 peer-checked:after:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        />
      </label>
    </div>
  )
}

function AgeGroupField({
  id,
  value,
  onChange,
}: {
  id: string
  value: Findings['ageGroup']
  onChange: (value: Findings['ageGroup']) => void
}) {
  const { t } = useTranslation()
  const options = [
    { value: 'adult', label: t('editor.form.adult') },
    { value: 'child', label: t('editor.form.child') },
  ] as const
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-question`} className="flex items-center justify-between gap-3">
      <span id={`${id}-label`} className="text-[0.88rem] font-medium">
        {t('editor.form.ageGroup')}
      </span>
      <div className="flex overflow-hidden rounded-lg border border-border-light">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={`${id}-age`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="block px-3 py-1 text-[0.82rem] text-muted peer-checked:bg-accent peer-checked:font-bold peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-text">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function RespiratoryRateField({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string
  value: number | null
  invalid: boolean
  onChange: (value: number | null) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[0.88rem] font-medium">
          {t('editor.form.respiratoryRate')}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={80}
          step={1}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy(`${id}-hint`, `${id}-question`, invalid && `${id}-error`)}
          className={`${INPUT_BASE} w-24 text-right tabular-nums`}
        />
      </div>
      <p id={`${id}-hint`} className={HINT_CLASS}>
        {t('editor.form.respiratoryRateHint')}
      </p>
    </div>
  )
}

function TagsField({
  id,
  tags,
  error,
  onChange,
}: {
  id: string
  tags: string[]
  error: string | undefined
  onChange: (tags: string[]) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const full = tags.length >= MAX_TAGS

  function commit() {
    const tag = draft.trim()
    setDraft('')
    if (tag !== '' && !tags.includes(tag) && !full) onChange([...tags, tag])
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{t('editor.form.tags')}</span>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 rounded-full bg-elevated py-0.5 pl-2.5 pr-1 text-[0.78rem]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((other) => other !== tag))}
                aria-label={t('editor.form.removeTag', { tag })}
                className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-border-light hover:text-text cursor-pointer"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          {t('editor.form.tagInput')}
        </label>
        <input
          id={id}
          value={draft}
          maxLength={40}
          disabled={full}
          placeholder={t('editor.form.tagInput')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(`${id}-hint`, error && `${id}-error`)}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={commit}
          disabled={full}
          className="shrink-0 rounded-lg border border-border-light bg-elevated px-3 text-[0.82rem] font-bold cursor-pointer disabled:opacity-50"
        >
          {t('editor.form.addTag')}
        </button>
      </div>
      <p id={`${id}-hint`} className={HINT_CLASS}>
        {t('editor.form.tagsHint')}
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
