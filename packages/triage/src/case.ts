import { z } from 'zod'
import { findingsSchema, type Findings } from './findings.ts'
import {
  categorySchema,
  learningFieldSchema,
  STEP_KEYS,
  type Category,
  type LearningField,
  type StepKey,
} from './steps.ts'

const text = z.string().trim().min(10).max(4000)

export const caseInputSchema = z
  .object({
    description: text,
    reasoning: text,
    findings: findingsSchema,
    expectedCategory: categorySchema,
    focusFields: z
      .array(learningFieldSchema)
      .max(7)
      .refine((a) => new Set(a).size === a.length, 'focusFields must be unique'),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(10)
      .refine((a) => new Set(a).size === a.length, 'tags must be unique'),
  })
  .strict()

export type CaseInput = z.infer<typeof caseInputSchema>

export const trainingCaseSchema = z.object({
  caseId: z.string(),
  revisionId: z.string(),
  description: z.string(),
  reasoning: z.string(),
  findings: findingsSchema,
  focusFields: z.array(learningFieldSchema),
})

export type TrainingCase = z.infer<typeof trainingCaseSchema>

export const CASE_STATUSES = ['draft', 'published', 'archived'] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

/** Editor view of a case (working copy plus publication state). Dates are ISO strings. */
export type CaseDetail = {
  id: string
  slug: string | null
  description: string
  reasoning: string
  findings: Findings
  expectedCategory: Category
  focusFields: LearningField[]
  tags: string[]
  computedCategory: Category
  decisiveStep: StepKey | null
  status: CaseStatus
  publishedRevisionNumber: number | null
  hasUnpublishedChanges: boolean
  createdAt: string
  updatedAt: string
}

export type CaseSummary = Omit<CaseDetail, 'reasoning' | 'findings'>

export const caseFilterSchema = z
  .object({
    status: z.enum(CASE_STATUSES).optional(),
    category: categorySchema.optional(),
    decisiveStep: z.union([z.enum(STEP_KEYS), z.literal('none')]).optional(),
    tag: z.string().trim().min(1).max(40).optional(),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict()

export type CaseFilter = z.infer<typeof caseFilterSchema>
