import { describe, expect, it } from 'vitest';
import { stealPlan } from '../../../v4/game/boardPick.js';

describe('steal plan uses resource quantities, not number of clicks', () => {
  const rivals = [{ pid: 1, stacks: [{ res: 'gold', has: 5, o: { take: 2 } }] }, { pid: 2, stacks: [{ res: 'red', has: 3, o: { take: 2 } }] }];
  it('takes doubled amounts from the chosen stack, with an odd remainder', () => {
    const plan = stealPlan(rivals, 5);
    expect(plan).toEqual([{ pid: 1, res: 'gold', take: 2 }, { pid: 1, res: 'gold', take: 2 }, { pid: 2, res: 'red' }]);
    expect(plan.reduce((n, x) => n + (x.take || 1), 0)).toBe(5);
  });
  it('honors each-rival requirements before allocating remaining resources', () => {
    expect(stealPlan(rivals, 4, [1, 2], true)).toEqual([{ pid: 1, res: 'gold', take: 2 }, { pid: 2, res: 'red', take: 2 }]);
  });
});
