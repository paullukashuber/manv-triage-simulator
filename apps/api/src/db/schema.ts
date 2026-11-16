import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import type { Findings } from '@manv/triage'

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique(),
  description: text('description').notNull(),
  reasoning: text('reasoning').notNull(),
  findings: jsonb('findings').$type<Findings>().notNull(),
  expectedCategory: text('expected_category').notNull(),
  focusFields: text('focus_fields').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  computedCategory: text('computed_category').notNull(),
  decisiveStep: text('decisive_step'),
  status: text('status').notNull().default('draft'),
  authorId: text('author_id'),
  publishedRevisionId: uuid('published_revision_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const caseRevisions = pgTable(
  'case_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    revisionNumber: integer('revision_number').notNull(),
    description: text('description').notNull(),
    reasoning: text('reasoning').notNull(),
    findings: jsonb('findings').$type<Findings>().notNull(),
    focusFields: text('focus_fields').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    computedCategory: text('computed_category').notNull(),
    decisiveStep: text('decisive_step'),
    algorithmVersion: text('algorithm_version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    publishedBy: text('published_by'),
  },
  (t) => [unique('case_revisions_case_id_revision_number_unique').on(t.caseId, t.revisionNumber)],
)
