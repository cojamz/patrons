// Summarize v4-hard-batch.mjs output. Usage: node scripts/v4-hard-batch-report.mjs <files.jsonl...>
// Win share splits ties. Hard seats only, except the buy-followers-only line. A 4-seat table's even share is 25%.
import { readFileSync } from 'node:fs';
import { allQuadrantIds, quadrant } from '../src/engine/v4/index.js';
import { defById } from '../src/engine/v4/content/index.js';
// A member's cost is its color plus wild (s + w). Cory, Oct 22 (9:49pm): a member should give about 2x its cost in followers (was 1.5x).
const cost = {};
for (const q of allQuadrantIds()) for (const d of quadrant(q).members) cost[`${d.name} (${q})`] = (d.s || 0) + (d.w || 0);
const rows = process.argv.slice(2).flatMap(f => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse));
const share = (r, p) => p.win ? 1 / r.players.filter(x => x.win).length : 0;
const pct = x => `${Math.round(x * 100)}%`;
const bump = (o, k, w) => { (o[k] ??= { n: 0, w: 0 }); o[k].n++; o[k].w += w; };
const fol = {}, color = {}, member = {}, space = {}, offered = {}, buyer = { n: 0, w: 0 };
for (const r of rows) {
  for (const m of r.shop) offered[m] = (offered[m] || 0) + 1;
  // colors: members of each color the winner owns vs another Hard seat
  for (const q of r.table) for (const p of r.players.filter(x => x.seat !== r.buyer)) {
    const c = p.members.filter(m => m.endsWith(`(${q})`)).length;
    (color[q] ??= { gw: 0, nw: 0, gl: 0, nl: 0, games: 0 }); if (p === r.players.find(x => x.seat !== r.buyer)) color[q].games++;
    if (p.win) { color[q].gw += c; color[q].nw++; } else { color[q].gl += c; color[q].nl++; }
  }
  for (const p of r.players) {
    const w = share(r, p);
    if (p.seat === r.buyer) { buyer.n++; buyer.w += w; continue; }
    for (const m of new Set(p.members)) bump(member, m, w);
    for (const [m, f] of Object.entries(p.memberFollowers || {})) { (fol[m] ??= { n: 0, f: 0 }); fol[m].n++; fol[m].f += f; }
    for (const [k, c] of Object.entries(p.places)) { (space[k] ??= { uses: 0, win: 0, lose: 0, nw: 0, nl: 0 }); space[k].uses += c; }
  }
  // spaces: average uses per winner vs per other hard seat
  const hard = r.players.filter(p => p.seat !== r.buyer);
  const keys = new Set(hard.flatMap(p => Object.keys(p.places)));
  for (const k of keys) for (const p of hard) { const c = p.places[k] || 0; if (p.win) { space[k].win += c; space[k].nw++; } else { space[k].lose += c; space[k].nl++; } }
}
const games = rows.length;
console.log(`${games} games, 4 seats, random tables of 4 colors. Buy-followers-only seat: ${buyer.n} games, won ${pct(buyer.w / (buyer.n || 1))}.`);
console.log('\nColors (members of that color, winner vs other Hard seats, on tables with it):');
for (const [q, v] of Object.entries(color).sort((a, b) => (b[1].gw / b[1].nw - b[1].gl / b[1].nl) - (a[1].gw / a[1].nw - a[1].gl / a[1].nl)))
  console.log(`  ${q}: on ${v.games} tables, winner ${(v.gw / (v.nw || 1)).toFixed(2)} vs others ${(v.gl / (v.nl || 1)).toFixed(2)}`);
console.log('\nMembers (owned at game end by a Hard seat; owner win share; bought / times seen in shop), min 6 owners:');
const ml = Object.entries(member).filter(([, v]) => v.n >= Number(process.env.MIN || 6)).map(([k, v]) => [k, v.w / v.n, v.n, offered[k] || 0]).sort((a, b) => b[1] - a[1]);
for (const [k, wr, n, off] of ml) console.log(`  ${k}: wins ${pct(wr)}, owned ${n} times / in shop ${off} games${fol[k] ? `, gave ${(fol[k].f / fol[k].n).toFixed(1)} followers for cost ${cost[k] ?? '?'}${cost[k] ? ` (${(fol[k].f / fol[k].n / cost[k]).toFixed(1)}x)` : ''}, ${fol[k].n} games` : ''}`);
const pick = Object.entries(offered).filter(([, o]) => o >= 8).map(([k, o]) => [k, (member[k]?.n || 0) / o]).sort((a, b) => b[1] - a[1]);
console.log('\nMost and least bought when in the shop (seen in 8+ games):');
console.log('  top: ' + pick.slice(0, 8).map(([k, x]) => `${k} ${pct(x)}`).join(', '));
console.log('  bottom: ' + pick.slice(-8).map(([k, x]) => `${k} ${pct(x)}`).join(', '));
console.log('\nSpaces (uses per game; winner vs other seats, uses per seat):');
const sl = Object.entries(space).map(([k, v]) => [k, v.uses / games, v.win / (v.nw || 1), v.lose / (v.nl || 1)]).sort((a, b) => (b[2] - b[3]) - (a[2] - a[3]));
for (const [k, u, w, l] of sl) console.log(`  ${k}: ${u.toFixed(1)}/game, winner ${w.toFixed(2)} vs others ${l.toFixed(2)}`);
