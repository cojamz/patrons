// One command for the whole v4 quality gate: unit + fuzz tests, production build, browser e2e.
// Usage: npm run check:v4   (add --fast to skip e2e)
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';

const fast = process.argv.includes('--fast');
// Parallel agents: give each its own build dir and port (V4_OUTDIR, V4_PORT) so they never serve each other's builds.
const outDir = process.env.V4_OUTDIR || '.v4-build';
const results = [];
const run = (name, cmd, args, opts = {}) => new Promise(res => {
  const t0 = Date.now();
  const p = spawn(cmd, args, { stdio: opts.quiet ? 'pipe' : 'inherit', env: { ...process.env, ...opts.env } });
  let out = '';
  if (opts.quiet) { p.stdout.on('data', d => (out += d)); p.stderr.on('data', d => (out += d)); }
  p.on('close', code => { results.push({ name, ok: code === 0, s: ((Date.now() - t0) / 1000).toFixed(1) }); if (code && opts.quiet) console.log(out.slice(-4000)); res(code === 0); });
});

await run('engine + session + ui tests', 'npx', ['vitest', 'run', 'src/test/engine/v4', 'src/test/v4', '--exclude', 'src/test/engine/v4/spheres/**']);
await run('production build', 'npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], { quiet: true });

if (!fast && existsSync('e2e/v4')) {
  const port = Number(process.env.V4_PORT || 5180);
  const server = spawn('npx', ['vite', 'preview', '--outDir', outDir, '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  // wait until the preview server answers (up to 30s)
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
  for (const f of readdirSync('e2e/v4').filter(f => f.endsWith('.mjs')).sort())
    await run(`e2e ${f}`, 'node', [`e2e/v4/${f}`], { env: { V4_URL: `http://localhost:${port}` } });
  server.kill();
}

console.log('\n── v4 check ──');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.s}s)`);
process.exit(results.every(r => r.ok) ? 0 : 1);
