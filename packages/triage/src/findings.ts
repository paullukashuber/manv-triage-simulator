import { z } from 'zod'

export const findingsSchema = z
  .object({
    lifeThreateningExtremityBleeding: z.boolean(),
    ambulatory: z.boolean(),
    definiteDeathSigns: z.boolean(),
    inhalationTraumaStridor: z.boolean(),
    airwayNeedsManagement: z.boolean(),
    ageGroup: z.enum(['adult', 'child']),
    respiratoryRate: z.number().int().min(0).max(80).nullable(),
    lifeThreateningBleeding: z.boolean(),
    radialPulsePalpable: z.boolean(),
    respondsPurposefully: z.boolean(),
  })
  .strict()

export type Findings = z.infer<typeof findingsSchema>

export function defaultFindings(): Findings {
  return {
    lifeThreateningExtremityBleeding: false,
    ambulatory: false,
    definiteDeathSigns: false,
    inhalationTraumaStridor: false,
    airwayNeedsManagement: false,
    ageGroup: 'adult',
    respiratoryRate: null,
    lifeThreateningBleeding: false,
    radialPulsePalpable: true,
    respondsPurposefully: true,
  }
}
