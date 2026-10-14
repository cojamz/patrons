// @vitest-environment node
// Fire audit gate (Cory: every number on the table traces to a log line). Seeded mixed tables, normal bots: every
// member with an effect that gets recruited must leave a log line naming it as acting at least once.
// scripts/v4-fire-audit.mjs is the long report; this is the fast gate. Each block covers a group of spheres.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { namesCard } from './cards-helpers.js';

const STD = new Set(['key', 'name', 's', 'w', 'text', 'f', 'n', 'id', 'quadrant', 'copies', 'badge', 'vanilla']);
/** A plain member ("Worth 2 followers", "No effect") has nothing to fire. */
const plain = def => Object.keys(def).every(k => STD.has(k));

/** Play `games` seeded 4-bot games over `tables`; per member name: games recruited, games named as acting. */
export function audit(tables, games, seed = 3100) {
  const st = {};
  for (let g = 0; g < games; g++) {
    const quads = tables[g % tables.length];
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: seed + g, quadrants: quads });
    const rand = seededRandom(seed + g * 7 + 1);
    const full = [...s.log];
    let k = 0;
    while (!s.over && k++ < 8000) {
      const n0 = s.log.length, last = s.log[n0 - 1];
      s = applyMove(s, chooseBotMove(s, rand));
      full.push(...s.log.slice(n0 < 300 ? n0 : s.log.lastIndexOf(last) + 1));
    }
    if (!s.over) throw new Error(`${quads.join(',')} seed ${seed + g} did not finish`);
    full.push(...s.players.flatMap(p => p.final?.parts || []));
    const recruited = new Set(full.filter(l => / recruited /.test(l)).map(l => l.replace(/^.* recruited (.*?)( from the pile)? \(.*$/, '$1')));
    for (const q of quads) for (const def of quadrant(q).members) {
      if (plain(def) || !recruited.has(def.name)) continue;
      const e = (st[def.id] ||= { name: def.name, rec: 0, fired: 0 });
      e.rec++;
      if (full.some(l => namesCard(l, def.name))) e.fired++;
    }
  }
  return st;
}

describe('fire audit: Blue, Magenta, White, Green', () => {
  // Members that change no number (Watchdog only refuses a steal), or that bots never set up (see design/eval/card-ledger-b.md)
  const EXEMPT = new Set(['thieves.watchdog']);
  const TABLES = [
    ['thieves', 'market', 'trading', 'echo'], ['gold', 'thieves', 'trading', 'echo'], ['red', 'market', 'thieves', 'echo'],
    ['gold', 'market', 'trading', 'echo'], ['red', 'thieves', 'market', 'trading'],
  ];
  it('every recruited member with an effect leaves a named trace at least once', () => {
    const st = audit(TABLES, 30);
    const silent = Object.entries(st).filter(([id, e]) => e.rec && !e.fired && !EXEMPT.has(id)).map(([id, e]) => `${id} (recruited in ${e.rec})`);
    const groups = ['market', 'thieves', 'trading', 'echo'];
    const unseen = groups.flatMap(q => quadrant(q).members).filter(d => !plain(d) && !EXEMPT.has(d.id) && !st[d.id]).map(d => d.id);
    expect(silent).toEqual([]);
    expect(unseen).toEqual([]);
  }, 120000);
});
