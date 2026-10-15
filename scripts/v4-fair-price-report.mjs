// Builds the card list for design/eval/fair-price.md and design/eval/reprice-proposal.json from
//   a panel run (the price: causal, paired, every card), a screen run (demand: how often bots recruit it when offered
//   and affordable, at jittered prices) and optional single-card sweeps (anchors; a Hard test seat).
// Usage: node scripts/v4-fair-price-report.mjs --panel=p.json --screen=s.json [--sweeps=a.json,b.json] [--md=out.md] [--json=out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { allQuadrantIds, quadrant, guestMembers } from '../src/engine/v4/content/index.js';

const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const load = f => JSON.parse(readFileSync(f, 'utf8'));
const P = load(flags.panel), S = flags.screen ? load(flags.screen) : { cards: [] };
// --confirm: a panel centred on the proposed prices (grid proposed ±4); its fit replaces the main panel's extrapolation
const CF = flags.confirm ? load(flags.confirm) : null;
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

const MIN_N = 150, GAP = 2;
// the ability's worth floor: a plain 1-follower member (Volunteer) in the same instrument
const VOL = P.cards.find(x => x.id === 'red.volunteer')?.fair ?? 2;
const roman = r => ['I', 'II', 'III'][r - 1];
const lines = [], proposal = [], tally = { fair: 0, under: 0, over: 0, thin: 0, ability: 0 };
for (const q of [...allQuadrantIds(), 'guests']) {
  const ds = defs.filter(d => (d.guest ? 'guests' : d.quadrant) === q);
  if (!ds.length) continue;
  lines.push('', `### ${q === 'guests' ? 'Guest rule-benders' : (quadrant(q).name || q)}`);
  for (const d of ds) {
    const c0 = P.cards.find(x => x.id === d.id), sc = S.cards.find(x => x.id === d.id), T = d.s + d.w;
    if (!c0) continue;
    const cf = CF?.cards.find(x => x.id === d.id && x.n >= 300 && CF.printed[x.id] !== T);
    const c = cf ? { ...cf, mainFair: c0.fair, center: CF.printed[d.id] } : c0;
    const thin = c.n < MIN_N || !Number.isFinite(c.lo) || !Number.isFinite(c.hi);
    const covers = c.lo <= T && T <= c.hi, gap = c.fair - T;
    let verdict;
    if (thin) { verdict = 'too few probes to call'; tally.thin++; }
    else if (covers || Math.abs(gap) < GAP) { verdict = 'fair as printed'; tally.fair++; }
    else if (gap > 0) { verdict = `underpriced, raise to ${even(c.fair)}`; tally.under++; }
    else { verdict = `overpriced, cut to ${even(c.fair)}`; tally.over++; }
    const fl = [];
    if (d.vanilla) fl.push('plain member: a yardstick, priced by Cory’s rule (old price)');
    // the ability adds nothing: worth no more than a plain 1-follower member, with the CI agreeing
    if (!thin && !d.vanilla && T > 0 && c.hi < VOL + 1.5 && c.fair <= VOL) fl.push(`NEEDS AN ABILITY CHANGE, NOT A PRICE: worth no more than a Volunteer (~${h(VOL)}) in its best round`);
    // nobody wants it: under 3% of affordable offers recruited even at jittered prices, and the price is already above its worth
    else if (!thin && !d.vanilla && !covers && sc && sc.buyRate < 0.03 && gap <= -GAP) fl.push('NEEDS AN ABILITY CHANGE, NOT A PRICE: bots recruit it under 3% of the time even when cheap; a cut alone leaves a dead card');
    // so strong a price can't hold it: it would have to more than double
    if (!thin && c.lo > Math.max(2 * T, T + 6)) fl.push('NEEDS AN ABILITY CHANGE, NOT A PRICE: it would have to cost more than double');
    if (!thin && sc && sc.buyRate < 0.1 && gap >= GAP) fl.push(`bots under-recruit it (${Math.round(sc.buyRate * 100)}% of affordable offers): a bot-valuation gap too`);
    if (fl.some(f => f.startsWith('NEEDS'))) tally.ability++;
    const prof = Object.entries(c.byRound || {}).map(([r, b]) => `${roman(+r)} ${h(b.fair)}`).join(' / ');
    const conf = c.center ? `; confirmed on a grid around ${c.center} (main panel, extrapolated: ~${h(c.mainFair)})` : '';
    const extra = (sw[d.id] || []).map(r => `${r.hard ? `Hard seat` : 'single-card sweep'} ~${h(r.fair)} (${h(r.lo)}–${h(r.hi)}, ${r.n} seeds)`);
    const demand = sc && Number.isFinite(sc.buyRate) ? `recruited at ${Math.round(sc.buyRate * 100)}% of affordable offers (screen)` : '';
    lines.push(`- ${d.name} (${d.s}+${d.w}=${T}): fair ~${h(c.fair)} (90% ${h(c.lo)}–${h(c.hi)}, panel n=${c.n}${conf}; by round recruited ${prof}${extra.length ? '; ' + extra.join('; ') : ''}); ${demand}; ${verdict}${fl.length ? '. ' + fl.join('; ') : ''}`);
    if (!thin && !covers && Math.abs(gap) >= GAP && !d.vanilla) {
      const Pp = even(c.fair), [ps, pw] = split(d, Pp);
      proposal.push({ id: d.id, name: d.name, printed: [d.s, d.w], proposed: fl.some(f => f.startsWith('NEEDS')) ? [d.s, d.w] : [ps, pw], fair: +c.fair.toFixed(1), ci90: [+c.lo.toFixed(1), +c.hi.toFixed(1)],
        evidence: `panel (paired forced recruit, normal bots, random real tables): n=${c.n}, best recruited from round ${roman(c.bestRound)} (net ${c.net >= 0 ? '+' : ''}${c.net.toFixed(1)} followers of margin at printed), by round ${prof}${conf}${demand ? '; ' + demand : ''}${extra.length ? '; ' + extra.join('; ') : ''}`,
        bestRound: c.bestRound, byRound: Object.fromEntries(Object.entries(c.byRound || {}).map(([r, b]) => [r, +b.fair.toFixed(1)])),
        ...(fl.some(f => f.startsWith('NEEDS')) ? { flags: fl, note: 'proposed = printed: fix the ability first, then re-price' } : fl.length ? { flags: fl } : {}) });
    }
  }
}
if (flags.md) writeFileSync(flags.md, lines.join('\n') + '\n'); else console.log(lines.join('\n'));
if (flags.json) writeFileSync(flags.json, JSON.stringify(proposal, null, 1) + '\n');
console.error(JSON.stringify(tally), `${proposal.length} in the proposal`);
