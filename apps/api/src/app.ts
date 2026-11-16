import Fastify, { type FastifyInstance } from 'fastify'
import type { Config } from './config.ts'
import { registerTrainingRoutes } from './cases/training-routes.ts'
import type { Db } from './db/client.ts'

export type AppDeps = { db: Db; config: Config }

export async function buildApp({ db, config }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.nodeEnv !== 'test' })

  app.get('/api/health', async () => ({ status: 'ok' }))

  registerTrainingRoutes(app, db)

  return app
}
