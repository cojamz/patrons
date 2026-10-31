// Fire audit: seeded bot games on mixed tables. For every member that got recruited, did a log line (or a final
// score part) ever name it acting? Cory's rule: every number on the table traces to a log line, so a member that
// is recruited again and again and never named is either silent (its effect leaves no trace) or dead.
// Used by fire-audit.test.js (the gate) and scripts/v4-fire-audit.mjs (the report).
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { quadrant, guestMembers, defById } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { makeTables } from './fuzz-tables-runner.js';
import { namesCard } from './cards-helpers.js';

const PLAIN_KEYS = new Set(['key', 'name', 's', 'w', 'text', 'f', 'n', 'copies', 'id', 'quadrant', 'vanilla', 'guest', 'lean', 'bends', 'extraWild']); // extraWild: the +1 wild on every member's price (content/index.js), not an effect
/** A member with an effect (a hook or a rule flag), not just "worth N followers". */
export const hasEffect = def => Object.keys(def).some(k => !PLAIN_KEYS.has(k));

/**
 * @param {{ games?: number, spheres?: string[]|null, seed?: number, levels?: string[] }} opts
 *   spheres: only tables with at least one of these (null: every table); guests are always in the deck.
 * @returns {{ games: number, crashes: string[], stats: Record<string, { def: string, name: string, rec: number, fired: number }> }}
 */
export function runFireAudit({ games = 120, spheres = null, seed = 7, levels = ['easy', 'normal', 'easy', 'normal'] } = {}) {
  let { tables } = makeTables(seed, 6);
  if (spheres) tables = tables.filter(t => t.some(q => spheres.includes(q)));
  const stats = {};
  const crashes = [];
  for (let g = 0; g < games; g++) {
    const quads = tables[g % tables.length];
    try {
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 1000 + g, quadrants: quads });
      levels.forEach((l, i) => { s.players[i].bot = l; });
      const rand = seededRandom(g + 9);
      const full = [...s.log];
      const held = new Set();
      let k = 0;
      while (!s.over && k++ < 8000) {
        const len = s.log.length, last = s.log[len - 1];
        s = applyMove(s, chooseBotMove(s, rand));
        // new lines (the log keeps the last 300)
        full.push(...(s.log.length > len ? s.log.slice(len) : s.log.slice(s.log.lastIndexOf(last) + 1)));
        for (const p of s.players) for (const u of p.members) held.add(s.cards[u].def);
      }
      if (!s.over) throw new Error('did not finish');
      const lines = [...full, ...s.players.flatMap(p => p.final?.parts || [])];
      const defs = [...quads.flatMap(q => quadrant(q).members), ...guestMembers()];
      for (const d of defs) {
        if (!held.has(d.id)) continue;
        const e = (stats[d.id] ||= { def: d.id, name: d.name, rec: 0, fired: 0 });
        e.rec += 1;
        if (lines.some(l => namesCard(l, d.name))) e.fired += 1;
      }
    } catch (e) { crashes.push(`${quads.join(',')} seed ${1000 + g}: ${e.message}`); }
  }
  return { games, crashes, stats };
}

/** Members (with an effect, from these spheres or guests) recruited in some game and never named acting. */
export function silentMembers(stats, spheres, allow = {}) {
  return Object.values(stats).filter(e => {
    const d = defById(e.def);
    const mine = spheres.includes(d.guest ? 'benders' : d.quadrant) || (d.guest && spheres.includes(d.guest));
    return mine && hasEffect(d) && e.rec > 0 && e.fired === 0 && !allow[e.def];
  });
}
