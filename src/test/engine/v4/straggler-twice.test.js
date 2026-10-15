// Two Straggler moves queued at once (a Straggler and a Doppelganger copying it): the second choice was made from a
// board the first one changed. It used to crash (benders.js stragglerTo splicing a gone squat list); now it re-offers.
import { describe, it, expect } from 'vitest';
import { sceneQ } from './cards-helpers.js';
import { move } from './helpers.js';

describe('Straggler twice in one round', () => {
  it('a stale second move is offered again with fresh options instead of crashing', () => {
    let s = sceneQ({ members: [['benders.straggler', 'red.doppel']], slots: { '0-0': 0, '0-1': 0 }, queue: [{ t: 'allPlaced' }] });
    const dop = s.players[0].members.find(u => s.cards[u].def === 'red.doppel');
    s.cards[dop].copy = 'benders.straggler';
    s.queue = [{ t: 'allPlaced' }]; s.pending = null;
    return import('../../../engine/v4/core.js').then(({ resume: r }) => {
      s = r(s);
      expect(s.pending?.kind).toBe('choose');
      // both Straggler choices are queued now, each for the last-placed minion; the first moves it
      const to = s.pending.options[0].id;
      s = move(s, to);
      // the second was queued for a minion that has moved (stale): resolving it must not crash, and must re-offer
      expect(() => { while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id); }).not.toThrow();
      const mine = Object.values(s.slots).filter(o => o === 0).length;
      expect(mine).toBe(2); // still two workers on the board, moved, none lost or duplicated
    });
  });
});
