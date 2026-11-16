import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createDb, migrateDb } from './db/client.ts'
import { SEED_CASES } from './seed/cases.ts'
import { seedCases } from './seed/seed.ts'

const config = loadConfig(process.env)
const { db, close } = createDb(config.databaseUrl)
await migrateDb(db)

const app = await buildApp({ db, config })
const { inserted } = await seedCases(db, SEED_CASES, {
  publish: config.seedPublish,
})
app.log.info({ inserted }, 'seeded cases')
app.addHook('onClose', close)
await app.listen({ host: '0.0.0.0', port: config.port })
