// @vitest-environment node
// White (trading): every action and every member with exact numbers, plus 200 seeded bot games on a White table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor, shopSize } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import trading, { install } from '../../../../engine/v4/content/trading.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';
import { STRAYS, stray } from '../stray.js';

// seeded games in the table block below: a game count, not a time budget (budget.js). The verdict plays 100 (catches a
// bug in ≥3% of this table's games with 95% confidence), the nightly full run (check:v4:full) all 200, the fast gate 20.
const GAMES = games(200);

install();
const Q = ['gold', 'red', 'blue', 'trading'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const WHITE_TEST_COSTS = {
  'trading.shopkeeper': [1, 1], 'trading.heiress': [2, 2], 'trading.bulkbuyer': [1, 1], 'trading.broker': [1, 0],
  'trading.exporter': [1, 1], 'trading.raider': [2, 1], 'trading.cashier': [1, 1], 'trading.undertaker': [1, 1],
  'trading.appraiser': [1, 1], 'trading.changer': [1, 1], 'trading.martyr': [1, 1], 'trading.hoarder': [2, 2],
};
let restore;
beforeEach(() => { restore = pinCosts({ ...TEST_COSTS, ...WHITE_TEST_COSTS }); });
afterEach(() => restore());

// The shared scene() helper always builds the default table, so White tests build their own.
function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], turn = 0, queue = null, left = 3 } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q });
  s.queue = []; s.pending = null; s.round = round; s.slots = {}; s.order = []; s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = left;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) { if (!STRAYS.has(def)) throw new Error(`no ${def}`); return stray(s, def); } return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: turn }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const B = (s, i = 0) => s.players[i].bonus;
const F = (s, i = 0) => followers(s, s.players[i]);
const Z = { gold: 0, red: 0, blue: 0, white: 0 };
const has = (s, def, i = 0) => s.players[i].members.some(u => s.cards[u].def === def);
const pick = (s, def, i = 0) => `card:${uidOf(s, def, i)}`;
const buyTurn = { queue: [{ t: 'buy', p: 0 }] };

describe('White scoring: most white held', () => {
  it('counts the white you hold, ignoring followers and members', () => {
    const s = scene({ members: [['trading.shopkeeper'], []], bonus: [20, 0], res: [{ white: 2 }, { white: 5 }] });
    expect(trading.scoring.score(contextFor(s), s.players[0])).toBe(2);
    expect(trading.scoring.score(contextFor(s), s.players[1])).toBe(5);
  });
  it('pays the ring to whoever holds the most white; ties each get half', () => {
    const s = scene({ n: 3, res: [{ white: 4 }, { white: 1 }, {}], queue: [{ t: 'endRound' }] });
    expect(s.log.join('\n')).toContain('Most white: P1 +4');
    const t = scene({ n: 3, res: [{ white: 3 }, { white: 3 }, {}], queue: [{ t: 'endRound' }] });
    expect(t.log.join('\n')).toContain('Most white: P1 & P2 +2');
  });
});

