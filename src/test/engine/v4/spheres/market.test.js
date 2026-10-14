// @vitest-environment node
// Blue (market): every action and every member with exact numbers, plus 200 seeded bot games on a Blue table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import market, { memberValue, install } from '../../../../engine/v4/content/market.js';
import { contextFor } from '../../../../engine/v4/core.js';
import { take, move, uidOf, ids, fol, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

install();
const Q = ['gold', 'red', 'market', 'green'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const MARKET_TEST_COSTS = {
  'market.dealer': [1, 1], 'market.broker': [1, 1], 'market.connoisseur': [2, 1], 'market.reseller': [2, 1],
  'market.outfitter': [1, 1], 'market.collector': [2, 1], 'market.regular': [1, 1], 'market.promoter': [1, 0],
  'market.underbidder': [1, 0], 'market.windowshopper': [1, 1], 'market.shopper': [3, 2], 'market.shopaholic': [2, 1],
  'market.blackmarket': [2, 2], 'market.heirloom': [3, 2], 'market.appraiser': [3, 2],
};
let restore;
beforeEach(() => { restore = pinCosts({ ...TEST_COSTS, ...MARKET_TEST_COSTS }); });
afterEach(() => restore());

function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], turn = 0, queue = null, pileFirst = null } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q });
  s.queue = []; s.pending = null; s.round = round; s.slots = {}; s.order = []; s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = 3;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  if (pileFirst) s.pile.unshift(...pileFirst.map(grab));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: turn }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const Z = { gold: 0, red: 0, blue: 0, green: 0 };
const pass = s => move(s, 'pass');
const has = (s, def, i = 0) => s.players[i].members.some(u => s.cards[u].def === def);
// test costs: midas 5, jackpot 6, tycoon 4, mentor 5, proselytizer 6, bigfamily 4
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];
const CHEAP = ['red.intern', 'red.volunteer', 'red.twins', 'gold.taxman', 'red.drive', 'gold.thrift'];
const card = (s, def) => `card:${uidOf(s, def, 'shop')}`;

