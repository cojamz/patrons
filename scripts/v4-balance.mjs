// Balance batch: bots on random tables of the 2.0 colors, any seat count, optional price changes. One JSON line per game.
// Usage: node scripts/v4-balance.mjs <firstGame> <count> <out.jsonl>
//   SEATS=2|3|4 (default 4; one color per seat, as the game deals). LEVEL=normal|hard|easy (default normal).
//   PRICE="cheerleader=0/5,echo.impostor=2/4" sets a member's price as colored/any (by key, id or name; prices only, never
//   what a card does). A new price can move a card to another round's deck, as it would in the game (core.js memberRound).
//   ONLY=red,echo,... sets the color pool (default: the 2.0 colors). MUST=thieves puts that color on every table.
//   BUDGET=<n> trims Hard's lookahead (default: the game's). Every 5th game one seat only buys followers.
// Same game numbers with the same settings replay the same games, so a price run compares game for game with the base.
import { appendFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } from '../src/engine/v4/index.js';
import { defById, guestMembers } from '../src/engine/v4/content/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { sphereVersion } from '../src/v4/tables.js';

const [first, count, out] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'balance.jsonl'];
const level = process.env.LEVEL || 'normal', seats = Number(process.env.SEATS || 4);
const all = process.env.ONLY ? process.env.ONLY.split(',') : allQuadrantIds().filter(q => sphereVersion(q) === '2.0');
const must = process.env.MUST ? process.env.MUST.split(',') : [];
const defs = [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()];
const prices = {};
for (const pair of (process.env.PRICE || '').split(',').filter(Boolean)) {
  const [k, v] = pair.split('='), [s, w] = v.split('/').map(Number);
  const d = defs.find(x => x.id === k || x.key === k || x.name.toLowerCase() === k.toLowerCase());
  if (!d) throw new Error(`No member ${k}`);
  // the printed any part includes the +1 wild every member pays (extraWild), so set w as printed
  prices[d.id] = { from: `${d.s}/${d.w}`, to: v };
  d.s = s; d.w = w;
}
const botOpts = level === 'hard' ? { level, maxMs: Infinity, ...(process.env.BUDGET ? { budget: Number(process.env.BUDGET) } : {}) } : { level };
const name = d => { try { const x = defById(d); return `${x.name} (${d.split('.')[0]})`; } catch { return d; } };
const cost = d => { try { const x = defById(d); return (x.s || 0) + (x.w || 0); } catch { return null; } };

for (let g = first; g < first + count; g++) {
  const rand = seededRandom(g * 7717 + 3 + seats * 101);
  const pool = all.filter(q => !must.includes(q)), quads = [...must];
  while (quads.length < seats) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: seats }, () => ({ kind: 'bot' })), seed: g, quadrants: quads });
  const buyer = g % 5 === 0 ? g % seats : -1;
  const places = s.players.map(() => ({})), seen = {}, got = s.players.map(() => ({}));
  while (!s.over) {
    for (const uid of s.shop) seen[s.cards[uid].def] ??= s.round;
    const before = s.players.map(p => new Set(p.members));
    const pl = s.pending.player;
    const m = pl === buyer ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, botOpts);
    if (typeof m.option === 'string' && /^(slot|squat):/.test(m.option)) {
      const [q, i] = m.option.split(':')[1].split('-').map(Number);
      const a = quadrant(s.quadrants[q]).actions[i];
      const k = a ? `${s.quadrants[q]}: ${a.name}` : m.option;
      places[pl][k] = (places[pl][k] || 0) + 1;
    }
    const round = s.round;
    s = applyMove(s, m);
    s.players.forEach((p, i) => { for (const u of p.members) if (!before[i].has(u)) got[i][name(s.cards[u].def)] ??= round; });
  }
  const top = Math.max(...s.players.map(p => followers(s, p)));
  const row = {
    game: g, level, seats, table: quads, buyer, prices,
    shop: Object.keys(seen).map(name), shopRound: Object.fromEntries(Object.entries(seen).map(([d, r]) => [name(d), r])),
    players: s.players.map(p => ({
      seat: p.id, followers: followers(s, p), win: followers(s, p) === top, members: p.members.map(u => name(s.cards[u].def)),
      memberCount: memberCount(s, p), artifact: p.artifact !== undefined ? name(s.cards[p.artifact].def) : null, places: places[p.id],
      gotRound: got[p.id], left: Object.values(p.res).reduce((a, b) => a + b, 0),
      memberFollowers: Object.fromEntries(p.members.map(u => {
        const c = s.cards[u], d = defById(c.def), f = c.copy ? Math.max(d.f || 0, defById(c.copy).f || 0) : d.f || 0;
        return [name(c.def), f + ((s.ledger && s.ledger[p.id] && s.ledger[p.id][d.name]) || 0)];
      })),
      memberCost: Object.fromEntries(p.members.map(u => [name(s.cards[u].def), cost(s.cards[u].def)])),
    })),
  };
  appendFileSync(out, JSON.stringify(row) + '\n');
}
