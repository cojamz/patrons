// @vitest-environment node
// Purple (extra turns): every action and every member with exact numbers, plus 200 seeded bot games on a Purple table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor, roundOrder, turnRail, actionAt } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import purple, { onBoard, spareSpace, turnsNow } from '../../../../engine/v4/content/purple.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';
import { useRetiredOvertime } from '../retired-overtime.js';

useRetiredOvertime();

// seeded games in the table block below: a game count, not a time budget (budget.js). The verdict plays 100 (catches a
// bug in ≥3% of this table's games with 95% confidence), the nightly full run (check:v4:full) all 200, the fast gate 20.
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
/** A bot move, minus Sleep In (it skips a turn; the turnsNow test counts the plain snake). */
function noSkip(s, rand) {
  const m = chooseBotMove(s, rand);
  const o = s.pending?.options?.find(x => x.id === m.option);
  if (o?.kind === 'slot' && o.q !== undefined && actionAt(s, o.q, o.i).key === 'skip') {
    const alt = s.pending.options.find(x => x.kind === 'slot' && x.q !== undefined && actionAt(s, x.q, x.i).key !== 'skip');
    if (alt) return { player: m.player, option: alt.id };
  }
  return m;
}
const nextPlacer = s => { while (s.pending && s.pending.kind !== 'place') s = pass(s); return s.pending?.player; };
const JV = '0-0', RUSH = '0-1', HIRE = '1-2';
// every round-I space but the ones named, taken by P2
const fullRoundI = (...free) => Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => !free.includes(k)).map(k => [k, 1]));

