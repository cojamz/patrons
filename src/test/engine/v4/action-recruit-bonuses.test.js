// Action-based recruits fire the same bonuses as shop recruits.
import { it, expect } from 'vitest';
import { sceneQ, settle } from './cards-helpers.js';
import { take, move } from './helpers.js';
for (const [action, round] of [['red.hire', 1], ['red.hireup', 2], ['red.take', 3]]) {
  it(`${action} triggers Go-Between and Exporter when taking a red member`, () => {
    const before = sceneQ({ quadrants: ['red', 'yellow', 'trading', 'gold'], round, members: [['yellow.gobetween', 'trading.exporter', 'gold.taxman']], shop: ['red.volunteer'] });
    before.shop = before.shop.filter(u => before.cards[u].def === 'red.volunteer');
    let s = take(before, action);
    if (action === 'red.hireup') {
      const incoming = s.shop.find(u => s.cards[u].def === 'red.volunteer');
      const outgoing = s.players[0].members.find(u => s.cards[u].def === 'gold.taxman');
      s = move(s, `trade:${outgoing}:${incoming}`);
    }
    s = settle(s);
    expect(s.players[0].members.some(u => s.cards[u].def === 'red.volunteer')).toBe(true);
    expect(s.players[0].res.red).toBe(2); // Inherent Red + Go-Between's recruited color
    expect(s.players[0].res.white).toBe(1); // Exporter: white on a non-white recruit
    for (const name of ['Go-Between', 'Exporter']) expect(s.log.some(l => l.includes(name))).toBe(true);
  });
}
