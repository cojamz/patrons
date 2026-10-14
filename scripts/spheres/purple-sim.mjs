// Purple balance sim: greedy bots, Purple in place of the blue stand-in.
// Usage: node scripts/spheres/purple-sim.mjs [games=400] [players=4] [quadrants=gold,red,purple,green]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import purple, { restingOf } from '../../src/engine/v4/content/purple.js';
import { contextFor } from '../../src/engine/v4/core.js';
registerQuadrant(purple);

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,purple,green').split(',');
const pq = quadrants.indexOf('purple');
const st = { wins: Array(n).fill(0), fol: [], mem: [], takes: {}, takesByRound: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  purpleMembers: [], restingAtRoundEnd: [], placements: [], winnerPurpleContest: [], contestFromLast: 0, contestWinnerPos: {}, sixBuys: 0, errors: 0 };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const pc = Array(n).fill(0), placed = Array(n).fill(0);
  let lastPlacer = null;
  try {
    while (!s.over) {
      const pend = s.pending;
      const mv = chooseBotMove(s, rand);
      if (pend.kind === 'place') {
        placed[pend.player]++;
        lastPlacer = pend.player;
        const o = pend.options.find(x => x.id === mv.option);
        if (o.q === pq) { const a = actionAt(s, o.q, o.i).name; st.takes[a] = (st.takes[a] || 0) + 1; const k = `${a} r${s.round}`; st.takesByRound[k] = (st.takesByRound[k] || 0) + 1; }
      }
      if (pend.kind === 'buy' && mv.option === 'tier:big') st.sixBuys++;
      const r0 = s.round;
      const ctxBefore = contextFor(s);
      const restBefore = s.players.map(p => restingOf(ctxBefore, p));
      const next = applyMove(s, mv);
      if (next.round !== r0 || next.over) {
        const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
        if (line) {
          st.contestRounds++;
          for (const v of restBefore) st.restingAtRoundEnd.push(v);
          const part = line.split(' · ').find(x => x.includes('Most resting'));
          if (!part) st.noScore++;
          else {
            const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
            if (names.length > 1) st.ties++;
            for (const nm of names) {
              const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; pc[id] += [2, 4, 6][r0 - 1];
              if (id === lastPlacer) st.contestFromLast++;
            }
          }
        }
      }
      s = next;
    }
  } catch (e) { st.errors++; console.error(`game ${g}: ${e.message}`); continue; }
  const w = s.ranking[0];
  st.wins[w]++;
  st.winnerPurpleContest.push(pc[w]);
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p));
    st.purpleMembers.push(p.members.filter(u => s.cards[u].def.startsWith('purple.')).length);
  }
  placed.forEach(x => st.placements.push(x));
}
const avg = a => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);
console.log(`${games} games, ${n} players, ${quadrants.join('/')}${st.errors ? `, ERRORS ${st.errors}` : ''}`);
console.log(`wins by seat: ${st.wins.join(' / ')}  (${st.wins.map(x => (100 * x / games).toFixed(0) + '%').join(' / ')})`);
console.log(`avg followers ${avg(st.fol)} · avg members ${avg(st.mem)} · purple members owned ${avg(st.purpleMembers)} · placements per player ${avg(st.placements)} (12 base) · 6-buys/game ${(st.sixBuys / games).toFixed(1)}`);
if (pq >= 0) {
  console.log(`Purple takes per game: ${Object.entries(st.takes).map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`  by round: ${Object.entries(st.takesByRound).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`Resting contest: nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}% of rounds; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}; won by the round's last placer ${st.contestFromLast}`);
  console.log(`  resting workers per player at round end ${avg(st.restingAtRoundEnd)}; winner's followers from the contest ${avg(st.winnerPurpleContest)}`);
}