describe('White actions', () => {
  it('Allowance (Oct 31): +round+1 white, and +round followers on a member recruit that turn', () => {
    for (const [round, f, w] of [[1, 1, 2], [2, 2, 3], [3, 3, 4]]) {
      let s = take(scene({ round, res: [{ gold: 4 }], shop: ['gold.midas'] }), 'trading.stipend');
      expect([B(s), R(s).white]).toEqual([0, w]);
      expect(s.pending.kind).toBe('buy');
      s = move(s, pick(s, 'gold.midas', 'shop'));
      expect(B(s)).toBe(f);
    }
  });

  it('Splurge: +1 white, then +1 follower per 2 resources paid for the turn\'s first recruited member', () => {
    let s = take(scene({ res: [{ gold: 4 }], shop: ['gold.midas'] }), 'trading.splurge');
    expect(R(s).white).toBe(1);
    expect(s.players[0].perSpend).toBe(true);
    s = move(s, pick(s, 'gold.midas', 'shop')); // Midas 3+2: pays 5
    expect(has(s, 'gold.midas')).toBe(true);
    expect(B(s)).toBe(2); // floor(5 / 2)
    expect(s.players[0].perSpend).toBeUndefined();
    expect(s.log.join('\n')).toContain("P1's Splurge: +2 followers for spending.");
  });

  it('Splurge pays on members only: buying followers gets nothing extra', () => {
    let s = take(scene({ res: [{ red: 6 }] }), 'trading.splurge');
    s = move(s, 'tier:mid'); // spends 5 → +5 bought, no Splurge
    expect(B(s)).toBe(5);
    expect(s.log.join('\n')).not.toContain('for spending');
  });

  it('Splurge wears off at the next turn when nothing was recruited', () => {
    let s = take(scene({ n: 2 }), 'trading.splurge');
    expect(s.players[0].perSpend).toBe(true);
    s.queue = [{ t: 'turn', p: 0 }]; s.pending = null;
    s = resume(s);
    expect(s.players[0].perSpend).toBeUndefined();
  });

  it('Exchange round I: +1 white, then turn 1 resource into 2 followers', () => {
    let s = take(scene({ res: [{ red: 2 }] }), 'trading.exchange');
    expect(ids(s)).toEqual(['color:red', 'color:white', 'done']);
    s = move(s, 'color:red');
    expect([R(s).red, R(s).white, B(s)]).toEqual([1, 1, 2]);
    expect(s.pending.kind).toBe('buy'); // round I: one only
    const none = move(take(scene({ res: [{ red: 2 }] }), 'trading.exchange'), 'done');
    expect([R(none).red, R(none).white, B(none)]).toEqual([2, 1, 0]);
  });

  it('Exchange rounds II and III: up to 2, then up to 3 resources, 2 followers each; you can stop early', () => {
    let s = take(scene({ round: 2, res: [{ red: 3 }] }), 'trading.exchange');
    s = move(move(s, 'color:red'), 'color:red');
    expect([R(s).red, R(s).white, B(s)]).toEqual([1, 1, 4]);
    expect(s.pending.kind).toBe('buy');
    let t = take(scene({ round: 3, res: [{ red: 3, blue: 1 }] }), 'trading.exchange');
    t = move(move(move(t, 'color:red'), 'color:blue'), 'color:white');
    expect([R(t).red, R(t).blue, R(t).white, B(t)]).toEqual([2, 0, 0, 6]);
    let u = take(scene({ round: 3, res: [{ red: 3 }] }), 'trading.exchange');
    u = move(move(u, 'color:red'), 'done');
    expect([R(u).red, B(u)]).toEqual([2, 2]);
  });

  it('Farewell (ring II): +1 white, send a member to the bottom of the pile, followers equal to its cost', () => {
    expect(() => take(scene({ members: [['gold.midas']] }), 'trading.farewell')).toThrow();
    let s = take(scene({ round: 2, members: [['red.bigfamily', 'red.twins']] }), 'trading.farewell');
    const u = uidOf(s, 'red.bigfamily', 0);
    expect(ids(s)).toEqual([`card:${u}`, `card:${uidOf(s, 'red.twins', 0)}`, 'done']);
    s = move(s, `card:${u}`);
    expect([B(s), R(s).white]).toEqual([4, 1]); // Big Family costs 2 + 2
    expect(has(s, 'red.bigfamily')).toBe(false);
    expect(s.pile.at(-1)).toBe(u);
    const keep = move(take(scene({ round: 2, members: [['red.bigfamily']] }), 'trading.farewell'), 'done');
    expect([B(keep), has(keep, 'red.bigfamily')]).toEqual([0, true]);
    const none = take(scene({ round: 2 }), 'trading.farewell');
    expect([none.pending.kind, R(none).white]).toEqual(['buy', 1]);
  });

  it('Farewell refills a shop left short by an empty pile with the member it sent to the bottom (QA, Oct 28)', () => {
    const s0 = scene({ round: 2, members: [['red.bigfamily']] });
    s0.pile = []; s0.shop = s0.shop.slice(0, shopSize(s0) - 1);
    let s = take(s0, 'trading.farewell');
    const u = uidOf(s, 'red.bigfamily', 0);
    s = move(s, `card:${u}`);
    expect(s.shop.length).toBe(shopSize(s));
    expect(s.shop.at(-1)).toBe(u);
    expect(s.pile).toEqual([]);
  });

  it('Estate Sale (ring II): +1 white, send a member to the bottom of the pile, white equal to its cost', () => {
    let s = take(scene({ round: 2, members: [['red.bigfamily']] }), 'trading.estatesale');
    s = move(s, `card:${uidOf(s, 'red.bigfamily', 0)}`);
    expect([R(s).white, B(s), has(s, 'red.bigfamily')]).toEqual([5, 0, false]); // 2+2, +1
  });

  it('Cash In (ring III): turn all your white into followers, then +1 white', () => {
    expect(() => take(scene({ round: 2, res: [{ white: 4 }] }), 'trading.cashin')).toThrow();
    let s = take(scene({ round: 3, res: [{ white: 6, red: 2 }] }), 'trading.cashin');
    expect([B(s), R(s).white, R(s).red]).toEqual([6, 1, 2]);
    s = take(scene({ round: 3 }), 'trading.cashin');
    expect([B(s), R(s).white]).toEqual([0, 1]);
  });

  it('Midas takes White action gains as gold (Allowance, Estate Sale)', () => {
    const s = take(scene({ round: 2, members: [['gold.midas']] }), 'trading.stipend');
    expect([R(s).gold, R(s).white]).toEqual([3, 0]);
    let t = take(scene({ round: 2, members: [['gold.midas', 'red.twins']] }), 'trading.estatesale');
    t = move(t, `card:${uidOf(t, 'red.twins', 0)}`);
    expect([R(t).gold, R(t).white]).toEqual([3, 0]);
  });
});

