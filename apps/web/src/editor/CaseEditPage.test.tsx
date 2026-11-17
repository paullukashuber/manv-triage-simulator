import { defaultFindings, type CaseInput } from '@manv/triage'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toCaseInput } from './caseInput.ts'
import { jsonResponse, makeDetail, mockApi, renderEditor, type ApiRequest } from '../test/editor-fixtures.tsx'

beforeEach(() => {
  localStorage.setItem('manv:prototype-ack', '1')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const CASE_URL = '/api/editor/cases/c1'
const DRAFT_KEY = 'manv:case-draft:c1'
const NEW_DRAFT_KEY = 'manv:case-draft:new'

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
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  describe('unsaved drafts', () => {
    const RESTORED = 'Nicht gespeicherte Änderungen wiederhergestellt.'

    function storedDraft(key = DRAFT_KEY) {
      const raw = sessionStorage.getItem(key)
      return raw === null ? null : (JSON.parse(raw) as CaseInput)
    }

    // Simulates the global 401 handler: RequireRole unmounts the editor, the user signs in again
    // and lands on the same case.
    async function editThenRemount(text: string) {
      const detail = makeDetail()
      mockApi(() => jsonResponse(detail))
      const user = userEvent.setup()
      renderEditor('/editor/cases/c1')
      await user.type(await screen.findByLabelText('Fallbeschreibung'), text)
      await waitFor(() => expect(storedDraft()?.description).toBe(detail.description + text))
      cleanup()
      renderEditor('/editor/cases/c1')
      return { detail, user }
    }

    it('restores unsaved input after the editor was unmounted', async () => {
      const { detail } = await editThenRemount(' Er blutet.')
      expect(await screen.findByLabelText('Fallbeschreibung')).toHaveValue(`${detail.description} Er blutet.`)
      expect(screen.getByText(RESTORED)).toBeInTheDocument()
      expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled()
    })

    it('discards a restored draft', async () => {
      const { detail, user } = await editThenRemount(' Er blutet.')
      await screen.findByText(RESTORED)
      await user.click(screen.getByRole('button', { name: 'Verwerfen' }))
      expect(screen.getByLabelText('Fallbeschreibung')).toHaveValue(detail.description)
      expect(screen.queryByText(RESTORED)).not.toBeInTheDocument()
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument()
      expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
    })

    it('clears the draft after a successful save', async () => {
      const detail = makeDetail()
      mockApi(({ method, body }) =>
        method === 'PUT' ? jsonResponse({ ...detail, ...(body as CaseInput) }) : jsonResponse(detail),
      )
      const user = userEvent.setup()
      renderEditor('/editor/cases/c1')
      await user.type(await screen.findByLabelText('Fallbeschreibung'), '!')
      await waitFor(() => expect(storedDraft()).not.toBeNull())
      await user.click(screen.getByRole('button', { name: 'Speichern' }))
      expect(await screen.findByText('Gespeichert.')).toBeInTheDocument()
      expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
    })

    it('keeps a draft of a new case under "new" and clears it once created', async () => {
      const created = makeDetail({ id: 'new-1', slug: null })
      mockApi(({ method }) => (method === 'POST' ? jsonResponse(created, 201) : jsonResponse(created)))
      const user = userEvent.setup()
      renderEditor('/editor/cases/new')
      await user.type(screen.getByLabelText('Fallbeschreibung'), created.description)
      await waitFor(() => expect(storedDraft(NEW_DRAFT_KEY)?.description).toBe(created.description))

      cleanup()
      const again = renderEditor('/editor/cases/new')
      expect(await screen.findByLabelText('Fallbeschreibung')).toHaveValue(created.description)
      expect(screen.getByText(RESTORED)).toBeInTheDocument()
      await user.type(screen.getByLabelText('Begründung'), created.reasoning)
      await user.click(screen.getByRole('button', { name: 'Speichern' }))
      await waitFor(() => expect(again.state.location.pathname).toBe('/editor/cases/new-1'))
      expect(sessionStorage.getItem(NEW_DRAFT_KEY)).toBeNull()
    })

    it.each([
      ['unreadable', () => '{"description":42'],
      ['malformed', () => JSON.stringify({ ...toCaseInput(makeDetail()), findings: { ambulatory: 'yes' } })],
      ['equal to the server value', () => JSON.stringify(toCaseInput(makeDetail()))],
    ])('ignores and removes a stored draft that is %s', async (_label, stored) => {
      const detail = makeDetail()
      sessionStorage.setItem(DRAFT_KEY, stored())
      mockApi(() => jsonResponse(detail))
      renderEditor('/editor/cases/c1')
      expect(await screen.findByLabelText('Fallbeschreibung')).toHaveValue(detail.description)
      expect(screen.queryByText(RESTORED)).not.toBeInTheDocument()
      await waitFor(() => expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull())
    })

    it('keeps editing when the storage is unavailable', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })
      mockApi(() => jsonResponse(makeDetail()))
      const user = userEvent.setup()
      renderEditor('/editor/cases/c1')
      await user.type(await screen.findByLabelText('Fallbeschreibung'), '!')
      expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument()
    })
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
