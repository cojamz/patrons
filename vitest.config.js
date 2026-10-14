import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
