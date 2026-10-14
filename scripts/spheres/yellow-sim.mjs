// Yellow balance sim: greedy bots, Yellow in place of the blue stand-in.
// Usage: node scripts/spheres/yellow-sim.mjs [games=400] [players=4] [quadrants=gold,red,yellow,green]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import yellow, { setsOf } from '../../src/engine/v4/content/yellow.js';
import { contextFor } from '../../src/engine/v4/core.js';
registerQuadrant(yellow);

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,yellow,green').split(',');
const yq = quadrants.indexOf('yellow');
const st = { wins: Array(n).fill(0), fol: [], mem: [], takes: {}, takesByRound: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  winnerHadYellow: 0, yellowMembersOwned: [], setsAtEnd: [], yellowContestFollowersOfWinner: [], leftover: [], winnerIsYellowLeader: 0, sixBuys: 0 };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const yContest = Array(n).fill(0);
  while (!s.over) {
    const pend = s.pending;
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === chooseBotMove(s, seededRandom(0))?.option);
    }
    const m = chooseBotMove(s, rand);
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === m.option);
      if (o.q === yq) { const a = actionAt(s, o.q, o.i).name; st.takes[a] = (st.takes[a] || 0) + 1; const k = `${a} r${s.round}`; st.takesByRound[k] = (st.takesByRound[k] || 0) + 1; }
    }
    if (pend.kind === 'buy' && m.option === 'tier:big') st.sixBuys++;
    const r0 = s.round, ended = s.queue[0]?.t;
    // score the Yellow contest ourselves right before the round-end task runs
    const next = applyMove(s, m);
    if (next.round !== r0 || next.over) {
      // round ended inside this move: recompute from the log line
      const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
      if (line) {
        st.contestRounds++;
        const part = line.split(' · ').find(x => x.includes('Most full sets'));
        if (!part) st.noScore++;
        else {
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.ties++;
          for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; yContest[id] += [2, 4, 6][r0 - 1]; }
        }
      }
    }
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  st.yellowContestFollowersOfWinner.push(yContest[w]);
  const ctx = contextFor(s);
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p));
    st.setsAtEnd.push(setsOf(ctx, p));
    st.yellowMembersOwned.push(p.members.filter(u => s.cards[u].def.startsWith('yellow.')).length);
    st.leftover.push(Object.values(p.res).reduce((a, b) => a + b, 0));
  }
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`${games} games, ${n} players, ${quadrants.join('/')}`);
console.log(`wins by seat: ${st.wins.join(' / ')}  (${st.wins.map(x => (100 * x / games).toFixed(0) + '%').join(' / ')})`);
console.log(`avg followers ${avg(st.fol)} · avg members ${avg(st.mem)} · avg yellow members owned ${avg(st.yellowMembersOwned)} · leftover resources ${avg(st.leftover)} · 6-buys/game ${(st.sixBuys / games).toFixed(1)}`);
if (yq >= 0) {
  console.log(`Yellow action takes per game: ${Object.entries(st.takes).map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`  by round: ${Object.entries(st.takesByRound).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`Sets contest: ${st.contestRounds} rounds; nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}%; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}`);
  console.log(`  winner's followers from the sets contest: ${avg(st.yellowContestFollowersOfWinner)}; full sets held at game end: ${avg(st.setsAtEnd)}`);
}
