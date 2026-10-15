import { it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
it('fuzz: every offered option of a Snap Up / Half Price / Talent Scout choice applies', () => {
  let checked = 0;
  for (let g = 0; g < 40; g++) {
    const rand = seededRandom(1000 + g);
    let s = createGame({ seats: [0, 1, 2, 3].map(i => ({ name: `P${i}`, kind: 'bot' })), seed: 500 + g, quadrants: ['gold', 'red', 'market', 'echo'] });
    let n = 0;
    while (s.pending && n++ < 2000) {
      const pr = s.pending.prompt || '';
      if (s.pending.kind === 'choose' && /^(Snap Up|Half Price|Talent Scout)/.test(pr)) {
        for (const o of s.pending.options) {
          try { applyMove(s, { player: s.pending.player, option: o.id }); checked++; }
          catch (e) { throw new Error(`game ${g} move ${n}: ${pr} → ${o.id}: ${e.message}\n${JSON.stringify(s.players[s.pending.player])}`); }
        }
      }
      const m = rand() < 0.5 ? chooseBotMove(s, rand, { level: 'normal' }) : { player: s.pending.player, option: s.pending.options[Math.floor(rand() * s.pending.options.length)].id };
      s = applyMove(s, m);
    }
  }
  console.log('checked', checked);
  expect(checked).toBeGreaterThan(20);
});
