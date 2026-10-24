// Green (echo) balance sim: greedy bots, Green in place of the green stand-in.
// Usage: node scripts/spheres/echo-sim.mjs [games=400] [players=4] [quadrants=gold,red,blue,echo]
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import echoQ, { install, VARIANT } from '../../src/engine/v4/content/echo.js';
install();
if (process.env.PLUS) VARIANT.plus = Number(process.env.PLUS);
// record every round-end scoring call so we can see how much green it took to win
let scoreBuf = [];
const baseScore = echoQ.scoring.score;
echoQ.scoring.score = (ctx, p) => { const v = baseScore(ctx, p); scoreBuf.push(v); return v; };

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,echo').split(',');
const eq = quadrants.indexOf('echo');
const label = quadrants.includes('echo') ? 'Most green' : 'Most green';
const st = { wins: Array(n).fill(0), winsByPick: Array(n).fill(0), fol: [], mem: [], takes: {}, yieldBy: {}, contestRounds: 0, winGreen: [], echoR1ByPos: Array.from({ length: 12 }, () => []), echoR1Pos: Array(12).fill(0), bestAt: Array.from({ length: 12 }, () => []), r1PosWins: Array(12).fill(0), r1PosFol: Array.from({ length: 12 }, () => []), noScore: 0, ties: 0,
  contestToLeader: 0, contestToLast: 0, sameTwice: 0, sameTwiceN: 0, winnerWonGreen: 0, greenEnd: [], greenMembers: [], leftover: [], copies: 0, sixBuys: 0, spread: [] };
const tot = r => Object.values(r).reduce((a, b) => a + b, 0);
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  let firstOrder = null; let prevWinners = null; let winnerGreen = new Set(); let r1pos = 0; const posOf = {}; const echoPos = {};
  while (!s.over) {
    const pend = s.pending;
    const m = chooseBotMove(s, rand);
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === m.option);
      if (o.q === eq) { const k = `${actionAt(s, o.q, o.i).name} r${s.round}`; st.takes[k] = (st.takes[k] || 0) + 1; }
      if (s.round === 1) {
        // what Echo would pay if taken right now: the best outer-ring space so far this round
        const now = Object.values(s.echo?.round === 1 ? s.echo.now : {}).filter(e => !e.echo && e.ring === 1);
        st.bestAt[r1pos]?.push(Math.max(0, ...now.map(e => tot(e.res) + e.discount + 2.5 * e.members.length)));
        if (actionAt(s, o.q, o.i).name === 'Echo') { st.echoR1Pos[r1pos]++; echoPos[pend.player] = r1pos; }
        r1pos++;
      }
    }
    // what each space gave, read from the ledger once the taker reaches their buy step
    if (pend.kind === 'buy' && s.echo?.lastBy && s.echo.counted !== s.echo.lastBy + ':' + s.moves) {
      const e = s.echo.now[s.echo.lastBy];
      if (e && e.p === pend.player && !s.echo.seen?.[e.key]) {
        s.echo.seen = { ...(s.echo.seen || {}), [e.key]: 1 };
        const k = `${e.name} r${s.round}`;
        const y = tot(e.res) + e.discount + 2.5 * e.members.length;
        (st.yieldBy[k] ||= []).push(y);
        if (k === 'Echo r1') st.echoR1ByPos[echoPos[e.p]].push(y);
      }
    }
    if (pend.kind === 'buy' && m.option === 'tier:big') st.sixBuys++;
    const r0 = s.round;
    // followers before the round ends (leader/last for the contest)
    const folBefore = s.players.map(p => followers(s, p));
    scoreBuf = [];
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
          if (scoreBuf.length >= n) st.winGreen.push(Math.max(...scoreBuf.slice(-n)));
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
  console.log(`Echo in round I by pick (1-12): taken ${st.echoR1Pos.map(x => (x / games).toFixed(2)).join(' ')}`);
  console.log(`  Echo's worth at each pick (best outer space so far): ${st.bestAt.map(a => (a.length ? avg(a) : '-')).join(' ')}`);
  console.log(`  yield by pick: ${st.echoR1ByPos.map(a => (a.length ? avg(a) : '-')).join(' ')}`);
  console.log(`Most green: winning green held avg ${avg(st.winGreen)} (median ${[...st.winGreen].sort((a, b) => a - b)[st.winGreen.length >> 1]}); `);
  console.log(`Most green: nobody scored ${pct(st.noScore, st.contestRounds)}; shared ${pct(st.ties, st.contestRounds)}; to the follower leader ${pct(st.contestToLeader, st.contestRounds)}; to last place ${pct(st.contestToLast, st.contestRounds)}; same winner next round ${pct(st.sameTwice, st.sameTwiceN)}; game winner won it at least once ${pct(st.winnerWonGreen, games)}`);
}
