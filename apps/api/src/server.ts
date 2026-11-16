import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createDb, migrateDb } from './db/client.ts'

const config = loadConfig(process.env)
const { db, close } = createDb(config.databaseUrl)
await migrateDb(db)

const app = await buildApp({ db, config })
app.addHook('onClose', close)
await app.listen({ host: '0.0.0.0', port: config.port })
