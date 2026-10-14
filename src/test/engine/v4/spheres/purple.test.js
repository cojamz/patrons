// @vitest-environment node
// Purple (extra turns): every action and every member with exact numbers, plus 200 seeded bot games on a Purple table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import purple, { onBoard, spareSpace } from '../../../../engine/v4/content/purple.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (the fast gate plays 20; budget.js)
const GAMES = games(200);

registerQuadrant(purple);
const Q = ['gold', 'red', 'purple', 'green'];

const PURPLE_TEST_COSTS = {
  'purple.secondwind': [4, 2], 'purple.errand': [2, 2], 'purple.taskmaster': [2, 1], 'purple.lateriser': [3, 2],
  'purple.foreman': [1, 1], 'purple.courier': [1, 1], 'purple.apprentice': [1, 1], 'purple.overseer': [1, 1],
  'purple.doubletime': [2, 1], 'purple.bookkeeper': [1, 1], 'purple.clockmaker': [2, 1], 'purple.lamplighter': [1, 0],
  'purple.patience': [3, 2], 'purple.crew': [1, 1],
};
let restore;
beforeEach(() => {
  const base = Object.fromEntries(Object.entries(TEST_COSTS).filter(([k]) => !k.startsWith('blue.')));
  restore = pinCosts({ ...base, ...PURPLE_TEST_COSTS });
});
afterEach(() => restore());

function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], queue = null, slots = {} } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q });
  s.queue = []; s.pending = null; s.round = round; s.slots = { ...slots }; s.order = []; s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = 3;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: 0 }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
const nextPlacer = s => { while (s.pending && s.pending.kind !== 'place') s = pass(s); return s.pending?.player; };
const JV = '0-0', RUSH = '0-1', HIRE = '1-2';
const OT_COST = 8; // Overtime: this much purple for 2 extra turns
// every round-I space but the ones named, taken by P2
const fullRoundI = (...free) => Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => !free.includes(k)).map(k => [k, 1]));

describe('Purple scoring: most purple', () => {
  it('most purple at round end takes the ring; ties all score; none scores nothing', () => {
    // workers on the board don't count any more (Claude, 2026-10-14: they almost always tied)
    const s = scene({ res: [{ purple: 2 }, { purple: 3 }], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 1 }, queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most purple: P2 +2');
    const t = scene({ res: [{ purple: 4 }, { purple: 4 }], queue: [{ t: 'endRound' }] });
    expect(t.log.at(-1)).toContain('Most purple: P1 & P2 +2');
    const u = scene({ res: [{ purple: 0 }, { purple: 0 }], queue: [{ t: 'endRound' }] });
    expect(u.log.at(-1)).not.toContain('Most purple');
  });
  it('counts the purple you hold now', () => {
    const s = scene({ res: [{ purple: 7 }], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 1 } });
    expect(purple.scoring.score(contextFor(s), s.players[0])).toBe(7);
    expect(purple.scoring.score(contextFor(s), s.players[1])).toBe(0);
    expect(onBoard(contextFor(s), s.players[0])).toBe(2); // still used by Catch Up, Wind-up, Foreman, Bookkeeper
  });
});