describe('White members', () => {
  const start = (members, res = [{}, {}], extra = {}) => scene({ members, res, queue: [{ t: 'round', r: 2 }], ...extra });

  it('Shopkeeper: now and at round start, +2 white', () => {
    expect(R(start([['trading.shopkeeper']])).white).toBe(2);
    let s = scene({ res: [{ white: 2 }], shop: ['trading.shopkeeper'], ...buyTurn });
    s = move(s, pick(s, 'trading.shopkeeper', 'shop'));
    expect(R(s).white).toBe(2); // paid 2, +2 now
  });

  it('Heiress: once per game, +1 white per member you have', () => {
    let s = scene({ members: [['trading.heiress', 'red.twins', 'gold.banker']], ...buyTurn });
    const u = uidOf(s, 'trading.heiress', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(5); // Heiress, Triplets 3, Banker: worth isn't members
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Bulk Buyer: whenever you buy 5 or more followers, +1 follower (not the 1-for-1 buy)', () => {
    let s = move(scene({ res: [{ red: 5 }], members: [['trading.bulkbuyer']], ...buyTurn }), 'tier:mid');
    expect(B(s)).toBe(6);
    s = move(scene({ res: [{ red: 10 }], members: [['trading.bulkbuyer']], ...buyTurn }), 'tier:top');
    expect(B(s)).toBe(11);
    s = move(scene({ res: [{ red: 1 }], members: [['trading.bulkbuyer']], ...buyTurn }), 'tier:small');
    expect(B(s)).toBe(1);
    s = move(scene({ res: [{}, { red: 5 }], members: [['trading.bulkbuyer']], queue: [{ t: 'buy', p: 1 }] }), 'tier:mid');
    expect([B(s, 0), B(s, 1)]).toEqual([0, 5]); // a rival's buy: nothing
  });

  it('Broker: whenever a White action gives you followers, +1 follower (once per action)', () => {
    const br = { members: [['trading.broker']] };
    const al = take(scene({ round: 2, res: [{ gold: 4 }], shop: ['gold.midas'], ...br }), 'trading.stipend');
    expect(B(move(al, pick(al, 'gold.midas', 'shop')))).toBe(3); // Allowance's +2 on a member recruit, Broker +1
    expect(B(move(move(take(scene({ round: 2, res: [{ red: 2 }], ...br }), 'trading.exchange'), 'color:red'), 'color:red'))).toBe(5);
    expect(B(take(scene({ round: 3, res: [{ white: 2 }], ...br }), 'trading.cashin'))).toBe(3);
    expect(B(take(scene({ round: 3, ...br }), 'trading.cashin'))).toBe(0); // nothing turned, no bonus
    let s = take(scene({ round: 2, members: [['trading.broker', 'red.twins']] }), 'trading.farewell');
    expect(B(move(s, `card:${uidOf(s, 'red.twins', 0)}`))).toBe(3);
    const sp = take(scene({ res: [{ gold: 4 }], shop: ['gold.midas'], ...br }), 'trading.splurge');
    expect(B(move(sp, pick(sp, 'gold.midas', 'shop')))).toBe(2 + 1); // Midas paid 5: +2, Broker +1
    expect(B(move(scene({ res: [{ red: 1 }], ...br, ...buyTurn }), 'tier:small'))).toBe(1); // a buy isn't a White action
  });

  it('Exporter: whenever you recruit a non-white member, +1 white', () => {
    let s = scene({ res: [{ red: 1 }], members: [['trading.exporter']], shop: ['red.intern'], ...buyTurn });
    s = move(s, pick(s, 'red.intern', 'shop'));
    expect(R(s).white).toBe(1);
    s = scene({ res: [{ white: 1 }], members: [['trading.exporter']], shop: ['trading.broker'], ...buyTurn });
    s = move(s, pick(s, 'trading.broker', 'shop'));
    expect(R(s).white).toBe(0);
  });

  it('Raider: once per game, steal up to 4 loose followers from the leader and pay them 2 white', () => {
    let s = scene({ n: 3, res: [{ white: 3 }], bonus: [0, 6, 2], members: [['trading.raider']], ...buyTurn });
    const u = uidOf(s, 'trading.raider', 0);
    s = move(s, `use:${u}`);
    expect([B(s, 0), B(s, 1), B(s, 2), R(s, 0).white, R(s, 1).white]).toEqual([4, 2, 2, 1, 2]);
    expect(ids(s)).not.toContain(`use:${u}`);
    s = scene({ res: [{ white: 2 }], bonus: [0, 3], members: [['trading.raider']], ...buyTurn });
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect([B(s, 0), B(s, 1), R(s, 0).white, R(s, 1).white]).toEqual([3, 0, 0, 2]); // only 3 to steal
  });

  it('Raider: not while you lead, and not without 2 white; the use is not spent', () => {
    let s = scene({ res: [{ white: 5 }], bonus: [6, 4], members: [['trading.raider']], ...buyTurn });
    const u = uidOf(s, 'trading.raider', 0);
    s = move(s, `use:${u}`);
    expect([B(s, 0), B(s, 1), R(s).white]).toEqual([6, 4, 5]);
    expect(ids(s)).toContain(`use:${u}`);
    s = scene({ res: [{ white: 1 }], bonus: [0, 4], members: [['trading.raider']], ...buyTurn });
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect([B(s, 1), R(s).white]).toEqual([4, 1]);
    expect(ids(s)).toContain(`use:${uidOf(s, 'trading.raider', 0)}`);
  });

  it('Cashier: when recruited, turn all your white into followers', () => {
    let s = scene({ res: [{ white: 5 }], shop: ['trading.cashier'], ...buyTurn });
    s = move(s, pick(s, 'trading.cashier', 'shop'));
    expect(has(s, 'trading.cashier')).toBe(true);
    expect([R(s).white, B(s)]).toEqual([0, 3]); // paid 2 white, the other 3 turned
    let k = scene({ res: [{ white: 6 }], members: [['trading.changer']], shop: ['trading.cashier'], ...buyTurn });
    k = move(k, pick(k, 'trading.cashier', 'shop'));
    expect([R(k).white, B(k)]).toEqual([1, 4]); // Money Changer: +1 white after the turning
    let none = scene({ res: [{ white: 2 }], shop: ['trading.cashier'], ...buyTurn });
    none = move(none, pick(none, 'trading.cashier', 'shop'));
    expect([R(none).white, B(none)]).toEqual([0, 0]);
  });

  it('Undertaker: whenever you get rid of one of your members, +2 followers', () => {
    let s = take(scene({ round: 2, members: [['trading.undertaker', 'red.twins']] }), 'trading.estatesale');
    s = move(s, `card:${uidOf(s, 'red.twins', 0)}`);
    expect([R(s).white, B(s)]).toEqual([3, 2]);
    s = take(scene({ round: 2, members: [['trading.undertaker', 'red.twins']] }), 'trading.farewell');
    s = move(s, `card:${uidOf(s, 'red.twins', 0)}`);
    expect(B(s)).toBe(4);
  });

  it('Martyr: when it leaves your cult, followers equal to its cost', () => {
    let s = take(scene({ round: 2, members: [['trading.martyr']] }), 'trading.farewell');
    s = move(s, `card:${uidOf(s, 'trading.martyr', 0)}`);
    expect(B(s)).toBe(4); // Farewell 2, Martyr 2
    s = take(scene({ round: 2, members: [['trading.martyr']] }), 'trading.estatesale');
    s = move(s, `card:${uidOf(s, 'trading.martyr', 0)}`);
    expect([R(s).white, B(s)]).toEqual([3, 2]);
  });

  it('Money Changer: whenever you turn resources or members into followers, +1 white (once per turning)', () => {
    const bk = 'trading.changer';
    let s = take(scene({ round: 3, res: [{ red: 3 }], members: [[bk]] }), 'trading.exchange');
    s = move(move(move(s, 'color:red'), 'color:red'), 'color:red');
    expect([B(s), R(s).white]).toEqual([6, 2]); // +1 space, +1 Money Changer once
    s = take(scene({ round: 3, res: [{ white: 4 }], members: [[bk]] }), 'trading.cashin');
    expect([B(s), R(s).white]).toEqual([4, 2]);
    s = take(scene({ round: 2, members: [[bk, 'red.twins']] }), 'trading.farewell');
    s = move(s, `card:${uidOf(s, 'red.twins', 0)}`);
    expect([B(s), R(s).white]).toEqual([2, 2]);
    s = take(scene({ round: 2, members: [[bk, 'red.twins']] }), 'trading.estatesale');
    s = move(s, `card:${uidOf(s, 'red.twins', 0)}`);
    expect(R(s).white).toBe(3); // turned into white, not followers: no Money Changer
  });

  it('Appraiser: once per game, get rid of a member for followers or white equal to its cost', () => {
    let s = scene({ members: [['trading.appraiser', 'gold.midas']], ...buyTurn });
    const u = uidOf(s, 'trading.appraiser', 0), m = uidOf(s, 'gold.midas', 0);
    s = move(s, `use:${u}`);
    expect(ids(s)).toEqual([`card:${m}`]); // never itself
    s = move(s, `card:${m}`);
    expect(ids(s)).toEqual(['pick:followers', 'pick:white']);
    const f = move(s, 'pick:followers');
    expect([B(f), R(f).white, has(f, 'gold.midas')]).toEqual([5, 0, false]);
    expect(ids(f)).not.toContain(`use:${u}`);
    const w = move(s, 'pick:white');
    expect([B(w), R(w).white]).toEqual([0, 5]);
    let none = scene({ members: [['trading.appraiser']], ...buyTurn });
    none = move(none, `use:${uidOf(none, 'trading.appraiser', 0)}`);
    expect(ids(none)).toContain(`use:${uidOf(none, 'trading.appraiser', 0)}`); // nothing else to get rid of: not spent
  });

  it('Appraiser with Undertaker and Martyr: +2 more, and the Martyr pays its cost again', () => {
    let s = scene({ members: [['trading.appraiser', 'trading.undertaker', 'trading.martyr']], ...buyTurn });
    s = move(s, `use:${uidOf(s, 'trading.appraiser', 0)}`);
    s = move(move(s, `card:${uidOf(s, 'trading.martyr', 0)}`), 'pick:followers');
    expect(B(s)).toBe(2 + 2 + 2);
  });

  it('Hoarder: once per game, turn all your resources into white', () => {
    let s = scene({ res: [{ gold: 2, red: 3, blue: 1, white: 1 }], members: [['trading.hoarder']], ...buyTurn });
    const u = uidOf(s, 'trading.hoarder', 0);
    s = move(s, `use:${u}`);
    expect(R(s)).toEqual({ ...Z, white: 7 });
    expect(ids(s)).not.toContain(`use:${u}`);
    let w = scene({ res: [{ white: 3 }], members: [['trading.hoarder']], ...buyTurn });
    w = move(w, `use:${uidOf(w, 'trading.hoarder', 0)}`);
    expect(R(w).white).toBe(3);
    expect(ids(w)).toContain(`use:${uidOf(w, 'trading.hoarder', 0)}`); // only white: not spent
  });
});

describe(`White table: ${GAMES} seeded bot games`, () => {
  it('finish cleanly with every invariant holding', () => {
    for (let seed = 1; seed <= GAMES; seed++) {
      const n = 2 + (seed % 3);
      const rand = seededRandom(seed * 31 + n);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed, quadrants: Q });
      let k = 0;
      while (s.pending) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (++k % 7 === 0) checkInvariants(s, `white seed ${seed}`);
        if (k > 2500) throw new Error(`seed ${seed} did not end`);
      }
      checkInvariants(s, `white seed ${seed}`);
      expect(s.over).toBe(true);
      expect(s.ranking).toHaveLength(n);
      expect(followers(s, s.players[s.ranking[0]])).toBeGreaterThan(1);
    }
  });
});
