import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { Button } from './Button.tsx'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  /** `danger` styles the confirm button as destructive. */
  tone?: 'default' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation. Focuses the (safe) cancel button on open, keeps Tab inside,
 * closes on Escape and returns focus to the previously focused element on close.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    return () => previous?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)')]
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        onKeyDown={onKeyDown}
        className="flex w-full max-w-[400px] flex-col gap-3 rounded-xl border border-border-light bg-card p-5"
      >
        <h2 id={`${id}-title`} className="text-base font-bold">
          {title}
        </h2>
        <p id={`${id}-message`} className="text-[0.85rem] leading-relaxed text-muted">
          {message}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button ref={cancelRef} variant="secondary" size="sm" className="w-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
