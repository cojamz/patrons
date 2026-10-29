// Summarize v4-balance.mjs output. Usage: node scripts/v4-balance-report.mjs <files.jsonl...> [--min=20] [--json=out.json]
// Win share splits ties; bot seats only, except the buy-followers-only line. Even share is 1/seats.
// Members: owners win more because owners own more members, so each owner seat is also given an "expected" share, the
// win share of all seats with the same member count at the same seat count. Lift = actual − expected, in points; ± is
// one standard error. A lift past 2 SE on 30+ owners is worth a look.
import { readFileSync, writeFileSync } from 'node:fs';

const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
const MIN = Number(flags.min || 20);
const rows = files.flatMap(f => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
const share = (r, p) => (p.win ? 1 / r.players.filter(x => x.win).length : 0);
const pct = x => `${Math.round(x * 100)}%`, pts = x => `${x >= 0 ? '+' : ''}${Math.round(x * 100)}`;
const bucket = c => Math.min(c, 20);
const se = (p, n) => Math.sqrt(Math.max(p * (1 - p), 0.05) / n);
const bots = r => r.players.filter(p => p.seat !== r.buyer);

// expected win share by (seats, member count), smoothed by pooling neighbours when thin
const curve = {};
for (const r of rows) for (const p of bots(r)) { const k = `${r.seats}:${bucket(p.memberCount)}`; (curve[k] ??= { n: 0, w: 0 }); curve[k].n++; curve[k].w += share(r, p); }
const expected = (seats, c) => {
  let n = 0, w = 0;
  for (let d = 0; d <= 3 && n < 40; d++) for (const x of new Set([c - d, c + d])) { const v = curve[`${seats}:${bucket(x)}`]; if (v) { n += v.n; w += v.w; } }
  return n ? w / n : 1 / seats;
};

const out = { games: rows.length, bySeats: {}, members: {}, colors: {}, artifacts: {}, spaces: {}, spaceUse: {}, seatOrder: {}, membersBySeats: {} };
const add = (o, k, w, e) => { (o[k] ??= { n: 0, w: 0, e: 0 }); o[k].n++; o[k].w += w; o[k].e += e; };
const offered = {}, bought = {}, fol = {}, gotR = {};
for (const r of rows) {
  const S = (out.bySeats[r.seats] ??= { games: 0, buyer: { n: 0, w: 0 }, followers: 0, seatsN: 0, members: 0, top: 0, margin: 0 });
  S.games++;
  const fs = r.players.map(p => p.followers).sort((a, b) => b - a);
  S.top += fs[0]; S.margin += fs[0] - fs[1];
  for (const m of r.shop) offered[m] = (offered[m] || 0) + 1;
  for (const p of r.players) {
    const w = share(r, p);
    if (p.seat === r.buyer) { S.buyer.n++; S.buyer.w += w; continue; }
    S.followers += p.followers; S.members += p.memberCount; S.seatsN++;
    const e = expected(r.seats, p.memberCount);
    add(out.seatOrder, `${r.seats}p seat ${p.seat + 1}`, w, 1 / r.seats);
    for (const m of new Set(p.members)) {
      add(out.members, m, w, e); add(out.membersBySeats[r.seats] ??= {}, m, w, e);
      if (p.gotRound?.[m] !== undefined) { (gotR[m] ??= [0, 0, 0, 0]); gotR[m][p.gotRound[m]]++; }
    }
    if (p.artifact) add(out.artifacts, p.artifact, w, 1 / r.seats);
    for (const [m, f] of Object.entries(p.memberFollowers || {})) { (fol[m] ??= { n: 0, f: 0, c: 0 }); fol[m].n++; fol[m].f += f; fol[m].c += p.memberCost?.[m] || 0; }
    // color: the seat's main color (most members of it, at least 3) vs even share
    const by = {};
    for (const m of p.members) { const q = m.match(/\((\w+)\)$/)?.[1]; if (q && q !== 'benders') by[q] = (by[q] || 0) + 1; }
    const main = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    if (main && main[1] >= 3) add(out.colors, main[0], w, 1 / r.seats);
    for (const [k, c] of Object.entries(p.places)) { (out.spaces[k] ??= { uses: 0, win: 0, lose: 0, nw: 0, nl: 0, tables: 0 }); out.spaces[k].uses += c; add(out.spaceUse, k, w, e); }
  }
  for (const m of new Set(bots(r).flatMap(p => p.members))) bought[m] = (bought[m] || 0) + 1;
  const keys = new Set(bots(r).flatMap(p => Object.keys(p.places)));
  for (const k of keys) { out.spaces[k].tables++; for (const p of bots(r)) { const c = p.places[k] || 0; if (p.win) { out.spaces[k].win += c; out.spaces[k].nw++; } else { out.spaces[k].lose += c; out.spaces[k].nl++; } } }
}

const lvl = [...new Set(rows.map(r => r.level))].join('+');
const priced = [...new Set(rows.flatMap(r => Object.entries(r.prices || {}).map(([k, v]) => `${k} ${v.from}→${v.to}`)))];
console.log(`${lvl} bots, ${rows.length} games, random tables of the 2.0 colors.${priced.length ? ` Prices changed: ${priced.join(', ')}.` : ''}`);
for (const [n, S] of Object.entries(out.bySeats)) console.log(`  ${n} seats: ${S.games} games; buy-followers-only seat won ${pct(S.buyer.w / (S.buyer.n || 1))} of ${S.buyer.n} (even ${pct(1 / n)}); avg followers ${(S.followers / S.seatsN).toFixed(1)}, winner ${(S.top / S.games).toFixed(1)}, margin ${(S.margin / S.games).toFixed(1)}; avg members ${(S.members / S.seatsN).toFixed(1)}`);
console.log('\nSeat order (win share vs even):');
for (const [k, v] of Object.entries(out.seatOrder).sort()) console.log(`  ${k}: ${pct(v.w / v.n)} vs ${pct(v.e / v.n)} (${v.n})`);
console.log('\nMain color (seats with 3+ members of one color, most of that color; win share vs even):');
for (const [k, v] of Object.entries(out.colors).sort((a, b) => (b[1].w - b[1].e) / b[1].n - (a[1].w - a[1].e) / a[1].n)) console.log(`  ${k}: ${pct(v.w / v.n)} vs ${pct(v.e / v.n)}, lift ${pts((v.w - v.e) / v.n)} ±${Math.round(se(v.w / v.n, v.n) * 100)} (${v.n} seats)`);
console.log('\nArtifacts (owner win share vs even):');
for (const [k, v] of Object.entries(out.artifacts).sort((a, b) => (b[1].w - b[1].e) / b[1].n - (a[1].w - a[1].e) / a[1].n)) console.log(`  ${k}: ${pct(v.w / v.n)} vs ${pct(v.e / v.n)}, lift ${pts((v.w - v.e) / v.n)} ±${Math.round(se(v.w / v.n, v.n) * 100)} (${v.n})`);
const ml = Object.entries(out.members).filter(([, v]) => v.n >= MIN).map(([k, v]) => {
  const lift = (v.w - v.e) / v.n, err = se(v.w / v.n, v.n), f = fol[k];
  return { k, n: v.n, win: v.w / v.n, exp: v.e / v.n, lift, err, z: lift / err, buyRate: (bought[k] || 0) / (offered[k] || 1), offered: offered[k] || 0,
    followers: f ? f.f / f.n : null, cost: f ? f.c / f.n : null, got: gotR[k] };
}).sort((a, b) => b.lift - a.lift);
out.memberTable = ml;
console.log(`\nMembers by lift (owner win share minus expected for their member count; ${MIN}+ owners). Followers = printed plus what the ability added:`);
for (const m of ml) console.log(`  ${m.k}: ${pts(m.lift)} ±${Math.round(m.err * 100)}${Math.abs(m.z) >= 2 ? (m.z > 0 ? ' STRONG' : ' WEAK') : ''} | wins ${pct(m.win)} vs ${pct(m.exp)} | owned ${m.n}, a bot owned it in ${pct(m.buyRate)} of the ${m.offered} games it showed | ${m.followers?.toFixed(1)} followers for ${m.cost?.toFixed(0)}`);
const thin = Object.entries(offered).filter(([k]) => (out.members[k]?.n || 0) < MIN).map(([k, o]) => `${k} ${out.members[k]?.n || 0}/${o}`);
if (thin.length) console.log(`\nToo few owners to read (owned/in shop): ${thin.join(', ')}`);
console.log('\nSpaces by lift (seats that took it at least once: win share minus expected for their member count). Uses per game it sits on; winner vs other seats, uses per seat:');
const sl = Object.entries(out.spaces).map(([k, v]) => { const u = out.spaceUse[k]; return { k, per: v.uses / (v.tables || 1), w: v.win / (v.nw || 1), l: v.lose / (v.nl || 1), n: u.n, lift: (u.w - u.e) / u.n, err: se(u.w / u.n, u.n), takers: u.n / (v.tables || 1) }; }).sort((a, b) => b.lift - a.lift);
out.spaceTable = sl;
for (const x of sl) console.log(`  ${x.k}: ${pts(x.lift)} ±${Math.round(x.err * 100)}${Math.abs(x.lift) >= 2 * x.err ? (x.lift > 0 ? ' STRONG' : ' WEAK') : ''} | ${x.per.toFixed(1)}/game, ${x.takers.toFixed(1)} seats take it | winner ${x.w.toFixed(2)} vs others ${x.l.toFixed(2)}`);
if (flags.json) writeFileSync(flags.json, JSON.stringify(out, null, 1));
