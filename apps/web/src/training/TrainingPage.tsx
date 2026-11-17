import { PrototypeModal } from '../components/ui/PrototypeModal.tsx'
import { StartScreen, type StartStatus } from './screens/StartScreen.tsx'
import { TrainingRunner } from './TrainingRunner.tsx'
import { useTrainingCases } from './useTrainingCases.ts'

export function TrainingPage() {
  const { requestId, started, cases, isLoading, isError, start, reset } = useTrainingCases()

  let status: StartStatus = 'idle'
  if (started) {
    if (isLoading) status = 'loading'
    else if (isError) status = 'error'
    else if (cases?.length === 0) status = 'empty'
  }

  return (
    <main className="mx-auto max-w-[480px] min-h-dvh flex flex-col gap-3 p-4">
      {cases && cases.length > 0 ? (
        <TrainingRunner key={requestId} cases={cases} mode="session" onExit={reset} onRetry={start} />
      ) : (
        <StartScreen status={status} onStart={start} />
      )}
      <PrototypeModal />
    </main>
  )
}
