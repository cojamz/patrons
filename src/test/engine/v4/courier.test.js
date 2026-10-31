// @vitest-environment node
// Courier (Cory, 2026-10-29): "Whenever you take two turns in a row, +1 of each other color." It pays on Right Away,
// Crunch Time, a snake turnaround and a minion placed right after your turn; it never paid on Right Away before
// ("courier doesnt seem to work right").
import { describe, it, expect } from 'vitest';
import { take, move } from './helpers.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { sceneQ, settle, passBuys } from './cards-helpers.js';

const rich = { purple: 9, green: 9, gold: 9, red: 9 };
const scene = (queue, round = 2) => sceneQ({ quadrants: ['purple', 'echo', 'gold', 'red'], n: 3, round, res: [rich, rich, rich], members: [['purple.courier']],
  queue: queue.map(p => ({ t: 'turn', p })).concat({ t: 'allPlaced' }) });
const plain = s => {
  const o = s.pending.options.find(x => x.kind === 'slot' && ['gold', 'red'].includes(s.quadrants[x.q])) || s.pending.options.find(x => x.kind === 'slot');
  return passBuys(settle(move(s, o.id)));
};
const paid = s => s.log.filter(l => /^P1's Courier: /.test(l));

describe('Courier', () => {
  it('reads as decided', () => {
    const s = scene([0, 1, 2]);
    const c = Object.values(s.cards).find(x => x.def === 'purple.courier');
    expect(s.players[0].members).toContain(c.uid);
    expect(quadrant('purple').members.find(d => d.id === 'purple.courier' || d.key === 'courier')?.text).toBe('Whenever you take two turns in a row, +1 of each other color.');
  });
  it('Right Away: your next turn comes now, and Courier pays +1 of each other color', () => {
    let s = scene([0, 1, 2, 2, 1, 0]);
    s = passBuys(settle(take(s, 'purple.again')));
    expect(s.pending).toMatchObject({ kind: 'place', player: 0 });
    expect(paid(s)).toEqual(["P1's Courier: +1 green, +1 gold, +1 red."]);
    expect(s.players[0].res).toMatchObject({ green: 10, gold: 10, red: 10 });
  });
  it('Crunch Time pays twice: two turns, each one right after your last', () => {
    let s = scene([0, 1, 2, 2, 1, 0, 0, 1, 2]);
    s = passBuys(settle(take(s, 'purple.rally')));
    s = plain(s);
    expect(paid(s)).toHaveLength(2);
  });
  it('a snake turnaround pays: you place twice in a row', () => {
    let s = scene([1, 2, 0, 0, 2, 1]);
    s = plain(s); s = plain(s); // P2, P3
    expect(paid(s)).toHaveLength(0);
    s = plain(s); // P1's first; the next is P1's again
    expect(paid(s)).toHaveLength(1);
  });
  it('a plain turn after a rival pays nothing', () => {
    let s = scene([0, 1, 2, 2, 1, 0]);
    s = plain(s);
    expect(paid(s)).toHaveLength(0);
  });
});