describe('Purple actions', () => {
  it('Hourly: +4 / +5 / +6 purple, by round', () => {
    expect(R(take(scene(), 'Hourly')).purple).toBe(4);
    expect(R(take(scene({ round: 2 }), 'Hourly')).purple).toBe(5);
    expect(R(take(scene({ round: 3 }), 'Hourly')).purple).toBe(6);
  });
  it('Catch Up: +1 purple, +2 per rival with more workers on the board', () => {
    expect(R(take(scene({ n: 3, slots: { [RUSH]: 1, [HIRE]: 1, '1-0': 2, '1-1': 2 } }), 'Catch Up')).purple).toBe(5);
    expect(R(take(scene({ n: 3, slots: { [RUSH]: 1, [HIRE]: 2 } }), 'Catch Up')).purple).toBe(1); // equal counts don't pay
  });
  it('Wind-up: +1 purple per worker you have on the board, this one included', () => {
    expect(R(take(scene(), 'Wind-up')).purple).toBe(1);
    expect(R(take(scene({ slots: { [JV]: 0, [HIRE]: 0, [RUSH]: 1 } }), 'Wind-up')).purple).toBe(3);
  });
  it('Plan Ahead (ring II): +2 purple per worker you have left to place this round', () => {
    expect(() => take(scene({ round: 1 }), 'Plan Ahead')).toThrow();
    // the scene gives 3 workers; placing this one leaves 2
    expect(R(take(scene({ round: 2, queue: turns(0, 1) }), 'Plan Ahead')).purple).toBe(4);
    const last = scene({ round: 3, queue: turns(0, 1) });
    last.players[0].left = 1;
    expect(R(take(last, 'Plan Ahead')).purple).toBe(0); // your last worker: nothing left to plan
  });
  it(`Overtime (ring II): pay ${OT_COST} purple for 2 extra turns right after this one; without it, +3 purple`, () => {
    let s = take(scene({ round: 2, res: [{ purple: OT_COST + 1 }], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(1);
    expect(s.players[0].left).toBe(2 + 2); // one worker in, two out
    expect(nextPlacer(s)).toBe(0);
    s = pass(take(s, 'Hourly'));
    expect(nextPlacer(s)).toBe(0); // the second extra turn
    s = pass(take(s, 'Wind-up'));
    expect(nextPlacer(s)).toBe(1);
    s = take(scene({ round: 2, res: [{ purple: OT_COST - 1 }], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(OT_COST + 2);
    expect(nextPlacer(s)).toBe(1);
  });
  it('extra turns never squeeze a later player out of the last space', () => {
    // round II: only Overtime and two other spaces open, P2 still has a turn
    const slots = { ...fullRoundI(JV, RUSH), '0-3': 1, '0-4': 1, '1-3': 1, '1-4': 1, '3-3': 1, '3-4': 1, '2-3': 1 };
    const s0 = scene({ round: 2, res: [{ purple: OT_COST }], slots, queue: turns(0, 1) });
    expect(spareSpace(contextFor(s0))).toBe(true); // 3 open, 1 turn queued
    const s = take(s0, 'Overtime');
    expect(R(s).purple).toBe(OT_COST + 3); // 2 open, 1 turn queued: room for 1 extra turn, not 2, so +3
    expect(nextPlacer(s)).toBe(1);
  });
  it('Rally (ring III): spend all your purple, 1 extra turn per 4 spent plus 1, up to 3; with less than 4, +4 purple', () => {
    const rally = purpleHeld => take(scene({ round: 3, res: [{ purple: purpleHeld }], queue: turns(0, 1) }), 'Rally');
    let s = rally(5);
    expect(R(s).purple).toBe(0); // all of it, even the odd 1
    expect(s.players[0].left).toBe(2 + 2); // 5 → 1 per 4, plus 1 = 2 extra turns
    expect(nextPlacer(s)).toBe(0);
    s = rally(8);
    expect(s.players[0].left).toBe(2 + 3);
    s = rally(30);
    expect(s.players[0].left).toBe(2 + 3); // never more than 3
    expect(R(s).purple).toBe(0);
    s = rally(3);
    expect(R(s).purple).toBe(7);
    expect(nextPlacer(s)).toBe(1);
  });
  it('Rally with room for fewer turns than its purple buys: pays only for the turns it gets', () => {
    // round III: 4 spaces open once Rally is taken, and P2 still has 2 turns → room for 2 extra turns, not 3
    const taken = { ...fullRoundI('0-0', '0-1', '0-2'), '0-3': 1, '0-4': 1, '1-3': 1, '1-4': 1, '2-3': 1, '3-3': 1, '3-4': 1, '0-5': 1, '1-5': 1, '3-5': 1 };
    const s0 = scene({ round: 3, res: [{ purple: 12 }], slots: taken, queue: turns(0, 1, 1) });
    const s = take(s0, 'Rally');
    expect(s.players[0].left).toBe(2 + 2);
    expect(R(s).purple).toBe(12 - 4); // 2 turns: the free one and one bought with 4
  });
});

describe('Purple members', () => {
  const start = (members, extra = {}) => scene({ members, queue: [{ t: 'round', r: 2 }], ...extra });
  const afterTake = (members, extra = {}) => take(scene({ queue: turns(0, 1), members, ...extra }), 'Hourly');

  it('Second Wind: once per game, an extra turn right after this one', () => {
    let s = afterTake([['purple.secondwind']]);
    const u = uidOf(s, 'purple.secondwind', 0);
    s = move(s, `use:${u}`);
    expect(ids(s)).not.toContain(`use:${u}`);
    expect(nextPlacer(s)).toBe(0);
  });
  it('Errand Runner: when recruited, an extra turn right after this one', () => {
    let s = scene({ res: [{ purple: 2, gold: 2 }], shop: ['purple.errand'], queue: turns(0, 1) });
    s = take(s, 'Hourly');
    s = move(s, `card:${uidOf(s, 'purple.errand', 'shop')}`);
    expect(nextPlacer(s)).toBe(0);
  });
  it('Taskmaster: once per round, pay 5 purple for an extra turn', () => {
    let s = afterTake([['purple.taskmaster']], { res: [{ purple: 2 }] }); // 2 + 4 = 6
    const u = uidOf(s, 'purple.taskmaster', 0);
    s = move(s, `use:${u}`);
    expect(R(s).purple).toBe(1);
    expect(ids(s)).not.toContain(`use:${u}`);
    expect(nextPlacer(s)).toBe(0);
    let t = afterTake([['purple.taskmaster']]); // only 4
    t = move(t, `use:${u}`);
    expect(ids(t)).toContain(`use:${u}`); // not used up
  });
  it('Late Riser: from round II, the trailing player takes an extra turn first', () => {
    const s = start([['purple.lateriser']], { bonus: [0, 3] });
    expect(s.pending.kind).toBe('place');
    expect(s.pending.player).toBe(0);
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 0)).toHaveLength(4); // 1 extra + 4 - this one
    const t = start([['purple.lateriser']], { bonus: [3, 0] });
    expect(t.queue.filter(x => x.t === 'turn' && x.p === 0)).toHaveLength(4);
  });
  it('Foreman, Courier, Apprentice: whenever you take an extra turn (Overtime gives 2)', () => {
    const s = take(scene({ round: 2, res: [{ purple: OT_COST }], slots: { [JV]: 0 }, members: [['purple.foreman', 'purple.courier', 'purple.apprentice']], queue: turns(0, 1) }), 'Overtime');
    // Foreman: 2 workers on the board (Joint Venture + Overtime), twice
    expect(R(s)).toEqual({ gold: 2, red: 2, purple: 4, green: 2 });
    expect(s.players[0].discount).toBe(8);
  });
  it('Overseer: whenever a rival takes an extra turn, gain half your purple, up to 4 (each of Overtime’s 2 turns)', () => {
    let s = take(scene({ round: 2, res: [{ purple: OT_COST }, { purple: 5 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s, 1).purple).toBe(5 + 2 + 3);
    s = take(scene({ round: 2, res: [{ purple: OT_COST }, { purple: 20 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s, 1).purple).toBe(28);
  });
  it('Double Time: extra turns you pay purple for cost half, rounded up (Overtime 4; Rally 1 turn per 2 spent)', () => {
    let s = take(scene({ round: 2, res: [{ purple: OT_COST / 2 }], members: [['purple.doubletime']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(0);
    expect(nextPlacer(s)).toBe(0);
    s = take(scene({ round: 3, res: [{ purple: 2 }], members: [['purple.doubletime']], queue: turns(0, 1) }), 'Rally');
    expect(R(s).purple).toBe(0);
    expect(s.players[0].left).toBe(2 + 2); // 2 purple → 1 per 2, plus 1
    expect(s.log.some(l => l.includes('Double Time: 1 turn per 2'))).toBe(true);
  });
  it('Bookkeeper: when you place your last worker of a round, +1 purple per 2 workers you have on the board; nothing at round end', () => {
    expect(R(scene({ members: [['purple.bookkeeper']], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 0 }, queue: [{ t: 'endRound' }] })).purple).toBe(0);
    let s = scene({ members: [['purple.bookkeeper']], slots: { [JV]: 0, [HIRE]: 0 }, queue: turns(0, 1, 0) });
    s.players[0].left = 2;
    s = pass(take(s, 'Rush')); // 1 worker left after this: nothing yet
    expect(R(s).purple).toBe(0);
    s = pass(take(s, 'Hourly')); // P2
    s = take(s, 'Turnout'); // the last one: 4 workers on the board → +2, before this turn's buy
    expect(R(s).purple).toBe(2);
    expect(s.pending.kind).toBe('buy');
  });
  it('Clockmaker: round start (after other round-start income), +1 purple per 2 purple; nothing at round end', () => {
    expect(R(scene({ members: [['purple.clockmaker']], res: [{ purple: 7 }], queue: [{ t: 'endRound' }] })).purple).toBe(7);
    // Lamplighter pays 4 at round II start first, then Clockmaker counts 3 + 4 = 7 → +3
    expect(R(scene({ members: [['purple.clockmaker', 'purple.lamplighter']], res: [{ purple: 3 }], queue: [{ t: 'round', r: 2 }] })).purple).toBe(10);
  });
  it('Lamplighter: round start, +1 purple per worker you get this round', () => {
    expect(R(start([['purple.lamplighter']])).purple).toBe(4);
    expect(R(scene({ members: [['purple.lamplighter']], queue: [{ t: 'round', r: 3 }] })).purple).toBe(5);
  });
  it('Patience: game end, +1 follower per 3 purple', () => {
    const s = scene({ round: 3, members: [['purple.patience']], res: [{ purple: 10 }], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Patience +3');
  });
  it('Shift Crew: worth 2 followers', () => {
    const s = scene({ members: [['purple.crew']] });
    expect(followers(s, s.players[0])).toBe(3);
  });
});

describe(`Purple table: ${GAMES} seeded bot games`, () => {
  it('finish cleanly with every invariant holding', () => {
    for (let seed = 1; seed <= GAMES; seed++) {
      const n = 2 + (seed % 3);
      const rand = seededRandom(seed * 31 + n);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed, quadrants: Q });
      let k = 0;
      while (s.pending) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (++k % 7 === 0) checkInvariants(s, `purple seed ${seed}`);
        if (k > 2500) throw new Error(`seed ${seed} did not end`);
      }
      checkInvariants(s, `purple seed ${seed}`);
      expect(s.over).toBe(true);
      expect(s.ranking).toHaveLength(n);
      expect(followers(s, s.players[s.ranking[0]])).toBeGreaterThan(1);
    }
  });
});
