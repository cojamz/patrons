// White (trading) balance sim: greedy bots, White in place of the green stand-in.
// Usage: node scripts/spheres/trading-sim.mjs [games=400] [players=4] [quadrants=gold,red,blue,trading]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt, quadrant } from '../../src/engine/v4/index.js';
import { chooseFollowerBuyerMove } from '../../src/engine/v4/bots.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { install } from '../../src/engine/v4/content/trading.js';
install();

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,trading').split(',');
const BUYER = process.env.BUYER === '1';
let buyerWins = 0, lastGot = 0, lastRounds = 0;
const wq = quadrants.indexOf('trading');
const st = { wins: Array(n).fill(0), fol: [], mem: [], takes: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  winnerWhiteContest: [], whiteMembers: [], leftover: [], whiteLeft: [], sold: 0, sixBuys: 0, winnerWhiteMembers: 0, contestWinnerWonGame: 0, gameRounds: 0,
  whiteAtRoundEnd: [[], [], []], spread: [], boom: [], heiress: [], cashed: [] };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const wContest = Array(n).fill(0);
  while (!s.over) {
    const pend = s.pending;
    const m = BUYER && pend.player === g % n ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand);
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
        const part = line.split(' · ').map(x => x.replace(/^Round [IV]+ ends\. /, '')).find(x => x.startsWith(quadrant('trading').scoring.label));
        if (!part) st.noScore++;
        else {
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.ties++;
          const fb = s.players.map(p => followers(s, p)), lo = Math.min(...fb); lastRounds++;
          if (names.some(nm => fb[s.players.findIndex(p => p.name === nm)] === lo)) lastGot++;
          for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; wContest[id] += [2, 4, 6][r0 - 1]; }
        }
      }
    }
    for (const l of next.log) {
      let mm;
      if ((mm = l.match(/ (sold|pawned)[^\d]*(\d+) follower/))) st.sold += Number(mm[2]);
      if ((mm = l.match(/All In: (\d+) resources became/))) st.boom.push(Number(mm[1]));
      if ((mm = l.match(/used Heiress: \+(\d+) white/))) st.heiress.push(Number(mm[1]));
      if ((mm = l.match(/traded (\d+) white for/))) st.cashed.push(Number(mm[1]));
    }
    // only new lines matter; the engine caps the log, so clear it after reading
    next.log = [];
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  if (BUYER && w === g % n) buyerWins++;
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
if (BUYER) console.log(`buy-followers-only seat wins ${(100 * buyerWins / games).toFixed(1)}%`);
console.log(`White prize went to (one of) the fewest-followers players ${(100 * lastGot / Math.max(1, lastRounds)).toFixed(0)}% of scored rounds`);
if (wq >= 0) {
  console.log(`White action takes per game: ${Object.entries(st.takes).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`followers sold per game ${(st.sold / games).toFixed(1)} · Boom turns ${avg(st.boom)} resources into followers · Cash In trades ${avg(st.cashed)} white · Heiress gives ${avg(st.heiress)} white`);
  console.log(`White contest: ${st.contestRounds} rounds; nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}%; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}`);
  console.log(`  white held at round end (avg) I ${avg(st.whiteAtRoundEnd[0])} · II ${avg(st.whiteAtRoundEnd[1])} · III ${avg(st.whiteAtRoundEnd[2])}; leader's margin over 2nd ${avg(st.spread)}`);
  console.log(`  winner's followers from the White contest ${avg(st.winnerWhiteContest)}; the game's top White scorer won the game ${(100 * st.contestWinnerWonGame / games).toFixed(0)}%`);
}
