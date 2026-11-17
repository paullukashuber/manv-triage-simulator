import { CATEGORIES, type Category } from '@manv/triage'
import type { TFunction } from 'i18next'
import { ApiError } from '../lib/api.ts'
import { fieldKeyFor } from './caseInput.ts'

export type ErrorFeedback = { text: string; fieldErrors: Record<string, string> }

type ErrorBody = { error?: unknown; issues?: unknown; expected?: unknown; computed?: unknown }

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value)
}

function fieldMessage(key: string, t: TFunction): string {
  if (key === 'description' || key === 'reasoning') return t('editor.errors.text')
  if (key === 'findings.respiratoryRate') return t('editor.errors.respiratoryRate')
  if (key === 'tags') return t('editor.errors.tags')
  if (key === 'focusFields') return t('editor.errors.focusFields')
  return t('editor.errors.invalid')
}

function issueFieldErrors(issues: unknown, t: TFunction): Record<string, string> {
  if (!Array.isArray(issues)) return {}
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const path = (issue as { path?: unknown } | null)?.path
    if (typeof path !== 'string') continue
    const key = fieldKeyFor(path)
    errors[key] = fieldMessage(key, t)
  }
  return errors
}

/** Translates an editor API failure into a German message plus per-field errors (for 400 validation). */
export function errorFeedback(error: unknown, t: TFunction): ErrorFeedback {
  const generic = { text: t('editor.errors.generic'), fieldErrors: {} }
  if (!(error instanceof ApiError)) return generic
  const body = (typeof error.body === 'object' && error.body !== null ? error.body : {}) as ErrorBody

  if (error.status === 400 && body.error === 'validation') {
    return { text: t('editor.errors.validationSummary'), fieldErrors: issueFieldErrors(body.issues, t) }
  }
  if (body.error === 'expected_category_mismatch' && isCategory(body.expected) && isCategory(body.computed)) {
    return {
      text: t('editor.errors.mismatch', {
        expected: t(`categories.${body.expected}.short`),
        computed: t(`categories.${body.computed}.short`),
      }),
      fieldErrors: {},
    }
  }
  if (body.error === 'case_archived') return { text: t('editor.errors.archived'), fieldErrors: {} }
  if (body.error === 'case_has_revisions') return { text: t('editor.errors.hasRevisions'), fieldErrors: {} }
  if (error.status === 404) return { text: t('editor.errors.notFound'), fieldErrors: {} }
  return generic
}
