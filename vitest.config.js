import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { getPriority, setPriority } from 'node:os'
import { engineSourceHashSafe } from './scripts/v4-src-hash.mjs'

// Unit tests yield the CPU to browsers, builds and dev servers on this shared 4-CPU box: every vitest run (the gate's
// and any agent's own) runs at nice 10 or lower priority, and its workers inherit it, so a test run never skews an
// e2e timing gate or a blind tester's game. Tests carry no wall-clock budgets, so this only changes who waits.
// V4_VITEST_NICE=0 opts out.
try { const nice = Number(process.env.V4_VITEST_NICE ?? 10); if (getPriority() < nice) setPriority(nice) } catch { /* not permitted: run as is */ }

export default defineConfig({
  plugins: [react()],
  // the rules-source hash in the content stamp, as in the build (vite.config.js; src/v4/session/record.js)
  define: { __V4_SRC__: JSON.stringify(engineSourceHashSafe()) },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // a whole-suite `vitest run` outside check:v4 waits for a check slot like a quick check (scripts/lib/vitest-slot.mjs)
    globalSetup: ['./scripts/lib/vitest-slot.mjs'],
    // 2 workers for an agent's own run (V4_VITEST_WORKERS changes it): eleven agents at vitest's default of 3 each put
    // 33 workers on 4 CPUs (2026-10-15). check:v4 passes its own --maxWorkers.
    maxWorkers: Number(process.env.V4_VITEST_WORKERS) || 2,
    // build snapshots, freeze worktrees and agents' worktrees are never test sources
    exclude: ['**/node_modules/**', '**/dist/**', '.v4-wt/**', '.v4-panel/**', '.v4-build*/**', '.claude/worktrees/**'],
    // No wall-clock budgets on deterministic work: engine and fuzz tests are bounded by game and move counts, session
    // tests by fake-timer steps (helpers.js untilFake). A slow, loaded box must not turn green into red. This is only
    // a backstop for a test that truly hangs (an awaited promise that never settles).
    testTimeout: 600_000,
    hookTimeout: 600_000,
  },
})
