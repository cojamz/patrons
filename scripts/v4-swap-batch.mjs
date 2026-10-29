// How bots move members between cults: Hard bots (or LEVEL=normal) on random 2.0 tables, 4 players, one JSON line per
// game. Usage: node scripts/v4-swap-batch.mjs <firstGame> <count> <out.jsonl> [engineDir]
// engineDir plays another copy of the engine (an older commit's src/engine/v4, for a before/after on the same seeds).
// Counted per game: swaps that touch a rival's cult, members handed to a rival or taken from one, by card; uses of
// activations that swap; and who owned the members that only matter between cults at the end (with the result).
// Every 5th game one seat only buys followers. Hard is uncapped, so a seed always plays the same game.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [first, count, out, dir] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'swap-batch.jsonl', process.argv[5]];
const eng = dir ? resolve(dir) : resolve('src/engine/v4');
const imp = f => import(pathToFileURL(`${eng}/${f}`).href);
const { createGame, applyMove, followers, allQuadrantIds } = await imp('index.js');
const { defById } = await imp('content/index.js');
const { chooseBotMove, chooseFollowerBuyerMove } = await imp('bots.js');
const { seededRandom } = await imp('rng.js');
const { sphereVersion } = await import('../src/v4/tables.js');

const level = process.env.LEVEL || 'hard';
const all = process.env.ONLY ? process.env.ONLY.split(',') : allQuadrantIds().filter(q => sphereVersion(q) === '2.0');
const WATCH = (process.env.WATCH || 'Agents,Saboteur,Loyalists,Anarchist,Headhunter,Double Agent').split(',');
for (let g = first; g < first + count; g++) {
  const rand = seededRandom(g * 7717 + 3);
  const must = process.env.MUST ? process.env.MUST.split(',') : [];
  const pool = all.filter(q => !must.includes(q)), quads = [...must];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const buyer = g % 5 === 0 ? g % 4 : -1;
  const where = st => { const m = {}; st.players.forEach(p => p.members.forEach(u => { m[u] = p.id; })); return m; };
  const moves = { handed: {}, taken: {}, rivalSwaps: 0, uses: {} };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  while (!s.over) {
    const pl = s.pending.player;
    const m = pl === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, level === 'hard' ? { level, maxMs: Infinity } : { level });
    const before = where(s), logAt = s.log.length;
    s = applyMove(s, m);
    const after = where(s);
    let rival = false;
    for (const u of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const a = before[u], b = after[u];
      if (a === b) continue;
      const n = defById(s.cards[u].def).name;
      // handed: the mover's (or the shop's) member lands in a rival's cult; taken: a rival's lands in the mover's
      if (b !== undefined && b !== pl) { bump(moves.handed, n); rival = true; }
      if (a !== undefined && a !== pl) { if (b === pl) bump(moves.taken, n); rival = true; }
    }
    if (rival) moves.rivalSwaps++;
    for (const line of s.log.slice(logAt)) {
      const u = typeof line === 'string' && line.match(/ uses (Anarchist|Headhunter)\./);
      if (u) bump(moves.uses, u[1]);
      if (typeof line === 'string' && / Double Agent swaps sides/.test(line)) bump(moves.uses, 'Double Agent');
    }
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const row = {
    game: g, level, table: quads, buyer, ...moves,
    players: s.players.map(p => ({
      seat: p.id, followers: followers(s, p), win: followers(s, p) === top,
      watched: p.members.map(u => defById(s.cards[u].def).name).filter(n => WATCH.includes(n)),
    })),
  };
  appendFileSync(out, JSON.stringify(row) + '\n');
}
