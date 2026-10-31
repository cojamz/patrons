// One row per card across several reports. Usage: node scripts/v4-balance-matrix.mjs <label=report.json>... [--what=members|artifacts|spaces|colors] [--min=20]
// Cell: lift in points (win share minus expected), "*" when past 2 SE, "." when too few seats.
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2), flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const what = flags.what || 'members', MIN = Number(flags.min || 20);
const cols = args.filter(a => !a.startsWith('--')).map(a => { const [l, f] = a.split('='); return [l, JSON.parse(readFileSync(f, 'utf8'))]; });
const se = (p, n) => Math.sqrt(Math.max(p * (1 - p), 0.05) / n);
const table = r => {
  if (what === 'members') return Object.fromEntries(r.memberTable.map(m => [m.k, m]));
  if (what === 'spaces') return Object.fromEntries(r.spaceTable.map(m => [m.k, m]));
  const o = what === 'artifacts' ? r.artifacts : r.colors;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { n: v.n, lift: (v.w - v.e) / v.n, err: se(v.w / v.n, v.n) }]));
};
const T = cols.map(([l, r]) => [l, table(r)]);
const keys = [...new Set(T.flatMap(([, t]) => Object.keys(t)))];
const avg = k => { const xs = T.map(([, t]) => t[k]).filter(x => x && x.n >= MIN); return xs.length ? xs.reduce((a, x) => a + x.lift, 0) / xs.length : 0; };
keys.sort((a, b) => avg(b) - avg(a));
console.log(''.padEnd(28) + T.map(([l]) => l.padStart(7)).join('') + '    mean');
for (const k of keys) {
  const cells = T.map(([, t]) => { const x = t[k]; if (!x || x.n < MIN) return '.'.padStart(7); const v = Math.round(x.lift * 100); return `${v > 0 ? '+' : ''}${v}${Math.abs(x.lift) >= 2 * x.err ? '*' : ' '}`.padStart(7); });
  console.log(k.slice(0, 27).padEnd(28) + cells.join('') + `${Math.round(avg(k) * 100)}`.padStart(8));
}
