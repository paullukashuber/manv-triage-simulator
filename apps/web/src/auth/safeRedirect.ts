const FALLBACK = '/editor'

/** Allows only same-origin absolute paths; everything else falls back to the editor. */
export function safeRedirect(value: string | null): string {
  if (value === null || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return FALLBACK
  return value
}
