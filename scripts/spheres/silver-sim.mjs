// Silver balance sim: greedy bots, Silver in place of the green stand-in.
// Usage: node scripts/spheres/silver-sim.mjs [games=400] [players=4] [quadrants=gold,red,blue,silver]
// Reports seat wins, followers, Silver action takes, the most-silver contest spread, and the spill ratio
// (what rivals got from Silver spaces ÷ what the taker got).
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import silver from '../../src/engine/v4/content/silver.js';
registerQuadrant(silver);

const games = Number(process.argv[2] || 400), n = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,silver').split(',');
const sq = quadrants.indexOf('silver');
const sum = r => Object.values(r).reduce((a, b) => a + b, 0);
const st = { wins: Array(n).fill(0), fol: [], winFol: [], mem: [], takes: {}, takesByRound: {}, contestWins: Array(n).fill(0), contestRounds: 0, noScore: 0, ties: 0,
  silverContestOfWinner: [], silverMembers: [], winnerSilverMembers: [], silverEnd: [], self: 0, spill: 0, perAction: {}, winnerTookSilver: [], leftover: [] };
for (let g = 1; g <= games; g++) {
  const rand = seededRandom(g * 9973);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants });
  const sContest = Array(n).fill(0), silverTakes = Array(n).fill(0);
  let act = null; // a Silver action in flight: { who, name, before }
  const snap = st2 => st2.players.map(p => sum(p.res) + 2 * p.bonus);
  const close = st2 => {
    if (!act) return;
    const after = snap(st2);
    const self = after[act.who] - act.before[act.who];
    let sp = 0; after.forEach((v, i) => { if (i !== act.who) sp += v - act.before[i]; });
    st.self += self; st.spill += sp;
    const a = (st.perAction[act.name] ||= { self: 0, spill: 0, k: 0 }); a.self += self; a.spill += sp; a.k++;
    act = null;
  };
  while (!s.over) {
    const pend = s.pending;
    const m = chooseBotMove(s, rand);
    if (pend.kind === 'place' || pend.kind === 'buy') close(s);
    if (pend.kind === 'place') {
      const o = pend.options.find(x => x.id === m.option);
      if (o.q === sq || process.env.ALL) {
        const a = actionAt(s, o.q, o.i).name;
        st.takes[a] = (st.takes[a] || 0) + 1; const k = `${a} r${s.round}`; st.takesByRound[k] = (st.takesByRound[k] || 0) + 1;
        silverTakes[pend.player]++;
        act = { who: pend.player, name: a, before: snap(s) };
      }
    }
    const r0 = s.round;
    const next = applyMove(s, m);
    if (next.round !== r0 || next.over) {
      const line = [...next.log].reverse().find(l => l.startsWith(`Round ${['I', 'II', 'III'][r0 - 1]} ends.`));
      if (line) {
        st.contestRounds++;
        const part = line.split(' · ').find(x => x.includes('Most silver'));
        if (!part) st.noScore++;
        else {
          const names = part.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
          if (names.length > 1) st.ties++;
          for (const nm of names) { const id = next.players.findIndex(p => p.name === nm); st.contestWins[id]++; sContest[id] += [2, 4, 6][r0 - 1]; }
        }
      }
    }
    s = next;
  }
  const w = s.ranking[0];
  st.wins[w]++;
  st.silverContestOfWinner.push(sContest[w]);
  st.winnerTookSilver.push(silverTakes[w]);
  st.winFol.push(followers(s, s.players[w]));
  const sm = p => p.members.filter(u => s.cards[u].def.startsWith('silver.')).length;
  st.winnerSilverMembers.push(sm(s.players[w]));
  for (const p of s.players) {
    st.fol.push(followers(s, p)); st.mem.push(memberCount(s, p)); st.silverMembers.push(sm(p)); st.silverEnd.push(p.res.silver || 0);
    st.leftover.push(sum(p.res));
  }
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
console.log(`${games} games, ${n} players, ${quadrants.join('/')}`);
console.log(`wins by seat: ${st.wins.join(' / ')}  (${st.wins.map(x => (100 * x / games).toFixed(0) + '%').join(' / ')})`);
console.log(`avg followers ${avg(st.fol)} (winner ${avg(st.winFol)}) · avg members ${avg(st.mem)} · silver members owned ${avg(st.silverMembers)} (winner ${avg(st.winnerSilverMembers)}) · silver at end ${avg(st.silverEnd)} · leftover resources ${avg(st.leftover)}`);
if (sq >= 0) {
  console.log(`Silver takes per game: ${Object.entries(st.takes).map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`  by round: ${Object.entries(st.takesByRound).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(' · ')}`);
  console.log(`Most-silver contest: nobody scored ${(100 * st.noScore / st.contestRounds).toFixed(0)}%; shared ${(100 * st.ties / st.contestRounds).toFixed(0)}%; wins by seat ${st.contestWins.join('/')}; winner's followers from it ${avg(st.silverContestOfWinner)}; winner took ${avg(st.winnerTookSilver)} Silver spaces`);
  console.log(`Spill ratio (rivals' gain ÷ taker's gain, resources + 2 per follower, incl. member triggers): ${(st.spill / st.self).toFixed(2)}`);
  console.log('  per action: ' + Object.entries(st.perAction).map(([k, a]) => `${k} you ${(a.self / a.k).toFixed(1)} / table ${(a.spill / a.k).toFixed(1)}`).join(' · '));
}
