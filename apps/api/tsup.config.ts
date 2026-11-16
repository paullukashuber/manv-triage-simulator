import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: 'esm',
  target: 'node24',
  platform: 'node',
  clean: true,
  // @manv/triage ships TypeScript source; bundle it. Other node_modules stay external.
  // devDependency used only by createTestDb (dynamic import); never bundled.
  external: ['@electric-sql/pglite', 'drizzle-orm/pglite', 'drizzle-orm/pglite/migrator'],
  noExternal: ['@manv/triage'],
})
