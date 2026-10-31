// @vitest-environment node
// Right Away (Purple, round I; Cory, 2026-10-22): "+1 purple, take another turn right after this one". Cory's yes:
// the second placement uses one of your own minions, so you place the same number that round. Round I, A B C D:
// A takes it on their first turn, places again right away, then B C D D C B A B C D (A's last turn came up).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, actionAt } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';

const Q = ['gold', 'red', 'purple', 'echo'];
const MOVES = ['skip', 'holdup', 'again'];
/** A bot move that takes a space moving turns only when nothing else is open, so the rest is the plain snake. */
function plain(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  const moves = x => x.kind === 'slot' && x.q !== undefined && MOVES.includes(actionAt(s, x.q, x.i).key);
  const alt = o && moves(o) && s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !moves(x));
  return alt ? { player: m.player, option: alt.id } : m;
}

describe('Right Away', () => {
  it("round I, 4 players: +1 purple, A places again at once, and still places 3 in all", () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 1, quadrants: Q });
    const rand = seededRandom(1);
    while (!(s.round === 1 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    const base = s.order.slice(0, 4), A = s.pending.player;
    const i = quadrant('purple').actions.findIndex(a => a.key === 'again');
    expect(quadrant('purple').actions[i].text).toBe('+1 purple (+2 in round II, +3 in round III). Your next turn comes right after this one.');
    const before = s.players[A].res.purple || 0;
    s = applyMove(s, { player: A, option: `slot:${s.quadrants.indexOf('purple')}-${i}` });
    expect(s.players[A].res.purple).toBe(before + 1);
    const placed = [A];
    while (s.round === 1) {
      const next = plain(s, rand);
      if (s.pending?.kind === 'place') placed.push(s.pending.player);
      s = applyMove(s, next);
    }
    const L = p => 'ABCD'[base.indexOf(p)];
    expect(placed.map(L).join(' ')).toBe('A A B C D D C B A B C D');
  });
});
