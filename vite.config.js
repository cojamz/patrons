import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { engineSourceHashSafe } from './scripts/v4-src-hash.mjs'

// The build id stamped on v4 games, saves and rooms (src/v4/session/record.js): Netlify's commit, else the local git
// commit, plus the build time. Diagnostic only; compatibility is decided by the rules-content hash.
function buildId() {
  let sha = (process.env.COMMIT_REF || '').slice(0, 7)
  if (!sha) try { sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { sha = 'nogit' }
  return `${sha}@${new Date().toISOString().slice(0, 16)}Z`
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // __V4_SRC__: a hash of the rules source, part of the content stamp (record.js), so effect changes refuse old rooms/saves
  define: { __V4_BUILD__: JSON.stringify(buildId()), __V4_SRC__: JSON.stringify(engineSourceHashSafe()) },
  // agents' worktrees, frozen builds, build dirs and design notes are not app source: watching and dep-scanning them made a
  // cold `vite` crawl for minutes (2026-10-15)
  server: { watch: { ignored: ['**/.v4-wt/**', '**/.v4-panel/**', '**/.v4-build*/**', '**/.v4-perf/**', '**/design/**', '**/archive/**'] } },
  optimizeDeps: { entries: ['index.html'] },
})
