// One command for the whole v4 quality gate: unit + fuzz + sphere tests, production build, browser e2e.
// `npm run check:v4 -- --help` for the options. Every sphere a table can pick is gated. Tests carry no wall-clock
// budgets: game and move counts bound the engine work, fake timers the session waits (vitest.config.js has a hang
// backstop).
// Speed (2026-10-15, design/eval/harness-metrics.md): the unit tests start at once on every core at nice 10 (as every
// vitest run does, vitest.config.js), so they soak up whatever CPU the build and the browsers leave idle and never slow
// a timing gate. The e2e start the moment the build is served, longest first, each holding a machine-wide e2e token
// (scripts/lib/slots.mjs), so all runs on the box together keep at most V4_E2E_TOKENS browsers in flight; the timing-
// sensitive ones (hover p95, count-ups, bot pacing) take every token and run with no other e2e anywhere on the box.
// Output is captured per stage and printed whole as each stage ends (no interleaving); every run appends a record to
// the run history that scripts/v4-retro.mjs reads.
// Processes: vitest, the build and each e2e run in their own process group and die with this script, however it ends
// (scripts/lib/procs.mjs); the preview server runs inside this process, on a port checked free before it starts, and
// is confirmed to be serving this run's outDir before any e2e touches it. At most V4_CHECK_SLOTS (3) runs share the
// box at once; the next waits, with an ETA, and says who holds the slots.
import { readdirSync, readFileSync, existsSync, mkdirSync, symlinkSync, createWriteStream } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { availableParallelism, loadavg } from 'node:os';
import { runChild, exitOf, VITE, VITEST, portBusy, busyMessage, servePreview, removeOnExit, removeNow } from './lib/procs.mjs';
import { acquireSlot, acquire, E2E_TOKENS, SLOTS, recordRun, RUNS } from './lib/slots.mjs';

const HELP = `npm run check:v4 [-- options]

  --commit <sha|HEAD>  The verdict. Exports that commit (git archive) to .v4-wt/check-<sha>-<pid> with node_modules
                       symlinked, runs the tests, the build and the e2e there, then removes it. Nobody's uncommitted
                       edits can reach it. Use this for any "is it green?" that someone will act on.
  (no --commit)        The live tree, for quick iteration while you edit. NOT a verdict: other agents' uncommitted
                       edits land mid-run (a content change between the build and an e2e's engine import makes saves
                       read as "older version", and the resume e2e fail).
  --quick              The pre-check while iterating (npm run check:v4:quick; ~2 min on a quiet box): unit tests with
                       every seeded block on its fast slice (V4_GAMES=fast) and the slowest coverage gates left out,
                       the build, and the hot-seat e2e. Not a verdict.
  --related <f,f…>     With --quick: only the unit tests that import these files (vitest related; a UI file skips
                       every engine and seeded block), e.g. --quick --related src/v4/game/Wheel.jsx,src/v4/lamp.css
  --fast               Unit tests (seeded blocks on their fast slice) and the build; no e2e. CI runs this.
  --full               Every seeded block at its full count (V4_GAMES=full): the nightly / remote job. The verdict
                       plays each block's verdict slice, whose strength is stated beside it (src/test/engine/v4/budget.js).
  --help               This.

  V4_OUTDIR=.v4-build-<name>  build dir (default .v4-build; inside the export with --commit)
  V4_PORT=<5281+>             preview port for the e2e (default 5180); refused up front if anything answers there
  V4_CHECK_SLOTS=${String(SLOTS).padEnd(13)}capacity in units: a full gate takes 2, --quick/--fast or a bare whole-suite vitest 1 (/tmp/v4-check-slots)
  V4_E2E_TOKENS=${String(E2E_TOKENS).padEnd(14)}browser e2e in flight at once across every run on the box
  V4_UNIT_WORKERS=<n>         vitest workers (default: every core; they run at nice 10)
  V4_PHONE=1                  include touch.mjs (the phone gate; outside the v0.2 verdict)
  V4_LOGS=<dir>               where each stage's full output goes (default /tmp/v4-check-logs/<run>)`;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); process.exit(0); }
const quick = argv.includes('--quick'), fast = argv.includes('--fast'), full = argv.includes('--full');
if ([quick, fast, full].filter(Boolean).length > 1) { console.error('pick one of --quick, --fast, --full\n\n' + HELP); process.exit(2); }
const ci = argv.indexOf('--commit');
const ref = ci >= 0 ? argv[ci + 1] : null;
if (ci >= 0 && (!ref || ref.startsWith('--'))) { console.error('--commit needs a commit: --commit HEAD, or a sha\n\n' + HELP); process.exit(2); }
const ri = argv.indexOf('--related');
const related = ri >= 0 ? (argv[ri + 1] || '').split(',').map(f => f.trim()).filter(Boolean) : null;
if (ri >= 0 && (!related.length || argv[ri + 1].startsWith('--') || !quick)) { console.error('--related goes with --quick and needs files: --quick --related src/v4/game/Wheel.jsx,src/v4/lamp.css\n\n' + HELP); process.exit(2); }
const known = new Set(['--quick', '--fast', '--full', '--commit', ref, '--related', ri >= 0 ? argv[ri + 1] : null].filter(Boolean));
const unknown = argv.filter(a => !known.has(a));
if (unknown.length) { console.error(`unknown option ${unknown.join(' ')}\n\n${HELP}`); process.exit(2); }

