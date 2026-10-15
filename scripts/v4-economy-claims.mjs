// Readings for five economy claims from a blind game-feel reviewer (design/eval/bench/economy-claims.md).
// One process, no workers (it runs beside the bench). Seeded; tables: Classic and random 4-sphere tables (makeTables).
//   node scripts/v4-economy-claims.mjs [normalGames=200] [hardGames=80] [--out=file.json]
// Seats: 4 Normal, or Hard-20 in one rotating seat + 3 Normal.
import { writeFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, actionAt } from '../src/engine/v4/core.js';
import { chooseNormalMove } from '../src/engine/v4/bots.js';
import { chooseThinkerMove } from '../src/engine/v4/thinker.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { makeTables } from '../src/test/engine/v4/fuzz-tables-runner.js';

const args = process.argv.slice(2);
const [NN = 200, NH = 80] = args.filter(a => !a.startsWith('--')).map(Number);
const out = (args.find(a => a.startsWith('--out=')) || '').slice(6);
const CLASSIC = ['gold', 'red', 'market', 'echo'];
const RANDOM = makeTables(4242, 2).tables;

function play(g, table, hard) {
  const seat = hard ? g % 4 : -1;
  const rands = [0, 1, 2, 3].map(i => seededRandom(880000 + g * 31 + i * 1009));
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 880000 + g, quadrants: table });
  const recruited = [0, 1, 2, 3].map(() => new Set());
  const r1places = []; // [player, actionKey] in round I, in order
  const tide = []; // [round, gain]
  let n = 0;
  while (!s.over && n++ < 8000) {
    const pend = s.pending, pl = pend.player;
    const mv = pl === seat ? chooseThinkerMove(s, rands[pl], { budget: 20, maxMs: Infinity }) : chooseNormalMove(s, rands[pl]);
    const prev = s;
    s = applyMove(s, mv);
    s.players.forEach((p, i) => p.members.forEach(u => recruited[i].add(u)));
    if (pend.kind === 'place' && mv.option.startsWith('slot:')) {
      const [q, k] = mv.option.slice(5).split('-').map(Number);
      const a = actionAt(prev, q, k);
      if (prev.round === 1) r1places.push([pl, `${prev.quadrants[q]}.${a.key}`]);
      if (a.key === 'tide') {
        const line = s.log.slice(-8).reverse().find(l => l.includes('Rising Tide: +1 silver to everyone else'));
        const m = line && line.match(/then \+(\d+) silver/);
        if (m) tide.push([prev.round, Number(m[1])]);
      }
    }
  }
  const fs = s.players.map(p => followers(s, p));
  const players = s.players.map((p, i) => ({
    f: fs[i], recruits: recruited[i].size, members: memberCount(s, p), bought: p.bought || 0, contest: p.contest || 0,
    memberWorth: fs[i] - 1 - p.bonus, effects: p.bonus - (p.bought || 0) - (p.contest || 0), hard: i === seat,
  }));
  const contests = (s.contests || []).map(c => ({ round: c.round, prize: c.prize, results: c.results.map(r => ({ q: r.qid, winners: r.winners, scores: r.rows.map(x => [x.player, x.score]) })) }));
  return { g, table, hard, winner: s.ranking[0], players, contests, r1places, tide };
}

const games = [];
const t0 = Date.now();
const plan = [];
for (let g = 0; g < NN; g++) plan.push([g, g % 2 ? RANDOM[g % RANDOM.length] : CLASSIC, false]);
for (let g = 0; g < NH; g++) plan.push([10000 + g, g % 2 ? RANDOM[g % RANDOM.length] : CLASSIC, true]);
for (const [g, t, h] of plan) {
  try { games.push(play(g, t, h)); } catch (e) { process.stderr.write(`g=${g} crashed: ${String(e).slice(0, 120)}\n`); }
  if (games.length % 40 === 0) process.stderr.write(`  ${games.length}/${plan.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
}
const json = JSON.stringify({ NN, NH, secs: (Date.now() - t0) / 1000, games });
if (out) writeFileSync(out, json); else process.stdout.write(json);
