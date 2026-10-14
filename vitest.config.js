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
  },
})
