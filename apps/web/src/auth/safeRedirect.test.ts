import { describe, expect, it } from 'vitest'
import { safeRedirect } from './safeRedirect.ts'

describe('safeRedirect', () => {
  it.each(['/editor', '/editor/cases/abc', '/admin/users?x=1'])('allows %s', (value) => {
    expect(safeRedirect(value)).toBe(value)
  })

  it.each([null, '', 'editor', '//evil.example', 'https://evil.example', '/\\evil.example', '/a\\b', 'javascript:alert(1)'])(
    'falls back for %s',
    (value) => {
      expect(safeRedirect(value)).toBe('/editor')
    },
  )
})
