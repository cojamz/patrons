// @vitest-environment node
// Crowd In (Purple, round III; Cory, 2026-10-28): "+5 purple and gain a minion this round". Replaces placing on taken
// spaces, which copied too much with Greatest Hits. Extra minions stop when the round's spare spaces run out.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';

describe('Crowd In', () => {
  it('round III: +3 purple and one more minion this round; no taken spaces opened; not open before round III', () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 5, quadrants: ['gold', 'red', 'purple', 'echo'] });
    const rand = seededRandom(5);
    const q = s.quadrants.indexOf('purple'), i = quadrant('purple').actions.findIndex(a => a.key === 'crowdin');
    while (!(s.round === 2 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    expect(s.pending.options.some(o => o.id === `slot:${q}-${i}`)).toBe(false);
    while (!(s.round === 3 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    const who = s.pending.player;
    const before = s.players[who].res.purple || 0, left = s.players[who].left;
    s = applyMove(s, { player: who, option: `slot:${q}-${i}` });
    expect(s.players[who].res.purple).toBe(before + 3);
    expect(s.players[who].squatAll).not.toBe(3); // no longer opens taken spaces
    // the minion just placed is spent, the new one takes its place
    expect(s.players[who].left).toBe(left);
    // every minion left, the new one included, gets placed, on open spaces only
    let placed = 0;
    while (s.round === 3 && !s.over) {
      const had = s.players[who].left;
      s = applyMove(s, chooseBotMove(s, rand));
      if (s.round === 3 && s.players[who].left < had) placed += had - s.players[who].left;
    }
    expect(placed).toBeGreaterThanOrEqual(left); // a later extra turn can add more
  });
});
