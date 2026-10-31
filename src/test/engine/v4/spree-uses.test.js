// @vitest-environment node
// Spree's three recruits survive a recruit that brings a usable member (Speculator): the "use a member, or finish your
// turn" step waits until the last recruit, since its Done ends every recruit left (release QA, Oct 28: the UI critic
// got one recruit of three).
import { describe, it, expect } from 'vitest';
import { take, move } from './helpers.js';
import { table } from './cards-helpers-b.js';

const SHOP = ['gold.speculator', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.bigfamily'];
function spree(members) {
  let s = table(['gold', 'red', 'market', 'echo'], { round: 3, left: 8, shop: SHOP, res: [{ gold: 40, red: 40, blue: 40, green: 40 }], members: [members, []], queue: [0, 1].map(p => ({ t: 'turn', p })) });
  s = take(s, 'market.spree');
  let recruits = 0, usesSeen = 0;
  for (let k = 0; k < 20 && s.pending?.player === 0; k++) {
    const p = s.pending;
    if (p.kind === 'buy' && p.options.some(o => o.kind === 'use')) usesSeen++;
    const card = p.options.find(o => o.kind === 'card');
    if (p.kind === 'buy' && card) { s = move(s, card.id); recruits++; continue; }
    if (p.kind === 'buy') { s = move(s, 'pass'); break; }
    s = move(s, p.options[0].id);
  }
  return { recruits, usesSeen };
}
describe('Spree with a usable member', () => {
  it('recruiting Speculator first still leaves the other two recruits, and Speculator stays usable', () => {
    const r = spree([]);
    expect(r.recruits).toBe(3);
    expect(r.usesSeen).toBeGreaterThan(0);
  });
  it('the same with Trendsetter sending a member to the bottom after each recruit', () => {
    expect(spree(['market.trendsetter']).recruits).toBe(3);
  });
});
