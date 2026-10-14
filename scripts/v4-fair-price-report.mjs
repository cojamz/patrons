// Builds the card list for design/eval/fair-price.md and design/eval/reprice-proposal.json from
//   a panel run (the price: causal, paired, every card), a screen run (demand: how often bots recruit it when offered
//   and affordable, at jittered prices) and optional single-card sweeps (anchors; a Hard test seat).
// Usage: node scripts/v4-fair-price-report.mjs --panel=p.json --screen=s.json [--sweeps=a.json,b.json] [--md=out.md] [--json=out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { allQuadrantIds, quadrant, guestMembers } from '../src/engine/v4/content/index.js';

const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const load = f => JSON.parse(readFileSync(f, 'utf8'));
const P = load(flags.panel), S = flags.screen ? load(flags.screen) : { cards: [] };
const sweeps = String(flags.sweeps || '').split(',').filter(Boolean).map(load);
const defs = [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()];
const h = x => (Number.isFinite(x) ? String(Math.round(x * 2) / 2) : '–');
const even = x => Math.max(0, 2 * Math.round(x / 2));
// keep the colored share of the printed split; colored part even when it can be
function split(d, P) {
  const T = d.s + d.w;
  if (!T) return [Math.min(P, 2 * Math.floor(P / 4)), P - Math.min(P, 2 * Math.floor(P / 4))];
  let s = Math.round((P * d.s) / T);
  if (s % 2 && P - s > 0) s += 1; else if (s % 2) s -= 1;
  s = Math.max(0, Math.min(P, s));
  return [s, P - s];
}
const sw = {};
for (const R of sweeps) for (const r of R.rows) (sw[r.id] ||= []).push({ ...r, n: r.per[0]?.n ?? 0, hard: R.hard || 0 });

const MIN_N = 150;
const lines = [], proposal = [], tally = { fair: 0, under: 0, over: 0, thin: 0, ability: 0 };
for (const q of [...allQuadrantIds(), 'guests']) {
  const ds = defs.filter(d => (d.guest ? 'guests' : d.quadrant) === q);
  if (!ds.length) continue;
  lines.push('', `### ${q === 'guests' ? 'Guest rule-benders' : (quadrant(q).name || q)}`);
  for (const d of ds) {
    const c = P.cards.find(x => x.id === d.id), sc = S.cards.find(x => x.id === d.id), T = d.s + d.w;
    if (!c) continue;
    const thin = c.n < MIN_N || !Number.isFinite(c.lo) || !Number.isFinite(c.hi);
    const covers = c.lo <= T && T <= c.hi, gap = c.fair - T;
    let verdict;
    if (thin) { verdict = 'too few probes to call'; tally.thin++; }
    else if (covers || Math.abs(gap) < 1.5) { verdict = 'fair as printed'; tally.fair++; }
    else if (gap > 0) { verdict = `underpriced, raise to ${even(c.fair)}`; tally.under++; }
    else { verdict = `overpriced, cut to ${even(c.fair)}`; tally.over++; }
    const fl = [];
    // worth nothing even free: the fit says ≤ 0.5 and its CI stays under 1.5, at a printed price above 0
    if (!thin && c.fair <= 0.5 && c.hi < 1.5 && T > 0) fl.push('NEEDS AN ABILITY CHANGE, NOT A PRICE: worth ~nothing even free');
    // so strong a price can't hold it: it would have to more than double
    if (!thin && c.lo > Math.max(2 * T, T + 6)) fl.push('NEEDS AN ABILITY CHANGE, NOT A PRICE: it would have to cost more than double');
    if (fl.length) tally.ability++;
    const extra = (sw[d.id] || []).map(r => `${r.hard ? `Hard seat` : 'single-card sweep'} ~${h(r.fair)} (${h(r.lo)}–${h(r.hi)}, ${r.n} seeds)`);
    const demand = sc && Number.isFinite(sc.buyRate) ? `recruited at ${Math.round(sc.buyRate * 100)}% of affordable offers (screen)` : '';
    lines.push(`- ${d.name} (${d.s}+${d.w}=${T}): fair ~${h(c.fair)} (90% ${h(c.lo)}–${h(c.hi)}, panel n=${c.n}${extra.length ? '; ' + extra.join('; ') : ''}); ${demand}; ${verdict}${fl.length ? '. ' + fl.join('; ') : ''}`);
    if (!thin && !covers && Math.abs(gap) >= 1.5) {
      const Pp = even(c.fair), [ps, pw] = split(d, Pp);
      proposal.push({ id: d.id, name: d.name, printed: [d.s, d.w], proposed: fl.length ? [d.s, d.w] : [ps, pw], fair: +c.fair.toFixed(1), ci90: [+c.lo.toFixed(1), +c.hi.toFixed(1)],
        evidence: `panel (paired forced-recruit, normal bots, random real tables): n=${c.n}, net margin at printed ${c.net.toFixed(2)}, ${Math.round((c.boughtShare || 0) * 100)}% of probes recruited, round ~${h(c.meanRound)}${demand ? '; ' + demand : ''}${extra.length ? '; ' + extra.join('; ') : ''}`,
        ...(fl.length ? { flags: fl, note: 'price left as printed: fix the ability first' } : {}),
        ...(d.vanilla ? { note: 'plain member: Cory set plain members at their old price; review before applying' } : {}) });
    }
  }
}
if (flags.md) writeFileSync(flags.md, lines.join('\n') + '\n'); else console.log(lines.join('\n'));
if (flags.json) writeFileSync(flags.json, JSON.stringify(proposal, null, 1) + '\n');
console.error(JSON.stringify(tally), `${proposal.length} in the proposal`);
