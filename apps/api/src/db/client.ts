import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.ts'

/** Common query-builder surface shared by postgres.js (production) and PGlite (tests). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

type Migrate = (folder: string) => Promise<void>

// Each factory registers the driver-specific migrator for the Db it creates.
const migrators = new WeakMap<Db, Migrate>()

/**
 * Migrations are generated into apps/api/drizzle. The module runs from src/db/
 * (tests, tsx) or is bundled into dist/ (tsup; the image ships drizzle/ next to dist/).
 * The candidate for the current layout is probed first, and a folder only counts
 * when it holds meta/_journal.json, so an unrelated "drizzle" directory is never used.
 */
export function resolveMigrationsFolder(moduleUrl: string): string {
  const inSourceTree = basename(dirname(fileURLToPath(moduleUrl))) === 'db'
  const candidates = inSourceTree ? ['../../drizzle', '../drizzle'] : ['../drizzle', '../../drizzle']
  for (const rel of candidates) {
    const path = fileURLToPath(new URL(rel, moduleUrl))
    if (existsSync(join(path, 'meta', '_journal.json'))) return path
  }
  throw new Error('Migrations folder (drizzle/meta/_journal.json) not found')
}

const migrationsFolder = () => resolveMigrationsFolder(import.meta.url)

export function createDb(url: string): { db: Db; close(): Promise<void> } {
  // Drop server NOTICEs (e.g. "schema drizzle already exists" on every migrate); errors still throw.
  const client = postgres(url, { onnotice: () => undefined })
  const db = drizzlePostgres(client, { schema })
  migrators.set(db, (folder) => migratePostgres(db, { migrationsFolder: folder }))
  return { db, close: () => client.end() }
}

export async function migrateDb(db: Db): Promise<void> {
  const migrate = migrators.get(db)
  if (!migrate) throw new Error('Db was not created by createDb/createTestDb')
  await migrate(migrationsFolder())
}

// PGlite is a devDependency: import it lazily so the production bundle never loads it.
export async function createTestDb(): Promise<Db> {
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrate: migratePglite }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ])
  const db = drizzlePglite(new PGlite(), { schema })
  migrators.set(db, (folder) => migratePglite(db, { migrationsFolder: folder }))
  await migrateDb(db)
  return db
}
