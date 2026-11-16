import { existsSync } from 'node:fs'
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
 * Migrations are generated into apps/api/drizzle. This module runs from
 * src/db/ (tests, tsx) or is bundled into dist/ (tsup), so probe both layouts.
 */
function migrationsFolder(): string {
  for (const rel of ['../../drizzle', '../drizzle']) {
    const path = fileURLToPath(new URL(rel, import.meta.url))
    if (existsSync(path)) return path
  }
  throw new Error('Migrations folder apps/api/drizzle not found')
}

export function createDb(url: string): { db: Db; close(): Promise<void> } {
  const client = postgres(url)
  const db = drizzlePostgres(client, { schema })
  migrators.set(db, (migrationsFolder) => migratePostgres(db, { migrationsFolder }))
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
  migrators.set(db, (migrationsFolder) => migratePglite(db, { migrationsFolder }))
  await migrateDb(db)
  return db
}
