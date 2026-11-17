import type { CaseDetail, CaseFilter, CaseInput, CaseSummary } from '@manv/triage'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api.ts'

const BASE = '/api/editor/cases'

function caseUrl(id: string, action?: string): string {
  const path = `${BASE}/${encodeURIComponent(id)}`
  return action ? `${path}/${action}` : path
}

function post(url: string, body?: unknown): Promise<CaseDetail> {
  return apiFetch<CaseDetail>(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
}

export const editorApi = {
  async listCases(filter: CaseFilter): Promise<CaseSummary[]> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filter)) if (value !== undefined) params.set(key, value)
    const query = params.toString()
    const body = await apiFetch<{ cases: CaseSummary[] }>(query ? `${BASE}?${query}` : BASE)
    return body.cases
  },
  getCase: (id: string) => apiFetch<CaseDetail>(caseUrl(id)),
  createCase: (input: CaseInput) => post(BASE, input),
  updateCase: (id: string, input: CaseInput) =>
    apiFetch<CaseDetail>(caseUrl(id), { method: 'PUT', body: JSON.stringify(input) }),
  duplicateCase: (id: string) => post(caseUrl(id, 'duplicate')),
  publishCase: (id: string) => post(caseUrl(id, 'publish')),
  archiveCase: (id: string) => post(caseUrl(id, 'archive')),
  restoreCase: (id: string) => post(caseUrl(id, 'restore')),
  deleteCase: (id: string) => apiFetch<void>(caseUrl(id), { method: 'DELETE' }),
}

export const editorKeys = {
  lists: ['editor', 'cases'] as const,
  list: (filter: CaseFilter) => ['editor', 'cases', filter] as const,
  detail: (id: string) => ['editor', 'case', id] as const,
}

export function useCaseList(filter: CaseFilter) {
  return useQuery({
    queryKey: editorKeys.list(filter),
    queryFn: () => editorApi.listCases(filter),
    placeholderData: keepPreviousData,
  })
}

export function useCaseDetail(id: string | undefined) {
  return useQuery({
    queryKey: editorKeys.detail(id ?? ''),
    queryFn: () => editorApi.getCase(id ?? ''),
    enabled: id !== undefined,
    // Der Arbeitsstand liegt im Formular; ein Refetch beim Fensterwechsel würde ihn nicht ändern.
    refetchOnWindowFocus: false,
  })
}

/** Mutation returning a case: its result is written to the detail cache, all lists are refreshed. */
export function useCaseMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<CaseDetail>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (detail) => {
      queryClient.setQueryData(editorKeys.detail(detail.id), detail)
      void queryClient.invalidateQueries({ queryKey: editorKeys.lists })
    },
  })
}

export function useDeleteCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editorApi.deleteCase,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: editorKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: editorKeys.lists })
    },
  })
}