describe('Blue scoring: most member value (printed cost), blue members break ties', () => {
  it('counts printed cost, not what was paid', () => {
    const s = scene({ members: [['gold.midas', 'red.volunteer', 'red.twins'], ['red.intern']] });
    const ctx = contextFor(s);
    expect(memberValue(ctx, s.players[0])).toBe(5 + 0 + 2);
    expect(memberValue(ctx, s.players[1])).toBe(1);
  });
  it('no value scores nothing; a blue member breaks a tie', () => {
    const s = scene({ members: [['red.volunteer'], ['market.promoter'], []], n: 3 });
    const ctx = contextFor(s);
    expect(market.scoring.score(ctx, s.players[0])).toBe(0);
    const t = scene({ members: [['gold.taxman'], ['market.dealer']] }); // both worth 2
    const c2 = contextFor(t);
    expect(market.scoring.score(c2, t.players[1])).toBeGreaterThan(market.scoring.score(c2, t.players[0]));
  });
  it('pays the ring value at round end', () => {
    const s = scene({ members: [['gold.midas'], ['gold.taxman']], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most member value: P1 +2');
  });
});

describe('Blue actions', () => {
  it('Bargain: recruit a face-up member now for a third off (rounded up), in any colors; your buy is still to come', () => {
    let s = take(scene({ res: [{ red: 5, blue: 2 }], shop: SHOP }), 'Bargain');
    expect(s.pending.kind).toBe('choose');
    s = move(s, card(s, 'gold.midas')); // 5 → 3 (2 off), no gold needed
    expect(s.pending.prompt).toContain('how do you pay 3');
    s = move(s, 'pay:0-3-0-0');
    expect(has(s, 'gold.midas')).toBe(true);
    expect(R(s)).toEqual({ ...Z, red: 2, blue: 2 });
    expect(s.pending.kind).toBe('buy'); // the normal buy is still to come
    const t = take(scene({ res: [{ red: 3 }], shop: SHOP }), 'Bargain');
    expect(ids(t)).toContain(card(t, 'gold.midas'));
    expect(ids(t)).not.toContain(card(t, 'gold.jackpot')); // 6 → 4 is too much
  });
  it('Bargain: you choose how to pay, may recruit nothing; a 2-cost member costs 1', () => {
    let s = take(scene({ res: [{ red: 3, gold: 3 }], shop: SHOP }), 'Bargain');
    s = move(s, card(s, 'gold.tycoon')); // 4 → 2
    expect(s.pending.options[0].id).toBe('pay:0-2-0-0'); // default spends red before gold
    s = move(s, 'pay:2-0-0-0');
    expect(R(s)).toEqual({ ...Z, red: 3, gold: 1 });
    let t = take(scene({ res: [{ red: 5 }], shop: SHOP }), 'Bargain');
    t = move(t, 'none');
    expect(t.players[0].members).toEqual([]);
    expect(R(t).red).toBe(5);
    let u = take(scene({ res: [{ green: 1 }], shop: CHEAP }), 'Bargain');
    u = move(u, card(u, 'red.twins'));
    expect(has(u, 'red.twins')).toBe(true);
    expect(R(u).green).toBe(0);
  });
  it('Bargain: with nothing affordable, nothing happens', () => {
    const s = take(scene({ res: [{ red: 1 }], shop: SHOP }), 'Bargain');
    expect(s.players[0].members).toEqual([]);
    expect(s.log.join('\n')).toContain("Bargain: P1 can't pay for anything.");
  });
  it('Restock: +2 blue and six new members; the old row goes to the bottom of the pile', () => {
    const s0 = scene({ shop: SHOP });
    const old = [...s0.shop];
    const s = take(s0, 'Restock');
    expect(R(s).blue).toBe(2);
    expect(s.shop).toHaveLength(6);
    expect(s.shop.some(u => old.includes(u))).toBe(false);
    expect(s.pile.slice(-6)).toEqual(old);
  });
  it('Showroom: +1 blue per face-up member costing 4 or more', () => {
    expect(R(take(scene({ shop: SHOP }), 'Showroom')).blue).toBe(6);
    expect(R(take(scene({ shop: CHEAP }), 'Showroom')).blue).toBe(0);
    expect(R(take(scene({ shop: ['gold.midas', 'gold.tycoon', ...CHEAP.slice(0, 4)] }), 'Showroom')).blue).toBe(2);
  });
  it('Clearance (ring II): recruit a face-up member for half its cost, rounded down, any colors', () => {
    expect(() => take(scene({ round: 1, res: [{ red: 9 }], shop: SHOP }), 'Clearance')).toThrow();
    let s = take(scene({ round: 2, res: [{ green: 3 }], shop: SHOP }), 'Clearance');
    expect(ids(s)).toContain(card(s, 'gold.jackpot')); // 6 → 3
    s = move(s, card(s, 'gold.midas')); // 5 → 2
    expect(R(s)).toEqual({ ...Z, green: 1 });
    expect(has(s, 'gold.midas')).toBe(true);
    // a member costing 1 is free
    let t = take(scene({ round: 2, shop: CHEAP }), 'Clearance');
    t = move(t, card(t, 'red.intern'));
    expect(has(t, 'red.intern')).toBe(true);
  });
  it('Appraise (ring II): blue equal to the cost of your priciest member', () => {
    expect(R(take(scene({ round: 2, members: [['gold.tycoon', 'red.intern']] }), 'Appraise')).blue).toBe(4);
    expect(R(take(scene({ round: 2 }), 'Appraise')).blue).toBe(0);
  });
  it('Spree (ring III): two buys this turn', () => {
    let s = take(scene({ round: 3, res: [{ red: 6, gold: 6, green: 6 }], shop: CHEAP }), 'Spree');
    s = move(s, card(s, 'red.intern'));
    expect(s.pending.kind).toBe('buy');
    s = move(s, 'tier:big');
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].members).toHaveLength(1);
    expect(s.players[0].bonus).toBe(6);
  });
  it('Free recruits from Bargain trigger recruit hooks (Recruiter pays)', () => {
    let s = take(scene({ res: [{ green: 3 }], members: [['red.recruiter']], shop: SHOP }), 'Bargain');
    s = move(s, card(s, 'gold.midas'));
    expect(R(s).red).toBe(1);
  });
});

