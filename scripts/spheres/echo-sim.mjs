// Green (echo) balance sim: greedy bots, Green in place of the green stand-in.
// Usage: node scripts/spheres/echo-sim.mjs [games=400] [players=4] [quadrants=gold,red,blue,echo]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { install } from '../../src/engine/v4/content/echo.js';
install();

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,echo').split(',');
const eq = quadrants.indexOf('echo');
const label = quadrants.includes('echo') ? 'Most green' : 'Most green';
const st = { wins: Array(n).fill(0), winsByPick: Array(n).fill(0), fol: [], mem: [], takes: {}, yieldBy: {}, contestRounds: 0, noScore: 0, ties: 0,
  contestToLeader: 0, contestToLast: 0, sameTwice: 0, sameTwiceN: 0, winnerWonGreen: 0, greenEnd: [], greenMembers: [], leftover: [], copies: 0, sixBuys: 0, spread: [] };
const tot = r => Object.values(r).reduce((a, b) => a + b, 0);
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  let firstOrder = null; let prevWinners = null; let winnerGreen = new Set();
  while (!s.over) {
    const pend = s.pending;
    const m = chooseBotMove(s, rand);
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === m.option);
      if (o.q === eq) { const k = `${actionAt(s, o.q, o.i).name} r${s.round}`; st.takes[k] = (st.takes[k] || 0) + 1; }
    }
    // what each space gave, read from the ledger once the taker reaches their buy step
    if (pend.kind === 'buy' && s.echo?.lastBy && s.echo.counted !== s.echo.lastBy + ':' + s.moves) {
      const e = s.echo.now[s.echo.lastBy];
      if (e && e.p === pend.player && !s.echo.seen?.[e.key]) {
        s.echo.seen = { ...(s.echo.seen || {}), [e.key]: 1 };
        const k = `${e.name} r${s.round}`;
        (st.yieldBy[k] ||= []).push(tot(e.res) + e.discount + 2.5 * e.members.length);
      }
    }
    if (pend.kind === 'buy' && m.option === 'tier:big') st.sixBuys++;
    const r0 = s.round;
    // followers before the round ends (leader/last for the contest)
    const folBefore = s.players.map(p => followers(s, p));
    const next = applyMove(s, m);
    if (next.round !== r0 && next.echo) next.echo.seen = {};
    if (!firstOrder && next.order.length) firstOrder = next.order.slice(0, n);
    if (next.round !== r0 || next.over) {
      const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
      if (line) {
        st.contestRounds++;
        const part = line.split(' · ').map(x => x.replace(/^Round [IV]+ ends\. /, '')).find(x => x.startsWith(label));
        if (!part) st.noScore++;
        else {
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.ties++;
          const ids = names.map(nm => next.players.findIndex(p => p.name === nm));
          const top = Math.max(...folBefore), bot = Math.min(...folBefore);
          if (ids.some(i => folBefore[i] === top)) st.contestToLeader++;
          if (ids.some(i => folBefore[i] === bot)) st.contestToLast++;
          if (prevWinners) { st.sameTwiceN++; if (ids.some(i => prevWinners.includes(i))) st.sameTwice++; }
          prevWinners = ids; ids.forEach(i => winnerGreen.add(i));
        }
      }
    }
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  st.winsByPick[firstOrder.indexOf(w)]++;
  if (winnerGreen.has(w)) st.winnerWonGreen++;
  const fs = s.players.map(p => followers(s, p));
  st.spread.push(Math.max(...fs) - Math.min(...fs));
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p));
    st.greenEnd.push(p.res.green || 0);
    st.greenMembers.push(p.members.filter(u => s.cards[u].def.startsWith('echo.')).length);
    st.leftover.push(tot(p.res));
  }
  st.copies += s.log.filter(l => / copied /.test(l)).length; // log is capped at 300 lines; a floor
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
const pct = (x, d) => (100 * x / d).toFixed(0) + '%';
console.log(`${games} games, ${n} players, ${quadrants.join('/')}`);
console.log(`wins by seat: ${st.wins.map(x => pct(x, games)).join(' / ')} · by round-I pick order: ${st.winsByPick.map(x => pct(x, games)).join(' / ')}`);
console.log(`avg followers ${avg(st.fol)} · first-to-last gap ${avg(st.spread)} · avg members ${avg(st.mem)} · green members owned ${avg(st.greenMembers)} · leftover resources ${avg(st.leftover)} · green left ${avg(st.greenEnd)} · 6-buys/game ${(st.sixBuys / games).toFixed(1)}`);
if (eq >= 0) {
  console.log('Green takes per game (avg yield, resources + 2.5 per free member):');
  for (const k of Object.keys(st.takes).sort((a, b) => a.slice(-2).localeCompare(b.slice(-2)) || a.localeCompare(b)))
    console.log(`  ${k.padEnd(14)} ${(st.takes[k] / games).toFixed(2)}  yield ${st.yieldBy[k] ? avg(st.yieldBy[k]) : '-'}`);
  if (process.env.ALL) for (const k of Object.keys(st.yieldBy).sort()) console.log(`    all: ${k.padEnd(18)} ${(st.yieldBy[k].length / games).toFixed(2)} yield ${avg(st.yieldBy[k])}`);
  console.log(`Most green: nobody scored ${pct(st.noScore, st.contestRounds)}; shared ${pct(st.ties, st.contestRounds)}; to the follower leader ${pct(st.contestToLeader, st.contestRounds)}; to last place ${pct(st.contestToLast, st.contestRounds)}; same winner next round ${pct(st.sameTwice, st.sameTwiceN)}; game winner won it at least once ${pct(st.winnerWonGreen, games)}`);
}
