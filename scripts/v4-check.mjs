// One command for the whole v4 quality gate: unit + fuzz + sphere tests, production build, browser e2e.
// Usage: npm run check:v4   (add --fast to skip e2e and play a slice of each seeded-game block: V4_GAMES=fast,
// see src/test/engine/v4/budget.js). Every sphere a table can pick is gated. Tests carry no wall-clock budgets:
// game and move counts bound the engine work, fake timers the session waits (vitest.config.js has a hang backstop).
// Processes: vitest, the build and each e2e run in their own process group and die with this script, however it ends
// (scripts/lib/procs.mjs); the preview server runs inside this process, on a port checked free before it starts, and
// is confirmed to be serving this run's outDir before any e2e touches it.
import { readdirSync, existsSync } from 'node:fs';
import { runChild, exitOf, VITE, VITEST, portBusy, busyMessage, servePreview } from './lib/procs.mjs';

const fast = process.argv.includes('--fast');
const started = Date.now();
// Parallel agents: give each its own build dir and port (V4_OUTDIR, V4_PORT) so they never serve each other's builds.
const outDir = process.env.V4_OUTDIR || '.v4-build';
const port = Number(process.env.V4_PORT || 5180);
const e2e = !fast && existsSync('e2e/v4');
const results = [];
const run = async (name, args, opts = {}) => {
  const t0 = Date.now();
  const child = runChild(process.execPath, args, opts);
  const code = await exitOf(child);
  results.push({ name, ok: code === 0, s: ((Date.now() - t0) / 1000).toFixed(1) });
  if (code && opts.quiet) console.log(child.output.slice(-4000));
  return code === 0;
};

// refuse a busy port now, not after ten minutes of tests: whoever is there would answer the e2e with another build
if (e2e && (await portBusy(port))) { console.error(busyMessage(port)); process.exit(2); }

await run('engine + spheres + session + ui tests', [VITEST, 'run', 'src/test/engine/v4', 'src/test/v4'], { env: fast ? { V4_GAMES: 'fast' } : {} });
const built = await run('production build', [VITE, 'build', '--outDir', outDir, '--emptyOutDir'], { quiet: true });

if (e2e) {
  if (!built) { console.error('no build to test: skipping e2e'); results.push({ name: 'e2e (no build)', ok: false, s: '0.0' }); }
  else {
    let server;
    try { server = await servePreview({ outDir, port }); } catch (err) { console.error(err.message); process.exit(2); }
    for (const f of readdirSync('e2e/v4').filter(f => f.endsWith('.mjs')).sort())
      await run(`e2e ${f}`, [`e2e/v4/${f}`], { env: { V4_URL: server.url } });
    await server.close();
  }
}

console.log('\n── v4 check ──');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.s}s)`);
console.log(`total ${((Date.now() - started) / 1000).toFixed(1)}s${fast ? ' (--fast)' : ''}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
