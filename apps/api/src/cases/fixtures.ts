import { defaultFindings, type CaseInput, type Findings } from '@manv/triage'

/** Test fixture: valid case input; defaults to an ambulatory patient (white). */
export function caseInput(
  over: Partial<Omit<CaseInput, 'findings'>> & {
    findings?: Partial<Findings>
  } = {},
): CaseInput {
  const { findings, ...rest } = over
  return {
    description: 'Patient läuft selbstständig vom Unfallort weg.',
    reasoning: 'Gehfähige Patienten werden als PAK weiß gesichtet.',
    expectedCategory: 'white',
    focusFields: ['ambulatory'],
    tags: [],
    ...rest,
    findings: { ...defaultFindings(), ambulatory: true, ...findings },
  }
}
