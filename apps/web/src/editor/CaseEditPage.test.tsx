import { defaultFindings, type CaseInput } from '@manv/triage'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, makeDetail, mockApi, renderEditor, type ApiRequest } from '../test/editor-fixtures.tsx'

beforeEach(() => {
  localStorage.setItem('manv:prototype-ack', '1')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const CASE_URL = '/api/editor/cases/c1'

function publishButton() {
  return screen.getByRole('button', { name: 'Veröffentlichen' })
}

describe('CaseEditPage', () => {
  it('disables publishing when the expected category differs from the computed one', async () => {
    const detail = makeDetail({
      findings: { ...defaultFindings(), ambulatory: true },
      expectedCategory: 'red',
      computedCategory: 'white',
      decisiveStep: 'ambulatory',
    })
    mockApi(() => jsonResponse(detail))
    renderEditor('/editor/cases/c1')
    await screen.findByDisplayValue(detail.description)
    expect(publishButton()).toBeDisabled()
    expect(publishButton()).toHaveAccessibleDescription('Soll-Kategorie passt nicht zur berechneten Kategorie.')
  })

  it('saves the edited case and then publishes it', async () => {
    const detail = makeDetail()
    const requests = mockApi(({ method, url, body }) => {
      if (method === 'PUT' && url === CASE_URL) return jsonResponse({ ...detail, ...(body as CaseInput) })
      if (method === 'POST' && url === `${CASE_URL}/publish`)
        return jsonResponse({ ...detail, status: 'published', publishedRevisionNumber: 1 })
      return jsonResponse(detail)
    })
    const user = userEvent.setup()
    renderEditor('/editor/cases/c1')
    const description = await screen.findByLabelText('Fallbeschreibung')
    await user.type(description, ' Er blutet leicht.')

    expect(publishButton()).toBeDisabled()
    expect(publishButton()).toHaveAccessibleDescription('Erst speichern')

    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(publishButton()).toBeEnabled())
    const put = requests.find((r) => r.method === 'PUT')
    expect(put?.body).toMatchObject({ description: `${detail.description} Er blutet leicht.` })

    await user.click(publishButton())
    expect(await screen.findByText('Als Revision 1 veröffentlicht.')).toBeInTheDocument()
    expect(requests.some((r) => r.method === 'POST' && r.url === `${CASE_URL}/publish`)).toBe(true)
  })

  it('shows the server mismatch error when publishing is rejected with 422', async () => {
    mockApi(({ method }) =>
      method === 'POST'
        ? jsonResponse({ error: 'expected_category_mismatch', expected: 'red', computed: 'yellow' }, 422)
        : jsonResponse(makeDetail()),
    )
    renderEditor('/editor/cases/c1')
    await screen.findByLabelText('Fallbeschreibung')
    await userEvent.click(publishButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Veröffentlichen abgelehnt: Soll-Kategorie SK 1, berechnet SK 2.',
    )
  })

  it('maps a 400 validation issue to the description field', async () => {
    mockApi(({ method }) =>
      method === 'PUT'
        ? jsonResponse({ error: 'validation', issues: [{ path: 'description', message: 'Too small' }] }, 400)
        : jsonResponse(makeDetail()),
    )
    const user = userEvent.setup()
    renderEditor('/editor/cases/c1')
    const description = await screen.findByLabelText('Fallbeschreibung')
    await user.type(description, '!')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(description).toHaveAttribute('aria-invalid', 'true'))
    expect(description).toHaveAccessibleDescription(/Bitte 10 bis 4000 Zeichen eingeben\./)
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte die markierten Felder prüfen.')
  })

  it('runs a trial triage with the current form state', async () => {
    mockApi(() => jsonResponse(makeDetail()))
    const user = userEvent.setup()
    renderEditor('/editor/cases/c1')
    const description = await screen.findByLabelText('Fallbeschreibung')
    await user.clear(description)
    await user.type(description, 'Kind sitzt weinend am Straßenrand.')
    await user.click(screen.getByRole('button', { name: 'Probe-Sichtung' }))
    expect(screen.getByText('Patient 1 von 1')).toBeInTheDocument()
    expect(screen.getByText('Kind sitzt weinend am Straßenrand.')).toBeInTheDocument()
  })

  it('creates a new case and continues editing it under its id', async () => {
    const created = makeDetail({ id: 'new-1', slug: null })
    const requests = mockApi(({ method }) => (method === 'POST' ? jsonResponse(created, 201) : jsonResponse(created)))
    const user = userEvent.setup()
    const router = renderEditor('/editor/cases/new')
    await user.type(screen.getByLabelText('Fallbeschreibung'), created.description)
    await user.type(screen.getByLabelText('Begründung'), created.reasoning)
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/editor/cases/new-1'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const post = requests.find((r: ApiRequest) => r.method === 'POST')
    expect(post?.body).toMatchObject({ findings: defaultFindings(), expectedCategory: 'yellow' })
    expect(await screen.findByRole('heading', { name: 'Fall bearbeiten' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fallbeschreibung')).toHaveValue(created.description)
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert.')
  })

  it('asks before leaving with unsaved changes', async () => {
    mockApi(({ url }) => (url === CASE_URL ? jsonResponse(makeDetail()) : jsonResponse({ cases: [] })))
    const user = userEvent.setup()
    const router = renderEditor('/editor/cases/c1')
    await user.type(await screen.findByLabelText('Fallbeschreibung'), '!')
    await user.click(screen.getByRole('link', { name: /Zur Fallliste/ }))

    const dialog = await screen.findByRole('dialog', { name: 'Änderungen verwerfen?' })
    expect(within(dialog).getByRole('button', { name: 'Weiter bearbeiten' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: 'Weiter bearbeiten' }))
    expect(router.state.location.pathname).toBe('/editor/cases/c1')

    await user.click(screen.getByRole('link', { name: /Zur Fallliste/ }))
    await user.click(await screen.findByRole('button', { name: 'Verwerfen' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/editor'))
  })

  it('deletes an unpublished draft after confirmation', async () => {
    const requests = mockApi(({ method, url }) => {
      if (method === 'DELETE') return new Response(null, { status: 204 })
      return url === CASE_URL ? jsonResponse(makeDetail()) : jsonResponse({ cases: [] })
    })
    const user = userEvent.setup()
    const router = renderEditor('/editor/cases/c1')
    await user.click(await screen.findByRole('button', { name: 'Löschen' }))
    const dialog = screen.getByRole('dialog', { name: 'Fall löschen?' })
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false)
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/editor'))
    expect(requests.some((r) => r.method === 'DELETE' && r.url === CASE_URL)).toBe(true)
  })

  it('offers no delete for published cases and flags unpublished changes', async () => {
    mockApi(() =>
      jsonResponse(makeDetail({ status: 'published', publishedRevisionNumber: 2, hasUnpublishedChanges: true })),
    )
    renderEditor('/editor/cases/c1')
    await screen.findByLabelText('Fallbeschreibung')
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()
    expect(screen.getByText('Änderungen noch nicht veröffentlicht')).toBeInTheDocument()
    expect(publishButton()).toBeEnabled()
  })

  it('shows a not-found message for an unknown case', async () => {
    mockApi(() => jsonResponse({ error: 'not_found' }, 404))
    renderEditor('/editor/cases/unknown')
    expect(await screen.findByText('Fall nicht gefunden')).toBeInTheDocument()
  })
})
