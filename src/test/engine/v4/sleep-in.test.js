// @vitest-environment node
// Sleep In (Purple, round I; Cory, 2026-10-22): "+4 purple, skip your next turn". Cory's example: round I, 4 players,
// A takes it first; the snake comes back D C B, A is passed over, the next turn is A's anyway; B C D place their
// last; A still has a minion, so the snake carries on and A places it. A places all 3 minions.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, actionAt } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';

// seed 2 since Sleep In grew to +4 / +5 / +6 (Oct 28): other seeds' bots pile skips onto A
describe('Sleep In', () => {
  it("Cory's round I example: A A-skipped, A places all 3, the last one after everyone", () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 3, quadrants: ['gold', 'red', 'purple', 'echo'] }); // seed 3 since Saboteur joined the deck (Oct 28)
    const rand = seededRandom(3);
    while (!(s.round === 1 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    const base = s.order.slice(0, 4);
    const A = s.pending.player, q = s.quadrants.indexOf('purple');
    const i = quadrant('purple').actions.findIndex(a => a.key === 'skip');
    const before = s.players[A].res.purple || 0;
    s = applyMove(s, { player: A, option: `slot:${q}-${i}` });
    expect(s.players[A].res.purple).toBe(before + 4); // round I (+4 / +5 / +6, Oct 28)
    const placed = [A];
    // (the others leave turn-moving spaces and copies of them alone while anything else is open)
    const moves = x => x.kind === 'slot' && x.q !== undefined && ['skip', 'holdup', 'again', 'echo', 'refrain'].includes(actionAt(s, x.q, x.i).key);
    while (s.round === 1) {
      let next = chooseBotMove(s, rand);
      const o = s.pending?.options?.find(x => x.id === next.option);
      const alt = o && moves(o) && s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !moves(x));
      if (alt) next = { player: next.player, option: alt.id };
      if (s.pending?.kind === 'place' && !next.option.startsWith('use:')) placed.push(s.pending.player); // a member's use isn't a placement
      s = applyMove(s, next);
    }
    const L = p => 'ABCD'[base.indexOf(p)];
    expect(placed.filter(p => p === A).length).toBe(3);
    expect(placed.length).toBe(12);
    expect(placed.at(-1)).toBe(A);
    expect(placed.map(L).join(' ')).toMatch(/^A B C D D C B A B C D A$/);
  });
});
