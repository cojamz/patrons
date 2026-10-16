// Action-based recruits fire the same bonuses as shop recruits.
import { it, expect } from 'vitest';
import { sceneQ, settle } from './cards-helpers.js';
import { take } from './helpers.js';
for (const [action, round] of [['red.hire', 1], ['red.hireup', 2], ['red.take', 3]]) {
  it(`${action} triggers Go-Between and Exporter when taking a red member`, () => {
    const before = sceneQ({ quadrants: ['red', 'yellow', 'trading', 'gold'], round, members: [['yellow.gobetween', 'trading.exporter']], shop: ['red.volunteer'] });
    before.shop = before.shop.filter(u => before.cards[u].def === 'red.volunteer');
    const s = settle(take(before, action));
    expect(s.players[0].members.some(u => s.cards[u].def === 'red.volunteer')).toBe(true);
    expect(s.players[0].res.red).toBe(1); // Go-Between: the recruited member's color
    expect(s.players[0].res.white).toBe(1); // Exporter: white on a non-white recruit
    for (const name of ['Go-Between', 'Exporter']) expect(s.log.some(l => l.includes(name))).toBe(true);
  });
}
