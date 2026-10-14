// Black (thieves) balance sim: greedy bots, 4 seats, gold/red/blue + Black, one run per scoring mode.
// Usage: node scripts/spheres/thieves-sim.mjs [games=400] [modes=loot,others,black,fewest] [policy=rich|leader|random]
import { install, setScoring, releaseLoot } from '../../src/engine/v4/content/thieves.js';
import { createGame, applyMove, chooseBotMove, followers, memberCount, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';

install();
const N = Number(process.argv[2] || 400);
const MODES = (process.argv[3] || 'loot,black').split(',');
const POLICY = process.argv[4] || 'rich';
const QUADS = ['gold', 'red', 'blue', 'thieves'];
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (a, b) => (b ? (100 * a / b).toFixed(0) + '%' : '-');

// Steal-target policy for bots: the engine bot follows option hints; we can re-weight 'take' and member picks.
function botMove(s, rand) {
  const pend = s.pending;
  if (POLICY !== 'rich' && pend.kind === 'choose' && pend.options.some(o => o.kind === 'take' || (o.kind === 'member' && /lure|heist|ransom|burglar|double/i.test(pend.prompt)))) {
    const fol = id => followers(s, s.players[id]);
    const victim = o => (o.kind === 'take' ? o.value[0] : s.players.find(p => p.members.includes(o.value)).id);
    if (POLICY === 'random') return { player: pend.player, option: pend.options[Math.floor(rand() * pend.options.length)].id };
    if (POLICY === 'leader') {
      const best = pend.options.reduce((a, b) => (fol(victim(b)) * 10 + (b.hint || 0) > fol(victim(a)) * 10 + (a.hint || 0) ? b : a));
      return { player: pend.player, option: best.id };
    }
  }
  return chooseBotMove(s, rand);
}

function run(mode, control = false) {
  if (!control) setScoring(mode);
  const st = {
    wins: [0, 0, 0, 0], posWins: [0, 0, 0, 0], fol: [], winFol: [], spread: [], members: [], errors: 0,
    takes: {}, takesByRound: {}, contestWinners: [], contestTies: 0, contestNone: 0, contestRounds: 0,
    leaderWonContest: 0, lastWonContest: 0, repeatWinner: 0, repeatChances: 0, contestWinnerWonGame: 0, contestFolShareOfWinner: [],
    thefts: 0, units: 0, byRank: [0, 0, 0, 0], unitsByRank: [0, 0, 0, 0], lastHit: 0, leadHit: 0, memberThefts: 0, ransomPaid: 0,
    robbedPerPlayer: [], biggestBite: [], perVictimMax: [], gameLeaderShare: [], thiefRank: [0, 0, 0, 0],
    blackLeft: [], blackHeld: [], pickPos: {},
  };
  for (let g = 1; g <= N; g++) {
    const rand = seededRandom(g * 9973 + 1);
    const quads = control ? ['gold', 'red', 'blue', 'green'] : QUADS;
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: quads });
    let r1 = null, lastRound = 0, prevContest = null, lastBlackWinners = null;
    try {
      while (!s.over) {
        const pend = s.pending;
        if (pend.kind === 'place') {
          const pre = pend;
          const mv = botMove(s, rand);
          const o = pre.options.find(x => x.id === mv.option);
          const a = actionAt(s, o.q, o.i);
          // how early in the round this action went (0 = first placement, 1 = last)
          const placed = Object.keys(s.slots).length, totalP = 4 * [3, 4, 5][s.round - 1];
          const key = `${a.name} R${s.round}`;
          (st.pickPos[key] = st.pickPos[key] || []).push(placed / (totalP - 1));
          if (QUADS[o.q] === 'thieves' && !control) {
            st.takes[a.name] = (st.takes[a.name] || 0) + 1;
            const k = `${a.name} R${s.round}`; st.takesByRound[k] = (st.takesByRound[k] || 0) + 1;
          }
          s = applyMove(s, mv);
        } else s = applyMove(s, botMove(s, rand));
        if (!r1 && s.order.length) r1 = s.order.slice(0, 4);
        // loot mode: piles join supplies at round start (stands in for a quadrant round-start hook)
        if (!control && mode === 'loot' && s.round !== lastRound && lastRound) { s = structuredClone(s); releaseLoot(s); }
        if (prevContest && s.players.some((p, i) => p.contest !== prevContest[i])) {
          // a round just ended: find Black's winners from the log line
          const line = [...s.log].reverse().find(l => /^Round (I|II|III) ends/.test(l));
          if (!control && line) {
            const lab = { loot: 'Most loot', others: 'Most members of other colors', black: 'Most black', fewest: 'Fewest resources' }[mode];
            const seg = line.split(' · ').find(x => x.includes(lab));
            st.contestRounds++;
            const before = s.players.map((p, i) => followers(s, p) - (p.contest - prevContest[i]));
            const topB = Math.max(...before), lowB = Math.min(...before);
            if (!seg) { st.contestNone++; lastBlackWinners = null; }
            else {
              const names = seg.split(': ')[1].replace(/ \+\d+$/, '').split(' & ');
              const ids = names.map(n => s.players.find(p => p.name === n).id);
              if (ids.length > 1) st.contestTies++;
              st.contestWinners.push(...ids);
              if (ids.some(id => before[id] === topB)) st.leaderWonContest++;
              if (ids.some(id => before[id] === lowB)) st.lastWonContest++;
              if (lastBlackWinners) { st.repeatChances++; if (ids.some(id => lastBlackWinners.includes(id))) st.repeatWinner++; }
              lastBlackWinners = ids;
            }
          }
        }
        prevContest = s.players.map(p => p.contest);
        lastRound = s.round;
      }
    } catch (e) { st.errors++; if (st.errors < 3) console.error(mode, g, e.message); continue; }
    const f = s.players.map(p => followers(s, p));
    st.wins[s.ranking[0]]++;
    st.posWins[r1.indexOf(s.ranking[0])]++;
    st.fol.push(...f); st.winFol.push(Math.max(...f));
    st.spread.push(Math.max(...f) - Math.min(...f));
    st.members.push(...s.players.map(p => memberCount(s, p)));
    st.blackLeft.push(...s.players.map(p => p.res.black || 0));
    const th = s.thefts || [];
    const robbed = [0, 0, 0, 0];
    const perAction = {};
    for (const t of th) {
      st.thefts++; st.units += t.n; st.byRank[t.rank]++; st.unitsByRank[t.rank] += t.n;
      if (t.last) st.lastHit += t.n; if (t.lead) st.leadHit += t.n;
      if (t.kind === 'member') st.memberThefts++;
      if (t.kind === 'ransom') st.ransomPaid++;
      robbed[t.from] += t.n;
    }
    for (const t of th) if (t.kind !== 'member') { const k = `${t.m}:${t.from}`; perAction[k] = (perAction[k] || 0) + t.n; }
    st.perVictimMax.push(...Object.values(perAction));
    // thief stats: who robs (by follower rank at the end)
    for (const t of th) st.thiefRank[s.ranking.indexOf(t.by)] += t.n;
    st.robbedPerPlayer.push(...robbed);
    // game winner's share of the Black contest
    if (!control) {
      const w = s.ranking[0];
      const wins = (st._perGame = st.contestWinners.slice(st._cw || 0)); st._cw = st.contestWinners.length;
      if (wins.includes(w)) st.contestWinnerWonGame++;
    }
  }
  return st;
}

