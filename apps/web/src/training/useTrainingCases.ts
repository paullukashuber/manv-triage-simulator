import { trainingCaseSchema, type TrainingCase } from '@manv/triage'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../lib/api.ts'

const CASE_COUNT = 10
const casesSchema = trainingCaseSchema.array()

async function fetchTrainingCases(): Promise<TrainingCase[]> {
  const body = await apiFetch<{ cases?: unknown } | undefined>(`/api/training/cases?count=${CASE_COUNT}`)
  return casesSchema.parse(body?.cases)
}

/**
 * Loads a fresh case set only on explicit request (`start`); never on mount or window focus.
 * Every `start` uses a new query key, so "practice again" always draws new cases.
 */
export function useTrainingCases() {
  const [requestId, setRequestId] = useState(0)
  const query = useQuery({
    queryKey: ['training-cases', requestId],
    queryFn: fetchTrainingCases,
    enabled: requestId > 0,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  return {
    requestId,
    started: requestId > 0,
    cases: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    start: () => setRequestId((id) => id + 1),
    reset: () => setRequestId(0),
  }
}