describe('Purple scoring: most purple held', () => {
  it('pays the ring for purple held; ties get half and zero scores nothing', () => {
    const s = scene({ res: [{ purple: 20 }, {}], members: [[], ['purple.foreman']], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most purple: P1 +2');
    const t = scene({ res: [{ purple: 3 }, { purple: 3 }], queue: [{ t: 'endRound' }] });
    expect(t.log.at(-1)).toContain('Most purple: P1 & P2 +1');
    const u = scene({ members: [['purple.foreman'], []], queue: [{ t: 'endRound' }] });
    expect(u.log.at(-1)).not.toContain('Most purple');
  });
  it('counts held purple, not purple members or board minions', () => {
    const s = scene({ res: [{ purple: 7 }], members: [['purple.foreman'], []], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 1 } });
    expect(purple.scoring.score(contextFor(s), s.players[0])).toBe(7);
    expect(purple.scoring.score(contextFor(s), s.players[1])).toBe(0);
    expect(onBoard(contextFor(s), s.players[0])).toBe(2);
  });
});

describe('Purple actions', () => {
  it('Catch Up: +1 purple, and +1 per rival who\'s placed more minions than you this round (counted before yours lands)', () => {
    // two rivals two minions ahead: +1, and +1 for each
    expect(R(take(scene({ n: 3, slots: { [RUSH]: 1, [HIRE]: 1, '1-0': 2, '1-1': 2 } }), 'purple.catchup')).purple).toBe(3);
    // equal counts before yours lands don't pay: only the +1
    expect(R(take(scene({ n: 3, slots: { [RUSH]: 0, [HIRE]: 1, '1-0': 2 } }), 'purple.catchup')).purple).toBe(1);
    // nobody on the board yet: the +1 is still granted
    expect(R(take(scene(), 'purple.catchup')).purple).toBe(1);
  });
  it('Catch Up pays in ordinary turn order: a rival one minion ahead counts (yours, landing, does not count against you)', () => {
    // Cory got nothing from Catch Up: the old count included the minion just placed, so a rival one ahead (the only
    // lead turn order gives) tied it, and the bonus never paid without someone's extra turns.
    // P2 went first this round and has 1 out; P1's first minion takes Catch Up.
    let s = take(scene({ slots: { [RUSH]: 1 }, queue: turns(0, 1) }), 'purple.catchup');
    expect(R(s).purple).toBe(1 + 1);
    // 4 players, P1 last in the snake: three rivals one ahead, +1 each
    s = take(scene({ n: 4, slots: { [RUSH]: 1, [HIRE]: 2, '1-0': 3 }, queue: turns(0, 1) }), 'purple.catchup');
    expect(R(s).purple).toBe(1 + 3);
  });
  it('Roll Call: +1 purple per worker you have on the board, this one included', () => {
    expect(R(take(scene(), 'purple.windup')).purple).toBe(1);
    expect(R(take(scene({ slots: { [JV]: 0, [HIRE]: 0, [RUSH]: 1 } }), 'purple.windup')).purple).toBe(3);
  });
  it('Overtime (ring II): take 1 extra turn right after this one; nothing to pay', () => {
    let s = take(scene({ round: 2, res: [{ purple: 9 }], queue: turns(0, 1) }), 'purple.overtime');
    expect(R(s).purple).toBe(9); // nothing spent
    expect(s.players[0].left).toBe(2 + 1); // one minion in, one back
    expect(s.log).toContain('P1 takes an extra turn.');
    expect(nextPlacer(s)).toBe(0);
    s = pass(take(pass(pass(s)), 'purple.windup'));
    expect(nextPlacer(s)).toBe(1);
    // with no purple at all, the same: no payment, no fallback gain
    s = take(scene({ round: 2, queue: turns(0, 1) }), 'purple.overtime');
    expect(R(s).purple).toBe(0);
    expect(nextPlacer(s)).toBe(0);
    // no choice or payment to make on the space (nothing to buy with, so straight to the extra placement)
    expect(s.pending).toMatchObject({ kind: 'place', player: 0 });
  });
  it('extra turns never squeeze a later player out of the last space', () => {
    // round II: only Overtime and two other spaces open (Rush Hour taken), P2 still has a turn
    const slots = { ...fullRoundI(JV, RUSH), '0-3': 1, '0-4': 1, '1-3': 1, '1-4': 1, '3-3': 1, '3-4': 1, '2-3': 1, '2-4': 1 }; // 2-4: Rush Hour, where Overtime stood (Overtime is a test-only 7th space)
    const s0 = scene({ round: 2, slots, queue: turns(0, 1) });
    expect(spareSpace(contextFor(s0))).toBe(true); // 3 open, 1 turn queued
    let s = take(s0, 'purple.overtime');
    expect(s.players[0].left).toBe(2 + 1); // 2 open, 1 turn queued: room for the 1
    expect(nextPlacer(s)).toBe(0);
    // only Overtime and one other space open: no space to spare, so no extra turn (and nothing else instead)
    s = take(scene({ round: 2, slots: { ...slots, [RUSH]: 1 }, queue: turns(0, 1) }), 'purple.overtime');
    expect(s.players[0].left).toBe(2);
    expect(R(s).purple).toBe(0);
    expect(s.log).toContain("P1's Overtime: no free space this round, so no extra turn.");
    expect(nextPlacer(s)).toBe(1);
  });
  // Cory, 2026-10-15: "it's not extra turns, it's taking two immediate turns with existing minions"
  const upcoming = s => s.queue.filter(t => t.t === 'turn').map(t => t.p);
  // every turn after the scene's first (the one that took Crunch Time), however far the scene has run on
  const after1 = s => { const r = turnRail(s); return [...r.done, ...(r.current != null ? [r.current] : []), ...r.next].slice(1); };
  it('Crunch Time (ring III): your next 2 turns right away; nothing to pay, no new minion', () => {
    const rally = purpleHeld => take(scene({ round: 3, res: [{ purple: purpleHeld }], queue: turns(0, 1, 0, 1, 0, 1) }), 'purple.rally');
    for (const held of [0, 3, 5, 30]) {
      const s = rally(held);
      expect(R(s).purple).toBe(held); // nothing spent, nothing gained
      expect(s.players[0].left).toBe(2); // the 3 it started with, less this one: no extra minion
      expect(after1(s)).toEqual([0, 0, 1, 1, 1]);
      expect(s.log).toContain("P1's Crunch Time: P1 takes their next 2 turns now.");
      expect(nextPlacer(s)).toBe(0);
    }
    expect(() => take(scene({ round: 2 }), 'purple.rally')).toThrow(); // the center opens in round III
  });
  it('Crunch Time needs no spare space: on a full board it still moves your turns', () => {
    // round III: 4 spaces open once Crunch Time is taken, and 4 turns to come: no room for an extra turn, room for these
    const taken = { ...fullRoundI('0-0', '0-1', '0-2'), '0-3': 1, '0-4': 1, '1-3': 1, '1-4': 1, '2-3': 1, '3-3': 1, '3-4': 1, '0-5': 1, '1-5': 1, '3-5': 1 };
    const s = take(scene({ round: 3, slots: taken, queue: turns(0, 1, 1, 0, 0) }), 'purple.rally');
    expect(after1(s)).toEqual([0, 0, 1, 1]);
    expect(s.log.some(l => /no free space this round/i.test(l))).toBe(false);
  });
  it('Crunch Time with 1 minion left takes that 1; with none, nothing happens', () => {
    let s = take(scene({ round: 3, queue: turns(0, 1, 1, 0, 1) }), 'purple.rally');
    expect(after1(s)).toEqual([0, 1, 1, 1]);
    expect(s.log).toContain("P1's Crunch Time: P1 takes their next turn now (their last minion).");
    s = take(scene({ round: 3, queue: turns(0, 1, 1) }), 'purple.rally');
    expect(after1(s)).toEqual([1, 1]);
    expect(s.log).toContain('P1 has no minions left to place: Crunch Time does nothing.');
    expect(nextPlacer(s)).toBe(1);
  });
  it('turnsNow: placements per round unchanged, the next 2 happen at once, and it works in round I at 4 players', () => {
    // a real 4-player round I (3 minions each, snake): P? first; give the first placer Crunch Time's move on its first turn
    const g = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 11, quadrants: Q });
    let s = g;
    const rand = seededRandom(5);
    while (s.pending && s.pending.kind !== 'place') s = applyMove(s, chooseBotMove(s, rand));
    const first = s.pending.player;
    const before = upcoming(s);
    expect(before).toHaveLength(11); // 12 placements, the first one running
    // move the first placer's next 2 turns up (as Crunch Time would, from a round-I space)
    const ctx = contextFor(s);
    expect(turnsNow(ctx, s.players[first], 2, 'Crunch Time')).toBe(2);
    const after = upcoming(s);
    expect(after).toHaveLength(11); // same placements
    expect(after.slice(0, 2)).toEqual([first, first]);
    expect([...after].sort()).toEqual([...before].sort());
    // the rest keep their order
    const rest = [...before]; rest.splice(rest.indexOf(first), 1); rest.splice(rest.indexOf(first), 1);
    expect(after.slice(2)).toEqual(rest);
    // play the round out: every seat places exactly 3, and the first placer's 3 come one after another
    const placed = Object.fromEntries(s.players.map(p => [p.id, 0]));
    const seq = [];
    for (let guard = 0; guard < 500 && s.round === 1 && !s.over; guard++) {
      if (s.pending?.kind === 'place' && (seq.length === 0 || seq[seq.length - 1].turn !== s.turns.length)) { seq.push({ p: s.pending.player, turn: s.turns.length }); placed[s.pending.player]++; }
      s = applyMove(s, noSkip(s, rand));
    }
    expect(Object.values(placed)).toEqual([3, 3, 3, 3]);
    expect(seq.slice(0, 3).map(t => t.p)).toEqual([first, first, first]);
  });
  it('turnsNow keeps the round\'s order in step with the queue (the seats read it), and state.order keeps the first pass', () => {
    const g = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 11, quadrants: Q });
    let s = g;
    const rand = seededRandom(5);
    while (s.pending && s.pending.kind !== 'place') s = applyMove(s, chooseBotMove(s, rand));
    const first = s.pending.player;
    const firstPass = s.order.slice(0, 4);
    turnsNow(contextFor(s), s.players[first], 2, 'Crunch Time');
    const { order, early } = roundOrder(s);
    expect(order.slice(0, 3)).toEqual([first, first, first]);
    expect(order.slice(1).filter((_, i) => i < 11)).toEqual(upcoming(s));
    expect(early.slice(1, 3)).toEqual(['Crunch Time', 'Crunch Time']);
    expect(s.order.slice(0, 4)).toEqual(firstPass);
  });
});

