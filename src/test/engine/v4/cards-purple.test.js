// @vitest-environment node
// Card-by-card: every Purple action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number (an extra turn is a number too: workers this round). Plus a cross-sphere case each.
import { describe, it, expect } from 'vitest';
import { followers, resume } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, passBuys, linesNaming, settle } from './cards-helpers.js';

const Q = ['gold', 'red', 'purple', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const P = (s, i = 0) => s.players[i].res.purple;
const rich = { gold: 30, red: 30, purple: 30, green: 30 };
// extra turns this round: workers left beyond the 3 the scene starts with, less those placed
const turnsQueued = (s, id, placed = id === s.current || id === 0 ? 1 : 0) => s.players[id].left - (3 - placed);

describe('Purple actions', () => {
  it('Hourly 4 / 5 / 6; Catch Up +1 and +2 per rival ahead on the board; Wind-up +1 per worker on the board', () => {
    for (const r of [1, 2, 3]) expect(P(take(sc({ round: r }), 'Hourly'))).toBe(3 + r);
    expect(P(take(sc({ n: 3, slots: { '0-0': 1, '0-1': 1, '0-2': 2 } }), 'Catch Up'))).toBe(1 + 2);
    expect(P(take(sc({ slots: { '0-0': 0, '0-1': 0 } }), 'Wind-up'))).toBe(3);
  });
  it('Linger: moves a worker from another color’s outer/middle space to an open space and does it', () => {
    let s = sc({ round: 2, slots: { '0-0': 0 } });
    s = take(s, 'Linger');
    expect(s.pending.options.map(o => o.id)).toEqual(['from:0-0']);
    s = move(s, 'from:0-0');
    s = move(s, 'to:0-1'); // Rush
    expect(s.slots['0-0']).toBeUndefined();
    expect(s.slots['0-1']).toBe(0);
    expect(s.players[0].res.gold).toBe(4);
  });
  it('Overtime / Rally: pay 6 / 5 purple for an extra turn right after this one; else +2 / +3 purple', () => {
    let s = take(sc({ round: 2, res: [{ purple: 6 }] }), 'Overtime');
    expect(P(s)).toBe(0);
    expect(turnsQueued(s, 0)).toBe(1);
    s = take(sc({ round: 2, res: [{ purple: 5 }] }), 'Overtime');
    expect(P(s)).toBe(7);
    s = take(sc({ round: 3, res: [{ purple: 4 }] }), 'Rally');
    expect(P(s)).toBe(7);
  });
});

describe('Purple members', () => {
  it('Second Wind: once per game, an extra turn right after this one; the log names Second Wind', () => {
    let s = sc({ members: [['purple.secondwind']] });
    s = take(s, 'Hourly');
    s = move(s, `use:${uidOf(s, 'purple.secondwind', 0)}`);
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Second Wind')).toHaveLength(1);
  });
  it('Second Wind × Foreman: the extra turn pays Foreman, named', () => {
    let s = sc({ members: [['purple.secondwind', 'purple.foreman']] });
    s = take(s, 'Hourly');
    s = move(s, `use:${uidOf(s, 'purple.secondwind', 0)}`);
    expect(P(s)).toBe(4 + 1);
    expect(named(s, 'Foreman')[0]).toMatch(/P1's Foreman: \+1 purple/);
  });

  it('Errand Runner: when recruited, an extra turn right after this one; named', () => {
    let s = sc({ res: [rich], shop: ['purple.errand'] });
    s = take(s, 'Hourly'); s = buy(s, 'purple.errand');
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Errand Runner')).toHaveLength(1);
  });
  it('Errand Runner × a rival’s Overseer and Relay: they react to the extra turn, named', () => {
    let s = sc({ res: [rich, { purple: 6 }], members: [[], ['purple.overseer', 'purple.relay']], shop: ['purple.errand'] });
    s = take(s, 'Hourly'); s = buy(s, 'purple.errand');
    expect(P(s, 1)).toBe(6 + 3);
    expect(named(s, 'Overseer')[0]).toMatch(/P2's Overseer: \+3 purple/);
    expect(s.pending.player).toBe(1); // Relay asks
    s = move(s, 'yes');
    expect(P(s, 1)).toBe(9 - 3);
    expect(named(s, 'Relay')).toHaveLength(1);
    expect(turnsQueued(s, 1)).toBe(1);
  });

  it('Taskmaster: once per round, pay 5 purple for an extra turn; named', () => {
    let s = sc({ round: 2, res: [{ purple: 7 }], members: [['purple.taskmaster']] });
    s = take(s, 'Rush');
    s = move(s, `use:${uidOf(s, 'purple.taskmaster', 0)}`);
    expect(P(s)).toBe(2);
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Taskmaster')).toHaveLength(1);
    expect(s.pending.options.some(o => o.id.startsWith('use:'))).toBe(false);
  });
  it('Taskmaster × Double Time: costs 3, and the log says Double Time halved it', () => {
    let s = sc({ round: 2, res: [{ purple: 7 }], members: [['purple.taskmaster', 'purple.doubletime']] });
    s = take(s, 'Rush');
    s = move(s, `use:${uidOf(s, 'purple.taskmaster', 0)}`);
    expect(P(s)).toBe(4);
    expect(named(s, 'Double Time')).toHaveLength(1);
  });

  it('Late Riser: from round II, the trailing player (ties count) takes a turn before anyone, even a Front-runner', () => {
    const s = sc({ bonus: [0, 5], members: [['purple.lateriser'], ['benders.frontrunner']], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.player).toBe(0);
    expect(named(s, 'Late Riser')).toHaveLength(1);
    expect(named(s, 'Front-runner')).toHaveLength(1);
    expect(s.players[0].left).toBe(5);
  });

  it('Foreman: +1 purple per worker on the board whenever you take an extra turn (Overtime), named', () => {
    const s = take(sc({ round: 2, res: [{ purple: 6 }], members: [['purple.foreman']], slots: { '0-0': 0 } }), 'Overtime');
    expect(P(s)).toBe(2);
    expect(named(s, 'Foreman')).toHaveLength(1);
  });
  it('Courier: +1 of each other color per extra turn, named; Midas leaves member income alone', () => {
    const s = take(sc({ round: 2, res: [{ purple: 6 }], members: [['purple.courier', 'gold.midas']] }), 'Overtime');
    expect(s.players[0].res).toEqual({ gold: 1, red: 1, purple: 0, green: 1 });
    expect(named(s, 'Courier')[0]).toMatch(/P1's Courier: \+1 gold, \+1 red, \+1 green/);
  });
  it('Apprentice: an extra turn makes your next member 4 cheaper, named', () => {
    const s = take(sc({ round: 2, res: [{ purple: 6 }], members: [['purple.apprentice']] }), 'Overtime');
    expect(s.players[0].discount).toBe(4);
    expect(named(s, 'Apprentice')[0]).toMatch(/next member costs 4 less/);
  });
  it('Overseer: half your purple, up to 4, when a rival takes an extra turn (capped), named', () => {
    const s = take(sc({ round: 2, res: [{ purple: 6 }, { purple: 11 }], members: [[], ['purple.overseer']] }), 'Overtime');
    expect(P(s, 1)).toBe(15);
    expect(named(s, 'Overseer')).toHaveLength(1);
  });
  it('Double Time: Overtime costs 3; the log names Double Time; a Doppelganger copy does not halve again', () => {
    let s = take(sc({ round: 2, res: [{ purple: 6 }], members: [['purple.doubletime']] }), 'Overtime');
    expect(P(s)).toBe(3);
    expect(named(s, 'Double Time')).toHaveLength(1);
    s = sc({ round: 2, res: [{ purple: 6 }], members: [['purple.doubletime', 'red.doppel']] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'purple.doubletime';
    expect(P(take(s, 'Overtime'))).toBe(3);
  });
  it('Bookkeeper / Clockmaker at round end; Lamplighter at round start; all named', () => {
    let s = sc({ res: [{ purple: 5 }], members: [['purple.bookkeeper', 'purple.clockmaker']], slots: { '0-0': 0, '0-1': 0, '0-2': 0 }, queue: [{ t: 'endRound' }] });
    // Bookkeeper +1 (3 workers), then Clockmaker on 6 → +3
    expect(P(s)).toBe(9);
    expect(named(s, 'Bookkeeper')).toHaveLength(1);
    expect(named(s, 'Clockmaker')).toHaveLength(1);
    s = sc({ members: [['purple.lamplighter']], queue: [{ t: 'round', r: 3 }] });
    expect(P(s)).toBe(5);
    expect(named(s, 'Lamplighter')).toHaveLength(1);
  });
  it('Lamplighter × Extra Hand: still the printed 5 in round III (see ledger question)', () => {
    const s = sc({ members: [['purple.lamplighter', 'benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    expect(s.players[0].left).toBe(6);
    expect(P(s)).toBe(5);
  });
  it('Patience: game end +1 follower per 3 purple, in the final parts', () => {
    const s = sc({ res: [{ purple: 7 }], members: [['purple.patience']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Patience +2']);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 2);
  });
  it('Relay: saying no spends nothing; once per round', () => {
    let s = take(sc({ round: 2, res: [{ purple: 12 }, { purple: 9 }], members: [[], ['purple.relay']] }), 'Overtime');
    s = move(s, 'no');
    expect(P(s, 1)).toBe(9);
    expect(turnsQueued(s, 1)).toBe(0);
    void resume; void passBuys; void settle;
  });
});
