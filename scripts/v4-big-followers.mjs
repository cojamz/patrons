// The pure "big followers" strategy (never recruits, plays for follower buys) against 3 bots of one level.
// Target (Cory): it wins about 25% of 4-player games (15–30% band) against a good table. The buyer's seat rotates
// every game; ties split. 95% Wilson interval on the win share.
// Usage: node scripts/v4-big-followers.mjs [games=200] [firstGame=1] [--level=normal] [--workers=4] [--budget=100]
//   [--buyer=hard] (the buyer plays with Hard's lookahead too)
//   [--no-release] [--no-guests] [--easy] (same as --level=easy) [--table=classic|default|a,b,c,d] [--split]
// --split (runtime patch, not a rule): tied contest leaders split the prize, rounded down, instead of each taking it.
// Also reports the share of each seat's final followers that came from contests, by round, and how often a contest
// pays 3+ tied leaders (state.contests, the engine's own record of each round's scoring).
// Levels: easy | casual | collector | normal | hard | greedy (the first bot). Hard runs uncapped (deterministic) at
// --budget. --blend=t: rivals play blendProfile(t), t = 0 easy … 1 normal.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createGame, applyMove, followers, memberCount } from '../src/engine/v4/index.js';
import { chooseBotMove, chooseFollowerBuyerMove, chooseGreedyMove, blendProfile } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

const TABLES = { classic: ['gold', 'red', 'market', 'echo'], default: undefined };

// Tied leaders split the prize (rounded down): take back what each was paid over its share.
function splitTies(prev, next) {
  const done = prev.contests?.length || 0;
  for (const c of (next.contests || []).slice(done)) for (const r of c.results) {
    const k = r.winners.length;
    if (k < 2) continue;
    const back = c.prize - Math.floor(c.prize / k);
    for (const id of r.winners) { next.players[id].bonus -= back; next.players[id].contest -= back; }
  }
}

function playGame({ g, level, rules, budget, blend, quadrants, split, buyerLevel }) {
  const rand = seededRandom(g * 7717 + 3);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, rules, ...(quadrants ? { quadrants } : {}) });
  const buyer = g % 4;
  let released = 0;
  while (!s.over) {
    const p = s.pending.player;
    const m = p === buyer ? chooseFollowerBuyerMove(s, rand, buyerLevel === 'hard' ? { level: 'hard', budget, maxMs: Infinity } : {})
      : level === 'greedy' ? chooseGreedyMove(s, rand)
        : chooseBotMove(s, rand, { level, budget, maxMs: Infinity, ...(blend !== undefined ? blendProfile(blend) : {}) });
    if (m.option.startsWith('release:')) released++;
    const next = applyMove(s, m);
    if (split) splitTies(s, next);
    s = next;
  }
  // contests: followers each seat took per round (after any split), and how many leaders each contest paid
  const byRound = s.players.map(() => [0, 0, 0]);
  const ties = [[0, 0], [0, 0], [0, 0]]; // per round: [contests that paid anyone, contests paying 3+]
  for (const c of s.contests || []) for (const r of c.results) {
    const k = r.winners.length;
    if (!k) continue;
    ties[c.round - 1][0]++; if (k >= 3) ties[c.round - 1][1]++;
    const each = split ? Math.floor(c.prize / k) : c.prize;
    for (const id of r.winners) byRound[id][c.round - 1] += each;
  }
  const finals = s.players.map(p => followers(s, p));
  const share = [0, 1, 2].map(r => s.players.reduce((a, p, i) => a + byRound[i][r] / finals[i], 0) / 4);
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const tied = s.players.filter(p => followers(s, p) === top);
  const others = s.players.filter(p => p.id !== buyer);
  return {
    win: tied.some(p => p.id === buyer) ? 1 / tied.length : 0,
    buyerF: followers(s, s.players[buyer]),
    othersF: others.reduce((a, p) => a + followers(s, p), 0) / 3,
    members: others.reduce((a, p) => a + memberCount(s, p), 0) / 3,
    left: others.reduce((a, p) => a + sum(p.res), 0) / 3,
    buyerLeft: sum(s.players[buyer].res),
    released, share, ties, contestsPerGame: (s.contests || []).reduce((a, c) => a + c.results.length, 0) / 3,
  };
}

