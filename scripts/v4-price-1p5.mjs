#!/usr/bin/env node
// Member prices at Cory's 1.5x rule (Oct 21: "at its price it should earn you the followers X cost X 1.5"), from
// v4-fair-price.mjs sweep output. A sweep fits the forced-buy follower margin as a line a + b·P. At P = 0 the owner
// pays nothing, so a is what the card earns its owner (its followers plus everything its ability changes, measured
// against the best rival). The 1.5x price is a / 1.5: nearest, halves down (Cory's rule), 0 to 10, and cards that
// bring a whole extra minion or member keep his 8 floor. The colored/any split keeps the card's current ratio.
//
//   node scripts/v4-price-1p5.mjs design/eval/member-sims/sweep-4p/*.json            the price list
//   node scripts/v4-price-1p5.mjs <files> --apply                                     also writes the content files
//   --keep=id,id   leave these cards at their printed price (e.g. a card Cory set himself)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const argv = process.argv.slice(2);
const files = argv.filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const keep = new Set(String(flags.keep || '').split(',').filter(Boolean));
const FLOOR8 = new Set(['red.mentor', 'benders.extrahand']); // an extra member / an extra minion: his 8-to-10 ladder
const CONTENT = join(dirname(fileURLToPath(import.meta.url)), '../src/engine/v4/content');

const price = (id, a) => {
  let p = Math.min(10, Math.max(0, Math.ceil(a / 1.5 - 0.5)));
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
  const P = keep.has(r.id) ? T : price(r.id, r.at0);
  const ns = T ? Math.round((P * s) / T) : 0, nw = P - ns;
  out.push({ id: r.id, name: r.name, was: `${T} (${s}+${w})`, worth: r.at0, slope: r.slope, P, split: `${ns}+${nw}` });
  if (flags.apply && P !== T) src[q] = read(q).replace(pattern(q, key), `$1${ns}, ${nw}`);
}
console.log('card'.padEnd(22), 'was'.padEnd(10), 'earns free', 'per +1 price', '→ 1.5x price (colored+any)');
for (const o of out) console.log(o.name.padEnd(22), o.was.padEnd(10), o.worth.toFixed(1).padStart(10), o.slope.toFixed(2).padStart(12), `   ${o.P} (${o.split})${keep.has(o.id) ? ' kept' : ''}`);
if (flags.apply) { for (const [q, t] of Object.entries(src)) writeFileSync(join(CONTENT, `${q}.js`), t); console.log('written'); }
