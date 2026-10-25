// @vitest-environment node
// Last Call (Purple, round II; Cory, 2026-10-22): "+2 followers per minion you have left" for taking "the remainder
// of your turns when others are out of minions". Round II, 4 players, A B C D D C B A A B C D D C B A: B takes it on
// their first turn with 3 minions left: +6 followers; A C D place all theirs, then B places 3 in a row.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, actionAt, followers } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant } from '../../../engine/v4/index.js';
import { sceneQ } from './cards-helpers.js';
import { take } from './helpers.js';

const Q = ['gold', 'red', 'purple', 'echo'];
const MOVES = ['skip', 'holdup', 'again', 'rally', 'lastcall'];
function plain(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  const moves = x => x.kind === 'slot' && x.q !== undefined && MOVES.includes(actionAt(s, x.q, x.i).key);
  const alt = o && moves(o) && s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && !moves(x));
  return alt ? { player: m.player, option: alt.id } : m;
}

describe('Last Call', () => {
  it('round II, 4 players: B on their first turn gets +6 followers and places their other 3 after everyone', () => {
    // seed 7 since Gather's +3 (Oct 25; seed 11 since the Oct 24 member structure) (seed 6 since Even Swap's +2 red): on other seeds a second bot took Last Call too
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 7, quadrants: Q });
    const rand = seededRandom(7);
    while (!(s.round === 2 && s.pending?.kind === 'place')) s = applyMove(s, plain(s, rand));
    const base = s.order.slice(0, 4), [A, B] = base;
    const placed = [];
    while (!(s.pending?.kind === 'place' && s.pending.player === B)) { if (s.pending?.kind === 'place') placed.push(s.pending.player); s = applyMove(s, plain(s, rand)); }
    placed.push(B);
    const i = quadrant('purple').actions.findIndex(a => a.key === 'lastcall');
    const f0 = followers(s, s.players[B]), p0 = s.players[B].res.purple || 0;
    s = applyMove(s, { player: B, option: `slot:${s.quadrants.indexOf('purple')}-${i}` });
    expect(followers(s, s.players[B])).toBe(f0 + 6);
    expect(s.players[B].res.purple).toBe(p0 + 1);
    while (s.round === 2) {
      const next = plain(s, rand);
      if (s.pending?.kind === 'place') placed.push(s.pending.player);
      s = applyMove(s, next);
    }
    const L = p => 'ABCD'[base.indexOf(p)];
    // everyone else places all 4, then B places the rest in a row (more than 3 if a bought member adds one)
    expect(placed.map(L).join(' ').startsWith('A B C D D C A A C D D C A B B B')).toBe(true);
    expect(placed.slice(13).every(p => p === B)).toBe(true);
  });

  it('with your last minion: +1 purple and nothing else', () => {
    const s = take(sceneQ({ quadrants: Q, round: 2, left: 1, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] }), 'purple.lastcall');
    expect(s.players[0].res.purple).toBe(1);
    expect(s.players[0].bonus).toBe(0);
  });
});
