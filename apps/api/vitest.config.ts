import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@manv/api',
    // Every DB test boots its own PGlite (WASM) and runs all migrations; while the whole
    // monorepo suite runs in parallel that alone can take several seconds per test.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
