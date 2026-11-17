import { categorySchema, findingsSchema, learningFieldSchema, type CaseInput } from '@manv/triage'

/**
 * Unsaved editor input, kept in sessionStorage so it survives the editor being unmounted
 * (an expired session redirects to the login page) or a reload in the same tab.
 * Storage may be unavailable or full; every access is best effort.
 */
export function draftKeyFor(caseId: string | undefined): string {
  return `manv:case-draft:${caseId ?? 'new'}`
}

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/** Shape check only: drafts may hold input the server would still reject (e.g. too short). */
function parseDraft(raw: string): CaseInput | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const draft = data as Record<string, unknown>
  const findings = findingsSchema.safeParse(draft.findings)
  const expectedCategory = categorySchema.safeParse(draft.expectedCategory)
  const focusFields = learningFieldSchema.array().safeParse(draft.focusFields)
  if (
    typeof draft.description !== 'string' ||
    typeof draft.reasoning !== 'string' ||
    !findings.success ||
    !expectedCategory.success ||
    !focusFields.success ||
    !isStringList(draft.tags)
  ) {
    return null
  }
  return {
    description: draft.description,
    reasoning: draft.reasoning,
    findings: findings.data,
    expectedCategory: expectedCategory.data,
    focusFields: focusFields.data,
    tags: draft.tags,
  }
}

export function loadDraft(key: string): CaseInput | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw === null ? null : parseDraft(raw)
  } catch {
    return null
  }
}

export function saveDraft(key: string, input: CaseInput): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(input))
  } catch {
    // Storage full or blocked: the draft just is not kept.
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
