import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createGame, DEFAULT_RULES } from '../../../engine/v4/core.js';
import { CUT, FULL_DECK } from '../../../engine/v4/content/cull.js';
import { allQuadrantIds, quadrant, guestMembers } from '../../../engine/v4/content/index.js';
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
  const DEALT = { echo: 12, red: 12, thieves: 13, purple: 12, market: 12, trading: 12 };
  it('Green, Red and Blue deal 12 members, Magenta 13, Purple 12, other spheres 10, guests 7; no cut card is dealt', () => {
    for (const q of SPHERES) {
      const s = createGame({ seats: seats(4), quadrants: [q, ...SPHERES.filter(x => x !== q).slice(0, 3)] });
      const dealt = Object.values(s.cards).map(c => c.def);
      expect(dealt.filter(d => d.startsWith(`${q}.`)).length, q).toBe(DEALT[q] ?? 10);
      expect(dealt.filter(d => CUT.has(d))).toEqual([]);
      expect(dealt.filter(d => d.startsWith('benders.')).length).toBe(7);
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
      expect(Object.values(s.cards).some(c => CUT.has(c.def))).toBe(false);
    }
  });
});
