import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, makeSummary, mockApi, renderEditor } from '../test/editor-fixtures.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
})

const cases = [
  makeSummary({ id: 'c1', slug: 'legacy-1', description: 'Mann mit Kopfplatzwunde, läuft umher.' }),
  makeSummary({
    id: 'c2',
    slug: 'new-af-34',
    description: 'Frau atmet sehr schnell.',
    status: 'published',
    publishedRevisionNumber: 1,
    hasUnpublishedChanges: true,
    computedCategory: 'red',
    expectedCategory: 'red',
    decisiveStep: 'abnormalBreathingRate',
    tags: ['Atmung'],
  }),
]

describe('CaseListPage', () => {
  it('lists cases with status, category, decisive step and the unpublished-changes notice', async () => {
    mockApi(() => jsonResponse({ cases }))
    renderEditor('/editor')
    const item = (await screen.findByRole('link', { name: 'Frau atmet sehr schnell.' })).closest('li')!
    expect(within(item).getByText('Veröffentlicht')).toBeInTheDocument()
    expect(within(item).getByText('SK 1')).toBeInTheDocument()
    expect(within(item).getByText('B – Atemfrequenz')).toBeInTheDocument()
    expect(within(item).getByText('Änderungen noch nicht veröffentlicht')).toBeInTheDocument()
    const other = screen.getByRole('link', { name: 'Mann mit Kopfplatzwunde, läuft umher.' }).closest('li')!
    expect(within(other).getByText('Entwurf')).toBeInTheDocument()
    expect(within(other).queryByText('Änderungen noch nicht veröffentlicht')).not.toBeInTheDocument()
  })

  it('puts the status filter into the URL query and the API call', async () => {
    const requests = mockApi(() => jsonResponse({ cases }))
    const router = renderEditor('/editor')
    await screen.findByRole('link', { name: 'Frau atmet sehr schnell.' })
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'draft')
    await waitFor(() => expect(router.state.location.search).toBe('?status=draft'))
    await waitFor(() => expect(requests.at(-1)?.url).toBe('/api/editor/cases?status=draft'))
  })

  it('ignores invalid filter params from the URL', async () => {
    const requests = mockApi(() => jsonResponse({ cases: [] }))
    renderEditor('/editor?status=bogus&category=red&decisiveStep=none')
    expect(await screen.findByText('Keine Fälle für diese Filter.')).toBeInTheDocument()
    expect(requests[0]?.url).toBe('/api/editor/cases?category=red&decisiveStep=none')
    expect(screen.getByLabelText('Berechnete Kategorie')).toHaveValue('red')
    expect(screen.getByLabelText('Status')).toHaveValue('')
  })

  it('filters by a tag when its chip is clicked', async () => {
    const requests = mockApi(() => jsonResponse({ cases }))
    const router = renderEditor('/editor')
    await userEvent.click(await screen.findByRole('button', { name: 'Nach Tag „Atmung“ filtern' }))
    await waitFor(() => expect(router.state.location.search).toBe('?tag=Atmung'))
    await waitFor(() => expect(requests.at(-1)?.url).toBe('/api/editor/cases?tag=Atmung'))
  })

  it('opens the form for a new case', async () => {
    mockApi(() => jsonResponse({ cases }))
    const router = renderEditor('/editor')
    await userEvent.click(screen.getByRole('link', { name: 'Neuer Fall' }))
    expect(router.state.location.pathname).toBe('/editor/cases/new')
  })

  it('shows a not-found page for unknown editor paths', () => {
    mockApi(() => jsonResponse({ cases }))
    renderEditor('/editor/does-not-exist')
    expect(screen.getByText('Seite nicht gefunden')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zur Fallliste/ })).toHaveAttribute('href', '/editor')
  })
})
