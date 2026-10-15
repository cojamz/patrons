// The harness retro: one dated row in design/eval/harness-metrics.md from the gates run since the last retro, so every
// milestone has numbers to improve against (wall time per stage, failures by stage, waits for a check slot).
//   node scripts/v4-retro.mjs                    runs recorded since the last retro row (the run history check:v4 keeps
//                                                in /tmp/v4-check-slots/runs.jsonl)
//   node scripts/v4-retro.mjs --since <iso>      runs since then instead
//   node scripts/v4-retro.mjs <gate.log> ...     also count saved check:v4 logs (older gates kept no history)
//   --dry                                        print the row, don't append it
// Last step of a milestone in the v4 loop (.claude/skills/v4-loop/SKILL.md).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { runHistory } from './lib/slots.mjs';

const FILE = new URL('../design/eval/harness-metrics.md', import.meta.url).pathname;
const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const si = argv.indexOf('--since');
const logs = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--since');

const md = existsSync(FILE) ? readFileSync(FILE, 'utf8') : '';
const marks = [...md.matchAll(/<!-- retro-through: (\S+) -->/g)].map(m => m[1]);
const since = si >= 0 ? argv[si + 1] : marks[marks.length - 1] || '1970-01-01T00:00:00Z';

// ---- runs: the history, plus any saved logs (old format: "PASS  e2e x.mjs  (76.5s)", "total 3617.2s") ----
const runs = runHistory(5000).filter(r => r.started > since);
for (const f of logs) {
  const txt = readFileSync(f, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const stages = [...txt.matchAll(/^(PASS|FAIL) {2}(.+?) {2}\(([\d.]+)s(?:, from ([\d.]+)s)?\)/gm)].map(m => ({ name: m[2], ok: m[1] === 'PASS', s: Number(m[3]), start: m[4] ? Number(m[4]) : null }));
  const total = txt.match(/^total ([\d.]+)s/m);
  if (!stages.length || !total) { console.error(`${f}: no gate summary in it (unfinished?), skipped`); continue; }
  const w = txt.match(/check slot \d+ of \d+ is ours after (?:(\d+)m)?(\d+)s/) || txt.match(/ours after (?:(\d+)m)?(\d+)s/);
  const commit = /verdict run on commit/.test(txt), fast = /\(--fast\)|--fast/.test(txt.split('\n').find(l => l.startsWith('total')) || '');
  runs.push({ kind: fast ? 'fast' : commit ? 'verdict' : 'live', totalS: Number(total[1]), ok: stages.every(s => s.ok), stages, waitedS: w ? Number(w[1] || 0) * 60 + Number(w[2]) : 0, from: f });
}
if (!runs.length) { console.log(`no gate runs since ${since}: nothing to add`); process.exit(0); }

// ---- the row ----
const q = (xs, p) => { const s = xs.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const m = s => (s == null ? '–' : s < 90 ? `${Math.round(s)}s` : `${(s / 60).toFixed(1)}m`);
const byKind = k => runs.filter(r => r.kind === k);
const green = rs => rs.filter(r => r.ok);
const counts = ['verdict', 'live', 'quick', 'fast', 'full'].map(k => [k, byKind(k).length]).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ');
// every finished verdict counts for wall time (a red one still ran its whole length); greens are counted beside it
const v = byKind('verdict'), vt = v.map(r => r.totalS);
const stageS = (rs, re) => rs.map(r => { const ss = (r.stages || []).filter(s => re.test(s.name)); return ss.length ? Math.max(...ss.map(s => s.s)) : null; });
const unitS = stageS(v, /unit|engine \+ spheres/);
const e2eDone = v.map(r => r.e2eDoneS ?? null);
const qk = green(byKind('quick')).map(r => r.totalS);
const waits = runs.map(r => r.waitedS || 0);
const fails = {};
for (const r of runs) for (const s of r.stages || []) if (!s.ok) fails[s.name] = (fails[s.name] || 0) + 1;
const failTxt = Object.entries(fails).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k.replace(/^e2e /, '')} ×${n}`).join(', ') || 'none';
const slow = {};
for (const r of v) for (const [f, s] of r.slowFiles || []) slow[f] = Math.max(slow[f] || 0, s);
const slowTxt = Object.entries(slow).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, s]) => `${f.split('/').pop().replace(/\.test\.jsx?$/, '')} ${m(s)}`).join(', ') || '–';
const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
const row = `| ${date} | ${counts} | ${m(q(vt, 0.5))} (${m(q(vt, 1))}), ${green(v).length}/${v.length} green | ${m(q(unitS, 0.5))} | ${m(q(e2eDone, 0.5))} | ${m(q(qk, 0.5))} | ${m(q(waits, 0.5))} (${m(q(waits, 1))}) | ${failTxt} | ${slowTxt} |`;
console.log(row);
if (dry) process.exit(0);

// ---- append under the retro table (made on first use) ----
const HEAD = `## Retro (one row per milestone: \`node scripts/v4-retro.mjs\`)
Verdicts (\`check:v4 -- --commit\`): median wall (worst) and how many were green; unit tests' wall; e2e done (seconds from the start); green \`--quick\` median; waits for a check slot over all runs; failed stages over all runs; slowest unit files.

| date (UTC) | runs | verdict p50 (max) | unit | e2e done | quick p50 | slot wait p50 (max) | failures | slowest unit files |
|---|---|---|---|---|---|---|---|---|
`;
const through = runs.map(r => r.started).filter(Boolean).sort().pop() || new Date().toISOString();
let out = md || '# Harness metrics\n\n';
if (!out.includes('## Retro')) out = `${out.trimEnd()}\n\n${HEAD}`;
// the new row goes after the table's last row
const lines = out.split('\n');
const head = lines.findIndex(l => l.startsWith('## Retro'));
let at = lines.findIndex((l, i) => i > head && l.startsWith('|---'));
while (lines[at + 1]?.startsWith('|')) at++;
lines.splice(at + 1, 0, row);
out = lines.join('\n').replace(/\n*$/, '\n');
out = out.replace(/<!-- retro-through: \S+ -->\n?/g, '') + `<!-- retro-through: ${through} -->\n`;
writeFileSync(FILE, out);
console.log(`appended to ${FILE.replace(process.cwd() + '/', '')}`);
