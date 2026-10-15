// Direct crossing for a centred confirmation panel (scripts/v4-fair-price.mjs panel --center): per card, a straight
// line through every probe's paired margin change against its price (rounds pooled, so timing is as dealt: a third
// each from rounds I, II and III), solved for 0; 90% CI by bootstrap over seeds. Also the share of probes recruited
// at each grid price (a price few seats can ever pay isn't a working price).
// Usage: node scripts/v4-fair-price-cross.mjs conf-raw.json [--out=f.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { seededRandom } from '../src/engine/v4/rng.js';
const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [file] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const R = JSON.parse(readFileSync(file, 'utf8')), C = R.params.printed;
const seeds = R.results.filter(r => !r.error);
const per = {}; // id -> seedIdx -> [[P, y, bought]]
seeds.forEach((g, si) => g.games.forEach(game => game.forEach(e => { if (!e) return; ((per[e[0]] ||= {})[si] ||= []).push([e[1], e[2], e[5] === 1]); })));
const line = pts => { let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; for (const [x, y] of pts) { n++; sx += x; sy += y; sxx += x * x; sxy += x * y; } const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n; return { a, b, x: b < 0 ? -a / b : NaN }; };
const rng = seededRandom(5), out = [];
for (const [id, by] of Object.entries(per)) {
  const keys = Object.keys(by), all = keys.flatMap(k => by[k]), est = line(all);
  const xs = [];
  for (let k = 0; k < 400; k++) { const pts = []; for (let i = 0; i < keys.length; i++) pts.push(...by[keys[Math.floor(rng() * keys.length)]]); xs.push(line(pts).x); }
  const f = xs.filter(Number.isFinite).sort((a, b) => a - b), q = p => f[Math.floor(p * (f.length - 1))];
  const grid = [...new Set(all.map(p => p[0]))].sort((a, b) => a - b);
  const share = grid.map(P => { const s = all.filter(p => p[0] === P); return [P, +(s.filter(p => p[2]).length / s.length).toFixed(2), +(s.reduce((t, p) => t + p[1], 0) / s.length).toFixed(2)]; });
  out.push({ id, center: C[id], n: all.length, fair: +est.x.toFixed(2), lo: +q(0.05).toFixed(2), hi: +q(0.95).toFixed(2), slope: +est.b.toFixed(2), grid: share });
}
out.sort((a, b) => a.id.localeCompare(b.id));
for (const o of out) console.log(o.id.padEnd(20), 'center', String(o.center).padStart(3), 'fair', o.fair.toFixed(1).padStart(5), `(${o.lo.toFixed(1)}–${o.hi.toFixed(1)})`, 'slope', o.slope, 'n', o.n, ' ', o.grid.map(([P, b, y]) => `${P}: ${Math.round(b * 100)}% Δ${y}`).join('  '));
if (flags.out) writeFileSync(flags.out, JSON.stringify(out, null, 1));
