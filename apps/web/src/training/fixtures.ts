import { defaultFindings, type TrainingCase } from '@manv/triage'

export function makeCase(id: string, overrides: Partial<TrainingCase['findings']> = {}): TrainingCase {
  return {
    caseId: `case-${id}`,
    revisionId: `rev-${id}`,
    description: `Beschreibung des Patienten ${id}`,
    reasoning: `Begründung zu Patient ${id}`,
    findings: { ...defaultFindings(), ...overrides },
    focusFields: [],
  }
}
