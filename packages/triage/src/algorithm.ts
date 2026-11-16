import type { Findings } from './findings.ts'
import { FALLBACK_CATEGORY, STEP_KEYS, STEPS, type Category, type StepKey } from './steps.ts'

const RATE_LIMITS = {
  adult: { min: 10, max: 30 },
  child: { min: 15, max: 40 },
} as const

export function isRespiratoryRatePathological(
  rate: number | null,
  ageGroup: 'adult' | 'child',
): boolean {
  if (rate === null) return false
  const { min, max } = RATE_LIMITS[ageGroup]
  return rate < min || rate > max
}

const PREDICATES: Record<StepKey, (f: Findings) => boolean> = {
  tourniquet: (f) => f.lifeThreateningExtremityBleeding,
  ambulatory: (f) => f.ambulatory,
  deathSigns: (f) => f.definiteDeathSigns,
  stridor: (f) => f.inhalationTraumaStridor,
  airwayBlocked: (f) => f.airwayNeedsManagement,
  abnormalBreathingRate: (f) => isRespiratoryRatePathological(f.respiratoryRate, f.ageGroup),
  majorBleeding: (f) => f.lifeThreateningBleeding,
  noRadialPulse: (f) => !f.radialPulsePalpable,
  unresponsive: (f) => !f.respondsPurposefully,
}

export function evaluateStep(key: StepKey, findings: Findings): boolean {
  return PREDICATES[key](findings)
}

export type TriageResult = {
  category: Category
  decisiveStep: StepKey | null
  path: { key: StepKey; applies: boolean }[]
}

export function triage(findings: Findings): TriageResult {
  const path: TriageResult['path'] = []
  for (const key of STEP_KEYS) {
    const applies = evaluateStep(key, findings)
    path.push({ key, applies })
    if (applies) {
      const step = STEPS.find((s) => s.key === key)
      if (!step) throw new Error(`Unknown step: ${key}`)
      return { category: step.resultIfYes, decisiveStep: key, path }
    }
  }
  return { category: FALLBACK_CATEGORY, decisiveStep: null, path }
}
