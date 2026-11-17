import { defaultFindings, findingsSchema, type CaseDetail, type CaseInput, type Findings } from '@manv/triage'

const FINDINGS_KEYS = Object.keys(findingsSchema.shape) as (keyof Findings)[]

export function emptyCaseInput(): CaseInput {
  return {
    description: '',
    reasoning: '',
    findings: defaultFindings(),
    expectedCategory: 'yellow',
    focusFields: [],
    tags: [],
  }
}

export function toCaseInput(detail: CaseDetail): CaseInput {
  return {
    description: detail.description,
    reasoning: detail.reasoning,
    findings: { ...detail.findings },
    expectedCategory: detail.expectedCategory,
    focusFields: [...detail.focusFields],
    tags: [...detail.tags],
  }
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

export function isSameCaseInput(a: CaseInput, b: CaseInput): boolean {
  return (
    a.description === b.description &&
    a.reasoning === b.reasoning &&
    a.expectedCategory === b.expectedCategory &&
    sameList(a.focusFields, b.focusFields) &&
    sameList(a.tags, b.tags) &&
    FINDINGS_KEYS.every((key) => a.findings[key] === b.findings[key])
  )
}

/** Form field an issue path belongs to: `findings.<key>` stays, everything else collapses to its top-level key. */
export function fieldKeyFor(path: string): string {
  const [head = '', second] = path.split('.')
  return head === 'findings' && second ? `findings.${second}` : head
}

/** Value of a form field addressed by `fieldKeyFor`, for detecting edits of fields with errors. */
export function fieldValue(input: CaseInput, key: string): unknown {
  if (key.startsWith('findings.')) return input.findings[key.slice('findings.'.length) as keyof Findings]
  return input[key as keyof CaseInput]
}
