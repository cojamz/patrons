// Blue (market) balance sim: greedy bots, Blue in place of the blue stand-in.
// Usage: node scripts/spheres/market-sim.mjs [games=400] [quadrants=gold,red,market,green]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant, quadrant } from '../../src/engine/v4/content/index.js';
import market, { memberValue, install } from '../../src/engine/v4/content/market.js';
import { contextFor } from '../../src/engine/v4/core.js';
install();

const games = Number(process.argv[2] || 400), n = 4;
const quadrants = (process.argv[3] || 'gold,red,market,green').split(',');
const gains = {}; let bargains = { Bargain: [0, 0], Clearance: [0, 0] };
const st = { wins: Array(n).fill(0), fol: [], mem: [], val: [], left: [], takes: {}, contest: {}, contestRounds: 0, top: [], winContest: [], uses: {}, buys: { member: 0, tier: 0 } };
const labels = quadrants.map(q => quadrant(q).scoring.label);
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const fromContest = Array(n).fill(0);
  while (!s.over) {
    const pend = s.pending, m = chooseBotMove(s, rand);
    const o = pend.options.find(x => x.id === m.option);
    if (pend.kind === 'place') {
      const q = quadrants[o.q];
      if (q === 'market' || quadrant(q).standIn) { const a = actionAt(s, o.q, o.i).name; const k = `${a}`; st.takes[k] ??= [0, 0, 0]; st.takes[k][s.round - 1]++; }
    }
    if (pend.kind === 'buy') { if (o.kind === 'use') { const nm = s.cards[o.uid].def; st.uses[nm] = (st.uses[nm] || 0) + 1; } if (o.kind === 'card') st.buys.member++; if (o.kind === 'tier') st.buys.tier++; }
    const r0 = s.round;
    const blue0 = s.players[pend.player].res.blue;
    const next = applyMove(s, m);
    if (pend.kind === 'place' && quadrants[o.q] === 'market') {
      const a = actionAt(s, o.q, o.i).name; gains[a] ??= [0, 0]; gains[a][0] += next.players[pend.player].res.blue - blue0; gains[a][1]++;
    }
    for (const l of next.log.slice(s.log.length >= 300 ? 0 : s.log.length)) {
      const mm = l.match(/^(Bargain|Clearance): .* pays (.*) for (.*)\.$/);
      if (mm && s.log[s.log.length - 1] !== l) { bargains[mm[1]][0]++; }
    }
    if (next.round !== r0 || next.over) {
      const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
      if (line) {
        st.contestRounds++;
        for (const lab of labels) {
          const part = line.split(/ends\. | · /).find(x => x.startsWith(lab + ':'));
          st.contest[lab] ??= { none: 0, ties: 0, bySeat: Array(n).fill(0), followers: 0 };
          if (!part) { st.contest[lab].none++; continue; }
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.contest[lab].ties++;
          for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contest[lab].bySeat[id]++; if (lab === 'Most member value') fromContest[id] += [2, 4, 6][r0 - 1]; }
        }
      }
    }
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  st.winContest.push(fromContest[w]);
  const ctx = contextFor(s);
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p)); st.val.push(memberValue(ctx, p));
    st.left.push(Object.values(p.res).reduce((a, b) => a + b, 0));
  }
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
const pct = x => (100 * x / games).toFixed(0) + '%';
console.log(`${games} games, 4 greedy bots, ${quadrants.join('/')}`);
console.log(`wins by seat: ${st.wins.map(pct).join(' / ')}`);
console.log(`avg followers ${avg(st.fol)} · members ${avg(st.mem)} · member value ${avg(st.val)} · leftover resources ${avg(st.left)} · buys/game: members ${(st.buys.member / games).toFixed(1)}, follower buys ${(st.buys.tier / games).toFixed(1)}`);
console.log('takes per game (rounds I/II/III):');
for (const [k, v] of Object.entries(st.takes)) console.log(`  ${k.padEnd(10)} ${v.map(x => (x / games).toFixed(2)).join(' / ')}`);
console.log('contests (share of rounds nobody scored / shared; wins by seat):');
for (const [k, v] of Object.entries(st.contest)) console.log(`  ${k.padEnd(18)} none ${(100 * v.none / (games * 3)).toFixed(0)}% · shared ${(100 * v.ties / (games * 3)).toFixed(0)}% · ${v.bySeat.join('/')}`);
console.log(`winner's followers from the member-value contest: ${avg(st.winContest)}`);
console.log(`avg blue gained per take: ${Object.entries(gains).map(([k, [a, b]]) => `${k} ${(a / b).toFixed(1)}`).join(' · ')}`);
console.log(`paid recruits per game: Bargain ${(bargains.Bargain[0] / games).toFixed(2)} · Clearance ${(bargains.Clearance[0] / games).toFixed(2)}`);
console.log(`activations per game: ${Object.entries(st.uses).map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
