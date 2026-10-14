// @vitest-environment node
// White (trading): every action and every member with exact numbers, plus 200 seeded bot games on a White table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import trading, { install } from '../../../../engine/v4/content/trading.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

install();
const Q = ['gold', 'red', 'blue', 'trading'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const WHITE_TEST_COSTS = {
  'trading.shopkeeper': [1, 1], 'trading.dealer': [1, 1], 'trading.pawnbroker': [1, 0], 'trading.comeback': [1, 1],
  'trading.tipster': [1, 1], 'trading.lender': [1, 0], 'trading.magnate': [3, 2], 'trading.shareholder': [2, 2],
  'trading.heiress': [2, 2], 'trading.bargain': [3, 2], 'trading.regular': [1, 0], 'trading.exporter': [1, 1],
  'trading.changer': [1, 1], 'trading.reinvestor': [1, 1], 'trading.raider': [2, 1],
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
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no ${def}`); return s.pile.splice(k, 1)[0]; };
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
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];

describe('White scoring: most white', () => {
  it('scores white held', () => {
    expect(trading.scoring.score({}, { res: { ...Z, white: 4 } })).toBe(4);
  });
  it('pays the ring value to the leader at round end; no white, no score; ties all score', () => {
    let s = scene({ n: 3, res: [{ white: 3 }, { white: 1 }, {}], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most white: P1 +2');
    s = scene({ n: 3, res: [{ white: 2 }, { white: 2 }, {}], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most white: P1 & P2 +2');
    s = scene({ n: 2, res: [{ gold: 2 }, {}], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).not.toContain('Most white');
  });
});

describe('White actions', () => {
  it('Haggle: +2 white, +1 per player with more followers than you', () => {
    expect(R(take(scene({ n: 4 }), 'Haggle')).white).toBe(2); // everyone tied at 1
    expect(R(take(scene({ n: 4, bonus: [0, 3, 1, 0] }), 'Haggle')).white).toBe(4);
    expect(R(take(scene({ n: 4, bonus: [5, 3, 1, 0] }), 'Haggle')).white).toBe(2);
  });

  it('Buy Low: trade 1 resource (you pick) for 2 followers', () => {
    let s = take(scene({ res: [{ gold: 2, red: 1 }] }), 'Buy Low');
    expect(ids(s)).toEqual(['color:gold', 'color:red']);
    s = move(s, 'color:red');
    expect(R(s)).toEqual({ ...Z, gold: 2 });
    expect(B(s)).toBe(2);
    expect(F(s)).toBe(3);
  });

  it('Buy Low: one color pays itself; with nothing to pay it does nothing', () => {
    let s = take(scene({ res: [{ blue: 2 }] }), 'Buy Low');
    expect(s.pending.kind).toBe('buy');
    expect(R(s).blue).toBe(1);
    expect(B(s)).toBe(2);
    s = take(scene({}), 'Buy Low');
    expect(B(s)).toBe(0);
  });

  it('Pawn: +2 white; may sell 1 follower for 2 white', () => {
    let s = take(scene({ bonus: [3] }), 'Pawn');
    expect(R(s).white).toBe(2);
    expect(ids(s)).toEqual(['amount:0', 'amount:1']);
    s = move(s, 'amount:1');
    expect(R(s).white).toBe(4);
    expect(B(s)).toBe(2);
    s = move(take(scene({ bonus: [3] }), 'Pawn'), 'amount:0');
    expect(R(s).white).toBe(2);
    expect(B(s)).toBe(3);
  });

  it('Pawn: with no followers to sell (members and yourself never sell), just +2 white', () => {
    const s = take(scene({ members: [['red.twins', 'red.intern']] }), 'Pawn');
    expect(s.pending.kind).toBe('buy');
    expect(R(s).white).toBe(2);
    expect(F(s)).toBe(4);
  });

  it('Sell High (ring II): sell up to 2 followers for 3 white each', () => {
    expect(() => take(scene({ round: 1, bonus: [4] }), 'Sell High')).toThrow();
    let s = take(scene({ round: 2, bonus: [4] }), 'Sell High');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(6);
    expect(B(s)).toBe(2);
    s = take(scene({ round: 2, bonus: [1] }), 'Sell High');
    expect(ids(s)).toEqual(['amount:0', 'amount:1']);
    s = take(scene({ round: 2 }), 'Sell High');
    expect(s.pending.kind).toBe('buy');
    expect(s.log.join('\n')).toContain('P1 had no followers to sell.');
  });

  it('Cash In (ring II): +1 follower, then trade white for followers 1 for 1', () => {
    let s = take(scene({ round: 2, res: [{ white: 8 }] }), 'Cash In');
    expect(B(s)).toBe(1);
    expect(ids(s)).toEqual(['amount:0', 'amount:2', 'amount:4', 'amount:6', 'amount:8']);
    s = move(s, 'amount:6');
    expect(R(s).white).toBe(2);
    expect(B(s)).toBe(7);
    s = take(scene({ round: 2 }), 'Cash In');
    expect(s.pending.kind).toBe('buy');
    expect(B(s)).toBe(1);
  });

  it('Boom (ring III): each white becomes 2 followers', () => {
    const s = take(scene({ round: 3, res: [{ white: 5, gold: 2 }] }), 'Boom');
    expect(R(s)).toEqual({ ...Z, gold: 2 });
    expect(B(s)).toBe(10);
  });

  it('Midas takes action gains as gold, sales included', () => {
    let s = take(scene({ bonus: [2], members: [['gold.midas']] }), 'Pawn');
    s = move(s, 'amount:1');
    expect(R(s)).toEqual({ ...Z, gold: 4 });
  });

  it('a bot sells early and keeps its followers on its last turn', () => {
    let s = take(scene({ round: 2, bonus: [4] }), 'Sell High');
    s = applyMove(s, chooseBotMove(s, () => 0.5));
    expect(B(s)).toBe(2);
    s = take(scene({ round: 3, bonus: [4], left: 1 }), 'Sell High');
    s = applyMove(s, chooseBotMove(s, () => 0.5));
    expect(B(s)).toBe(4);
  });
});

describe('White members', () => {
  const start = (members, res = [{}, {}], extra = {}) => scene({ members, res, queue: [{ t: 'round', r: 2 }], ...extra });

  it('Shopkeeper: at round start, +2 white', () => {
    expect(R(start([['trading.shopkeeper']])).white).toBe(2);
  });

  it('Dealer: whenever you sell followers, +1 white each', () => {
    let s = take(scene({ round: 2, bonus: [3], members: [['trading.dealer']] }), 'Sell High');
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(8);
  });

  it('Pawnbroker: once per round, sell 1 follower for 3 white; resets each round', () => {
    let s = take(scene({ bonus: [2], members: [['trading.pawnbroker']] }), 'Haggle');
    const u = uidOf(s, 'trading.pawnbroker', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(5);
    expect(B(s)).toBe(1);
    expect(ids(s)).not.toContain(`use:${u}`);
    s = scene({ bonus: [2], members: [['trading.pawnbroker']], queue: [{ t: 'round', r: 2 }] });
    s.players[0].members.forEach(x => { s.cards[x].used = true; });
    s = scene({ bonus: [2], members: [['trading.pawnbroker']], queue: [{ t: 'round', r: 2 }] });
    expect(s.cards[uidOf(s, 'trading.pawnbroker', 0)].used).toBe(false);
  });

  it('Pawnbroker: with nothing to sell, the use is not spent', () => {
    let s = take(scene({ members: [['trading.pawnbroker']] }), 'Haggle');
    const u = uidOf(s, 'trading.pawnbroker', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(2);
    expect(ids(s)).toContain(`use:${u}`);
  });

  it('Comeback Kid: at round start, +1 white per player with more followers than you', () => {
    const s = scene({ n: 4, bonus: [0, 2, 3, 0], members: [['trading.comeback']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).white).toBe(2); // P1 has 2 (self + Comeback Kid): P2 and P3 have more, P4 has fewer
  });

  it('Tipster: whenever a rival buys followers, +1 white (not your own buys)', () => {
    let s = scene({ turn: 1, res: [{}, { red: 2 }], members: [['trading.tipster']] });
    s = take(s, 'Haggle');
    s = move(s, 'tier:small');
    expect(R(s, 0).white).toBe(1);
    s = scene({ res: [{ red: 2 }], members: [['trading.tipster']] });
    s = move(take(s, 'Pawn'), 'tier:small');
    expect(R(s, 0).white).toBe(0);
  });

  it('Lender: +5 white when recruited; game end, lose 2 followers (only won or bought ones)', () => {
    let s = scene({ res: [{ white: 1 }], bonus: [5], shop: ['trading.lender'] });
    s = take(s, 'Rush');
    s = move(s, `card:${uidOf(s, 'trading.lender', 'shop')}`);
    expect(R(s).white).toBe(5);
    expect(F(s)).toBe(7);
    s = scene({ bonus: [5, 1], members: [['trading.lender'], ['trading.lender']].slice(0, 1), queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(3);
    s = scene({ bonus: [1], members: [['trading.lender']], queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(0);
    expect(F(s)).toBe(2); // yourself + the Lender
  });

  it('Magnate: game end, +1 follower per 2 white', () => {
    const s = scene({ res: [{ white: 7 }], members: [['trading.magnate']], queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(3);
  });

  it('Shareholder: worth 3 followers', () => {
    const s = scene({ members: [['trading.shareholder']] });
    expect(F(s)).toBe(4);
  });

  it('Heiress: once per game, gain followers equal to your white (keep the white)', () => {
    let s = take(scene({ round: 3, res: [{ white: 6 }], members: [['trading.heiress']] }), 'Rush');
    const u = uidOf(s, 'trading.heiress', 0);
    s = move(s, `use:${u}`);
    expect(B(s)).toBe(6);
    expect(R(s).white).toBe(6);
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Bargain Hunter: whenever you buy followers, +1 more', () => {
    let s = take(scene({ res: [{ red: 2, blue: 2 }], members: [['trading.bargain']] }), 'Haggle');
    s = move(s, 'tier:mid');
    expect(B(s)).toBe(4);
  });

  it('Regular: whenever you buy followers, +1 white', () => {
    let s = take(scene({ res: [{ red: 2 }], members: [['trading.regular']] }), 'Rush');
    s = move(s, 'tier:small');
    expect(R(s).white).toBe(1);
    expect(B(s)).toBe(1);
  });

  it('Exporter: whenever you recruit a non-white member, +1 white', () => {
    let s = scene({ res: [{ red: 1, gold: 2 }], members: [['trading.exporter']], shop: ['red.intern', 'trading.regular', ...SHOP.slice(0, 4)] });
    s = take(s, 'Rush');
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(R(s).white).toBe(1);
    s = scene({ res: [{ white: 1 }], members: [['trading.exporter']], shop: ['trading.regular', ...SHOP.slice(0, 5)] });
    s = take(s, 'Rush');
    s = move(s, `card:${uidOf(s, 'trading.regular', 'shop')}`);
    expect(R(s).white).toBe(0);
  });

  it('Money Changer: an action gaining 3+ of another color gives +1 white', () => {
    expect(R(take(scene({ members: [['trading.changer']] }), 'Joint Venture')).white).toBe(1);
    expect(R(take(scene({ members: [['trading.changer']] }), 'Rush')).white).toBe(0); // only 2 gold
    expect(R(take(scene({ members: [['trading.changer']] }), 'Haggle')).white).toBe(2); // white itself doesn't count
  });

  it('Reinvestor: selling followers knocks 1 per follower off your next member', () => {
    let s = take(scene({ round: 2, bonus: [3], members: [['trading.reinvestor']] }), 'Sell High');
    s = move(s, 'amount:2');
    expect(s.players[0].discount).toBe(2);
  });

  it('Raider: once per game, buy up to 3 followers from the leader at 2 white each; they get the white', () => {
    let s = scene({ n: 3, res: [{ white: 7 }], bonus: [0, 6, 2], members: [['trading.raider']] });
    s = take(s, 'Haggle'); // +2 + 2 ahead = 4 → 11 white
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect(B(s, 0)).toBe(3);
    expect(B(s, 1)).toBe(3);
    expect(R(s, 0).white).toBe(5);
    expect(R(s, 1).white).toBe(6);
  });

  it('Raider: not while you lead, and buys only what you can pay for', () => {
    let s = take(scene({ res: [{ white: 9 }], bonus: [6, 4], members: [['trading.raider']] }), 'Rush');
    const u = uidOf(s, 'trading.raider', 0);
    s = move(s, `use:${u}`);
    expect(B(s, 1)).toBe(4);
    expect(ids(s)).toContain(`use:${u}`); // not spent
    s = take(scene({ res: [{ white: 1 }], bonus: [0, 4], members: [['trading.raider']] }), 'Rush');
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect(B(s, 1)).toBe(4);
    expect(R(s, 0).white).toBe(1);
  });
});

describe('White table: 200 seeded bot games', () => {
  it('finish cleanly with every invariant holding', { timeout: 180000 }, () => {
    for (let seed = 1; seed <= 200; seed++) {
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