/** 95% Wilson score interval for k successes in n. */
export function wilson(k, n, z = 1.96) {
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d, h = (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

if (!isMainThread) {
  // an engine error ends that game only: it's counted and reported, not averaged in
  for (const job of workerData.jobs) {
    try { parentPort.postMessage(playGame(job)); } catch (e) { parentPort.postMessage({ crashed: `game ${job.g}: ${e.message}` }); }
  }
} else {
  const argv = process.argv.slice(2);
  const args = argv.filter(a => !a.startsWith('--'));
  const flag = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
  const games = Number(args[0] || 200), first = Number(args[1] || 1);
  const blend = flag.blend !== undefined ? Number(flag.blend) : undefined;
  const level = blend !== undefined ? 'normal' : flag.easy ? 'easy' : String(flag.level || 'normal');
  const rules = { release: !flag['no-release'], guests: !flag['no-guests'] };
  const budget = Number(flag.budget || 100);
  const workers = Math.max(1, Number(flag.workers || 4));
  const tname = String(flag.table || 'default');
  const quadrants = tname in TABLES ? TABLES[tname] : tname.split(',');
  const split = !!flag.split;
  const jobs = Array.from({ length: games }, (_, k) => ({ g: first + k, level, rules, budget, blend, quadrants, split, buyerLevel: flag.buyer }));
  const results = [];
  const t0 = performance.now();
  await Promise.all(Array.from({ length: workers }, (_, w) => new Promise((res, rej) => {
    const mine = jobs.filter((_, k) => k % workers === w);
    if (!mine.length) return res();
    const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: mine } });
    wk.on('message', r => { results.push(r); if (results.length % 50 === 0) process.stderr.write(`${results.length}/${games}\n`); });
    wk.on('error', rej);
    wk.on('exit', res);
  })));
  const crashed = results.filter(r => r.crashed);
  for (const c of crashed) console.log(`CRASH ${c.crashed}`);
  results.splice(0, results.length, ...results.filter(r => !r.crashed));
  const n = results.length;
  const tot = k => results.reduce((a, r) => a + r[k], 0);
  const wins = tot('win');
  const [lo, hi] = wilson(wins, n);
  console.log(`big followers${flag.buyer === 'hard' ? ' (Hard buyer)' : ''} vs 3 ${blend !== undefined ? `blend ${blend} (0 easy, 1 normal)` : level} bots${level === 'hard' ? ` (budget ${budget})` : ''}, ${n} games (from ${first}), table ${quadrants ? quadrants.join('/') : 'default'}${split ? ', tied leaders SPLIT (patch)' : ''}, release ${rules.release ? 'on' : 'off'}, guests ${rules.guests ? 'on' : 'off'}, ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  console.log(`buyer wins ${(100 * wins / n).toFixed(1)}% [${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}] · buyer followers ${(tot('buyerF') / n).toFixed(1)} (left ${(tot('buyerLeft') / n).toFixed(1)}) · others ${(tot('othersF') / n).toFixed(1)} · their members ${(tot('members') / n).toFixed(1)}, left ${(tot('left') / n).toFixed(1)} · releases/game ${(tot('released') / n).toFixed(1)}`);
  const pct = x => `${(100 * x).toFixed(1)}%`;
  const sh = [0, 1, 2].map(r => results.reduce((a, x) => a + x.share[r], 0) / n);
  console.log(`contests' share of each seat's final followers: round I ${pct(sh[0])} · II ${pct(sh[1])} · III ${pct(sh[2])} · all ${pct(sh[0] + sh[1] + sh[2])}`);
  const t = [0, 1, 2].map(r => [results.reduce((a, x) => a + x.ties[r][0], 0), results.reduce((a, x) => a + x.ties[r][1], 0)]);
  console.log(`contests paying 3+ tied leaders (of contests that paid anyone): ${t.map(([a, b], r) => `${['I', 'II', 'III'][r]} ${pct(b / Math.max(1, a))} (${b}/${a})`).join(' · ')} · all ${pct(t.reduce((a, x) => a + x[1], 0) / Math.max(1, t.reduce((a, x) => a + x[0], 0)))}`);
}
