// The perf rig, several times on one build: the spread across runs, and whether every run played the same game.
//   node scripts/v4-rig-spread.mjs <url> <label> [--runs=3] [--parallel=1] [any v4-rig.mjs flag]
// One run can't tell two builds apart (a single slow choose moves a round's p95 by seconds), so compare builds on
// the median of several runs, side by side, at the same --parallel (load on the box changes every number).
// Writes <out>/rig-<label>-<n>.md/.json per run and <out>/spread-<label>.md. Exit 1 if the runs played different games.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(a.indexOf('=') + 1) : d; };
const [url, label] = pos;
if (!url || !label) { console.error('usage: node scripts/v4-rig-spread.mjs <url> <label> [--runs=3] [--parallel=1]'); process.exit(2); }
const RUNS = Number(flag('runs', 3)), PAR = Number(flag('parallel', 1)), OUT = flag('out', 'design/eval/perf');
const pass = argv.filter(a => a.startsWith('--') && !/^--(runs|parallel)=/.test(a));

const runOne = n => new Promise(resolve => {
  const p = spawn(process.execPath, ['scripts/v4-rig.mjs', url, `${label}-${n}`, '--no-gate', ...pass], { stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', d => process.stdout.write(`[${n}] ${d}`.replace(/\n(?=.)/g, `\n[${n}] `)));
  p.stderr.on('data', d => process.stderr.write(`[${n}] ${d}`));
  p.on('exit', () => resolve(n));
});
const queue = Array.from({ length: RUNS }, (_, i) => i + 1);
await Promise.all(Array.from({ length: Math.min(PAR, RUNS) }, async () => { while (queue.length) await runOne(queue.shift()); }));

const runs = [];
for (let n = 1; n <= RUNS; n++) { try { runs.push({ n, ...JSON.parse(readFileSync(`${OUT}/rig-${label}-${n}.json`, 'utf8')) }); } catch { console.error(`run ${n}: no result`); } }
const med = xs => { const v = xs.filter(x => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
const span = xs => { const v = xs.filter(x => x != null); return v.length ? `${med(v)} (${Math.min(...v)}–${Math.max(...v)})` : '–'; };
const kind = (s, k) => s?.clicks.byKind.find(b => b.k === k)?.p95 ?? null;
const rounds = ['I', 'II', 'III'];
const same = runs.every(r => JSON.stringify(r.path) === JSON.stringify(runs[0].path));
const firstSplit = same ? null : (() => { const ps = runs.map(r => r.path || []); for (let i = 0; ; i++) if (ps.some(p => p[i] !== ps[0][i])) return { i, picks: ps.map(p => p[i]) }; })();
const L = [`# Rig spread: ${label}`, '', `${new Date().toISOString()} · ${url} · ${runs.length} runs, ${PAR} at a time · ${pass.join(' ') || 'rig defaults'}`, '',
  same ? `Every run played the same game (${runs[0]?.path?.length || 0} picks).` : `Runs played different games: first split at pick ${firstSplit.i + 1}: ${firstSplit.picks.join(' / ')}.`, '',
  'Median (min–max) across runs.', '',
  '| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |',
  '|---|---|---|---|---|---|---|---|---|---|'];
for (const r of rounds) {
  const s = runs.map(x => x.sum[r]);
  L.push(`| ${r} | ${span(s.map(x => x?.clicks.p95))} | ${span(s.map(x => kind(x, 'choose')))} | ${span(s.map(x => kind(x, 'place')))} | ${span(s.map(x => x?.clicks.dead))} | ${span(s.map(x => x?.hovers.p95))} | ${span(s.map(x => x?.frames.p95))} | ${span(s.map(x => x?.frames.hitch))} | ${span(s.map(x => x?.idle.busyPct))} | ${span(s.map(x => x?.busy))} |`);
}
L.push('', `Leak control (unbroken vs reload): elements ${span(runs.map(x => x.unbroken?.nodes))} vs ${span(runs.map(x => x.reloaded?.nodes))}, heap MB ${span(runs.map(x => x.unbroken?.heapMB))} vs ${span(runs.map(x => x.reloaded?.heapMB))}.`);
L.push('', `Per run: ${runs.map(x => `rig-${label}-${x.n}.md`).join(', ')}.`);
writeFileSync(`${OUT}/spread-${label}.md`, L.join('\n') + '\n');
console.log(L.join('\n'));
process.exit(same ? 0 : 1); // (callers piping into tail lose this; read the md)
