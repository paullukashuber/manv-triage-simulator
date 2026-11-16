import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveMigrationsFolder } from './client.ts'

let root: string

function makeMigrations(dir: string) {
  mkdirSync(join(dir, 'meta'), { recursive: true })
  writeFileSync(join(dir, 'meta', '_journal.json'), '{}')
}

function moduleUrl(...segments: string[]) {
  const file = join(root, ...segments)
  mkdirSync(join(file, '..'), { recursive: true })
  return pathToFileURL(file).href
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'manv-migrations-'))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('resolveMigrationsFolder', () => {
  it('resolves ../drizzle from a bundled dist/server.js', () => {
    makeMigrations(join(root, 'app', 'drizzle'))
    expect(resolveMigrationsFolder(moduleUrl('app', 'dist', 'server.js'))).toBe(join(root, 'app', 'drizzle'))
  })

  it('resolves ../../drizzle from src/db/client.ts', () => {
    makeMigrations(join(root, 'api', 'drizzle'))
    expect(resolveMigrationsFolder(moduleUrl('api', 'src', 'db', 'client.ts'))).toBe(join(root, 'api', 'drizzle'))
  })

  it('prefers the module-adjacent candidate over an unrelated folder further up', () => {
    makeMigrations(join(root, 'app', 'drizzle'))
    makeMigrations(join(root, 'drizzle'))
    expect(resolveMigrationsFolder(moduleUrl('app', 'dist', 'server.js'))).toBe(join(root, 'app', 'drizzle'))
  })

  it('ignores a drizzle folder without meta/_journal.json', () => {
    mkdirSync(join(root, 'app', 'drizzle'), { recursive: true })
    expect(() => resolveMigrationsFolder(moduleUrl('app', 'dist', 'server.js'))).toThrow(/Migrations folder/)
  })
})
