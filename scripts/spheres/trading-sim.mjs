// White (trading) balance sim: greedy bots, White in place of the green stand-in.
// Usage: node scripts/spheres/trading-sim.mjs [games=400] [players=4] [quadrants=gold,red,blue,trading]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { install } from '../../src/engine/v4/content/trading.js';
install();

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,trading').split(',');
const wq = quadrants.indexOf('trading');
const st = { wins: Array(n).fill(0), fol: [], mem: [], takes: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  winnerWhiteContest: [], whiteMembers: [], leftover: [], whiteLeft: [], sold: 0, sixBuys: 0, winnerWhiteMembers: 0, contestWinnerWonGame: 0, gameRounds: 0,
  whiteAtRoundEnd: [[], [], []], spread: [] };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const wContest = Array(n).fill(0);
  while (!s.over) {
    const pend = s.pending;
    const m = chooseBotMove(s, rand);
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === m.option);
      if (o.q === wq) { const k = `${actionAt(s, o.q, o.i).name} r${s.round}`; st.takes[k] = (st.takes[k] || 0) + 1; }
    }
    if (pend.kind === 'buy' && m.option === 'tier:big') st.sixBuys++;
    const r0 = s.round;
    const before = s.players.map(p => p.res.white);
    const next = applyMove(s, m);
    if (next.round !== r0 || next.over) {
      const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
      if (line) {
        st.contestRounds++;
        // white held when the round ended (before round-start income of the next round)
        const ws = [...before].sort((a, b) => b - a);
        st.spread.push(ws[0] - ws[1]);
        before.forEach(w => st.whiteAtRoundEnd[r0 - 1].push(w));
        const part = line.split(' · ').map(x => x.replace(/^Round [IV]+ ends\. /, '')).find(x => x.startsWith('Most white'));
        if (!part) st.noScore++;
        else {
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.ties++;
          for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; wContest[id] += [2, 4, 6][r0 - 1]; }
        }
      }
    }
    for (const l of next.log.slice(s.log.length >= 300 ? 0 : s.log.length)) if (/ (sold|pawned) \d+ follower/.test(l)) st.sold += Number(l.match(/(\d+) follower/)[1]);
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  st.winnerWhiteContest.push(wContest[w]);
  const top = Math.max(...wContest);
  if (wContest[w] === top && top > 0) st.contestWinnerWonGame++;
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p));
    const wm = p.members.filter(u => s.cards[u].def.startsWith('trading.')).length;
    st.whiteMembers.push(wm);
    st.leftover.push(Object.values(p.res).reduce((a, b) => a + b, 0));
    st.whiteLeft.push(p.res.white || 0);
  }
}
const avg = a => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(1);
console.log(`${games} games, ${n} players, ${quadrants.join('/')}`);
console.log(`wins by seat: ${st.wins.join(' / ')}  (${st.wins.map(x => (100 * x / games).toFixed(0) + '%').join(' / ')})`);
console.log(`avg followers ${avg(st.fol)} · avg members ${avg(st.mem)} · white members owned ${avg(st.whiteMembers)} · leftover resources ${avg(st.leftover)} (white ${avg(st.whiteLeft)}) · 6-buys/game ${(st.sixBuys / games).toFixed(1)}`);
if (wq >= 0) {
  console.log(`White action takes per game: ${Object.entries(st.takes).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`followers sold per game ${(st.sold / games).toFixed(1)}`);
  console.log(`White contest: ${st.contestRounds} rounds; nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}%; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}`);
  console.log(`  white held at round end (avg) I ${avg(st.whiteAtRoundEnd[0])} · II ${avg(st.whiteAtRoundEnd[1])} · III ${avg(st.whiteAtRoundEnd[2])}; leader's margin over 2nd ${avg(st.spread)}`);
  console.log(`  winner's followers from the White contest ${avg(st.winnerWhiteContest)}; the game's top White scorer won the game ${(100 * st.contestWinnerWonGame / games).toFixed(0)}%`);
}
