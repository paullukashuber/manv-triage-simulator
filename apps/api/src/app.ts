import Fastify, { type FastifyInstance } from 'fastify'
import { createAuth } from './auth/auth.ts'
import { registerAuthRoutes } from './auth/routes.ts'
import type { Config } from './config.ts'
import { registerTrainingRoutes } from './cases/training-routes.ts'
import type { Db } from './db/client.ts'

export type AppDeps = { db: Db; config: Config }

export async function buildApp({ db, config }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: config.nodeEnv !== 'test' })

  const auth = createAuth({ db, config })
  app.decorate('auth', auth)
  app.decorateRequest('user', undefined)
  registerAuthRoutes(app, auth, config.publicUrl)

  app.get('/api/health', async () => ({ status: 'ok' }))

  registerTrainingRoutes(app, db)

  return app
}
