// @vitest-environment node
// The members a space acts on (previewSpace's `targets`), which the screen lights while the space's hover is up
// (Cory, 2026-10-16: "hovering over Free Recruit should highlight the cheapest recruit(s) in the shop").
// Read off the engine's own options, so the light always matches what the space really does.
import { describe, it, expect } from 'vitest';
import { previewSpace } from '../../../engine/v4/preview.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { table, useCosts, uidIn } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'thieves'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'red.bigfamily': [2, 2], 'red.twins': [1, 1],
  'red.intern': [1, 0], 'red.reserve': [1, 0], 'red.volunteer': [2, 2], 'red.mentor': [6, 4],
});
const spot = (s, key) => {
  for (let q = 0; q < s.quadrants.length; q++) {
    const i = quadrant(s.quadrants[q]).actions.findIndex(a => a.key === key);
    if (i >= 0) return [q, i];
  }
  throw new Error(`no ${key}`);
};
const targetsAt = (s, key, pid = 0) => { const [q, i] = spot(s, key); return previewSpace(s, pid, q, i).targets; };
const sorted = a => [...a].sort((x, y) => x - y);

describe('space targets', () => {
  // Walk-In (2026-10-27) recruits the deck's top member, which isn't face-up, so no shop member lights
  it('Walk-In: lights no shop member, since it takes the top of the deck', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.bigfamily', 'red.intern', 'gold.taxman'] });
    expect(targetsAt(s, 'hire')).toBe(null);
  });
  // Open House left with the Red redesign (v0.8.0); round II's hireup space is Promote
  it('Promote: the pairs of a member (yours or a rival\'s) for a shop member costing up to 2 more', () => {
    const s = table(Q, { round: 2, members: [['red.twins'], ['red.intern']], shop: ['gold.tycoon', 'red.bigfamily', 'gold.taxman', 'red.reserve', 'red.mentor'] });
    const t = targetsAt(s, 'hireup');
    const key = ([a, b]) => `${a}:${b}`;
    const twins = uidIn(s, 'red.twins', 0), intern = uidIn(s, 'red.intern', 1);
    expect(t.pairs.map(key).sort()).toEqual([
      [twins, uidIn(s, 'red.bigfamily', 'shop')], [twins, uidIn(s, 'gold.taxman', 'shop')],
      [twins, uidIn(s, 'red.reserve', 'shop')], [intern, uidIn(s, 'red.reserve', 'shop')],
    ].map(key).sort());
  });
  it('Recruit a Member: every face-up member costing 8 or less (Cory, 2026-10-25)', () => {
    const s = table(Q, { round: 3, shop: ['gold.tycoon', 'red.intern', 'red.bigfamily', 'gold.taxman', 'red.mentor'] });
    const t = targetsAt(s, 'take');
    expect(sorted(t.shop)).toEqual(sorted(['red.intern', 'red.bigfamily', 'gold.taxman'].map(d => uidIn(s, d, 'shop'))));
  });
  it('Churn and Bury: no member is lit up front, since the player picks which go to the bottom', () => {
    const defs = ['gold.tycoon', 'red.intern', 'red.bigfamily'];
    expect(targetsAt(table(Q, { shop: defs }), 'bargain')).toBe(null);
    expect(targetsAt(table(Q, { round: 2, shop: defs }), 'pricecheck')).toBe(null);
  });
  // Tryout (2026-10-27) borrows a shop member's On Recruit; the member stays in the shop, so nothing joins and
  // nothing lights (Even Swap's pairs left with it)
  it('Tryout: no swap pairs and no member lit', () => {
    const s = table(Q, { members: [['gold.taxman'], ['red.intern', 'red.bigfamily']], shop: ['gold.tycoon'] });
    expect(targetsAt(s, 'evenswap')).toBe(null);
  });
  it('a space that touches no particular member lights nothing', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.intern'] });
    expect(targetsAt(s, 'turnout')).toBe(null);
  });
});
