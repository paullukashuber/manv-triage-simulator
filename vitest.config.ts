import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// apps/* kommt erst in späteren Tasks hinzu; ein leerer Glob darf nicht fehlschlagen.
const projects = ['packages/*']
if (existsSync(new URL('./apps', import.meta.url))) projects.push('apps/*')

export default defineConfig({
  test: { projects },
})
