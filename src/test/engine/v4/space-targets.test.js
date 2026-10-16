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
  it('Open Door with one cheapest: lights that one, surely', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.bigfamily', 'red.intern', 'gold.taxman'] });
    const t = targetsAt(s, 'hire');
    expect(t.shop).toEqual([uidIn(s, 'red.intern', 'shop')]);
    expect(t.sure).toBe(true);
  });
  it('Open Door with tied cheapest: lights every tied card, not surely one', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.intern', 'red.bigfamily', 'red.reserve'] });
    const t = targetsAt(s, 'hire');
    expect(sorted(t.shop)).toEqual(sorted([uidIn(s, 'red.intern', 'shop'), uidIn(s, 'red.reserve', 'shop')]));
    expect(t.sure).toBe(false);
  });
  it('Open House: every face-up member costing 4 or less', () => {
    const s = table(Q, { round: 2, shop: ['gold.tycoon', 'red.intern', 'red.bigfamily', 'gold.taxman', 'red.mentor'] });
    const t = targetsAt(s, 'hireup');
    expect(sorted(t.shop)).toEqual(sorted(['red.intern', 'red.bigfamily', 'gold.taxman'].map(d => uidIn(s, d, 'shop'))));
  });
  it('Snap Up: only what you could pay for after its +2 blue', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.intern', 'red.bigfamily'] });
    const t = targetsAt(s, 'bargain');
    expect(sorted(t.shop)).toEqual(sorted([uidIn(s, 'red.intern', 'shop')]));
  });
  it('Even Swap: the pairs of equal cost, yours for theirs', () => {
    const s = table(Q, { members: [['gold.taxman'], ['red.intern', 'red.bigfamily']], shop: ['gold.tycoon'] });
    const t = targetsAt(s, 'evenswap');
    expect(t.pairs).toEqual([[uidIn(s, 'gold.taxman', 0), uidIn(s, 'red.bigfamily', 1)]]);
    expect(t.shop).toEqual([]);
  });
  it('a space that touches no particular member lights nothing', () => {
    const s = table(Q, { shop: ['gold.tycoon', 'red.intern'] });
    expect(targetsAt(s, 'turnout')).toBe(null);
  });
});
