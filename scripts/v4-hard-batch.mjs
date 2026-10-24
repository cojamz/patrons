// Hard bots on random 4-sphere tables, one JSON line per game. Usage: node scripts/v4-hard-batch.mjs <firstGame> <count> <out.jsonl>
// Every 5th game one seat only buys followers (the buy-followers-only check). Hard is uncapped, so games repeat exactly.
import { appendFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } from '../src/engine/v4/index.js';
import { defById } from '../src/engine/v4/content/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const [first, count, out] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'hard-batch.jsonl'];
// The colors in the game: Classic's spheres plus Silver, White (trading) and Magenta (thieves); not the plain Blue and Green test spheres.
const all = allQuadrantIds().filter(q => q !== 'blue' && q !== 'green');
for (let g = first; g < first + count; g++) {
  const rand = seededRandom(g * 7717 + 3);
  // MUST=trading puts that sphere on every table (a quick read on one color); the rest are random.
  const must = process.env.MUST ? process.env.MUST.split(',') : [];
  const pool = all.filter(q => !must.includes(q)), quads = [...must];
  while (quads.length < 4) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const buyer = g % 5 === 0 ? g % 4 : -1;
  const places = s.players.map(() => ({})), seen = new Set();
  while (!s.over) {
    for (const uid of s.shop) seen.add(s.cards[uid].def);
    const pl = s.pending.player;
    const m = pl === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, { level: 'hard', maxMs: Infinity });
    if (typeof m.option === 'string' && /^(slot|squat):/.test(m.option)) {
      const [q, i] = m.option.split(':')[1].split('-').map(Number);
      const a = quadrant(s.quadrants[q]).actions[i];
      const name = a ? `${s.quadrants[q]}: ${a.name}` : m.option;
      places[pl][name] = (places[pl][name] || 0) + 1;
    }
    s = applyMove(s, m);
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const name = d => { try { const x = defById(d); return `${x.name} (${d.split('.')[0]})`; } catch { return d; } };
  const row = {
    game: g, table: quads, buyer,
    shop: [...seen].map(name),
    players: s.players.map(p => ({
      seat: p.id, followers: followers(s, p), win: followers(s, p) === top, members: p.members.map(u => name(s.cards[u].def)),
      memberCount: memberCount(s, p), places: places[p.id],
      // followers each member gave: its printed followers plus what its ability added during play (the ledger)
      memberFollowers: Object.fromEntries(p.members.map(u => {
        const c = s.cards[u], d = defById(c.def), f = c.copy ? Math.max(d.f || 0, defById(c.copy).f || 0) : d.f || 0;
        return [name(c.def), f + ((s.ledger && s.ledger[p.id] && s.ledger[p.id][d.name]) || 0)];
      })),
    })),
  };
  appendFileSync(out, JSON.stringify(row) + '\n');
}
