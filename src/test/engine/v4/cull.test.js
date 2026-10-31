import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createGame, DEFAULT_RULES, ARTIFACTS } from '../../../engine/v4/core.js';
import { CUT, FULL_DECK } from '../../../engine/v4/content/cull.js';
import { allQuadrantIds, quadrant, guestMembers, defById } from '../../../engine/v4/content/index.js';
import { applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { checkInvariants } from './fuzz-runner.js';

const SPHERES = allQuadrantIds().filter(q => !['blue', 'green'].includes(q));
const seats = n => Array.from({ length: n }, () => ({ kind: 'bot' }));

describe('the curated member decks', () => {
  // setup.js deals the full deck for the card tests; these play the deck the game ships with
  beforeAll(() => { FULL_DECK.tests = false; });
  afterAll(() => { FULL_DECK.tests = true; });

  it('real games cull by default', () => {
    expect(DEFAULT_RULES.cull).toBe(true);
    expect(createGame({ seats: seats(2) }).rules.cull).toBe(true);
  });

  // Purple's set of 12 (Cory, 2026-10-22). Blue is 12 (Cory, 2026-10-21).
  // Magenta deals 13 (Cory, 2026-10-21: 12 per color, Magenta stays at 13 for now, a cut is on the backlog)
  // Member structure (Cory, 2026-10-24): a once per game for Red, Magenta and Blue, Blue's round start, a go-deep for
  // Purple and White; Bulk Buyer, Appraiser and Makeover cut
  // Oct 25: Recluse moves to White, Stylist cut
  // Green grows to 16 (Cory, 2026-10-29: Understudy, Wallflower, Fan Club, Roadie), then 15 (Connector cut)
  const DEALT = { echo: 15, red: 13, thieves: 15, purple: 13, market: 12, trading: 12, yellow: 15 };
  it('Green deals 15, Blue 12, Red and Purple 13, Magenta 15, White 12, Yellow 15, other spheres 10, guests 15; no cut card is dealt', () => {
    for (const q of SPHERES) {
      const s = createGame({ seats: seats(4), quadrants: [q, ...SPHERES.filter(x => x !== q).slice(0, 3)] });
      // artifacts are picked, never dealt (Cory, 2026-10-24): their cards don't count here
      const arts = new Set(Object.values(s.artifacts || {}));
      const dealt = Object.values(s.cards).filter(c => !arts.has(c.uid)).map(c => c.def);
      // a color whose artifact is one of its dealt members deals one fewer (that member is the artifact now)
      const fromDeck = ARTIFACTS[q] && !CUT.has(ARTIFACTS[q]) && !defById(ARTIFACTS[q]).artifact ? 1 : 0;
      expect(dealt.filter(d => d.startsWith(`${q}.`)).length, q).toBe((DEALT[q] ?? 10) - fromDeck);
      expect(dealt.filter(d => CUT.has(d))).toEqual([]);
      expect(dealt.filter(d => d.startsWith('benders.')).length).toBe(15); // Cory's 15 guests (Oct 28)
    }
  });

  it('Overseer and Social Climber are cut (Cory, 2026-10-18)', () => {
    expect(CUT.has('purple.overseer')).toBe(true);
    expect(CUT.has('market.climber')).toBe(true);
  });

  it('every cut id names a real card', () => {
    const all = new Set([...SPHERES.flatMap(q => quadrant(q).members.map(d => d.id)), ...guestMembers().map(d => d.id)]);
    for (const id of CUT) expect(all.has(id), id).toBe(true);
  });

  it('bot games finish cleanly on culled tables', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const qs = SPHERES.slice(seed % 6, seed % 6 + 4).concat(SPHERES).slice(0, 4);
      const rand = seededRandom(seed);
      let s = createGame({ seats: seats(4), seed, quadrants: qs });
      for (let n = 0; s.pending && n < 5000; n++) { s = applyMove(s, chooseBotMove(s, rand)); checkInvariants(s, `cull seed=${seed}`); }
      expect(s.over, qs.join(',')).toBe(true);
      // an artifact may be a cut card (Silver's Caterer): it's never dealt, only picked
      const arts = new Set(Object.values(s.artifacts || {}));
      expect(Object.values(s.cards).some(c => CUT.has(c.def) && !arts.has(c.uid))).toBe(false);
    }
  });
});
