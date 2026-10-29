import { describe, it, expect } from 'vitest';
import { applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { take } from './helpers.js';
import { sceneQ } from './cards-helpers.js';

// Bots rate a swap for everyone it touches, not only their own cult (Cory, 2026-10-29: the bots "clearly aren't
// using it to switch into somebody"). Anarchist's own hint scores a swap of two members that aren't yours as 0, so
// before this a bot never pushed a shop Saboteur into the leader's cult.
const botMove = s => applyMove(s, chooseBotMove(s, () => 0.5, { level: 'normal' }));

describe('bots and rival swaps', () => {
  it('uses Anarchist to swap a shop Saboteur into the leader’s cult for their member', () => {
    let s = sceneQ({ round: 2, bonus: [0, 20], members: [['benders.anarchist'], ['gold.prospector']], shop: ['benders.saboteur'] });
    s.shop = s.shop.filter(u => s.cards[u].def === 'benders.saboteur'); // nothing else to swap for
    s = take(s, 'gold.rush');
    expect(s.pending.kind).toBe('buy');
    s = botMove(s);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.some(o => o.kind === 'trade')).toBe(true);
    s = botMove(s);
    const sab = Object.values(s.cards).find(c => c.def === 'benders.saboteur').uid;
    expect(s.log.join('\n')).toMatch(/Anarchist swapped/);
    expect(s.players[1].members).toContain(sab);
    expect(s.players[1].bonus).toBe(17);
  });
});
