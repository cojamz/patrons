// @vitest-environment node
// Hold Up (Purple, round I; Cory, 2026-10-22): the rival skip in Catch Up's spot, "1 purple per round". The rival you
// pick is passed over once and the snake carries on: they still place every minion, their last one after everyone.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, actionAt } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';
import { sceneQ } from './cards-helpers.js';
import { take } from './helpers.js';

const Q = ['gold', 'red', 'purple', 'echo'];
/** A bot move that takes a space moving turns (Sleep In, Hold Up) only when it is the last one open: round I fills
 *  every space, and Sleep In on the round's last placement has no turn left to skip. */
function plain(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  const moves = x => x.kind === 'slot' && x.q !== undefined && ['skip', 'holdup'].includes(actionAt(s, x.q, x.i).key);
  const alt = o && moves(o) && s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !moves(x));
  return alt ? { player: m.player, option: alt.id } : m;
}

describe('Hold Up', () => {
  it('round I, 4 players: A holds up D; D is passed over once and still places all 3, the last one after everyone', () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 3, quadrants: Q });
    const rand = seededRandom(3);
    while (!(s.round === 1 && s.pending?.kind === 'place')) s = applyMove(s, chooseBotMove(s, rand));
    const base = s.order.slice(0, 4);
    const [A, , , D] = base, q = s.quadrants.indexOf('purple');
    const i = quadrant('purple').actions.findIndex(a => a.key === 'holdup');
    const before = s.players[A].res.purple || 0;
    s = applyMove(s, { player: A, option: `slot:${q}-${i}` });
    expect(s.players[A].res.purple).toBe(before + 1);
    expect(s.pending.kind).toBe('choose');
    s = applyMove(s, { player: A, option: `player:${D}` });
    expect(s.log).toContain(`P${A + 1}'s Hold Up: P${D + 1} skips their next turn.`);
    const placed = [A];
    while (s.round === 1) {
      const next = plain(s, rand);
      if (s.pending?.kind === 'place') placed.push(s.pending.player);
      s = applyMove(s, next);
    }
    const L = p => 'ABCD'[base.indexOf(p)];
    expect(placed.length).toBe(12);
    expect(placed.filter(p => p === D).length).toBe(3);
    expect(placed.map(L).join(' ')).toBe('A B C D C B A A B C D D');
  });

  it('+2 purple in round II, +3 in round III', () => {
    for (const round of [2, 3]) {
      const s = take(sceneQ({ quadrants: Q, round, queue: [0, 1, 0, 1].map(p => ({ t: 'turn', p })) }), 'purple.holdup');
      expect(s.players[0].res.purple).toBe(round);
    }
  });

  it('no rival with a turn left: the purple, and the log says so', () => {
    const s = take(sceneQ({ quadrants: Q, round: 2, queue: [{ t: 'turn', p: 0 }] }), 'purple.holdup');
    expect(s.players[0].res.purple).toBe(2);
    expect(s.log).toContain("P1's Hold Up: no rival has a turn left to skip this round.");
  });
});
