// @vitest-environment node
// White (trading): every action and every member with exact numbers, plus 200 seeded bot games on a White table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import trading, { install, SELL_HIGH } from '../../../../engine/v4/content/trading.js';
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
  'trading.shopkeeper': [1, 1], 'trading.dealer': [1, 1], 'trading.pawnbroker': [1, 0], 'trading.safetynet': [1, 1],
  'trading.tipster': [1, 1], 'trading.lender': [1, 0], 'trading.magnate': [3, 2], 'trading.shareholder': [2, 2],
  'trading.heiress': [2, 2], 'trading.bulkbuyer': [3, 2], 'trading.broker': [1, 0], 'trading.exporter': [1, 1],
  'trading.liquidator': [1, 1], 'trading.reinvestor': [1, 1], 'trading.raider': [2, 1],
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
  it('Sob Story: +2 white, +1 per player with more followers than you', () => {
    expect(R(take(scene({ n: 4 }), 'trading.haggle')).white).toBe(2); // everyone tied at 1
    expect(R(take(scene({ n: 4, bonus: [0, 3, 1, 0] }), 'trading.haggle')).white).toBe(4);
    expect(R(take(scene({ n: 4, bonus: [5, 3, 1, 0] }), 'trading.haggle')).white).toBe(2);
  });

  it('Cheap Seats (round I): trade up to 2 resources (you pick) for followers, 1 for 1', () => {
    let s = take(scene({ res: [{ gold: 3, red: 1 }] }), 'trading.buylow');
    expect(ids(s)).toEqual(['color:gold', 'color:red', 'done']);
    s = move(s, 'color:red');
    expect(ids(s)).toEqual(['color:gold', 'done']);
    s = move(s, 'color:gold');
    expect(s.pending.kind).toBe('buy'); // round I: 2 at most
    expect(R(s)).toEqual({ ...Z, gold: 2 });
    expect(B(s)).toBe(2);
    expect(F(s)).toBe(3);
  });

  it('Cheap Seats: up to 2 per round number; Done stops early; nothing to pay, nothing happens', () => {
    let s = take(scene({ round: 3, res: [{ gold: 2, red: 5 }] }), 'trading.buylow');
    for (let k = 0; k < 5; k++) s = move(s, 'color:red');
    s = move(s, 'color:gold');
    expect(R(s)).toEqual({ ...Z, gold: 1 });
    expect(B(s)).toBe(6);
    s = move(move(take(scene({ round: 2, res: [{ blue: 3 }] }), 'trading.buylow'), 'color:blue'), 'done');
    expect(R(s).blue).toBe(2);
    expect(B(s)).toBe(1);
    s = take(scene({}), 'trading.buylow');
    expect(B(s)).toBe(0);
    expect(s.pending?.kind).not.toBe('choose');
  });

  it('Your Call: per round number, +1 follower or +2 white (you pick how many of each)', () => {
    let r3 = take(scene({ round: 3, bonus: [5] }), 'trading.pawn');
    expect(ids(r3)).toEqual(['amount:0', 'amount:1', 'amount:2', 'amount:3']);
    const mix = move(r3, 'amount:2');
    expect(R(mix).white).toBe(4);
    expect(B(mix)).toBe(6);
    const allWhite = move(r3, 'amount:3');
    expect([R(allWhite).white, B(allWhite)]).toEqual([6, 5]);
    const allFollowers = move(r3, 'amount:0');
    expect([R(allFollowers).white, B(allFollowers)]).toEqual([0, 8]);
    expect(allFollowers.log.join('\n')).toContain("P1's Your Call: +3 followers.");
  });

  it('Your Call in round I is live with nothing bought or won: 1 follower or 2 white (Cory found the old sale dead here)', () => {
    let s = take(scene({ members: [['red.twins', 'red.intern']] }), 'trading.pawn');
    expect(ids(s)).toEqual(['amount:0', 'amount:1']);
    const f = move(s, 'amount:0');
    expect([R(f).white, B(f), F(f)]).toEqual([0, 1, 5]);
    const w = move(s, 'amount:1');
    expect([R(w).white, B(w), F(w)]).toEqual([2, 0, 4]);
    expect(w.pending.kind).toBe('buy');
  });

  it('Sell High (ring II): sell up to 2 followers for 3 white each', () => {
    expect(() => take(scene({ round: 1, bonus: [4] }), 'trading.sellhigh')).toThrow();
    let s = take(scene({ round: 2, bonus: [4] }), 'trading.sellhigh');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(6);
    expect(B(s)).toBe(2);
    s = take(scene({ round: 2, bonus: [1] }), 'trading.sellhigh');
    expect(ids(s)).toEqual(['amount:0', 'amount:1']);
    s = take(scene({ round: 2 }), 'trading.sellhigh');
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.log.join('\n')).toContain('Sell High: P1 has no loose followers to sell');
  });

  it('Dividend (ring II): +1 white per loose follower; never yourself or a member, and nothing leaves', () => {
    expect(() => take(scene({ round: 1, bonus: [4] }), 'trading.dividend')).toThrow();
    let s = take(scene({ round: 2, bonus: [5], members: [['red.twins']] }), 'trading.dividend');
    expect([R(s).white, B(s)]).toEqual([5, 5]);
    expect(s.pending.kind).toBe('buy'); // no question: the buy follows
    s = take(scene({ round: 3, bonus: [0], members: [['red.twins']] }), 'trading.dividend');
    expect(R(s)).toEqual(Z);
    expect(s.log.join('\n')).toContain("P1's Dividend: no loose followers yet");
  });

  it('All In (ring III): trade all your resources for followers 1 for 1, or all but your white', () => {
    let s = take(scene({ round: 3, res: [{ white: 5, gold: 2, red: 1 }] }), 'trading.boom');
    expect(ids(s)).toEqual(['boom:all', 'boom:keep', 'boom:none']);
    const all = move(s, 'boom:all');
    expect(R(all)).toEqual(Z);
    expect(B(all)).toBe(8);
    const keep = move(s, 'boom:keep');
    expect(R(keep)).toEqual({ ...Z, white: 5 });
    expect(B(keep)).toBe(3);
    expect(ids(take(scene({ round: 3, res: [{ gold: 2 }] }), 'trading.boom'))).toEqual(['boom:all', 'boom:none']);
    const none = take(scene({ round: 3 }), 'trading.boom');
    expect(none.pending?.kind).not.toBe('choose');
  });

  it('Midas takes action gains as gold, sales included', () => {
    let s = take(scene({ bonus: [2], members: [['gold.midas']] }), 'trading.pawn');
    s = move(s, 'amount:1');
    expect(R(s)).toEqual({ ...Z, gold: 2 });
    s = move(take(scene({ round: 2, bonus: [2], members: [['gold.midas']] }), 'trading.sellhigh'), 'amount:2');
    expect(R(s)).toEqual({ ...Z, gold: 2 * SELL_HIGH.each });
  });

  it('a bot sells early and keeps its followers on its last turn', () => {
    let s = take(scene({ round: 2, bonus: [4] }), 'trading.sellhigh');
    s = applyMove(s, chooseBotMove(s, () => 0.5));
    expect(B(s)).toBe(2);
    s = take(scene({ round: 3, bonus: [4], left: 1 }), 'trading.sellhigh');
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
    let s = take(scene({ round: 2, bonus: [3], members: [['trading.dealer']] }), 'trading.sellhigh');
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(8);
  });

  it('Pawnbroker: once per round, sell 1 follower for 3 white; resets each round', () => {
    let s = take(scene({ bonus: [2], members: [['trading.pawnbroker']] }), 'trading.haggle');
    const u = uidOf(s, 'trading.pawnbroker', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(5);
    expect(B(s)).toBe(1);
    expect(ids(s)).not.toContain(`use:${u}`);
    // a new round brings it back
    s.cards[u].used = true;
    s.queue = [{ t: 'round', r: 2 }];
    s = resume(s);
    expect(s.cards[u].used).toBe(false);
  });

  it('Pawnbroker: with nothing to sell, the use is not spent', () => {
    let s = take(scene({ members: [['trading.pawnbroker']] }), 'trading.haggle');
    const u = uidOf(s, 'trading.pawnbroker', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(2);
    expect(ids(s)).toContain(`use:${u}`);
  });

  it('Rich Uncle: at round start, +3 white only if you have none', () => {
    expect(R(start([['trading.safetynet']])).white).toBe(3);
    expect(R(start([['trading.safetynet']], [{ white: 1 }, {}])).white).toBe(1);
  });

  it('Tipster: whenever a rival buys followers, +1 white (not your own buys)', () => {
    let s = scene({ turn: 1, res: [{}, { red: 2 }], members: [['trading.tipster']] });
    s = take(s, 'trading.haggle');
    s = move(s, 'tier:small');
    expect(R(s, 0).white).toBe(1);
    s = scene({ res: [{ red: 2 }], members: [['trading.tipster']] });
    s = move(take(s, 'gold.rush'), 'tier:small');
    expect(R(s, 0).white).toBe(0);
  });

  it('Lender: +5 white when recruited; game end, lose 2 followers (only won or bought ones)', () => {
    let s = scene({ res: [{ white: 1 }], bonus: [5], shop: ['trading.lender'] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'trading.lender', 'shop')}`);
    expect(R(s).white).toBe(5); // paid once, not again at turn end
    expect(F(s)).toBe(7);
    s = scene({ bonus: [5], members: [['trading.lender']], queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(3);
    s = scene({ bonus: [1], members: [['trading.lender']], queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(0);
    expect(F(s)).toBe(2); // yourself + the Lender: the debt never touches yourself or a member
  });

  it('Lender: a Doppelganger copying it is a full copy, +5 white included', () => {
    let s = scene({ res: [{ green: 2, gold: 2 }], members: [['trading.lender']], shop: ['echo.doppel'] });
    s.cards[uidOf(s, 'trading.lender', 0)].loanPaid = true; // the original already paid out
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'echo.doppel', 'shop')}`);
    s = move(s, `card:${uidOf(s, 'trading.lender', 0)}`);
    expect(R(s).white).toBe(5);
    s.players[0].bonus = 6;
    s.queue = [{ t: 'finish' }];
    s = resume(s);
    expect(B(s)).toBe(2); // two debts of 2
  });

  it('Magnate: game end, +1 follower per 3 white', () => {
    const s = scene({ res: [{ white: 8 }], members: [['trading.magnate']], queue: [{ t: 'finish' }] });
    expect(B(s)).toBe(2);
  });

  it('Shareholder: worth 3 followers', () => {
    const s = scene({ members: [['trading.shareholder']] });
    expect(F(s)).toBe(4);
  });

  it('Heiress: once per game, +1 white per member you have', () => {
    let s = take(scene({ round: 3, members: [['trading.heiress', 'red.twins', 'gold.banker']] }), 'gold.rush');
    const u = uidOf(s, 'trading.heiress', 0);
    s = move(s, `use:${u}`);
    expect(R(s).white).toBe(3); // Heiress, Twins, Banker
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Bulk Buyer: whenever you buy 3 or 6 followers, +1 more (not the 2-for-1 buy)', () => {
    let s = take(scene({ res: [{ red: 2, blue: 2 }], members: [['trading.bulkbuyer']] }), 'trading.haggle');
    s = move(s, 'tier:mid');
    expect(B(s)).toBe(4);
    s = move(take(scene({ res: [{ red: 2 }], members: [['trading.bulkbuyer']] }), 'trading.haggle'), 'tier:small');
    expect(B(s)).toBe(1);
  });

  it('Broker: whenever a White action gives you followers, +1 more (once per action)', () => {
    let s = move(take(scene({ res: [{ red: 1 }], members: [['trading.broker']] }), 'trading.buylow'), 'color:red');
    expect(B(s)).toBe(2); // 1, +1 Broker
    s = move(move(take(scene({ res: [{ red: 2 }], members: [['trading.broker']] }), 'trading.buylow'), 'color:red'), 'color:red');
    expect(B(s)).toBe(3); // 2 traded, +1 Broker once (not once per resource)
    s = move(take(scene({ round: 3, res: [{ white: 2 }], members: [['trading.broker']] }), 'trading.boom'), 'boom:all');
    expect(B(s)).toBe(3);
    s = move(take(scene({ round: 2, members: [['trading.broker']] }), 'trading.pawn'), 'amount:0');
    expect(B(s)).toBe(3); // 2 followers, +1 Broker
    s = move(take(scene({ round: 2, members: [['trading.broker']] }), 'trading.pawn'), 'amount:2');
    expect([B(s), R(s).white]).toEqual([0, 4]); // all white: no followers, no Broker
    s = take(scene({ round: 3, members: [['trading.broker']] }), 'trading.boom');
    expect(B(s)).toBe(0); // nothing traded, no bonus
    s = move(take(scene({ res: [{ red: 2 }], members: [['trading.broker']] }), 'gold.rush'), 'tier:small');
    expect(B(s)).toBe(1); // follower buys aren't White actions
  });

  it('Exporter: whenever you recruit a non-white member, +1 white', () => {
    let s = scene({ res: [{ red: 1, gold: 2 }], members: [['trading.exporter']], shop: ['red.intern', 'trading.broker', ...SHOP.slice(0, 4)] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(R(s).white).toBe(1);
    s = scene({ res: [{ white: 1 }], members: [['trading.exporter']], shop: ['trading.broker', ...SHOP.slice(0, 5)] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'trading.broker', 'shop')}`);
    expect(R(s).white).toBe(0);
  });

  it('Liquidator: once per game, sell up to 5 followers for 2 white each, right when you use it', () => {
    let s = take(scene({ round: 2, bonus: [7], members: [['trading.liquidator', 'trading.dealer']] }), 'gold.rush');
    const u = uidOf(s, 'trading.liquidator', 0);
    s = move(s, `use:${u}`);
    expect(B(s)).toBe(2);
    expect(R(s).white).toBe(15); // 10, +5 Dealer
    expect(ids(s)).not.toContain(`use:${u}`);
    s = take(scene({ round: 2, members: [['trading.liquidator']] }), 'gold.rush');
    s = move(s, `use:${uidOf(s, 'trading.liquidator', 0)}`);
    expect(ids(s)).toContain(`use:${uidOf(s, 'trading.liquidator', 0)}`); // nothing to sell: not spent
  });

  it('Reinvestor: selling followers knocks 2 per follower off your next member', () => {
    let s = take(scene({ round: 2, bonus: [3], members: [['trading.reinvestor']] }), 'trading.sellhigh');
    s = move(s, 'amount:2');
    expect(s.players[0].discount).toBe(4);
  });

  it('Raider: once per game, buy up to 3 followers from the leader at 1 white each; they get the white', () => {
    let s = scene({ n: 3, res: [{ white: 7 }], bonus: [0, 6, 2], members: [['trading.raider']] });
    s = take(s, 'trading.haggle'); // +2 + 2 ahead = 4 → 11 white
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect(ids(s)).toEqual(['amount:1', 'amount:2', 'amount:3']); // "up to 3": the player picks how many
    s = move(s, 'amount:3');
    expect(B(s, 0)).toBe(3);
    expect(B(s, 1)).toBe(3);
    expect(R(s, 0).white).toBe(8);
    expect(R(s, 1).white).toBe(3);
    s = take(scene({ n: 2, res: [{ white: 2 }], bonus: [0, 5], members: [['trading.raider']] }), 'gold.rush');
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect(ids(s)).toEqual(['amount:1', 'amount:2']); // only 2 white to pay with
    s = move(s, 'amount:2');
    expect(B(s, 0)).toBe(2);
    expect(R(s, 1).white).toBe(2);
  });

  it('Raider: not while you lead, and buys only what you can pay for', () => {
    let s = take(scene({ res: [{ white: 9 }], bonus: [6, 4], members: [['trading.raider']] }), 'gold.rush');
    const u = uidOf(s, 'trading.raider', 0);
    s = move(s, `use:${u}`);
    expect(B(s, 1)).toBe(4);
    expect(ids(s)).toContain(`use:${u}`); // not spent
    s = take(scene({ bonus: [0, 4], members: [['trading.raider']] }), 'gold.rush');
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    expect(B(s, 1)).toBe(4); // no white, no deal
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
