import { defaultFindings } from '@manv/triage'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TriagePreview } from './TriagePreview.tsx'

describe('TriagePreview', () => {
  it('shows PAK weiß and no warning for an ambulatory patient expected white', () => {
    render(<TriagePreview findings={{ ...defaultFindings(), ambulatory: true }} expectedCategory="white" />)
    expect(screen.getByText('PAK weiß')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('warns when the expected category differs from the computed one', () => {
    render(<TriagePreview findings={{ ...defaultFindings(), ambulatory: true }} expectedCategory="red" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Soll-Kategorie SK 1 weicht von der berechneten Kategorie PAK weiß ab')
  })

  it('hints at the missing respiratory rate when step B lies on the path', () => {
    render(<TriagePreview findings={defaultFindings()} expectedCategory="yellow" />)
    expect(screen.getByText(/Atemfrequenz nicht angegeben/)).toBeInTheDocument()
  })

  it('does not hint at the respiratory rate when the path ends before step B', () => {
    render(<TriagePreview findings={{ ...defaultFindings(), ambulatory: true }} expectedCategory="white" />)
    expect(screen.queryByText(/Atemfrequenz nicht angegeben/)).not.toBeInTheDocument()
  })

  it('lists the path up to the decisive step and highlights it', () => {
    render(
      <TriagePreview findings={{ ...defaultFindings(), inhalationTraumaStridor: true }} expectedCategory="red" />,
    )
    const items = within(screen.getByRole('list', { name: 'Weg durch den Algorithmus' })).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('Lebensbedrohliche Extremitätenblutung erkennbar?')
    expect(items[0]).toHaveTextContent('Nein')
    expect(items[3]).toHaveTextContent('Inhalationstrauma mit Stridor?')
    expect(items[3]).toHaveTextContent('Ja')
    expect(items[3]).toHaveAttribute('aria-current', 'step')
    expect(items[3]).toHaveTextContent('entscheidend')
  })

  it('states that no step applies when the patient falls through to SK 2', () => {
    render(<TriagePreview findings={{ ...defaultFindings(), respiratoryRate: 18 }} expectedCategory="yellow" />)
    expect(screen.getByText(/Kein Schritt trifft zu/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(9)
  })
})
