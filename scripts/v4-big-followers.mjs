// The pure "big followers" strategy (never recruits, plays for follower buys) against 3 bots of one level.
// Target (Cory): it wins about 25% of 4-player games (15–30% band) against a good table. The buyer's seat rotates
// every game; ties split. 95% Wilson interval on the win share.
// Usage: node scripts/v4-big-followers.mjs [games=200] [firstGame=1] [--level=normal] [--workers=4] [--budget=100]
//   [--no-release] [--no-guests] [--easy] (same as --level=easy)
// Levels: easy | casual | collector | normal | hard | greedy (the first bot). Hard runs uncapped (deterministic) at
// --budget. --blend=t: rivals play blendProfile(t), t = 0 easy … 1 normal.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createGame, applyMove, followers, memberCount } from '../src/engine/v4/index.js';
import { chooseBotMove, chooseFollowerBuyerMove, chooseGreedyMove, blendProfile } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

function playGame({ g, level, rules, budget, blend }) {
  const rand = seededRandom(g * 7717 + 3);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, rules });
  const buyer = g % 4;
  let released = 0;
  while (!s.over) {
    const p = s.pending.player;
    const m = p === buyer ? chooseFollowerBuyerMove(s, rand)
      : level === 'greedy' ? chooseGreedyMove(s, rand)
        : chooseBotMove(s, rand, { level, budget, maxMs: Infinity, ...(blend !== undefined ? blendProfile(blend) : {}) });
    if (m.option.startsWith('release:')) released++;
    s = applyMove(s, m);
  }
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
    released,
  };
}

/** 95% Wilson score interval for k successes in n. */
export function wilson(k, n, z = 1.96) {
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d, h = (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

if (!isMainThread) {
  for (const job of workerData.jobs) parentPort.postMessage(playGame(job));
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
  const jobs = Array.from({ length: games }, (_, k) => ({ g: first + k, level, rules, budget, blend }));
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
  const n = results.length;
  const tot = k => results.reduce((a, r) => a + r[k], 0);
  const wins = tot('win');
  const [lo, hi] = wilson(wins, n);
  console.log(`big followers vs 3 ${blend !== undefined ? `blend ${blend} (0 easy, 1 normal)` : level} bots${level === 'hard' ? ` (budget ${budget})` : ''}, ${n} games (from ${first}), release ${rules.release ? 'on' : 'off'}, guests ${rules.guests ? 'on' : 'off'}, ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  console.log(`buyer wins ${(100 * wins / n).toFixed(1)}% [${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}] · buyer followers ${(tot('buyerF') / n).toFixed(1)} (left ${(tot('buyerLeft') / n).toFixed(1)}) · others ${(tot('othersF') / n).toFixed(1)} · their members ${(tot('members') / n).toFixed(1)}, left ${(tot('left') / n).toFixed(1)} · releases/game ${(tot('released') / n).toFixed(1)}`);
}
