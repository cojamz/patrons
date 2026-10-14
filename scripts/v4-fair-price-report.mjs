// Builds design/eval/fair-price.md's card list and design/eval/reprice-proposal.json from a screen run and any sweeps
// (see scripts/v4-fair-price.mjs). Sweep evidence wins over the screen when it has a finite crossing.
// Usage: node scripts/v4-fair-price-report.mjs screen.json [sweep1.json,sweep2.json...] [--md=out.md] [--json=out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { allQuadrantIds, quadrant, guestMembers } from '../src/engine/v4/content/index.js';

const argv = process.argv.slice(2);
const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [screenFile, sweepFiles = ''] = argv.filter(a => !a.startsWith('--'));
const S = JSON.parse(readFileSync(screenFile, 'utf8'));
const sweeps = sweepFiles.split(',').filter(Boolean).map(f => JSON.parse(readFileSync(f, 'utf8')));
const defs = [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()];
const f1 = x => (Number.isFinite(x) ? (Math.round(x * 2) / 2).toFixed(1).replace(/\.0$/, '') : '–');
const even = x => Math.max(0, 2 * Math.round(x / 2));
const split = (d, P) => { const T = d.s + d.w; if (!T) return [Math.min(P, 2 * Math.round(P / 4)), P - Math.min(P, 2 * Math.round(P / 4))]; let s = Math.round((P * d.s) / T); if (s % 2 && P % 2 === 0 && P - s > 0) s += (d.s >= d.w ? 1 : -1); s = Math.max(0, Math.min(P, s)); return [s, P - s]; };

// latest sweep row per card (later files override earlier ones; a Hard-seat row is kept alongside)
const sw = {}, swHard = {};
for (const R of sweeps) for (const r of R.rows) {
  const n = r.per[0]?.n ?? 0, row = { ...r, n, hard: R.hard || 0, games: R.games };
  if (R.hard) swHard[r.id] = row; else if (!sw[r.id] || n >= sw[r.id].n) sw[r.id] = row;
}

const lines = [], proposal = [];
const order = allQuadrantIds();
const byQ = q => defs.filter(d => (d.guest ? 'guests' : d.quadrant) === q);
for (const q of [...order, 'guests']) {
  const ds = byQ(q); if (!ds.length) continue;
  lines.push('', `### ${q === 'guests' ? 'Guest rule-benders' : quadrant(q).name || q}`);
  for (const d of ds) {
    const c = S.cards.find(x => x.id === d.id), T = d.s + d.w, s = sw[d.id], h = swHard[d.id];
    if (!c) continue;
    const useSweep = s && Number.isFinite(s.fair) && Number.isFinite(s.lo) && Number.isFinite(s.hi) && s.hi - s.lo < (c.hi - c.lo) * 1.5;
    const fair = useSweep ? s.fair : c.fair, lo = useSweep ? s.lo : c.lo, hi = useSweep ? s.hi : c.hi;
    const instr = useSweep ? `sweep, normal seat, ${s.n} paired seeds` : `screen, ${c.owners} owners`;
    const low = !useSweep && c.low;
    const covers = lo <= T && T <= hi;
    const gap = fair - T;
    let verdict;
    if (low) verdict = 'too few owners to call';
    else if (covers || Math.abs(gap) < 1.5) verdict = 'fair';
    else verdict = gap > 0 ? `underpriced: raise to ${even(fair)}` : `overpriced: cut to ${even(fair)}`;
    const flagsOut = [];
    if (!low && fair <= 0.5 && hi < 1.5 && T > 0) flagsOut.push('NEEDS AN ABILITY CHANGE, NOT A PRICE (worth ~nothing even free)');
    if (!low && fair - T >= 8) flagsOut.push('NEEDS AN ABILITY CHANGE, NOT A PRICE (a price this high makes it a late-only buy; trim the ability)');
    if (d.vanilla && verdict.startsWith('under')) flagsOut.push('plain member: kept at old price by Cory’s rule');
    const hardTxt = h ? `; Hard seat ~${f1(h.fair)} (${f1(h.lo)}–${f1(h.hi)}, n=${h.n})` : '';
    const sTxt = useSweep ? `; screen ~${f1(c.fair)}` : (s ? `; sweep ~${f1(s.fair)} (${f1(s.lo)}–${f1(s.hi)}, n=${s.n})` : '');
    lines.push(`- ${d.name} (${d.s}+${d.w}=${T}): fair ~${f1(fair)} (90% ${f1(lo)}–${f1(hi)}, ${instr}${sTxt}${hardTxt}); buy ${Number.isFinite(c.buyRate) ? Math.round(c.buyRate * 100) : '–'}% of affordable offers, got in round ~${f1(c.meanRound)}; ${verdict}${flagsOut.length ? '. ' + flagsOut.join('; ') : ''}`);
    if (!low && !covers && Math.abs(gap) >= 1.5 && !d.vanilla) {
      const P = even(fair), [ps, pw] = split(d, P);
      proposal.push({ id: d.id, name: d.name, printed: [d.s, d.w], proposed: [ps, pw], fair: +fair.toFixed(2), ci90: [+lo.toFixed(2), +hi.toFixed(2)],
        evidence: `${instr}; buy rate ${Math.round(c.buyRate * 100)}%${sTxt}${hardTxt}`, flags: flagsOut });
    }
  }
}
const md = lines.join('\n');
if (flags.md) writeFileSync(flags.md, md + '\n'); else console.log(md);
if (flags.json) writeFileSync(flags.json, JSON.stringify(proposal, null, 1) + '\n');
console.error(`${proposal.length} cards proposed for repricing`);
