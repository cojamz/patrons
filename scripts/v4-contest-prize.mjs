// Contest prize read: bots on random 2.0 tables with the round prizes set per run, one JSON line per game.
// Usage: PRIZE=3,6,9 LEVEL=normal node scripts/v4-contest-prize.mjs <firstGame> <count> <out.jsonl>
// WILD=0 takes back the +1 wild every member costs (content/index.js EXTRA_WILD), for the before numbers.
// Same tables and buy-followers-only seat (every 5th game) as v4-hard-batch.mjs; also records prize followers.
import { appendFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, allQuadrantIds, RING_VALUE, quadrant } from '../src/engine/v4/index.js';
import { guestMembers } from '../src/engine/v4/content/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { sphereVersion } from '../src/v4/tables.js';

const [first, count, out] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'prize.jsonl'];
if (process.env.PRIZE) process.env.PRIZE.split(',').map(Number).forEach((v, i) => { RING_VALUE[i] = v; });
if (process.env.WILD === '0') for (const d of [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()]) { d.w -= d.extraWild || 0; d.extraWild = 0; }
const level = process.env.LEVEL || 'normal';
const all = allQuadrantIds().filter(q => sphereVersion(q) === '2.0');
for (let g = first; g < first + count; g++) {
  const rand = seededRandom(g * 7717 + 3);
  const pool = [...all], quads = [];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const buyer = g % 5 === 0 ? g % 4 : -1;
  while (!s.over) {
    const pl = s.pending.player;
    s = applyMove(s, pl === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, level === 'hard' ? { level, maxMs: Infinity } : { level }));
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  appendFileSync(out, JSON.stringify({
    game: g, level, prize: [...RING_VALUE], wild: process.env.WILD !== '0', table: quads, buyer,
    players: s.players.map(p => ({ seat: p.id, followers: followers(s, p), win: followers(s, p) === top, members: memberCount(s, p), contest: p.contest })),
  }) + '\n');
}
