import { z } from 'zod'
import { findingsSchema } from './findings.ts'
import { categorySchema, learningFieldSchema } from './steps.ts'

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