describe('Purple members', () => {
  const start = (members, extra = {}) => scene({ members, queue: [{ t: 'round', r: 2 }], ...extra });
  // round II: no extra minions in round I (Cory, 2026-10-15); Roll Call gives +1 per minion on the board there
  const afterTake = (members, extra = {}) => take(scene({ round: 2, queue: turns(0, 1), members, ...extra }), 'purple.windup');

  it('Go-Getter: once per game, an extra turn right after this one', () => {
    let s = afterTake([['purple.secondwind']]);
    const u = uidOf(s, 'purple.secondwind', 0);
    s = move(s, `use:${u}`);
    expect(ids(s)).not.toContain(`use:${u}`);
    expect(nextPlacer(s)).toBe(0);
  });
  it('Errand Runner: when recruited, an extra turn right after this one', () => {
    let s = scene({ round: 2, res: [{ purple: 2, gold: 2 }], shop: ['purple.errand'], queue: turns(0, 1) });
    s = take(s, 'purple.windup');
    s = move(s, `card:${uidOf(s, 'purple.errand', 'shop')}`);
    expect(nextPlacer(s)).toBe(0);
  });
  it('Taskmaster: once per round, pay 5 purple for an extra turn', () => {
    let s = afterTake([['purple.taskmaster']], { res: [{ purple: 5 }] }); // 5 + 1 = 6
    const u = uidOf(s, 'purple.taskmaster', 0);
    s = move(s, `use:${u}`);
    expect(R(s).purple).toBe(1);
    expect(ids(s)).not.toContain(`use:${u}`);
    expect(nextPlacer(s)).toBe(0);
    let t = take(scene({ round: 2, queue: turns(0, 1), members: [['purple.taskmaster']], res: [{ purple: 4 }] }), 'gold.rush'); // only 4
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
  it('Foreman, Courier, Apprentice: whenever you take an extra turn (Overtime gives 1); Crunch Time\'s turns aren\'t extra', () => {
    const trio = [['purple.foreman', 'purple.courier', 'purple.apprentice']];
    const s = take(scene({ round: 2, slots: { [JV]: 0 }, members: trio, queue: turns(0, 1) }), 'purple.overtime');
    // Foreman: 2 workers on the board (Kickback + Overtime)
    expect(R(s)).toEqual({ gold: 1, red: 1, purple: 2, green: 1 });
    expect(s.players[0].discount).toBe(4);
    const t = take(scene({ round: 3, slots: { [JV]: 0 }, members: trio, queue: turns(0, 1, 0, 1, 0) }), 'purple.rally');
    expect(R(t)).toEqual({ gold: 0, red: 0, purple: 0, green: 0 });
    expect(t.players[0].discount).toBe(0);
  });
  it('Overseer: whenever a rival takes an extra turn, gain half your purple, up to 4; not on Crunch Time', () => {
    let s = take(scene({ round: 2, res: [{}, { purple: 5 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'purple.overtime');
    expect(R(s, 1).purple).toBe(5 + 2);
    s = take(scene({ round: 2, res: [{}, { purple: 20 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'purple.overtime');
    expect(R(s, 1).purple).toBe(24);
    s = take(scene({ round: 3, res: [{}, { purple: 20 }], members: [[], ['purple.overseer']], queue: turns(0, 1, 0, 1, 0) }), 'purple.rally');
    expect(R(s, 1).purple).toBe(20);
  });
  it('Corner-Cutter: extra turns you pay purple for cost half, rounded up (Taskmaster 3); free spaces stay free and never name it', () => {
    let s = afterTake([['purple.taskmaster', 'purple.doubletime']], { res: [{ purple: 4 }] }); // 4 + 1 = 5 purple
    s = move(s, `use:${uidOf(s, 'purple.taskmaster', 0)}`);
    expect(R(s).purple).toBe(2); // pays 5 → 3
    expect(s.log.some(l => l.includes('Corner-Cutter: 5 → 3'))).toBe(true);
    expect(nextPlacer(s)).toBe(0);
    // Overtime and Crunch Time cost nothing, so Corner-Cutter has nothing to halve: no change, no log line
    s = take(scene({ round: 2, res: [{ purple: 4 }], members: [['purple.doubletime']], queue: turns(0, 1) }), 'purple.overtime');
    expect(R(s).purple).toBe(4);
    expect(s.players[0].left).toBe(2 + 1);
    s = take(scene({ round: 3, res: [{ purple: 2 }], members: [['purple.doubletime']], queue: turns(0, 1, 0) }), 'purple.rally');
    expect(R(s).purple).toBe(2);
    expect(s.players[0].left).toBe(2); // Crunch Time adds no minion
    expect(s.log.some(l => l.includes('Corner-Cutter'))).toBe(false);
  });
  it('Bookkeeper: when your last turn of a round ends, +1 purple per 2 workers you have on the board; nothing at round end', () => {
    expect(R(scene({ members: [['purple.bookkeeper']], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 0 }, queue: [{ t: 'endRound' }] })).purple).toBe(0);
    let s = scene({ members: [['purple.bookkeeper']], slots: { [JV]: 0, [HIRE]: 0 }, queue: turns(0, 1, 0) });
    s.players[0].left = 2;
    s = pass(take(s, 'gold.rush')); // 1 worker left after this: nothing yet
    expect(R(s).purple).toBe(0);
    s = pass(take(s, 'purple.windup')); // P2
    s = take(s, 'red.turnout'); // the last one lands; Bookkeeper waits for the turn's end (Cory, 2026-10-15)
    expect(R(s).purple).toBe(0);
    expect(s.pending.kind).toBe('buy');
    s = pass(s); // the turn ends: 4 workers on the board → +2
    expect(R(s).purple).toBe(2);
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
  it('Timekeeper: game end, +1 follower per 3 purple', () => {
    const s = scene({ round: 3, members: [['purple.patience']], res: [{ purple: 10 }], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Timekeeper +3');
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
