// @vitest-environment node
// Crowd In (Purple, round II; Cory, 2026-10-22): "+1 purple, you can play on occupied spaces this round", +2 with the
// inherent +1. Any taken space, for the rest of that round only.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';

describe('Crowd In', () => {
  it('+2 purple, then taken spaces are on offer for the rest of the round, and not the next', () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 5, quadrants: ['gold', 'red', 'purple', 'echo'] });
    const rand = seededRandom(5);
    while (!(s.round === 2 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    const who = s.pending.player, q = s.quadrants.indexOf('purple');
    const i = quadrant('purple').actions.findIndex(a => a.key === 'crowdin');
    const before = s.players[who].res.purple || 0;
    s = applyMove(s, { player: who, option: `slot:${q}-${i}` });
    expect(s.players[who].res.purple).toBe(before + 2);
    let joined = 0;
    while (s.round === 2) {
      if (s.pending?.kind === 'place' && s.pending.player === who) {
        const sq = s.pending.options.filter(o => o.squat);
        expect(sq.length).toBeGreaterThan(0);
        if (!joined) { s = applyMove(s, { player: who, option: sq[0].id }); joined++; continue; }
      }
      s = applyMove(s, chooseBotMove(s, rand));
    }
    expect(joined).toBe(1);
    while (!(s.round === 3 && s.pending?.kind === 'place' && s.pending.player === who) && !s.over) s = applyMove(s, chooseBotMove(s, rand));
    if (!s.over) expect(s.pending.options.some(o => o.squat)).toBe(false);
  });
});
