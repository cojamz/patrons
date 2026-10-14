// @vitest-environment node
// Night Owl (Purple, Relay's slot): "When you place your last minion of a round, take an extra turn right after this one."
// Through real moves: it fires on the last minion only, gives exactly one extra turn (before the next player), never
// fires twice in a round (its own extra turn is a "last minion" too), and gives nothing when the board has no space to
// spare (the glossary's extra-turn rule). Price: design/eval/purple-members.md (member-value sim, 8+2).
import { describe, it, expect } from 'vitest';
import { defById } from '../../../engine/v4/content/index.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, linesNaming, spaceOf } from './cards-helpers.js';

const Q = ['gold', 'red', 'purple', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const owl = s => linesNaming(s.log, 'Night Owl');
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
/** Pass every buy step; who places next (undefined when nobody does). */
function nextPlacer(s) {
  while (s.pending && s.pending.kind !== 'place') s = move(s, 'pass');
  return { s, who: s.pending?.player };
}
const queuedTurns = (s, id) => s.queue.filter(t => t.t === 'turn' && t.p === id).length;

describe('Night Owl', () => {
  it('is printed as decided: 8 purple + 2 any, worth 1 follower, the house text', () => {
    const d = defById('purple.nightowl');
    expect([d.s, d.w, d.f]).toEqual([8, 2, 1]);
    expect(d.text).toBe('When you place your last minion of a round, take an extra turn right after this one.');
  });

  it('does nothing on a minion that is not your last', () => {
    const s = take(sc({ round: 2, left: 3, members: [['purple.nightowl']], queue: turns(0, 1) }), 'Hourly');
    expect(s.players[0].left).toBe(2);
    expect(owl(s)).toEqual([]);
  });

  it('fires on your last minion of the round: one extra turn, right after this one (before the next player), named', () => {
    let s = take(sc({ round: 2, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) }), 'Hourly');
    expect(s.players[0].left).toBe(1);
    expect(owl(s)).toEqual(["P1's Night Owl: P1 takes an extra turn."]);
    expect(queuedTurns(s, 0)).toBe(1);
    const next = nextPlacer(s);
    expect(next.who).toBe(0);
  });

  it('does not fire twice: the extra turn places your last minion again, and nothing more comes of it', () => {
    let s = take(sc({ round: 2, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) }), 'Hourly');
    ({ s } = nextPlacer(s));
    s = take(s, 'Wind-up'); // the extra turn's minion: the last again
    expect(s.players[0].left).toBe(0);
    expect(owl(s)).toHaveLength(1);
    expect(queuedTurns(s, 0)).toBe(0);
    expect(nextPlacer(s).who).toBe(1);
  });

  it('fires again in the next round (once per round, not once per game)', () => {
    let s = sc({ round: 3, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) });
    s.cards[uidOf(s, 'purple.nightowl', 0)].owlRound = 2; // it fired last round
    s = take(s, 'Hourly');
    expect(owl(s)).toEqual(["P1's Night Owl: P1 takes an extra turn."]);
    expect(s.players[0].left).toBe(1);
  });

  it('gives no extra turn when the board has no space to spare, says so, and does not try again that round', () => {
    // round I, two players: every space taken but two, and P2 still has a turn to come
    const probe = sc({});
    const free = [spaceOf(probe, 'Hourly'), spaceOf(probe, 'Rush')];
    const slots = Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => !free.includes(k)).map(k => [k, 1]));
    let s = take(sc({ round: 1, left: 1, slots, members: [['purple.nightowl']], queue: turns(0, 1) }), 'Hourly');
    expect(s.players[0].left).toBe(0);
    expect(queuedTurns(s, 0)).toBe(0);
    expect(s.log).toContain('No space to spare: P1 gets no extra turn from Night Owl.');
    expect(nextPlacer(s).who).toBe(1);
  });

  it('× Foreman: the Night Owl turn is an extra turn like any other, so Foreman pays, named', () => {
    const s = take(sc({ round: 2, left: 1, slots: { '0-0': 0, '0-1': 0 }, members: [['purple.nightowl', 'purple.foreman']], queue: turns(0, 1) }), 'Hourly');
    // Hourly +5 in round II, then Foreman: +1 per minion on the board (3)
    expect(s.players[0].res.purple).toBe(5 + 3);
    expect(linesNaming(s.log, 'Foreman')).toHaveLength(1);
  });
});
