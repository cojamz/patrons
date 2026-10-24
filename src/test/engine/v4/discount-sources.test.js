// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { discountSources, grantDiscount } from '../../../engine/v4/discount.js';
import { sceneQ, buy } from './cards-helpers.js';
import { take } from './helpers.js';

describe('discount provenance', () => {
  it('records actual actions, persists through JSON saves, stacks without duplicating names', () => {
    let s = take(sceneQ(), 'gold.discount');
    expect(s.players[0].discountSources).toEqual([{ name: 'Intro Offer', n: 4 }]);
    s = JSON.parse(JSON.stringify(s));
    grantDiscount(s.players[0], 2, 'Planner');
    grantDiscount(s.players[0], 4, 'Intro Offer');
    expect(discountSources(s.players[0])).toEqual([{ name: 'Intro Offer', n: 8 }, { name: 'Planner', n: 2 }]);
    expect(s.players[0].discount).toBe(10);
  });
  it('does not guess the origin of a legacy amount, or retain consumed sources', () => {
    const p = { discount: 3 };
    grantDiscount(p, 4, 'Intro Offer');
    expect(discountSources(p)).toEqual([{ name: 'Earlier discount', n: 3 }, { name: 'Intro Offer', n: 4 }]);
    p.discount = 0;
    grantDiscount(p, 2, 'Planner');
    expect(discountSources(p)).toEqual([{ name: 'Planner', n: 2 }]);
  });
  it('clears source records when a paid recruit consumes the discount', () => {
    let s = sceneQ({ res: [{ gold: 30, red: 30, blue: 30, green: 30 }], shop: ['red.intern'] });
    grantDiscount(s.players[0], 4, 'Intro Offer');
    s = take(s, 'gold.discount');
    s = buy(s, 'red.intern');
    expect(s.players[0].discount).toBe(0);
    expect(s.players[0].discountSources).toEqual([]);
  });
});
