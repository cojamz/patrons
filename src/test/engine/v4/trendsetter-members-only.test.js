import { describe, it, expect } from 'vitest';
import { quadrant } from '../../../engine/v4/index.js';

// Cory, Oct 27: Trendsetter fires when you recruit a member, not when you buy followers.
describe('Trendsetter', () => {
  const def = quadrant('market').members.find(m => m.key === 'trendsetter');
  const ctx = (calls) => ({ state: { shop: [1, 2, 3], queue: [] }, choose: () => calls.push('choose'), defer: () => calls.push('defer'), shopCards: () => [], log() {} });
  it('says members', () => expect(def.text).toBe('Whenever you recruit a member, send 1 shop member to the bottom of the pile, then refill.'));
  it('skips a follower buy and fires on a member recruit', () => {
    const owner = { id: 0 }, card = { uid: 9 };
    const a = []; def.onRecruit(ctx(a), owner, card, owner, { followers: 3 }); expect(a).toEqual([]);
    const b = []; def.onRecruit(ctx(b), owner, card, owner, { member: { uid: 5 } }); expect(b).toContain('defer');
  });
});
