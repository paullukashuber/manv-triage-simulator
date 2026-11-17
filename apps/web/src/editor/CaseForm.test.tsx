import { defaultFindings, type CaseInput } from '@manv/triage'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CaseForm } from './CaseForm.tsx'

function makeInput(overrides: Partial<CaseInput> = {}): CaseInput {
  return {
    description: 'Erwachsener liegt am Boden.',
    reasoning: 'Keine Kriterien treffen zu.',
    findings: defaultFindings(),
    expectedCategory: 'yellow',
    focusFields: [],
    tags: [],
    ...overrides,
  }
}

/** Stateful wrapper so typing behaves like in the real editor. */
function Harness({ initial, onChange }: { initial: CaseInput; onChange: (value: CaseInput) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <CaseForm
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe('CaseForm', () => {
  it('lists the findings in algorithm order', () => {
    render(<CaseForm value={makeInput()} onChange={() => {}} />)
    const labels = screen
      .getAllByRole('switch')
      .map((element) => document.getElementById(element.getAttribute('aria-labelledby') ?? '')?.textContent)
    expect(labels).toEqual([
      'Lebensbedrohliche Extremitätenblutung',
      'Gehfähig',
      'Sichere Todeszeichen',
      'Inhalationstrauma mit Stridor',
      'Atemweg muss offengehalten werden',
      'Lebensbedrohliche Blutung (Rumpf/sonstige)',
      'Radialispuls tastbar',
      'Reagiert gezielt auf Ansprache',
    ])
  })

  it('toggling "Gehfähig" reports findings.ambulatory true', async () => {
    const onChange = vi.fn()
    render(<CaseForm value={makeInput()} onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Gehfähig' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ findings: expect.objectContaining({ ambulatory: true }) }),
    )
  })

  it('clearing the respiratory rate reports null', async () => {
    const onChange = vi.fn()
    render(
      <Harness initial={makeInput({ findings: { ...defaultFindings(), respiratoryRate: 20 } })} onChange={onChange} />,
    )
    await userEvent.clear(screen.getByLabelText('Atemfrequenz (/min)'))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ findings: expect.objectContaining({ respiratoryRate: null }) }),
    )
  })

  it('typing 34 as respiratory rate reports the number 34', async () => {
    const onChange = vi.fn()
    render(<Harness initial={makeInput()} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Atemfrequenz (/min)'), '34')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ findings: expect.objectContaining({ respiratoryRate: 34 }) }),
    )
  })

  it('switches the age group to child', async () => {
    const onChange = vi.fn()
    render(<CaseForm value={makeInput()} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Kind' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ findings: expect.objectContaining({ ageGroup: 'child' }) }),
    )
  })

  it('adds a tag on Enter, ignores duplicates and removes tags', async () => {
    const onChange = vi.fn()
    render(<Harness initial={makeInput({ tags: ['Brand'] })} onChange={onChange} />)
    const input = screen.getByLabelText('Neuer Tag')
    await userEvent.type(input, ' Kind {Enter}')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ['Brand', 'Kind'] }))
    expect(input).toHaveValue('')
    onChange.mockClear()
    await userEvent.type(input, 'Kind{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Tag „Brand“ entfernen' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ['Kind'] }))
  })

  it('toggles learning field focus', async () => {
    const onChange = vi.fn()
    render(<CaseForm value={makeInput({ focusFields: ['a'] })} onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Gehfähigkeit' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ focusFields: ['ambulatory', 'a'] }))
  })

  it('sets the expected category', async () => {
    const onChange = vi.fn()
    render(<CaseForm value={makeInput()} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'SK 1' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ expectedCategory: 'red' }))
  })

  it('shows field errors at the field', () => {
    render(
      <CaseForm
        value={makeInput()}
        onChange={() => {}}
        errors={{ description: 'Bitte 10 bis 4000 Zeichen eingeben.' }}
      />,
    )
    const description = screen.getByLabelText('Fallbeschreibung')
    expect(description).toHaveAttribute('aria-invalid', 'true')
    expect(description).toHaveAccessibleDescription(/Bitte 10 bis 4000 Zeichen eingeben\./)
  })
})
