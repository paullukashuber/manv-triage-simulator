import { triage, type CaseDetail, type CaseInput, type TrainingCase } from '@manv/triage'
import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useBlocker, useLocation, useNavigate, useParams, type BlockerFunction } from 'react-router'
import { Button } from '../components/ui/Button.tsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx'
import { ApiError } from '../lib/api.ts'
import { TrainingRunner } from '../training/TrainingRunner.tsx'
import { editorApi, useCaseDetail, useCaseMutation, useDeleteCase } from './api.ts'
import { errorFeedback } from './apiErrors.ts'
import { clearDraft, draftKeyFor, loadDraft, saveDraft } from './caseDraft.ts'
import { CaseForm } from './CaseForm.tsx'
import { emptyCaseInput, fieldValue, isSameCaseInput, toCaseInput } from './caseInput.ts'
import { CaseStatusChip, UnpublishedChangesChip } from './CaseStatusChip.tsx'
import { EditorNotFound } from './EditorNotFound.tsx'
import { TriagePreview } from './TriagePreview.tsx'

type Notice = 'saved' | 'duplicated'
type Message = { tone: 'success' | 'error'; text: string }

export function CaseEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const detail = useCaseDetail(id)

  if (id === undefined) return <CaseEditor key="new" detail={null} />
  if (detail.isPending) {
    return (
      <p role="status" className="text-[0.82rem] text-muted">
        {t('editor.edit.loading')}
      </p>
    )
  }
  if (detail.isError) {
    if (detail.error instanceof ApiError && detail.error.status === 404) return <EditorNotFound variant="case" />
    return (
      <p role="alert" className="text-[0.82rem] text-wrong">
        {t('editor.edit.loadError')}
      </p>
    )
  }
  return <CaseEditor key={id} detail={detail.data} />
}

function noticeFrom(state: unknown): Notice | null {
  const notice = (state as { notice?: unknown } | null)?.notice
  return notice === 'saved' || notice === 'duplicated' ? notice : null
}

