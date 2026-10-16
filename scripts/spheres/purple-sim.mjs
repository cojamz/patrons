// Purple balance sim: greedy bots, Purple in place of the blue stand-in.
// Usage: node scripts/spheres/purple-sim.mjs [games=400] [players=4] [quadrants=gold,red,purple,green]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import purple, { onBoard } from '../../src/engine/v4/content/purple.js';
import { contextFor } from '../../src/engine/v4/core.js';
registerQuadrant(purple);

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,purple,green').split(',');
const pq = quadrants.indexOf('purple');
const st = { wins: Array(n).fill(0), fol: [], mem: [], takes: {}, takesByRound: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  purpleMembers: [], placements: [], winnerContest: [], takers: {}, sixBuys: 0, errors: 0, streaks: {}, longest: [], squeezed: 0, boardTop: 0, purpleTie: 0, allEqual: 0 };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const pc = Array(n).fill(0), placed = Array(n).fill(0);
  const took = Array.from({ length: n }, () => new Set());
  let lastPlacer = null, streak = 0, longest = 0;
  try {
    while (!s.over) {
      const pend = s.pending;
      const mv = chooseBotMove(s, rand);
      if (pend.kind === 'place') {
        placed[pend.player]++;
        streak = pend.player === lastPlacer ? streak + 1 : 1;
        // count placements in a row by one player (the snake's ends already give 2)
        longest = Math.max(longest, streak);
        st.streaks[streak] = (st.streaks[streak] || 0) + 1;
        lastPlacer = pend.player;
        const o = pend.options.find(x => x.id === mv.option);
        const a = actionAt(s, o.q, o.i).name;
        took[pend.player].add(a);
        if (o.q === pq) { st.takes[a] = (st.takes[a] || 0) + 1; const k = `${a} r${s.round}`; st.takesByRound[k] = (st.takesByRound[k] || 0) + 1; }
      }
      if (pend.kind === 'buy' && mv.option === 'tier:big') st.sixBuys++;
      const r0 = s.round;
      const ctxS = contextFor(s);
      const boards = s.players.map(p => onBoard(ctxS, p));
      const next = applyMove(s, mv);
      st.squeezed += next.log.slice(s.log.length).filter(l => l.includes('No space to spare')).length;
      if (next.round !== r0 || next.over) {
        const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
        if (line) {
          st.contestRounds++;
          const top = Math.max(...boards);
          if (boards.every(b => b === top)) st.allEqual++;
          if (boards.filter(b => b === top).length > 1) st.purpleTie++; else st.boardTop++;
          const part = line.split(' · ').map(x => x.replace(/^Round \S+ ends\. /, '')).find(x => x.startsWith(`${purple.scoring.label}:`));
          if (!part) st.noScore++;
          else {
            const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
            if (names.length > 1) st.ties++;
            for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; pc[id] += [2, 4, 6][r0 - 1]; }
          }
        }
      }
      s = next;
    }
  } catch (e) { st.errors++; console.error(`game ${g}: ${e.message}`); continue; }
  const w = s.ranking[0];
  st.wins[w]++;
  took.forEach((set, i) => { for (const a of set) { const t = st.takers[a] ||= { n: 0, w: 0 }; t.n++; if (i === w) t.w++; } });
  st.winnerContest.push(pc[w]);
  st.longest.push(longest);
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p));
    st.purpleMembers.push(p.members.filter(u => s.cards[u].def.startsWith('purple.')).length);
  }
  placed.forEach(x => st.placements.push(x));
}
const avg = a => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);
const played = games - st.errors;
console.log(`${games} games, ${n} players, ${quadrants.join('/')}${st.errors ? `, ERRORS ${st.errors}` : ''}`);
console.log(`wins by seat: ${st.wins.join(' / ')}  (${st.wins.map(x => (100 * x / played).toFixed(0) + '%').join(' / ')})`);
console.log(`avg followers ${avg(st.fol)} · avg members ${avg(st.mem)} · purple members owned ${avg(st.purpleMembers)} · placements per player ${avg(st.placements)} (12 base) · 6-buys/game ${(st.sixBuys / played).toFixed(1)}`);
console.log(`turns in a row by one player: ${Object.entries(st.streaks).map(([k, v]) => `${k}: ${v}`).join(' · ')} · longest per game avg ${avg(st.longest)} · extra turns refused (no spare space) ${st.squeezed}`);
if (pq >= 0) {
  console.log(`Purple takes per game: ${Object.entries(st.takes).map(([k, v]) => `${k} ${(v / played).toFixed(2)}`).join(' · ')}`);
  console.log(`  by round: ${Object.entries(st.takesByRound).sort().map(([k, v]) => `${k} ${(v / played).toFixed(2)}`).join(' · ')}`);
  console.log(`Board contest: nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}% of rounds; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}; winner's followers from it ${avg(st.winnerContest)}`);
  console.log(`  decided by more workers ${(100 * st.boardTop / st.contestRounds).toFixed(0)}% · by the purple tiebreak ${(100 * st.purpleTie / st.contestRounds).toFixed(0)}% (everyone level on the board ${(100 * st.allEqual / st.contestRounds).toFixed(0)}%)`);
  console.log(`Win rate of players who took each action at least once (25% = average at 4p): ${Object.entries(st.takers).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).map(([k, v]) => `${k} ${(100 * v.w / v.n).toFixed(0)}%`).join(' · ')}`);
}