const started = Date.now();
const clock = () => ((Date.now() - started) / 1000).toFixed(0).padStart(4) + 's';
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
// the run's kind, for the history (ETAs, the retro): a verdict is a full gate on a commit
const kind = quick ? 'quick' : fast ? 'fast' : full ? 'full' : sha ? 'verdict' : 'live';
const games = quick || fast ? 'fast' : full ? 'full' : process.env.V4_GAMES || '';
const wantE2E = !fast;

// refuse a busy port now, not after minutes of tests: whoever is there would answer the e2e with another build
if (wantE2E && (await portBusy(port))) { console.error(busyMessage(port)); process.exit(2); }

// at most SLOTS gates on the box at once (the slot is held for the whole run)
const what = `${sha ? `commit ${sha.slice(0, 7)}` : 'live tree'}${kind === 'verdict' || kind === 'live' ? '' : ` --${kind}`}, ${outDir}${wantE2E ? `, port ${port}` : ''}`;
const { waitedMs } = await acquireSlot(what, { kind });
// what else is loading the box, said up front so a slow run is explained in its own log (and the run history)
const box = (() => {
  let vitest = 0, browsers = 0;
  try {
    for (const pid of readdirSync('/proc')) {
      if (!/^\d+$/.test(pid) || Number(pid) === process.pid) continue;
      let cmd = '';
      try { cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').join(' '); } catch { continue; }
      if (/vitest(\.mjs)? run\b/.test(cmd)) vitest++;
      else if (/chrom(e|ium)\b/.test(cmd) && /--remote-debugging-pipe/.test(cmd) && !/--type=/.test(cmd)) browsers++;
    }
  } catch { /* no /proc */ }
  return { load1: +loadavg()[0].toFixed(1), vitest, browsers };
})();
console.log(`box at start: load ${box.load1} on ${availableParallelism()} CPUs, ${box.vitest} vitest run(s) and ${box.browsers} browser(s) already going`);
process.env.V4_IN_CHECK = '1'; // our vitest (and anything else we start) runs under this slot (scripts/lib/vitest-slot.mjs)

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

const runId = `${new Date(started).toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
const logs = process.env.V4_LOGS || `/tmp/v4-check-logs/${runId}`;
mkdirSync(logs, { recursive: true });
console.log(`${kind} run${games ? ` (V4_GAMES=${games})` : ''}; each stage's full output: ${logs}`);

const results = [];
// runs a stage with its output captured (and streamed to its log file, for tail -f), then prints it whole (or its
// tail, for a long passing log) when it ends
const run = async (name, args, { env = {}, nice = 0, tail = Infinity, cmd = process.execPath } = {}) => {
  const t0 = Date.now();
  const child = nice ? runChild('nice', ['-n', String(nice), cmd, ...args], { cwd: root, env, quiet: true }) : runChild(cmd, args, { cwd: root, env, quiet: true });
  const file = join(logs, `${name.replace(/[^\w.-]+/g, '_')}.log`);
  const stream = createWriteStream(file);
  stream.on('error', () => {});
  child.stdout?.on('data', d => stream.write(d));
  child.stderr?.on('data', d => stream.write(d));
  const code = await exitOf(child);
  stream.end();
  const s = (Date.now() - t0) / 1000;
  const r = { name, ok: code === 0, s: +s.toFixed(1), start: +((t0 - started) / 1000).toFixed(1) };
  results.push(r);
  const out = child.output.trimEnd();
  const shown = r.ok && out.length > tail ? `… (${file})\n${out.slice(-tail)}` : out;
  console.log(`\n── ${r.ok ? 'PASS' : 'FAIL'} ${name} (${r.s}s, done at ${clock()}) ──\n${shown}`);
  return Object.assign(r, { output: child.output });
};

// 1. unit tests, at once, on every core, niced (also for an export of an older commit, whose vitest.config.js doesn't
//    nice itself): they take whatever the build and the browsers leave idle
const workers = Number(process.env.V4_UNIT_WORKERS) || availableParallelism();
// --quick leaves out the coverage gates that play their full sample even on the fast slice (they gate verdicts)
const QUICK_SKIP = ['**/fire-audit.test.js', '**/truth/contest-truth-*.test.jsx', '**/records.test.js'];
const unitArgs = related
  ? [VITEST, 'related', '--run', ...related, `--maxWorkers=${workers}`, '--passWithNoTests']
  : [VITEST, 'run', 'src/test/engine/v4', 'src/test/v4', `--maxWorkers=${workers}`, ...(quick ? QUICK_SKIP.flatMap(g => ['--exclude', g]) : [])];
const unit = run('unit tests', unitArgs, { nice: 10, env: games ? { V4_GAMES: games } : {}, tail: 2500 });
// 2. the build (COMMIT_REF stamps it with the exported commit (vite.config.js), not whatever HEAD the live tree has)
const built = await run('production build', [VITE, 'build', '--outDir', outDir, '--emptyOutDir'], { env: sha ? { COMMIT_REF: sha } : {}, tail: 300 });

// 3. the e2e, the moment the build is served
if (wantE2E && existsSync(join(root, 'e2e/v4'))) {
  if (!built.ok) { console.error('no build to test: skipping e2e'); results.push({ name: 'e2e (no build)', ok: false, s: 0 }); }
  else {
    let server;
    try { server = await servePreview({ outDir, port, root }); } catch (err) { console.error(err.message); process.exit(2); }
    // Each script gets its own shots dir (hotseat wipes its root). touch.mjs (phone) is outside the v0.2 verdict
    // (Cory: no phone for a long time): V4_PHONE=1 brings it back. --quick plays the hot-seat game only.
    const shotsRoot = process.env.V4_SHOTS || `/tmp/patrons-shots/v4-${port}`;
    const all = quick ? ['hotseat.mjs'] : readdirSync(join(root, 'e2e/v4')).filter(f => f.endsWith('.mjs')).filter(f => f !== 'touch.mjs' || process.env.V4_PHONE);
    // timing-sensitive: hover p95 (info), count-ups and bot pacing (motion). They take every e2e token on the box.
    // memory.mjs is not: it reads the heap after a forced GC, which load doesn't change.
    const SOLO = new Set(['info.mjs', 'motion.mjs']);
    // longest first (typical seconds on a quiet box), so the long pole starts at once
    const LONG = { 'online.mjs': 130, 'touch.mjs': 120, 'hotseat.mjs': 75, 'tables.mjs': 62, 'spaces.mjs': 60, 'memory.mjs': 60, 'benders.mjs': 50, 'reckoning.mjs': 21, 'layout.mjs': 13 };
    const order = (a, b) => (LONG[b] || 30) - (LONG[a] || 30) || a.localeCompare(b);
    const one = async (f, weight) => {
      const tok = await acquire('e2e', { weight, what: `${what}: ${f}`, kind, quietMs: 60000, log: m => console.log(`[${f}] ${m}`) });
      try { return await run(`e2e ${f}`, [`e2e/v4/${f}`], { env: { V4_URL: server.url, V4_SHOTS: `${shotsRoot}/${f.replace(/\.mjs$/, '')}` } }); } finally { tok.release(); }
    };
    // the FIFO token queue runs them in this order: the parallel ones (one token each), then each solo one alone
    const par = all.filter(f => !SOLO.has(f)).sort(order), solo = all.filter(f => SOLO.has(f)).sort(order);
    // (each ticket is filed the moment one() is called, so this order is the queue's order)
    const jobs = [...par.map(f => one(f, 1)), ...solo.map(f => one(f, E2E_TOKENS))];
    await Promise.all(jobs);
    await server.close();
  }
}

const u = await unit;
// the slowest unit files, for the run history (vitest prints "✓ path (N tests) 1234ms")
const slowFiles = [...(u.output || '').replace(/\x1b\[[0-9;]*m/g, '').matchAll(/^ [✓❯×] (src\/\S+) \(\d+ tests?[^)]*\)\s+(\d+)ms/gm)]
  .map(m => [m[1], +(Number(m[2]) / 1000).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 12);
const totalS = +((Date.now() - started) / 1000).toFixed(1);
const ok = results.every(r => r.ok);
const phase = re => { const rs = results.filter(r => re.test(r.name)); return rs.length ? +Math.max(...rs.map(r => r.start + r.s)).toFixed(1) : null; };
recordRun({
  v: 1, kind, games: games || 'verdict', sha: sha || null, started: new Date(started).toISOString(), waitedS: +(waitedMs / 1000).toFixed(1), totalS, ok,
  stages: results.map(({ name, ok: k, s, start }) => ({ name, ok: k, s, start })), unitDoneS: phase(/^unit/), e2eDoneS: phase(/^e2e/),
  slowFiles, box, load1: +loadavg()[0].toFixed(1), cpus: availableParallelism(), logs,
});
console.log(`\n── v4 check (${kind}) ──`);
if (waitedMs > 1000) console.log(`waited ${(waitedMs / 1000).toFixed(0)}s for a check slot`);
for (const r of results.slice().sort((a, b) => a.start - b.start)) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.s}s, from ${r.start}s)`);
console.log(`total ${totalS}s · ${kind}${games ? ` · V4_GAMES=${games}` : ''} · ${sha ? `verdict on commit ${sha.slice(0, 7)}` : LIVE_WARNING} · history ${RUNS}`);
process.exit(ok ? 0 : 1);
