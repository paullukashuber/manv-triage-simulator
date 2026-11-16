import { defaultFindings } from '@manv/triage'
import type { SeedCase } from './seed.ts'

// Placeholder seeds; replaced by the real case set in Task 5.
export const SEED_CASES: SeedCase[] = [
  {
    slug: 'placeholder-1',
    description: 'Patient steht am Unfallort und geht selbstständig auf die Einsatzkräfte zu.',
    reasoning:
      'Gehfähige Patienten werden unabhängig von weiteren Befunden als PAK weiß gesichtet.',
    findings: { ...defaultFindings(), ambulatory: true },
    expectedCategory: 'white',
    focusFields: ['ambulatory'],
    tags: [],
  },
  {
    slug: 'placeholder-2',
    description: 'Patient liegt am Boden, Atemfrequenz 35 pro Minute, flache Atmung.',
    reasoning: 'Die Atemfrequenz über 30 ist pathologisch, daher SK 1.',
    findings: { ...defaultFindings(), respiratoryRate: 35 },
    expectedCategory: 'red',
    focusFields: ['b'],
    tags: [],
  },
  {
    slug: 'placeholder-3',
    description: 'Patient liegt ansprechbar am Boden, Atmung und Puls unauffällig, nicht gehfähig.',
    reasoning: 'Kein Schritt des Algorithmus trifft zu, daher SK 2.',
    findings: defaultFindings(),
    expectedCategory: 'yellow',
    focusFields: [],
    tags: [],
  },
]
