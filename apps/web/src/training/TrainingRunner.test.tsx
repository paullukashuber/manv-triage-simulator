import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeCase } from './fixtures.ts'
import { TrainingRunner } from './TrainingRunner.tsx'

const user = userEvent.setup()

async function click(name: string) {
  await user.click(screen.getByRole('button', { name }))
}

describe('TrainingRunner', () => {
  it('plays two cases through to the summary', async () => {
    const onExit = vi.fn()
    const onRetry = vi.fn()
    render(
      <TrainingRunner
        cases={[makeCase('1', { ambulatory: true }), makeCase('2', { ambulatory: true })]}
        mode="session"
        onExit={onExit}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText('Patient 1 von 2')).toBeInTheDocument()

    // Case 1: answered correctly (nein, ja -> PAK weiß)
    await click('VOR-Sichtung beginnen')
    await click('Nein')
    await click('Ja')
    expect(screen.getByText('✓ Korrekt eingestuft')).toBeInTheDocument()
    await click('Nächster Patient →')

    // Case 2: wrongly stops at the first step (SK 1 instead of PAK weiß)
    expect(screen.getByText('Patient 2 von 2')).toBeInTheDocument()
    await click('VOR-Sichtung beginnen')
    await click('Ja')
    expect(screen.getByText('✗ Falsch eingestuft')).toBeInTheDocument()
    expect(screen.getByText('fälschlich bejaht')).toBeInTheDocument()
    await click('Zur Auswertung →')

    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()
    await click('Nochmal üben')
    expect(onRetry).toHaveBeenCalledOnce()
    await click('Startseite')
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('shows 2/2 when both cases are correct', async () => {
    render(
      <TrainingRunner
        cases={[makeCase('1', { ambulatory: true }), makeCase('2', { ambulatory: true })]}
        mode="session"
        onExit={vi.fn()}
      />,
    )
    for (let i = 0; i < 2; i++) {
      await click('VOR-Sichtung beginnen')
      await click('Nein')
      await click('Ja')
      await click(i === 0 ? 'Nächster Patient →' : 'Zur Auswertung →')
    }
    expect(screen.getByText('2/2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nochmal üben' })).not.toBeInTheDocument()
  })

  it('shows "category right, path wrong" when an early yes hits the right category', async () => {
    render(<TrainingRunner cases={[makeCase('1', { radialPulsePalpable: false })]} mode="session" onExit={vi.fn()} />)
    await click('VOR-Sichtung beginnen')
    await click('Ja')
    expect(screen.getByText('≈ Kategorie richtig, Weg falsch')).toBeInTheDocument()
    expect(screen.queryByText('✓ Korrekt eingestuft')).not.toBeInTheDocument()
    expect(screen.getByText(/Entscheidender Schritt:/)).toHaveTextContent('Kein Radialispuls tastbar?')
    await click('Zur Auswertung →')
    expect(screen.getByText('0/1')).toBeInTheDocument()
    expect(screen.getByText('1 × Kategorie richtig, Weg falsch')).toBeInTheDocument()
  })

  it('lists answers after the decisive step as not graded', async () => {
    render(
      <TrainingRunner
        cases={[makeCase('1', { ambulatory: true, respondsPurposefully: false })]}
        mode="session"
        onExit={vi.fn()}
      />,
    )
    await click('VOR-Sichtung beginnen')
    for (let i = 0; i < 9; i++) await click('Nein')
    expect(screen.getByText('✗ Falsch eingestuft')).toBeInTheDocument()
    const notGraded = screen.getByRole('region', { name: 'Nach dem entscheidenden Schritt (nicht gewertet)' })
    expect(notGraded).toHaveTextContent(/Keine gezielte Reaktion/)
    const graded = screen.getByRole('region', { name: 'Fehler bei der Sichtung' })
    expect(graded).not.toHaveTextContent(/Keine gezielte Reaktion/)
  })

  it('classifies overcalled errors with learning field', async () => {
    render(<TrainingRunner cases={[makeCase('1')]} mode="session" onExit={vi.fn()} />)
    await click('VOR-Sichtung beginnen')
    await click('Ja')
    expect(screen.getByText('fälschlich bejaht')).toBeInTheDocument()
    expect(screen.getByText(/X – Kritische Blutung/)).toBeInTheDocument()
  })

  it('exposes the learning field of the step badge to assistive tech', async () => {
    render(<TrainingRunner cases={[makeCase('1')]} mode="session" onExit={vi.fn()} />)
    await click('VOR-Sichtung beginnen')
    await click('Nein')
    expect(screen.getByRole('img', { name: 'Gehfähigkeit' })).toBeInTheDocument()
  })

  it('ends a preview after the single result via onExit without a summary', async () => {
    const onExit = vi.fn()
    render(<TrainingRunner cases={[makeCase('1', { ambulatory: true })]} mode="preview" onExit={onExit} />)
    await click('VOR-Sichtung beginnen')
    await click('Nein')
    await click('Ja')
    await click('Zurück zum Editor')
    expect(onExit).toHaveBeenCalledOnce()
    expect(screen.queryByText('VOR-Sichtung abgeschlossen')).not.toBeInTheDocument()
  })
})
