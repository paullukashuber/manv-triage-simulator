import { z } from 'zod'

export const CATEGORIES = ['red', 'yellow', 'white', 'dead'] as const
export type Category = (typeof CATEGORIES)[number]
export const categorySchema = z.enum(CATEGORIES)

export const LEARNING_FIELDS = ['x', 'ambulatory', 'death', 'a', 'b', 'c', 'd'] as const
export type LearningField = (typeof LEARNING_FIELDS)[number]
export const learningFieldSchema = z.enum(LEARNING_FIELDS)

/** Algorithm order; the first matching step ends the triage. */
export const STEP_KEYS = [
  'tourniquet',
  'ambulatory',
  'deathSigns',
  'stridor',
  'airwayBlocked',
  'abnormalBreathingRate',
  'majorBleeding',
  'noRadialPulse',
  'unresponsive',
] as const
export type StepKey = (typeof STEP_KEYS)[number]

export type StepDefinition = {
  key: StepKey
  learningField: LearningField
  badge: 'x' | 'walk' | 'dead' | 'a' | 'b' | 'c' | 'd'
  resultIfYes: Category
}

export const STEPS: readonly StepDefinition[] = [
  { key: 'tourniquet', learningField: 'x', badge: 'x', resultIfYes: 'red' },
  { key: 'ambulatory', learningField: 'ambulatory', badge: 'walk', resultIfYes: 'white' },
  { key: 'deathSigns', learningField: 'death', badge: 'dead', resultIfYes: 'dead' },
  { key: 'stridor', learningField: 'a', badge: 'a', resultIfYes: 'red' },
  { key: 'airwayBlocked', learningField: 'a', badge: 'a', resultIfYes: 'red' },
  { key: 'abnormalBreathingRate', learningField: 'b', badge: 'b', resultIfYes: 'red' },
  { key: 'majorBleeding', learningField: 'c', badge: 'c', resultIfYes: 'red' },
  { key: 'noRadialPulse', learningField: 'c', badge: 'c', resultIfYes: 'red' },
  { key: 'unresponsive', learningField: 'd', badge: 'd', resultIfYes: 'red' },
]

export const FALLBACK_CATEGORY: Category = 'yellow'
export const ALGORITHM_VERSION = '1.0.0'
