import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createDb, migrateDb } from './db/client.ts'
import { SEED_CASES } from './seed/cases.ts'
import { seedCases } from './seed/seed.ts'

const config = loadConfig(process.env)
const { db, close } = createDb(config.databaseUrl)

let app: Awaited<ReturnType<typeof buildApp>>
try {
  await migrateDb(db)
  app = await buildApp({ db, config })
  const { inserted } = await seedCases(db, SEED_CASES, { publish: config.seedPublish })
  app.log.info({ inserted }, 'seeded cases')
  // Closing the app also closes the DB client (onClose hook).
  app.addHook('onClose', close)
  await app.listen({ host: '0.0.0.0', port: config.port })
} catch (error) {
  console.error('Startup failed:', error)
  await close().catch(() => undefined)
  process.exit(1)
}

let shuttingDown = false
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return
    shuttingDown = true
    app.log.info({ signal }, 'shutting down')
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error(error, 'shutdown failed')
        process.exit(1)
      },
    )
  })
}
