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

registerQuadrant(purple);
const Q = ['gold', 'red', 'purple', 'green'];

const PURPLE_TEST_COSTS = {
  'purple.secondwind': [4, 2], 'purple.errand': [2, 2], 'purple.taskmaster': [2, 1], 'purple.lateriser': [3, 2],
  'purple.foreman': [1, 1], 'purple.courier': [1, 1], 'purple.apprentice': [1, 1], 'purple.overseer': [1, 1],
  'purple.doubletime': [2, 1], 'purple.bookkeeper': [1, 1], 'purple.clockmaker': [2, 1], 'purple.lamplighter': [1, 0],
  'purple.relay': [2, 2], 'purple.patience': [3, 2], 'purple.crew': [1, 1],
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
const JV = '0-0', RUSH = '0-1', STRIKE = '0-5', HIRE = '1-2', HOURLY = '2-0';
const RALLY_COST = 5;
// every round-I space but the ones named, taken by P2
const fullRoundI = (...free) => Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => !free.includes(k)).map(k => [k, 1]));

describe('Purple scoring: most workers on the board, purple breaks ties', () => {
  it('more workers on the board wins; equal boards go to more purple', () => {
    const s = scene({ res: [{ purple: 0 }, { purple: 9 }], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 1 }, queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most workers on the board (purple breaks ties): P1 +2');
    const t = scene({ res: [{ purple: 1 }, { purple: 3 }], slots: { [JV]: 0, [HIRE]: 1 }, queue: [{ t: 'endRound' }] });
    expect(t.log.at(-1)).toContain('purple breaks ties): P2 +2');
  });
  it('counts what is on the board now', () => {
    const s = scene({ slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 1 } });
    expect(onBoard(contextFor(s), s.players[0])).toBe(2);
    expect(purple.scoring.score(contextFor(s), s.players[1])).toBe(1000);
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
  it('Linger (ring II): move a worker to a different space and do that action', () => {
    expect(() => take(scene({ round: 1 }), 'Linger')).toThrow();
    let s = take(scene({ round: 2, slots: { [JV]: 0, [STRIKE]: 0, [HOURLY]: 0, [HIRE]: 1 }, queue: turns(0, 1) }), 'Linger');
    expect(ids(s)).toEqual([`from:${JV}`]); // not the center, not purple, not a rival's
    s = move(s, `from:${JV}`);
    expect(ids(s)).not.toContain(`to:${JV}`); // a different space
    s = move(s, `to:${RUSH}`);
    expect(s.slots[JV]).toBeUndefined();
    expect(s.slots[RUSH]).toBe(0);
    s = pass(s); // this turn's buy
    expect(R(s).gold).toBe(4); // Rush in round II
    expect(nextPlacer(s)).toBe(1);
  });
  it('Linger with no worker to move does nothing', () => {
    const s = take(scene({ round: 2, queue: turns(0, 1) }), 'Linger');
    expect(nextPlacer(s)).toBe(1);
  });
  it('Overtime (ring II): pay 6 purple for an extra turn; without 6, +2 purple', () => {
    let s = take(scene({ round: 2, res: [{ purple: 7 }], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(1);
    expect(nextPlacer(s)).toBe(0);
    s = take(scene({ round: 2, res: [{ purple: 5 }], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(7);
    expect(nextPlacer(s)).toBe(1);
  });
  it('extra turns never squeeze a later player out of the last space', () => {
    // round II: only Overtime and one other space open, P2 still has a turn
    const slots = { ...fullRoundI(JV), '0-3': 1, '0-4': 1, '1-3': 1, '1-4': 1, '3-3': 1, '3-4': 1, '2-3': 1 };
    const s0 = scene({ round: 2, res: [{ purple: 6 }], slots, queue: turns(0, 1) });
    expect(spareSpace(contextFor(s0))).toBe(true); // 2 open, 1 turn queued
    const s = take(s0, 'Overtime');
    expect(R(s).purple).toBe(8); // 1 open, 1 turn queued: no spare, so +2
    expect(nextPlacer(s)).toBe(1);
  });
  it(`Rally (ring III): pay ${RALLY_COST} purple for an extra turn; without it, +3 purple`, () => {
    let s = take(scene({ round: 3, res: [{ purple: RALLY_COST + 1 }], queue: turns(0, 1) }), 'Rally');
    expect(R(s).purple).toBe(1);
    expect(nextPlacer(s)).toBe(0);
    s = take(scene({ round: 3, res: [{ purple: RALLY_COST - 1 }], queue: turns(0, 1) }), 'Rally');
    expect(R(s).purple).toBe(RALLY_COST + 2);
    expect(nextPlacer(s)).toBe(1);
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
  it('Foreman, Courier, Apprentice: whenever you take an extra turn', () => {
    let s = take(scene({ round: 2, res: [{ purple: 6 }], slots: { [JV]: 0 }, members: [['purple.foreman', 'purple.courier', 'purple.apprentice']], queue: turns(0, 1) }), 'Overtime');
    // Foreman: 2 workers on the board (Joint Venture + Overtime)
    expect(R(s)).toEqual({ gold: 1, red: 1, purple: 2, green: 1 });
    expect(s.players[0].discount).toBe(4);
  });
  it('Overseer: whenever a rival takes an extra turn, gain half your purple, up to 4', () => {
    let s = take(scene({ round: 2, res: [{ purple: 6 }, { purple: 5 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s, 1).purple).toBe(7);
    s = take(scene({ round: 2, res: [{ purple: 6 }, { purple: 20 }], members: [[], ['purple.overseer']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s, 1).purple).toBe(24);
  });
  it('Linger counts as an extra turn for the triggers', () => {
    let s = take(scene({ round: 2, members: [['purple.foreman']], slots: { [JV]: 0 }, queue: turns(0, 1) }), 'Linger');
    s = move(move(s, `from:${JV}`), `to:${RUSH}`);
    expect(R(s).purple).toBe(2);
  });
  it('Double Time: extra turns you pay purple for cost half, rounded up', () => {
    let s = take(scene({ round: 2, res: [{ purple: 3 }], members: [['purple.doubletime']], queue: turns(0, 1) }), 'Overtime');
    expect(R(s).purple).toBe(0);
    expect(nextPlacer(s)).toBe(0);
    s = take(scene({ round: 3, res: [{ purple: Math.ceil(RALLY_COST / 2) }], members: [['purple.doubletime']], queue: turns(0, 1) }), 'Rally');
    expect(R(s).purple).toBe(0);
  });
  it('Bookkeeper: round end, +1 purple per 2 workers on the board', () => {
    expect(R(scene({ members: [['purple.bookkeeper']], slots: { [JV]: 0, [RUSH]: 0, [HIRE]: 0 }, queue: [{ t: 'endRound' }] })).purple).toBe(1);
  });
  it('Clockmaker: round end, +1 purple per 2 purple', () => {
    expect(R(scene({ members: [['purple.clockmaker']], res: [{ purple: 7 }], queue: [{ t: 'endRound' }] })).purple).toBe(10);
  });
  it('Lamplighter: round start, +1 purple per worker you get this round', () => {
    expect(R(start([['purple.lamplighter']])).purple).toBe(4);
    expect(R(scene({ members: [['purple.lamplighter']], queue: [{ t: 'round', r: 3 }] })).purple).toBe(5);
  });
  it('Relay: once per round, pay 3 purple to take a turn right after a rival\'s extra turn', () => {
    let s = take(scene({ round: 2, res: [{ purple: 6 }, { purple: 7 }], members: [[], ['purple.relay']], queue: turns(0, 1, 0) }), 'Overtime');
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.player).toBe(1);
    s = move(s, 'yes');
    expect(R(s, 1).purple).toBe(4);
    // P1's extra turn is running now; the relay turn comes right after it, before P2's own turn
    expect(s.pending).toMatchObject({ kind: 'place', player: 0 });
    expect(s.queue.filter(t => t.t === 'turn').map(t => t.p)).toEqual([1, 1, 0]);
    // once per round: a second extra turn this round doesn't ask again
    expect(s.cards[uidOf(s, 'purple.relay', 1)].relayRound).toBe(2);
  });
  it('Relay: saying no keeps your purple', () => {
    let s = take(scene({ round: 2, res: [{ purple: 6 }, { purple: 7 }], members: [[], ['purple.relay']], queue: turns(0, 1) }), 'Overtime');
    s = move(s, 'no');
    expect(R(s, 1).purple).toBe(7);
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

describe('Purple table: 200 seeded bot games', () => {
  it('finish cleanly with every invariant holding', { timeout: 300000 }, () => {
    for (let seed = 1; seed <= 200; seed++) {
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
