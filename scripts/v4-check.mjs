// One command for the whole v4 quality gate: unit + fuzz + sphere tests, production build, browser e2e.
// `npm run check:v4 -- --help` for the options. Every sphere a table can pick is gated. Tests carry no wall-clock
// budgets: game and move counts bound the engine work, fake timers the session waits (vitest.config.js has a hang
// backstop).
// Processes: vitest, the build and each e2e run in their own process group and die with this script, however it ends
// (scripts/lib/procs.mjs); the preview server runs inside this process, on a port checked free before it starts, and
// is confirmed to be serving this run's outDir before any e2e touches it. At most V4_CHECK_SLOTS (2) runs share the
// box at once (scripts/lib/slots.mjs); a third waits and says who holds the slots.
import { readdirSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { runChild, exitOf, VITE, VITEST, portBusy, busyMessage, servePreview, removeOnExit, removeNow } from './lib/procs.mjs';
import { acquireSlot } from './lib/slots.mjs';

const HELP = `npm run check:v4 [-- options]

  --commit <sha|HEAD>  The verdict. Exports that commit (git archive) to .v4-wt/check-<sha>-<pid> with node_modules
                       symlinked, runs the tests, the build and the e2e there, then removes it. Nobody's uncommitted
                       edits can reach it. Use this for any "is it green?" that someone will act on.
  (no --commit)        The live tree, for quick iteration while you edit. NOT a verdict: other agents' uncommitted
                       edits land mid-run (a content change between the build and an e2e's engine import makes saves
                       read as "older version", and the resume e2e fail).
  --fast               Skip the browser e2e; seeded-game blocks play a slice (V4_GAMES=fast).
  V4_E2E_JOBS=<n>      e2e scripts run n at a time (default 3); info, motion and memory always run alone, last.
  V4_PHONE=1           include touch.mjs (the phone gate; outside the v0.2 verdict).
  --help               This.

  V4_OUTDIR=.v4-build-<name>  build dir (default .v4-build; inside the export with --commit)
  V4_PORT=<5281+>             preview port for the e2e (default 5180); refused up front if anything answers there
  V4_CHECK_SLOTS=2            check:v4 runs allowed at once on this box (lock dir /tmp/v4-check-slots)`;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); process.exit(0); }
const fast = argv.includes('--fast');
const ci = argv.indexOf('--commit');
const ref = ci >= 0 ? argv[ci + 1] : null;
if (ci >= 0 && (!ref || ref.startsWith('--'))) { console.error('--commit needs a commit: --commit HEAD, or a sha\n\n' + HELP); process.exit(2); }
const known = new Set(['--fast', '--commit', ref].filter(Boolean));
const unknown = argv.filter(a => !known.has(a));
if (unknown.length) { console.error(`unknown option ${unknown.join(' ')}\n\n${HELP}`); process.exit(2); }

const started = Date.now();
// Parallel agents: give each its own build dir and port (V4_OUTDIR, V4_PORT) so they never serve each other's builds.
const outDir = process.env.V4_OUTDIR || '.v4-build';
const port = Number(process.env.V4_PORT || 5180);

// --commit: the exact commit, exported where nobody else edits
let root = process.cwd(), sha = null;
if (ref) {
  const rev = spawnSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { encoding: 'utf8' });
  if (rev.status) { console.error(`--commit ${ref}: not a commit here (${(rev.stderr || '').trim()})`); process.exit(2); }
  sha = rev.stdout.trim();
}
const LIVE_WARNING = 'LIVE TREE: not a verdict. Other agents\' uncommitted edits can change the code mid-run (a content change between the build and an e2e\'s engine import fails the resume e2e). For a verdict: npm run check:v4 -- --commit HEAD';

// refuse a busy port now, not after ten minutes of tests: whoever is there would answer the e2e with another build
if (!fast && (await portBusy(port))) { console.error(busyMessage(port)); process.exit(2); }

// at most SLOTS gates on the box at once (tests and e2e both count: the slot is held for the whole run)
const what = `${sha ? `commit ${sha.slice(0, 7)}` : 'live tree'}${fast ? ' --fast' : ''}, ${outDir}${fast ? '' : `, port ${port}`}`;
await acquireSlot(what);