describe('Blue members', () => {
  const start = (members, res = [{}, {}], extra = {}) => scene({ members, res, queue: [{ t: 'round', r: 2 }], ...extra });
  // P2 recruits def from the shop by buying it outright
  const rivalBuys = (members, def, res = { red: 9, gold: 9, blue: 9 }) => {
    let s = scene({ members, res: [{}, res], shop: [def, ...CHEAP.filter(d => d !== def).slice(0, 5)], turn: 1 });
    s = take(s, 'Showroom');
    return move(s, card(s, def));
  };

  it('Dealer: whenever anyone recruits a blue member, +1 blue', () => {
    expect(R(rivalBuys([['market.dealer']], 'market.promoter')).blue).toBe(1);
    expect(R(rivalBuys([['market.dealer']], 'red.intern')).blue).toBe(0);
  });
  it('Broker: whenever a rival recruits a member costing 4 or more, +1 blue', () => {
    expect(R(rivalBuys([['market.broker']], 'gold.tycoon')).blue).toBe(1);
    expect(R(rivalBuys([['market.broker']], 'gold.taxman')).blue).toBe(0);
  });
  it('Connoisseur: whenever you recruit a member costing 4 or more, +2 blue', () => {
    let s = take(scene({ res: [{ gold: 9 }], members: [['market.connoisseur']], shop: SHOP }), 'Showroom');
    s = move(s, card(s, 'gold.tycoon'));
    expect(R(s).gold).toBe(6); // 3 gold + 1 any (paid in blue)
    expect(R(s).blue).toBe(6 - 1 + 2);
    let t = take(scene({ res: [{ red: 9 }], members: [['market.connoisseur']], shop: CHEAP }), 'Showroom');
    t = move(t, card(t, 'red.twins'));
    expect(R(t).blue).toBe(0);
  });
  it('Reseller: whenever you recruit, +1 of that member’s color', () => {
    let s = take(scene({ res: [{ gold: 9 }], members: [['market.reseller']], shop: SHOP }), 'Showroom');
    s = move(s, card(s, 'gold.tycoon'));
    expect(R(s)).toEqual({ gold: 9 - 3 + 1, red: 0, blue: 6 - 1, green: 0 });
  });
  it('Outfitter: +2 blue for your first member of each color', () => {
    let s = take(scene({ res: [{ red: 9 }], members: [['market.outfitter']], shop: CHEAP }), 'Showroom');
    s = move(s, card(s, 'red.intern'));
    expect(R(s).blue).toBe(2);
    let t = take(scene({ res: [{ red: 9 }], members: [['market.outfitter', 'red.volunteer']], shop: CHEAP.filter(d => d !== 'red.volunteer') }), 'Showroom');
    t = move(t, card(t, 'red.intern'));
    expect(R(t).blue).toBe(0);
  });
  it('Collector: round start, +1 blue per member costing 3 or more', () => {
    expect(R(start([['market.collector', 'gold.midas', 'red.intern']])).blue).toBe(2); // Collector 3, Midas 5
  });
  it('Regular: round start, your next member costs 1 less per round number', () => {
    expect(start([['market.regular']]).players[0].discount).toBe(2);
  });
  it('Promoter: whenever you buy followers, your next member costs 1 less', () => {
    let s = take(scene({ res: [{ red: 4 }], members: [['market.promoter']] }), 'Showroom');
    s = move(s, 'tier:small');
    expect(s.players[0].discount).toBe(1);
  });
  it('Underbidder: round start, next member 1 less per rival with more members', () => {
    const s = scene({ n: 3, members: [['market.underbidder'], ['red.intern', 'red.volunteer'], ['red.twins', 'red.drive']], queue: [{ t: 'round', r: 2 }] });
    expect(s.players[0].discount).toBe(2);
    const t = scene({ n: 3, members: [['market.underbidder', 'red.twins'], ['red.intern', 'red.drive'], []], queue: [{ t: 'round', r: 2 }] });
    expect(t.players[0].discount).toBe(0);
  });
  it('Window Shopper: once per round, sweep the row before buying; resets next round', () => {
    let s = take(scene({ members: [['market.windowshopper']], shop: SHOP }), 'Showroom');
    const old = [...s.shop];
    const u = uidOf(s, 'market.windowshopper', 0);
    s = move(s, `use:${u}`);
    expect(s.pending.kind).toBe('buy');
    expect(s.shop.some(x => old.includes(x))).toBe(false);
    expect(ids(s)).not.toContain(`use:${u}`);
    s.round = 1; s.queue = [{ t: 'round', r: 2 }]; s = resume(s);
    expect(s.cards[u].used).toBe(false);
  });
  it('Personal Shopper: once per round, one more buy this turn', () => {
    let s = take(scene({ res: [{ red: 9 }], members: [['market.shopper']], shop: CHEAP }), 'Showroom');
    s = move(s, `use:${uidOf(s, 'market.shopper', 0)}`);
    s = move(s, card(s, 'red.intern'));
    expect(s.pending.kind).toBe('buy');
    s = move(s, card(s, 'red.twins'));
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].members).toHaveLength(3);
  });
  it('Shopaholic: once per game, two more buys this turn', () => {
    let s = take(scene({ res: [{ red: 9 }], members: [['market.shopaholic']], shop: CHEAP }), 'Showroom');
    const u = uidOf(s, 'market.shopaholic', 0);
    s = move(s, `use:${u}`);
    s = move(s, card(s, 'red.intern'));
    s = move(s, card(s, 'red.twins'));
    s = move(s, card(s, 'red.drive'));
    expect(s.players[0].members).toHaveLength(4);
    expect(s.cards[u].used).toBe(true);
  });
  it('Black Market: once per game, also recruit any member from the pile at its cost', () => {
    let s = take(scene({ res: [{ gold: 9 }], members: [['market.blackmarket']], shop: CHEAP }), 'Showroom');
    s = move(s, `use:${uidOf(s, 'market.blackmarket', 0)}`);
    s = move(s, 'pass'); // your normal buy comes first
    expect(s.pending.prompt).toContain('Black Market');
    const j = uidOf(s, 'gold.jackpot', 'pile');
    s = move(s, `card:${j}`); // 3 gold + 3 any → all gold, one way to pay
    expect(has(s, 'gold.jackpot')).toBe(true);
    expect(R(s).gold).toBe(3);
    expect(s.shop).toHaveLength(6);
    expect(s.pile.includes(j)).toBe(false);
  });
  it('Heirloom: worth 3 followers', () => {
    const s = scene({ members: [['market.heirloom']] });
    expect(fol(s, 0)).toBe(4);
  });
  it('Appraiser: game end, +1 follower per member costing 4 or more (itself included)', () => {
    let s = scene({ members: [['market.appraiser', 'gold.midas', 'gold.tycoon', 'red.intern']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(3);
  });
});

describe('Blue table: 200 seeded bot games', () => {
  it('finish cleanly with invariants holding', { timeout: 120000 }, () => {
    const restoreReal = restore; restoreReal(); restore = () => {};
    let usedSpree = 0;
    for (let g = 1; g <= 200; g++) {
      const rand = seededRandom(g * 131);
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: Q });
      let k = 0;
      while (!s.over) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (g <= 25) checkInvariants(s, { seed: g });
        if (++k > 1500) throw new Error(`game ${g} stuck`);
      }
      if (s.log.some(l => l.includes('goes on a spree'))) usedSpree++;
      expect(s.ranking).toHaveLength(4);
      for (const p of s.players) expect(followers(s, p)).toBeGreaterThan(0);
    }
    expect(usedSpree).toBeGreaterThan(150);
  });
});
