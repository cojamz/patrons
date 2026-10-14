import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { engineSourceHashSafe } from './scripts/v4-src-hash.mjs'

export default defineConfig({
  plugins: [react()],
  // the rules-source hash in the content stamp, as in the build (vite.config.js; src/v4/session/record.js)
  define: { __V4_SRC__: JSON.stringify(engineSourceHashSafe()) },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // build snapshots and freeze worktrees are never test sources
    exclude: ['**/node_modules/**', '**/dist/**', '.v4-wt/**', '.v4-panel/**', '.v4-build*/**'],
    // No wall-clock budgets on deterministic work: engine and fuzz tests are bounded by game and move counts, session
    // tests by fake-timer steps (helpers.js untilFake). A slow, loaded box must not turn green into red. This is only
    // a backstop for a test that truly hangs (an awaited promise that never settles).
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
})
