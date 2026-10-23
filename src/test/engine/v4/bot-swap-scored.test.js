import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

// Bots score each swap by playing it on a copy. Until 2026-10-21 that copy ran red.trade without the queued choice's
// data, so every trade threw and fell back to its hint (bots.js chooseSwap). The fallback counts into __swapFail.
describe('bot swap scoring', () => {
  it('plays every offered swap on a copy instead of falling back to its hint', () => {
    globalThis.__swapFail = 0;
    let swaps = 0;
    for (const seed of [1, 4, 5]) {
      const rand = seededRandom(seed);
      let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed, quadrants: ['red', 'gold', 'blue', 'green'] });
      while (!s.over) {
        const pend = s.pending;
        if (pend.kind === 'choose' && pend.options.length > 1 && pend.options.every(o => o.kind === 'trade' || o.kind === 'pass')) swaps++;
        s = applyMove(s, chooseBotMove(s, rand, { level: 'normal' }));
      }
    }
    expect(swaps).toBeGreaterThan(0);
    expect(globalThis.__swapFail).toBe(0);
  });
});
