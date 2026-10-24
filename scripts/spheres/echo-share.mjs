// Green seat and sphere-share sim (Green rework, 2026-10-14). Normal bots, 4 seats: wins by round-I pick, Green's share of
// placements and of all followers, each Green space's yield by round, and the Most green contest.
// Usage: node scripts/spheres/echo-share.mjs [games per table=150] ['gold,red,blue,echo;thieves,market,yellow,echo'] [label]   env: PLUS=n (+n green per copy)
import { createGame, applyMove, chooseBotMove, followers, actionAt, quadrant, defById } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import * as E from '../../src/engine/v4/content/echo.js';
if (process.env.PLUS) E.VARIANT.plus = Number(process.env.PLUS);
const games = Number(process.argv[2] || 150);
const tables = (process.argv[3] || 'gold,red,blue,echo;thieves,market,yellow,echo').split(';').map(t => t.split(','));
const label = process.argv[4] || '';
const tot = r => Object.values(r).reduce((a, b) => a + b, 0);
const st = { g: 0, winsByPick: [0, 0, 0, 0], takes: {}, yieldBy: {}, rounds: 0, none: 0, shared: 0, toLeader: 0, toLast: 0, same: 0, sameN: 0, winPile: [], copierWon: 0, copierRounds: 0,
  greenPlace: 0, allPlace: 0, leftover: [], fol: [], src: {}, srcTot: 0, mem: [], greenMem: [], winnerGreenShare: [], spread: [] };
for (const quads of tables) {
  const eq = quads.indexOf('echo');
  for (let g = 1; g <= games; g++) {
    const rand = seededRandom(g * 9973 + quads.join().length);
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g + 17 * quads.join().length, quadrants: quads });
    const labels = Object.fromEntries(quads.map(q => [quadrant(q).scoring.label, q]));
    const src = s.players.map(() => ({}));
    let firstOrder = null, prevW = null, open = {}, copiers = new Set();
    while (!s.over) {
      const pend = s.pending, m = chooseBotMove(s, rand);
      if (pend.kind === 'place') {
        const o = pend.options.find(x => x.id === m.option);
        st.allPlace++;
        if (o.q === eq) {
          st.greenPlace++;
          const a = actionAt(s, o.q, o.i);
          const k = `${a.name} r${s.round}`;
          st.takes[k] = (st.takes[k] || 0) + 1;
          const p = s.players[pend.player];
          open[pend.player] = { k, res: tot(p.res), mem: p.members.length, disc: p.discount };
          if (a.echo) copiers.add(pend.player);
        }
      }
      if (pend.kind === 'buy' && open[pend.player]) {
        const p = s.players[pend.player], o = open[pend.player];
        (st.yieldBy[o.k] ||= []).push(tot(p.res) - o.res + 2.5 * (p.members.length - o.mem) + 0.9 * (p.discount - o.disc));
        delete open[pend.player];
      }
      const r0 = s.round, fb = s.players.map(p => followers(s, p)), bonus0 = s.players.map(p => p.bonus);
      const next = applyMove(s, m);
      if (!firstOrder && next.order.length) firstOrder = next.order.slice(0, 4);
      if (next.round !== r0 || next.over) {
        const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
        if (line) {
          const parts = line.replace(/^Round [IV]+ ends\. /, '').split(' · ');
          for (const part of parts) {
            const m2 = part.match(/^(.*): (.*) \+(\d+)$/);
            if (!m2) continue;
            const q = labels[m2[1]], v = Number(m2[3]);
            for (const nm of m2[2].split(' & ')) { const i = next.players.findIndex(p => p.name === nm); src[i][q] = (src[i][q] || 0) + v; }
          }
          if (eq >= 0) {
            st.rounds++;
            const gl = quadrant('echo').scoring.label;
            const part = parts.find(x => x.startsWith(gl + ':'));
            if (!part) st.none++;
            else {
              const names = part.slice(gl.length + 2).replace(/ \+\d+$/, '').split(' & ');
              const ids = names.map(nm => next.players.findIndex(p => p.name === nm));
              if (ids.length > 1) st.shared++;
              if (ids.some(i => fb[i] === Math.max(...fb))) st.toLeader++;
              if (ids.some(i => fb[i] === Math.min(...fb))) st.toLast++;
              if (prevW) { st.sameN++; if (ids.some(i => prevW.includes(i))) st.same++; }
              prevW = ids;
              if (copiers.size) { st.copierRounds++; if (ids.some(i => copiers.has(i))) st.copierWon++; }
              st.winPile.push(Math.max(...next.players.map(p => quadrant('echo').scoring.score({ state: next, memberCount: () => 0 }, p))));
            }
          }
          copiers = new Set();
        }
      }
      s = next;
    }
    st.g++;
    const w = s.ranking[0];
    st.winsByPick[firstOrder.indexOf(w)]++;
    const fs = s.players.map(p => followers(s, p));
    st.spread.push(Math.max(...fs) - Math.min(...fs));
    s.players.forEach((p, i) => {
      for (const u of p.members) { const d = defById(s.cards[u].def); const q = d.quadrant; src[i][q] = (src[i][q] || 0) + d.f; }
      for (const part of p.final?.parts || []) { const mm = part.match(/^(.*) ([+−])(\d+)$/); if (!mm) continue; const d = Object.values(s.cards).map(c => defById(c.def)).find(x => x.name === mm[1]); if (d) src[i][d.quadrant] = (src[i][d.quadrant] || 0) + (mm[2] === '+' ? 1 : -1) * Number(mm[3]); }
      src[i].buys = p.bought || 0;
      const total = fs[i];
      for (const [k, v] of Object.entries(src[i])) { st.src[k] = (st.src[k] || 0) + v; }
      st.srcTot += total;
      st.leftover.push(tot(p.res)); st.fol.push(total); st.mem.push(p.members.length);
      st.greenMem.push(p.members.filter(u => s.cards[u].def.startsWith('echo.')).length);
    });
  }
}
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0).toFixed(1);
const pct = (x, d) => (d ? (100 * x / d).toFixed(0) : '-') + '%';
const med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
const o = [];
o.push(`== ${label} ${st.g} games (normal bots, 4 seats) on ${tables.map(t => t.join('/')).join(' ; ')}${process.env.PLUS ? ' PLUS=' + process.env.PLUS : ''}`);
o.push(`wins by round-I pick: ${st.winsByPick.map(x => pct(x, st.g)).join(' / ')} · followers ${avg(st.fol)} · spread ${avg(st.spread)} · members ${avg(st.mem)} (green ${avg(st.greenMem)}) · leftover ${avg(st.leftover)}`);
o.push(`placements on Green: ${pct(st.greenPlace, st.allPlace)} (fair share 25%)`);
o.push(`followers by source: ${Object.entries(st.src).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, st.srcTot)}`).join(' · ')}`);
const keys = Object.keys(st.takes).sort((a, b) => a.slice(-1).localeCompare(b.slice(-1)) || a.localeCompare(b));
o.push('Green takes/game, yield: ' + keys.map(k => `${k} ${(st.takes[k] / st.g).toFixed(2)}/${avg(st.yieldBy[k] || [])}`).join(' | '));
o.push(`contest: none ${pct(st.none, st.rounds)} · shared ${pct(st.shared, st.rounds)} · to leader ${pct(st.toLeader, st.rounds)} · to last ${pct(st.toLast, st.rounds)} · same winner next round ${pct(st.same, st.sameN)} · winning pile median ${med(st.winPile)} · a copier won it ${pct(st.copierWon, st.copierRounds)}`);
console.log(o.join('\n'));
