import { defaultFindings, type CaseDetail, type CaseSummary } from '@manv/triage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { CaseEditPage } from '../editor/CaseEditPage.tsx'
import { CaseListPage } from '../editor/CaseListPage.tsx'
import { EditorNotFound } from '../editor/EditorNotFound.tsx'

export function makeDetail(overrides: Partial<CaseDetail> = {}): CaseDetail {
  return {
    id: 'c1',
    slug: 'legacy-1',
    description: 'Erwachsener liegt am Boden und ist ansprechbar.',
    reasoning: 'Keines der Kriterien trifft zu, daher SK 2.',
    findings: defaultFindings(),
    expectedCategory: 'yellow',
    focusFields: [],
    tags: ['Einstieg'],
    computedCategory: 'yellow',
    decisiveStep: null,
    status: 'draft',
    publishedRevisionNumber: null,
    hasUnpublishedChanges: false,
    createdAt: '2026-11-16T10:00:00.000Z',
    updatedAt: '2026-11-16T10:00:00.000Z',
    ...overrides,
  }
}

export function makeSummary(overrides: Partial<CaseDetail> = {}): CaseSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reasoning, findings, ...summary } = makeDetail(overrides)
  return summary
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export type ApiRequest = { method: string; url: string; body: unknown }

/** Stubs `fetch`; every request is recorded and answered by `handler`. */
export function mockApi(handler: (request: ApiRequest) => Response | Promise<Response>) {
  const requests: ApiRequest[] = []
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    const request = { method: init?.method ?? 'GET', url: String(input), body }
    requests.push(request)
    return handler(request)
  })
  vi.stubGlobal('fetch', fetchMock)
  return requests
}

/** Renders the editor routes in a memory data router (needed for `useBlocker`). */
export function renderEditor(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/editor',
        children: [
          { index: true, element: <CaseListPage /> },
          { path: 'cases/new', element: <CaseEditPage /> },
          { path: 'cases/:id', element: <CaseEditPage /> },
          { path: '*', element: <EditorNotFound /> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
