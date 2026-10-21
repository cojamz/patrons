#!/usr/bin/env node
// Member prices at Cory's 1.5x rule (Oct 21: "at its price it should earn you the followers X cost X 1.5"), from
// v4-fair-price.mjs sweep output. A sweep measures the forced-buy follower margin at a few prices P: the owner's final
// followers against the best rival, with the card bought at P versus the same game without it. A resource buys one
// follower, so a card that earns 1.5x its cost beats the game without it by 0.5·P. The 1.5x price is where the
// measured margin crosses 0.5·P, interpolated between the tested prices (the line fit only past the ends: the margin
// isn't straight near 0, so its intercept misleads). Nearest, halves down (Cory's rule), 0 to 10; cards that bring
// a whole extra minion or member keep his 8 floor. The colored/any split keeps the card's current ratio.
//
//   node scripts/v4-price-1p5.mjs design/eval/member-sims/sweep-4p/*.json            the price list
//   node scripts/v4-price-1p5.mjs <files> --apply                                     also writes the content files
//   --keep=id,id   leave these cards at their printed price (e.g. a card Cory set himself)
//   --cap=n        move no price more than n in one pass (one sweep's noise is about ±2 followers per price)
// A card with an ability never drops below 1: a free one would be a reflex pick, whatever the bots think of it.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const argv = process.argv.slice(2);
const files = argv.filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const keep = new Set(String(flags.keep || '').split(',').filter(Boolean));
const FLOOR8 = new Set(['red.mentor', 'benders.extrahand']); // an extra member / an extra minion: his 8-to-10 ladder
const CONTENT = join(dirname(fileURLToPath(import.meta.url)), '../src/engine/v4/content');

// where margin − 0.5·P·(buy rate) crosses zero
function cross(r) {
  // only the games where the test seat could afford it bought it, so the target scales by the buy rate
  const pts = r.per.map(p => [p.P, p.forced[0] - 0.5 * p.P * p.forcedBuy]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (y0 >= 0 && y1 < 0) return x0 + ((x1 - x0) * y0) / (y0 - y1);
  }
  // no crossing inside the grid: the line a + b·P against 0.5·P
  return r.at0 / (0.5 - r.slope);
}
const price = (id, x) => {
  let p = Math.min(10, Math.max(0, Math.ceil(x - 0.5)));
  if (FLOOR8.has(id)) p = Math.max(8, p);
  return p;
};

const rows = files.flatMap(f => JSON.parse(readFileSync(f, 'utf8')).rows);
const src = {};
const read = q => (src[q] ??= readFileSync(join(CONTENT, `${q}.js`), 'utf8'));
// m('key', 'Name', s, w, …) in a sphere file; m('key', 'Name', 'sphere', s, w, …) in benders.js
const pattern = (q, key) => q === 'benders'
  ? new RegExp(`(m\\('${key}', '[^']+', (?:'[a-z]+'|null), )(\\d+), (\\d+)`)
  : new RegExp(`(m\\('${key}', '[^']+', )(\\d+), (\\d+)`);

const out = [];
for (const r of rows) {
  const [q, key] = r.id.split('.');
  const hit = read(q).match(pattern(q, key));
  if (!hit) throw new Error(`can't find ${r.id} in ${q}.js`);
  const s = Number(hit[2]), w = Number(hit[3]), T = s + w;
  let P = keep.has(r.id) ? T : price(r.id, cross(r));
  if (flags.cap) P = Math.min(T + Number(flags.cap), Math.max(T - Number(flags.cap), P));
  const ability = !/^m\('[a-z]+', '[^']+', (?:'[a-z]+', |null, )?\d+, \d+, 'Worth /.test(read(q).slice(hit.index));
  if (ability && T > 0) P = Math.max(1, P);
  const ns = T ? Math.round((P * s) / T) : 0, nw = P - ns;
  out.push({ id: r.id, name: r.name, was: `${T} (${s}+${w})`, worth: cross(r), margins: r.per.map(p => `${p.P}:${p.forced[0].toFixed(1)}/${Math.round(p.forcedBuy * 100)}%`).join(' '), slope: r.slope, P, split: `${ns}+${nw}` });
  if (flags.apply && P !== T) src[q] = read(q).replace(pattern(q, key), `$1${ns}, ${nw}`);
}
console.log('card'.padEnd(22), 'was'.padEnd(10), '1.5x at', ' → price (colored+any)', '  margin at each tested price');
for (const o of out) console.log(o.name.padEnd(22), o.was.padEnd(10), o.worth.toFixed(1).padStart(7), `   ${o.P} (${o.split})${keep.has(o.id) ? ' kept' : ''}`.padEnd(22), o.margins);
if (flags.apply) { for (const [q, t] of Object.entries(src)) writeFileSync(join(CONTENT, `${q}.js`), t); console.log('written'); }