if (sha) {
  // sweep exports left by runs that were killed outright (their pid is gone)
  if (existsSync('.v4-wt')) for (const d of readdirSync('.v4-wt')) {
    const m = d.match(/^check-[0-9a-f]+-(\d+)$/);
    if (m) { try { process.kill(Number(m[1]), 0); } catch (err) { if (err.code === 'ESRCH') removeNow(resolve('.v4-wt', d)); } }
  }
  root = resolve('.v4-wt', `check-${sha.slice(0, 7)}-${process.pid}`);
  mkdirSync(root, { recursive: true });
  removeOnExit(root);
  const tar = spawnSync('git', ['archive', '--format=tar', sha], { maxBuffer: 2 ** 31 - 1 });
  const untar = tar.status ? tar : spawnSync('tar', ['-x', '-C', root], { input: tar.stdout, maxBuffer: 2 ** 31 - 1 });
  if (tar.status || untar.status) { console.error(`couldn't export ${sha}: ${String(tar.stderr || untar.stderr || '').trim()}`); process.exit(2); }
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  console.log(`verdict run on commit ${sha.slice(0, 7)}, exported to ${root}`);
} else {
  console.log(LIVE_WARNING);
}

const e2e = !fast && existsSync(join(root, 'e2e/v4'));
const results = [];
const run = async (name, args, opts = {}) => {
  const t0 = Date.now();
  const child = runChild(process.execPath, args, { cwd: root, ...opts });
  const code = await exitOf(child);
  results.push({ name, ok: code === 0, s: ((Date.now() - t0) / 1000).toFixed(1) });
  if (code && opts.quiet) console.log(child.output.slice(-4000));
  return code === 0;
};

// the unit tests run alongside the build and the parallel e2e (they don't depend on each other); the timing-
// sensitive e2e still run alone, after both
const unit = run('engine + spheres + session + ui tests', [VITEST, 'run', 'src/test/engine/v4', 'src/test/v4'], { env: fast ? { V4_GAMES: 'fast' } : {} });
// COMMIT_REF stamps the build with the exported commit (vite.config.js), not whatever HEAD the live tree has
const built = await run('production build', [VITE, 'build', '--outDir', outDir, '--emptyOutDir'], { quiet: true, env: sha ? { COMMIT_REF: sha } : {} });

if (e2e) {
  if (!built) { console.error('no build to test: skipping e2e'); results.push({ name: 'e2e (no build)', ok: false, s: '0.0' }); }
  else {
    let server;
    try { server = await servePreview({ outDir, port, root }); } catch (err) { console.error(err.message); process.exit(2); }
    // Parallel e2e (Cory: faster). Each script gets its own shots dir (hotseat wipes its root), and the
    // timing-sensitive ones (hover p95, bot pacing, memory curve) run alone afterwards so load can't skew them.
    // touch.mjs (phone) is outside the v0.2 verdict (Cory: no phone for a long time): V4_PHONE=1 brings it back.
    const shotsRoot = process.env.V4_SHOTS || `/tmp/patrons-shots/v4-${port}`;
    const all = readdirSync(join(root, 'e2e/v4')).filter(f => f.endsWith('.mjs')).sort()
      .filter(f => f !== 'touch.mjs' || process.env.V4_PHONE);
    const SOLO = new Set(['info.mjs', 'motion.mjs', 'memory.mjs']);
    const jobs = Math.max(1, Number(process.env.V4_E2E_JOBS || 3));
    const one = f => run(`e2e ${f}`, [`e2e/v4/${f}`], { env: { V4_URL: server.url, V4_SHOTS: `${shotsRoot}/${f.replace(/\.mjs$/, '')}` } });
    const queue = all.filter(f => !SOLO.has(f));
    await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
    await unit;
    for (const f of all.filter(f => SOLO.has(f))) await one(f);
    await server.close();
  }
}

await unit;
console.log('\n── v4 check ──');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.s}s)`);
console.log(`total ${((Date.now() - started) / 1000).toFixed(1)}s${fast ? ' (--fast)' : ''} · ${sha ? `verdict on commit ${sha.slice(0, 7)}` : LIVE_WARNING}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