function CaseEditor({ detail }: { detail: CaseDetail | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const hintId = useId()

  const draftKey = draftKeyFor(detail?.id)
  const [saved, setSaved] = useState<CaseInput>(() => (detail ? toCaseInput(detail) : emptyCaseInput()))
  const [restoredDraft] = useState(() => {
    const draft = loadDraft(draftKey)
    return draft && !isSameCaseInput(draft, saved) ? draft : null
  })
  const [value, setValue] = useState<CaseInput>(restoredDraft ?? saved)
  const [showRestored, setShowRestored] = useState(restoredDraft !== null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<Message | null>(() => {
    const notice = noticeFrom(location.state)
    return notice ? { tone: 'success', text: t(`editor.edit.${notice}`) } : null
  })
  const [trialRun, setTrialRun] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const caseId = detail?.id
  const save = useCaseMutation((input: CaseInput) =>
    caseId ? editorApi.updateCase(caseId, input) : editorApi.createCase(input),
  )
  const publish = useCaseMutation(editorApi.publishCase)
  const duplicate = useCaseMutation(editorApi.duplicateCase)
  const archive = useCaseMutation(editorApi.archiveCase)
  const restore = useCaseMutation(editorApi.restoreCase)
  const remove = useDeleteCase()
  const busy = [save, publish, duplicate, archive, restore, remove].some((mutation) => mutation.isPending)

  const dirty = !isSameCaseInput(value, saved)
  const computed = triage(value.findings).category

  // Navigations we trigger ourselves after saving/deleting must not be blocked by the stale `dirty` closure.
  const allowLeave = useRef(false)
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname,
    [dirty],
  )
  const blocker = useBlocker(shouldBlock)

  // Keeps unsaved input across an unmount (e.g. the login redirect after a 401); see caseDraft.ts.
  useEffect(() => {
    if (dirty) saveDraft(draftKey, value)
    else clearDraft(draftKey)
  }, [dirty, draftKey, value])

  function discardDraft() {
    clearDraft(draftKey)
    setValue(saved)
    setErrors({})
    setShowRestored(false)
  }

  function leaveDiscarding() {
    clearDraft(draftKey)
    blocker.proceed?.()
  }

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function showTrialRun(show: boolean) {
    setTrialRun(show)
    document.documentElement.scrollTop = 0
  }

  function fail(error: unknown) {
    const feedback = errorFeedback(error, t)
    setErrors(feedback.fieldErrors)
    setMessage({ tone: 'error', text: feedback.text })
  }

  function succeed(text: string) {
    setMessage({ tone: 'success', text })
  }

  function onChange(next: CaseInput) {
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => fieldValue(next, key) === fieldValue(value, key)),
      ),
    )
    if (message?.tone === 'success') setMessage(null)
    setValue(next)
  }

  function onSave() {
    const submitted = value
    setMessage(null)
    save.mutate(submitted, {
      onSuccess: (result) => {
        const next = toCaseInput(result)
        setSaved(next)
        setValue((current) => (isSameCaseInput(current, submitted) ? next : current))
        setErrors({})
        setShowRestored(false)
        if (detail) {
          succeed(t('editor.edit.saved'))
        } else {
          clearDraft(draftKey)
          allowLeave.current = true
          void navigate(`/editor/cases/${result.id}`, { replace: true, state: { notice: 'saved' } })
        }
      },
      onError: fail,
    })
  }

  const onSaveShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 's' || !(event.metaKey || event.ctrlKey)) return
    event.preventDefault()
    if (!busy && !trialRun) onSave()
  })
  useEffect(() => {
    window.addEventListener('keydown', onSaveShortcut)
    return () => window.removeEventListener('keydown', onSaveShortcut)
  }, [])

  function runCaseAction(mutate: typeof publish.mutate, successText: (result: CaseDetail) => string) {
    if (!caseId) return
    setMessage(null)
    mutate(caseId, { onSuccess: (result) => succeed(successText(result)), onError: fail })
  }

  function onDuplicate() {
    if (!caseId) return
    setMessage(null)
    duplicate.mutate(caseId, {
      onSuccess: (copy) => void navigate(`/editor/cases/${copy.id}`, { state: { notice: 'duplicated' } }),
      onError: fail,
    })
  }

  function onDelete() {
    if (!caseId) return
    remove.mutate(caseId, {
      onSuccess: () => {
        allowLeave.current = true
        void navigate('/editor', { replace: true })
      },
      onError: (error) => {
        setConfirmDelete(false)
        fail(error)
      },
    })
  }

  let publishHint: string | null = null
  if (computed !== value.expectedCategory) publishHint = t('editor.edit.hints.mismatch')
  else if (!detail || dirty) publishHint = t('editor.edit.hints.saveFirst')
  else if (detail.status === 'archived') publishHint = t('editor.edit.hints.archived')
  else if (detail.status === 'published' && !detail.hasUnpublishedChanges) publishHint = t('editor.edit.hints.upToDate')

  if (trialRun) {
    const previewCase: TrainingCase = {
      caseId: 'preview',
      revisionId: 'preview',
      description: value.description,
      reasoning: value.reasoning,
      findings: value.findings,
      focusFields: value.focusFields,
    }
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-3">
        <button
          type="button"
          onClick={() => showTrialRun(false)}
          className="self-start text-[0.82rem] text-accent underline cursor-pointer"
        >
          {t('editor.edit.endTrialRun')}
        </button>
        <TrainingRunner cases={[previewCase]} mode="preview" onExit={() => showTrialRun(false)} />
        {blocker.state === 'blocked' && <LeaveDialog onStay={blocker.reset} onLeave={leaveDiscarding} />}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Link to="/editor" className="self-start text-[0.82rem] text-accent underline">
        {t('editor.backToList')}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">
            {detail ? t('editor.edit.editTitle') : t('editor.edit.newTitle')}
          </h1>
          {detail?.slug && <span className="font-mono text-[0.75rem] text-dim">{detail.slug}</span>}
          {detail && <CaseStatusChip status={detail.status} />}
          {detail?.publishedRevisionNumber != null && (
            <span className="text-[0.75rem] text-muted">
              {t('editor.revision', { number: String(detail.publishedRevisionNumber) })}
            </span>
          )}
          {detail?.hasUnpublishedChanges && <UnpublishedChangesChip />}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="secondary" size="sm" onClick={() => showTrialRun(true)}>
            {t('editor.edit.trialRun')}
          </Button>
          {detail && (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || dirty}
                title={dirty ? t('editor.edit.hints.saveFirst') : undefined}
                onClick={onDuplicate}
              >
                {t('editor.edit.duplicate')}
              </Button>
              {detail.status === 'archived' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => runCaseAction(restore.mutate, () => t('editor.edit.restored'))}
                >
                  {t('editor.edit.restore')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => runCaseAction(archive.mutate, () => t('editor.edit.archived'))}
                >
                  {t('editor.edit.archive')}
                </Button>
              )}
              {detail.publishedRevisionNumber === null && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  {t('editor.edit.delete')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {showRestored && dirty && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sk2/40 bg-sk2/10 px-3 py-2 text-[0.85rem]"
        >
          <span>{t('editor.edit.draftRestored')}</span>
          <Button variant="secondary" size="sm" onClick={discardDraft}>
            {t('editor.edit.discardDraft')}
          </Button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <CaseForm value={value} onChange={onChange} errors={errors} />
        <aside className="lg:sticky lg:top-4">
          <TriagePreview findings={value.findings} expectedCategory={value.expectedCategory} />
        </aside>
      </div>

      <div className="sticky-actions -mx-4 mt-auto flex flex-col gap-2 border-t border-border">
        {message && (
          <p
            role={message.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-lg border px-3 py-2 text-[0.85rem] ${
              message.tone === 'error' ? 'border-wrong/40 bg-wrong/10' : 'border-correct/40 bg-correct/10'
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-col text-[0.78rem] leading-snug sm:mr-auto">
            <p aria-live="polite" className="font-bold text-sk2">
              {dirty ? t('editor.edit.dirty') : ''}
            </p>
            {publishHint && (
              <p id={hintId} className="text-muted">
                {publishHint}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-96">
            <Button size="sm" className="w-full" disabled={busy || (detail !== null && !dirty)} onClick={onSave}>
              {save.isPending ? t('editor.edit.saving') : t('editor.edit.save')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={busy || publishHint !== null}
              aria-describedby={publishHint ? hintId : undefined}
              onClick={() =>
                runCaseAction(publish.mutate, (result) =>
                  t('editor.edit.published', { number: String(result.publishedRevisionNumber ?? '') }),
                )
              }
            >
              {t('editor.edit.publish')}
            </Button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('editor.confirm.deleteTitle')}
          message={t('editor.confirm.deleteText')}
          confirmLabel={t('editor.confirm.deleteConfirm')}
          cancelLabel={t('editor.confirm.deleteCancel')}
          tone="danger"
          busy={remove.isPending}
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {blocker.state === 'blocked' && <LeaveDialog onStay={blocker.reset} onLeave={leaveDiscarding} />}
    </div>
  )
}

function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      title={t('editor.confirm.leaveTitle')}
      message={t('editor.confirm.leaveText')}
      confirmLabel={t('editor.confirm.leaveConfirm')}
      cancelLabel={t('editor.confirm.leaveCancel')}
      tone="danger"
      onConfirm={onLeave}
      onCancel={onStay}
    />
  )
}
