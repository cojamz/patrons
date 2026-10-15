// New Hard against old Hard (the same lookahead, without grabbing a space first). Two seats each per 4-player game,
// seats rotated every game, ties split. Reports each side's win share with a 95% Wilson interval, average followers,
// and how often each side takes Crunch Time. Hard runs uncapped (deterministic) at --budget.
// Usage: node scripts/v4-hard-vs-hard.mjs [games=200] [firstGame=1] [--budget=100] [--weight=1] [--table=classic|a,b,c,d]
//   [--grab=0] [--paired=0] [--prior=1]  (switch off one half of new Hard)  [--old=normal]  (the old side plays Normal instead of old Hard)  [--old=normal-grab]  (Normal with grab vs Normal)  [--threads=4]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { createGame, applyMove, followers } from '../src/engine/v4/index.js';
import { chooseNormalMove } from '../src/engine/v4/bots.js';
import { chooseThinkerMove } from '../src/engine/v4/thinker.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const TABLES = { classic: ['gold', 'red', 'market', 'echo'] };
// which seats play new Hard: two of four, rotated through all six pairings
const PAIRS = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

function playGame({ g, budget, weight, quadrants, old, grab, paired, prior }) {
  const rand = seededRandom(g * 9973 + 11);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, ...(quadrants ? { quadrants } : {}) });
  const fresh = new Set(PAIRS[g % PAIRS.length]);
  const crunch = { new: 0, old: 0 };
  while (!s.over) {
    const p = s.pending.player;
    const isNew = fresh.has(p);
    const m = old === 'normal-grab' ? chooseNormalMove(s, rand, isNew ? { grab: true, grabWeight: weight } : {})
      : isNew ? chooseThinkerMove(s, rand, { budget, grabWeight: weight, grab, paired, prior })
      : old === 'normal' ? chooseNormalMove(s, rand) : chooseThinkerMove(s, rand, { budget, grab: false, paired: false });
    const o = s.pending.options.find(x => x.id === m.option);
    if (o?.kind === 'slot' && o.label === 'Crunch Time') crunch[isNew ? 'new' : 'old']++;
    s = applyMove(s, m);
  }
  const f = s.players.map(pl => followers(s, pl));
  const top = Math.max(...f);
  const winners = f.map((v, i) => (v === top ? i : -1)).filter(i => i >= 0);
  const share = { new: 0, old: 0 };
  for (const w of winners) share[fresh.has(w) ? 'new' : 'old'] += 1 / winners.length;
  const avg = side => f.filter((_, i) => fresh.has(i) === (side === 'new')).reduce((a, b) => a + b, 0) / 2;
  return { share, crunch, fNew: avg('new'), fOld: avg('old') };
}

if (!isMainThread) {
  for (const job of workerData.jobs) parentPort.postMessage(playGame(job));
  parentPort.postMessage('done');
} else {
  const args = process.argv.slice(2);
  const pos = args.filter(a => !a.startsWith('--'));
  const flag = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
  const games = Number(pos[0] || 200), first = Number(pos[1] || 1);
  const budget = Number(flag.budget || 100), weight = Number(flag.weight ?? 1);
  const quadrants = flag.table ? (TABLES[flag.table] || flag.table.split(',')) : undefined;
  const threads = Number(flag.threads || Math.max(1, os.cpus().length));
  const jobs = Array.from({ length: games }, (_, k) => ({ g: first + k, budget, weight, quadrants, old: flag.old, grab: flag.grab !== '0', paired: flag.paired !== '0', prior: Number(flag.prior ?? 0) }));
  const t0 = performance.now();
  const results = [];
  await Promise.all(Array.from({ length: threads }, (_, t) => new Promise((res, rej) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: jobs.filter((_, k) => k % threads === t) } });
    w.on('message', m => { if (m === 'done') res(); else { results.push(m); if (results.length % 25 === 0) console.error(`${results.length}/${games}`); } });
    w.on('error', rej);
  })));
  const n = results.length;
  const z = 1.96, ph = results.reduce((a, r) => a + r.share.new, 0) / n;
  const lo = (ph + z * z / (2 * n) - z * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n))) / (1 + z * z / n);
  const hi = (ph + z * z / (2 * n) + z * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n))) / (1 + z * z / n);
  const mean = k => (results.reduce((a, r) => a + r[k], 0) / n).toFixed(1);
  const cr = side => results.reduce((a, r) => a + r.crunch[side], 0);
  console.log(`new Hard (grab ${flag.grab !== '0' ? `on, weight ${weight}` : 'off'}, paired ${flag.paired !== '0' ? 'on' : 'off'}, prior ${flag.prior ?? 0}) vs ${flag.old ? flag.old : 'old Hard'}, 2 seats each, budget ${budget}, ${n} games from ${first}, table ${quadrants ? quadrants.join('/') : 'default'}, ${((performance.now() - t0) / 1000).toFixed(0)}s`);
  console.log(`  new Hard wins ${(100 * ph).toFixed(1)}% of games (50% = no better), 95% CI ${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}%`);
  console.log(`  followers: new ${mean('fNew')}, old ${mean('fOld')}; Crunch Time taken: new ${cr('new')}, old ${cr('old')}`);
}
