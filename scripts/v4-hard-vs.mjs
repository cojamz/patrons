// One seat plays this tree's bots, the others another copy's (an older commit's src/engine/v4): a head-to-head between
// two bot versions on the same rules. The seat rotates with the game number, and every game plays twice, with the
// roles swapped (A seat, then B seat), so table luck cancels. Usage:
//   node scripts/v4-hard-vs.mjs <first> <count> <out.jsonl> <otherEngineDir>
// LEVEL=normal plays Normal; MUST=red puts a color on every table (the rest are random 2.0 colors).
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGame, applyMove, followers, allQuadrantIds } from '../src/engine/v4/index.js';
import { chooseBotMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { sphereVersion } from '../src/v4/tables.js';

const [first, count, out, dir] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'vs.jsonl', process.argv[5]];
const other = (await import(pathToFileURL(`${resolve(dir)}/bots.js`).href)).chooseBotMove;
const level = process.env.LEVEL || 'hard';
const opts = level === 'hard' ? { level, maxMs: Infinity } : { level };
const all = allQuadrantIds().filter(q => sphereVersion(q) === '2.0');
for (let g = first; g < first + count; g++) {
  const pick = seededRandom(g * 7717 + 3);
  const must = process.env.MUST ? process.env.MUST.split(',') : [];
  const pool = all.filter(q => !must.includes(q)), quads = [...must];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(pick() * pool.length), 1)[0]);
  const seat = g % 4;
  const row = { game: g, table: quads, seat };
  for (const mine of ['A', 'B']) {
    // A: this tree's bots in `seat`, the other copy everywhere else; B: the reverse
    const rand = seededRandom(g * 31 + 1);
    let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
    let differ = 0;
    while (!s.over) {
      const here = (s.pending.player === seat) === (mine === 'A');
      const m = (here ? chooseBotMove : other)(s, rand, opts);
      s = applyMove(s, m);
    }
    const f = s.players.map(p => followers(s, p)), top = Math.max(...f);
    row[mine] = { followers: f, win: f[seat] === top, margin: f[seat] - Math.max(...f.filter((_, i) => i !== seat)) };
  }
  appendFileSync(out, JSON.stringify(row) + '\n');
}
