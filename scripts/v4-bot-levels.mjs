// Bot levels head to head. Usage: node scripts/v4-bot-levels.mjs [games=100] [seats=hard,normal,normal,normal] [firstGame=1]
// Seats rotate every game so no policy keeps one seat. A policy is easy | normal | hard | buyer (pure follower buying,
// never recruits), optionally with options: normal:k=0.8, hard:budget=300.
// Prints, per policy: win share (ties split), members, resources left at game end, followers, and the slowest move.
import { createGame, applyMove, followers, memberCount, quadrant } from '../src/engine/v4/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const games = Number(process.argv[2] || 100);
const spec = (process.argv[3] || 'hard,normal,normal,normal').split(',');
const first = Number(process.argv[4] || 1);
const quads = process.env.QUADRANTS ? process.env.QUADRANTS.split(',') : undefined;

const parse = s => {
  const [name, ...kv] = s.split(':');
  const opts = Object.fromEntries(kv.map(x => x.split('=')).map(([k, v]) => [k, Number.isNaN(Number(v)) ? v : Number(v)]));
  return { name, key: s, opts };
};
const policies = spec.map(parse);
const n = policies.length;
const stat = {};
for (const p of policies) stat[p.key] ??= { seats: 0, wins: 0, members: 0, left: 0, held: 0, followers: 0, maxMs: 0, ms: 0, moves: 0, bought: 0, contest: 0, leftMax: 0, membersMax: 0 };

for (let g = first; g < first + games; g++) {
  const rand = seededRandom(g * 7717 + 3);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, ...(quads ? { quadrants: quads } : {}) });
  // seat i plays policy (i + g) % n
  const seatPol = s.players.map((_, i) => policies[(i + g) % n]);
  while (!s.over) {
    const pol = seatPol[s.pending.player];
    const t = performance.now();
    const m = pol.name === 'buyer' ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, { level: pol.name, ...pol.opts });
    const dt = performance.now() - t;
    const st = stat[pol.key];
    st.ms += dt; st.moves += 1; if (dt > st.maxMs) st.maxMs = dt;
    s = applyMove(s, m);
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const winners = s.players.filter(p => followers(s, p) === top);
  for (const p of s.players) {
    const st = stat[seatPol[p.id].key];
    st.seats += 1;
    if (winners.includes(p)) st.wins += 1 / winners.length;
    st.members += memberCount(s, p);
    const left = Object.values(p.res).reduce((a, b) => a + b, 0);
    st.left += left; st.leftMax = Math.max(st.leftMax, left);
    st.membersMax = Math.max(st.membersMax, memberCount(s, p));
    // resources that were holding a contest lead at the end: only what the lead needed (runner-up + 1, or a tie)
    for (const qid of s.quadrants) {
      const q = quadrant(qid);
      const r = q.resource, mine = p.res[r] || 0;
      const next = Math.max(0, ...s.players.filter(o => o !== p).map(o => o.res[r] || 0));
      if (r && mine > 0 && mine >= next) st.held += Math.min(mine, next + 1);
    }
    st.followers += followers(s, p);
    st.bought += p.bought || 0;
    st.contest += p.contest || 0;
  }
  if (g % 10 === 0) process.stderr.write(`${g - first + 1}/${games}\n`);
}
console.log(`${games} games, seats ${spec.join(' / ')} (rotating)${quads ? `, quadrants ${quads.join(',')}` : ''}`);
for (const [k, st] of Object.entries(stat)) {
  const per = x => (x / st.seats).toFixed(1);
  // 95% interval on the win share (normal approximation; seats of one policy in the same game aren't independent,
  // so read it for a policy that holds one seat)
  const w = st.wins / st.seats, ci = 1.96 * Math.sqrt(Math.max(w * (1 - w), 1e-9) / st.seats);
  console.log(`${k.padEnd(18)} win ${(100 * w).toFixed(1)}% ±${(100 * ci).toFixed(1)} (n=${st.seats} seats, parity ${(100 / n).toFixed(0)}%) · members ${per(st.members)} (max ${st.membersMax}) · left ${per(st.left)} (max ${st.leftMax}; needed to hold a lead ${per(st.held)}, spare ${per(st.left - st.held)}) · followers ${per(st.followers)} (bought ${per(st.bought)}, contests ${per(st.contest)}) · ms/move ${(st.ms / st.moves).toFixed(1)} max ${st.maxMs.toFixed(0)}`);
}
