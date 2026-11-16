import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCase } from './fixtures.ts'
import { TrainingPage } from './TrainingPage.tsx'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <TrainingPage />
    </QueryClientProvider>,
  )
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  localStorage.setItem('manv:prototype-ack', '1')
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('TrainingPage', () => {
  it('does not fetch before the user starts', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Training starten' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the empty message and no runner when there are no cases', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ cases: [] }))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Training starten' }))
    expect(await screen.findByText('Aktuell sind keine freigegebenen Fälle vorhanden.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'VOR-Sichtung beginnen' })).not.toBeInTheDocument()
  })

  it('shows an error with retry on HTTP 500 and recovers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Training starten' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Die Fälle konnten nicht geladen werden.')

    fetchMock.mockResolvedValueOnce(jsonResponse({ cases: [makeCase('1')] }))
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByText('Patient 1 von 1')).toBeInTheDocument()
  })

  it('treats a response violating the schema as a load error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ cases: [{ caseId: 'x' }] }))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Training starten' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('starts the runner with the fetched cases', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ cases: [makeCase('1'), makeCase('2'), makeCase('3')] }))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Training starten' }))
    expect(await screen.findByText('Patient 1 von 3')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/training/cases?count=10')
  })

  it('fetches a fresh set for "Nochmal üben" and returns home on "Startseite"', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ cases: [makeCase('1', { ambulatory: true })] })))
    renderPage()
    const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))
    await click('Training starten')
    await screen.findByText('Patient 1 von 1')
    for (const name of ['VOR-Sichtung beginnen', 'Nein', 'Ja', 'Zur Auswertung →']) await click(name)

    await click('Nochmal üben')
    expect(await screen.findByText('Patient 1 von 1')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    for (const name of ['VOR-Sichtung beginnen', 'Nein', 'Ja', 'Zur Auswertung →', 'Startseite']) await click(name)
    expect(screen.getByRole('button', { name: 'Training starten' })).toBeInTheDocument()
  })
})
