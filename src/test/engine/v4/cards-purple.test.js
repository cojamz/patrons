// @vitest-environment node
// Card-by-card: every Purple action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number (an extra turn is a number too: workers this round). Plus a cross-sphere case each.
import { describe, it, expect } from 'vitest';
import { followers, turnRail } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, linesNaming, passBuys } from './cards-helpers.js';

const Q = ['gold', 'red', 'purple', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const P = (s, i = 0) => s.players[i].res.purple;
const rich = { gold: 30, red: 30, purple: 30, green: 30 };
// extra turns this round: workers left beyond the 3 the scene starts with, less those placed
const turnsQueued = (s, id, placed = id === s.current || id === 0 ? 1 : 0) => s.players[id].left - (3 - placed);

describe('Purple actions', () => {
  it('Clock In 4 / 5 / 6; Catch Up +1 and +1 per rival who has placed more this round; Roll Call +1 per worker on the board', () => {
    for (const r of [1, 2, 3]) expect(P(take(sc({ round: r }), 'purple.hourly'))).toBe(3 + r);
    // P2 placed 2, P3 placed 1, P1 none before this one: both ahead
    expect(P(take(sc({ n: 3, slots: { '0-0': 1, '0-1': 1, '0-2': 2 } }), 'purple.catchup'))).toBe(1 + 2);
    // P1 placed 1 before this one, P2 1, P3 2: only P3 ahead (P1's landing minion doesn't count against it)
    expect(P(take(sc({ n: 3, slots: { '0-0': 0, '0-1': 1, '0-2': 2, '1-0': 2 } }), 'purple.catchup'))).toBe(1 + 1);
    expect(P(take(sc(), 'purple.catchup'))).toBe(1); // the +1 always
    expect(P(take(sc({ slots: { '0-0': 0, '0-1': 0 } }), 'purple.windup'))).toBe(3);
  });
  it('Plan Ahead: +1 purple per minion you have left to place this round', () => {
    expect(P(take(sc({ round: 2 }), 'purple.planahead'))).toBe(2); // 3 minions, this one placed: 2 left
    expect(P(take(sc({ round: 3, left: 5 }), 'purple.planahead'))).toBe(4);
  });
  it('Overtime: 1 extra turn right after this one, free; Crunch Time: your next 2 turns right away, free, no new minion', () => {
    for (const held of [0, 7, 8]) {
      const s = take(sc({ round: 2, res: [{ purple: held }] }), 'purple.overtime');
      expect(P(s)).toBe(held);
      expect(turnsQueued(s, 0)).toBe(1);
    }
    const r = s => turnRail(s), upcoming = s => [...r(s).done, ...(r(s).current != null ? [r(s).current] : []), ...r(s).next].slice(1);
    for (const held of [0, 3, 4, 12]) {
      const s = take(sc({ round: 3, res: [{ purple: held }], queue: [0, 1, 0, 1, 0].map(p => ({ t: 'turn', p })) }), 'purple.rally');
      expect(P(s)).toBe(held);
      expect(turnsQueued(s, 0)).toBe(0); // no extra minion
      expect(upcoming(s)).toEqual([0, 0, 1, 1]);
      expect(named(s, 'Crunch Time')[0]).toBe("P1's Crunch Time: P1 takes their next 2 turns now.");
    }
  });
});

describe('Purple members', () => {
  it('Go-Getter: once per game, an extra turn right after this one; the log names Go-Getter', () => {
    let s = sc({ round: 2, members: [['purple.secondwind']] }); // no extra minions in round I
    s = take(s, 'purple.hourly');
    s = move(s, `use:${uidOf(s, 'purple.secondwind', 0)}`);
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Go-Getter')).toHaveLength(1);
  });
  it('Go-Getter × Foreman: the extra turn pays Foreman, named', () => {
    let s = sc({ round: 2, members: [['purple.secondwind', 'purple.foreman']] });
    s = take(s, 'purple.hourly');
    s = move(s, `use:${uidOf(s, 'purple.secondwind', 0)}`);
    expect(P(s)).toBe(5 + 1); // Clock In +5 in round II
    expect(named(s, 'Foreman')[0]).toMatch(/P1's Foreman: \+1 purple/);
  });

  it('Errand Runner: when recruited, an extra turn right after this one; named', () => {
    let s = sc({ round: 2, res: [rich], shop: ['purple.errand'] });
    s = take(s, 'purple.hourly'); s = buy(s, 'purple.errand');
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Errand Runner')).toHaveLength(1);
  });
  it('Errand Runner × a rival’s Overseer: it reacts to the extra turn, named', () => {
    let s = sc({ round: 2, res: [rich, { purple: 6 }], members: [[], ['purple.overseer']], shop: ['purple.errand'] });
    s = take(s, 'purple.hourly'); s = buy(s, 'purple.errand');
    expect(P(s, 1)).toBe(6 + 3);
    expect(named(s, 'Overseer')[0]).toMatch(/P2's Overseer: \+3 purple/);
  });

  it('Taskmaster: once per round, pay 5 purple for an extra turn; named', () => {
    let s = sc({ round: 2, res: [{ purple: 7 }], members: [['purple.taskmaster']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'purple.taskmaster', 0)}`);
    expect(P(s)).toBe(2);
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Taskmaster')).toHaveLength(1);
    expect(s.pending.options.some(o => o.id.startsWith('use:'))).toBe(false);
  });
  it('Taskmaster × Corner-Cutter: costs 3, and the log says Corner-Cutter halved it', () => {
    let s = sc({ round: 2, res: [{ purple: 7 }], members: [['purple.taskmaster', 'purple.doubletime']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'purple.taskmaster', 0)}`);
    expect(P(s)).toBe(4);
    expect(named(s, 'Corner-Cutter')).toHaveLength(1);
  });

  it('Late Riser: from round II, the trailing player (ties count) takes a turn before anyone, even a Front-runner', () => {
    const s = sc({ bonus: [0, 5], members: [['purple.lateriser'], ['benders.frontrunner']], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.player).toBe(0);
    expect(named(s, 'Late Riser')).toHaveLength(1);
    expect(named(s, 'Front-runner')).toHaveLength(1);
    expect(s.players[0].left).toBe(5);
  });

  // Crunch Time moves your own turns up: they aren't extra turns, so none of these fire for it
  const crunch = o => take(sc({ round: 3, queue: [0, 1, 0, 1, 0].map(p => ({ t: 'turn', p })), ...o }), 'purple.rally');
  it('Foreman: +1 purple per worker on the board whenever you take an extra turn (Overtime), named; not on Crunch Time', () => {
    const s = take(sc({ round: 3, members: [['purple.foreman']], slots: { '0-0': 0 } }), 'purple.overtime');
    expect(P(s)).toBe(2);
    expect(named(s, 'Foreman')).toHaveLength(1);
    const t = crunch({ members: [['purple.foreman']], slots: { '0-0': 0 } });
    expect(P(t)).toBe(0);
    expect(named(t, 'Foreman')).toHaveLength(0);
  });
  it('Courier: +1 of each other color per extra turn, named; Midas leaves member income alone; not on Crunch Time', () => {
    const s = take(sc({ round: 3, members: [['purple.courier', 'gold.midas']] }), 'purple.overtime');
    expect(s.players[0].res).toEqual({ gold: 1, red: 1, purple: 0, green: 1 });
    expect(named(s, 'Courier')[0]).toMatch(/P1's Courier: \+1 gold, \+1 red, \+1 green/);
    expect(crunch({ members: [['purple.courier']] }).players[0].res).toEqual({ gold: 0, red: 0, purple: 0, green: 0 });
  });
  it('Apprentice: each extra turn makes your next member 4 cheaper, named; not on Crunch Time', () => {
    const s = take(sc({ round: 3, members: [['purple.apprentice']] }), 'purple.overtime');
    expect(s.players[0].discount).toBe(4);
    expect(named(s, 'Apprentice')[0]).toMatch(/next member costs 4 less/);
    expect(crunch({ members: [['purple.apprentice']] }).players[0].discount).toBe(0);
  });
  it('Overseer: half your purple, up to 4, when a rival takes an extra turn (capped), named; not on Crunch Time', () => {
    const s = take(sc({ round: 3, res: [{}, { purple: 11 }], members: [[], ['purple.overseer']] }), 'purple.overtime');
    expect(P(s, 1)).toBe(11 + 4);
    expect(named(s, 'Overseer')).toHaveLength(1);
    const t = crunch({ res: [{}, { purple: 11 }], members: [[], ['purple.overseer']] });
    expect(P(t, 1)).toBe(11);
    expect(named(t, 'Overseer')).toHaveLength(0);
  });
  it('Corner-Cutter: Overtime is free, so nothing to halve and no Corner-Cutter line; a Doppelganger copy does not crash', () => {
    let s = take(sc({ round: 2, res: [{ purple: 8 }], members: [['purple.doubletime']] }), 'purple.overtime');
    expect(P(s)).toBe(8);
    expect(turnsQueued(s, 0)).toBe(1);
    expect(named(s, 'Corner-Cutter')).toHaveLength(0);
    s = sc({ round: 3, res: [{ purple: 8 }], members: [['purple.doubletime', 'echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'purple.doubletime';
    s = take(s, 'purple.rally');
    expect(P(s)).toBe(8);
    expect(turnsQueued(s, 0)).toBe(0); // Crunch Time adds no turn (and here P1 has none left to bring forward)
    expect(named(s, 'Corner-Cutter')).toHaveLength(0);
  });
  it('Bookkeeper when your last turn of the round ends (after its buy; Cory 2026-10-15), not at round end; Clockmaker and Lamplighter at round start; all named', () => {
    let s = sc({ res: [{ purple: 5 }], members: [['purple.bookkeeper']], slots: { '0-0': 0, '0-1': 0, '0-2': 0 }, queue: [{ t: 'endRound' }] });
    expect(P(s)).toBe(5);
    s = take(sc({ left: 1, res: [{ purple: 5 }], members: [['purple.bookkeeper']], slots: { '0-0': 0, '0-1': 0, '0-2': 0 } }), 'red.turnout');
    expect(P(s)).toBe(5); // its last worker landed; the turn isn't over until its buy
    s = passBuys(s);
    expect(P(s)).toBe(5 + 2); // the turn ends: 4 workers on the board → +1 per 2
    expect(named(s, 'Bookkeeper')).toHaveLength(1);
    s = sc({ res: [{ purple: 7 }], members: [['purple.clockmaker']], queue: [{ t: 'round', r: 2 }] });
    expect(P(s)).toBe(7 + 3); // +1 per 2 purple held
    expect(named(s, 'Clockmaker')).toHaveLength(1);
    s = sc({ members: [['purple.lamplighter']], queue: [{ t: 'round', r: 3 }] });
    expect(P(s)).toBe(5);
    expect(named(s, 'Lamplighter')).toHaveLength(1);
  });
  it('Lamplighter × Extra Hand: every minion you get counts, 6 in round III (Cory 2026-10-15)', () => {
    const s = sc({ members: [['purple.lamplighter', 'benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    expect(s.players[0].left).toBe(6);
    expect(P(s)).toBe(6);
  });
  it('Timekeeper: game end +1 follower per 3 purple, in the final parts', () => {
    const s = sc({ res: [{ purple: 7 }], members: [['purple.patience']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Timekeeper +2']);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 2);
  });
});