function report(mode, st, base) {
  const games = N - st.errors;
  const out = [];
  out.push(`\n=== ${mode} (${games} games, policy ${POLICY}${st.errors ? `, ${st.errors} ERRORS` : ''}) ===`);
  out.push(`seat wins ${st.wins.map(w => pct(w, games)).join(' / ')} · by round-I pick order ${st.posWins.map(w => pct(w, games)).join(' / ')}`);
  out.push(`avg followers ${avg(st.fol).toFixed(1)}${base ? ` (green stand-in table ${avg(base.fol).toFixed(1)})` : ''} · winner ${avg(st.winFol).toFixed(1)} · first-to-last gap ${avg(st.spread).toFixed(1)}${base ? ` (stand-in ${avg(base.spread).toFixed(1)})` : ''} · black left at end ${avg(st.blackLeft).toFixed(1)}`);
  if (mode !== 'control') {
    out.push(`Black action takes per game: ${Object.entries(st.takesByRound).sort().map(([k, v]) => `${k} ${(v / games).toFixed(2)}`).join(', ')}`);
    const pp = Object.entries(st.pickPos).filter(([k]) => / R(1|2|3)$/.test(k)).map(([k, v]) => [k, avg(v), v.length / games]);
    for (const r of [1, 2, 3]) out.push(`R${r} avg pick position, all actions (0 = picked first): ` + pp.filter(([k]) => k.endsWith(`R${r}`)).sort((a, b) => a[1] - b[1]).map(([k, v, n]) => `${k.replace(/ R\d$/, '')} ${v.toFixed(2)}${n < 0.95 ? ` (taken ${(n * 100).toFixed(0)}%)` : ''}`).join(', '));
    const cw = [0, 0, 0, 0]; for (const id of st.contestWinners) cw[id]++;
    out.push(`Black contest: rounds with no winner ${pct(st.contestNone, st.contestRounds)}, ties ${pct(st.contestTies, st.contestRounds)}, avg winners ${(st.contestWinners.length / Math.max(1, st.contestRounds - st.contestNone)).toFixed(2)}; went to the follower leader ${pct(st.leaderWonContest, st.contestRounds - st.contestNone)}, to last place ${pct(st.lastWonContest, st.contestRounds - st.contestNone)}; same winner as last round ${pct(st.repeatWinner, st.repeatChances)}; game winner won it at least once ${pct(st.contestWinnerWonGame, games)}`);
    out.push(`Thefts per game ${(st.thefts / games).toFixed(1)} (${(st.units / games).toFixed(1)} units; members taken ${(st.memberThefts / games).toFixed(2)}, ransoms paid ${(st.ransomPaid / games).toFixed(2)}). Units taken from: leader ${pct(st.unitsByRank[0], st.units)}, 2nd ${pct(st.unitsByRank[1], st.units)}, 3rd ${pct(st.unitsByRank[2], st.units)}, 4th ${pct(st.unitsByRank[3], st.units)} · from last place ${pct(st.lastHit, st.units)}`);
    const rp = st.robbedPerPlayer;
    const b = st.perVictimMax;
    out.push(`Bite per victim per move: avg ${avg(b).toFixed(2)}, 1 ${pct(b.filter(x => x === 1).length, b.length)}, 2 ${pct(b.filter(x => x === 2).length, b.length)}, 3+ ${pct(b.filter(x => x >= 3).length, b.length)} · units stolen BY final 1st/2nd/3rd/4th ${st.thiefRank.map(x => pct(x, st.units)).join(' / ')}`);
    out.push(`Robbed per player per game: avg ${avg(rp).toFixed(1)}, never robbed ${pct(rp.filter(x => x === 0).length, rp.length)}, robbed 8+ ${pct(rp.filter(x => x >= 8).length, rp.length)}`);
  }
  console.log(out.join('\n'));
}

const base = run('control', true);
report('control', base);
for (const mode of MODES) report(mode, run(mode), base);
