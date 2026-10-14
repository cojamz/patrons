// @vitest-environment node
// Blue (market): every action and every member with exact numbers, plus 200 seeded bot games on a Blue table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import market, { memberValue, priceyCount, install, setScoring, setBadge } from '../../../../engine/v4/content/market.js';
import { contextFor } from '../../../../engine/v4/core.js';
import { take, move, uidOf, ids, fol, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

install();
const Q = ['gold', 'red', 'market', 'green'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const MARKET_TEST_COSTS = {
  'market.stylist': [1, 1], 'market.onlooker': [1, 1], 'market.connoisseur': [2, 1], 'market.reseller': [2, 1],
  'market.curator': [2, 1], 'market.planner': [1, 1], 'market.underbidder': [1, 0], 'market.minimalist': [2, 1],
  'market.climber': [1, 1], 'market.auctioneer': [1, 1], 'market.sommelier': [1, 1], 'market.patroness': [3, 2],
  'market.blackmarket': [2, 2], 'market.snob': [3, 2], 'market.recluse': [2, 1],
};
let restore;
// These costs are the pre-doubling scale, so the badge cutoff goes back to 4 with them.
beforeEach(() => { restore = pinCosts({ ...TEST_COSTS, ...MARKET_TEST_COSTS }); setBadge(4); });
afterEach(() => { restore(); setBadge(8); });

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

describe('Blue scoring (switchable): most badged members (cost 4+), or most member value', () => {
  afterEach(() => setScoring('pricey'));
  it('member value counts printed cost, not what was paid', () => {
    const s = scene({ members: [['gold.midas', 'red.volunteer', 'red.twins'], ['red.intern']] });
    const ctx = contextFor(s);
    expect(memberValue(ctx, s.players[0])).toBe(5 + 0 + 2);
    expect(memberValue(ctx, s.players[1])).toBe(1);
  });
  it('badged (default): counts members costing 4 or more; blue members break ties; defs carry the badge', () => {
    const s = scene({ members: [['gold.midas', 'gold.tycoon', 'red.twins'], ['red.bigfamily', 'market.snob']] });
    const ctx = contextFor(s);
    expect(priceyCount(ctx, s.players[0])).toBe(2);
    expect(priceyCount(ctx, s.players[1])).toBe(2);
    expect(market.scoring.score(ctx, s.players[1])).toBeGreaterThan(market.scoring.score(ctx, s.players[0]));
    expect(market.members.find(d => d.key === 'snob').badge).toBe(true);
    expect(market.members.find(d => d.key === 'planner').badge).toBe(false);
    const t = scene({ members: [['red.twins', 'red.intern'], []] });
    expect(market.scoring.score(contextFor(t), t.players[0])).toBe(0); // nothing pricey scores nothing
  });
  it('value: total printed cost; no value scores nothing', () => {
    setScoring('value');
    const s = scene({ members: [['red.volunteer'], ['gold.taxman'], ['market.stylist']], n: 3 });
    const ctx = contextFor(s);
    expect(market.scoring.score(ctx, s.players[0])).toBe(0);
    expect(market.scoring.score(ctx, s.players[2])).toBeGreaterThan(market.scoring.score(ctx, s.players[1])); // both 2, blue breaks it
  });
  it('pays the ring value at round end', () => {
    const s = scene({ members: [['gold.midas'], ['gold.taxman']], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most badged members: P1 +2');
  });
});

describe('Blue actions', () => {
  it('Bargain (fill-in): +2 blue, then you may recruit a face-up member now at its cost, in any colors', () => {
    let s = take(scene({ res: [{ red: 5 }], shop: SHOP }), 'Bargain');
    expect(R(s).blue).toBe(2);
    expect(s.pending.kind).toBe('choose');
    expect(ids(s)).toContain(card(s, 'gold.jackpot')); // 6 of the 7 held
    s = move(s, card(s, 'gold.midas')); // 5, no gold needed
    expect(s.pending.prompt).toContain('how do you pay 5');
    s = move(s, 'pay:0-5-0-0');
    expect(has(s, 'gold.midas')).toBe(true);
    expect(R(s)).toEqual({ ...Z, blue: 2 });
    expect(s.pending.kind).toBe('buy'); // the normal buy is still to come
  });
  it('Bargain: you choose how to pay, and may recruit nothing', () => {
    let s = take(scene({ res: [{ red: 3, gold: 3 }], shop: SHOP }), 'Bargain');
    s = move(s, card(s, 'gold.tycoon')); // 4
    expect(s.pending.options[0].default ?? true).toBeTruthy();
    s = move(s, 'pay:3-1-0-0');
    expect(R(s)).toEqual({ ...Z, red: 2, blue: 2 });
    let t = take(scene({ res: [{ red: 5 }], shop: SHOP }), 'Bargain');
    t = move(t, 'none');
    expect(t.players[0].members).toEqual([]);
    expect(R(t)).toEqual({ ...Z, red: 5, blue: 2 });
  });
  it('Bargain: with nothing affordable, you just keep the 2 blue', () => {
    const s = take(scene({ res: [{ red: 1 }], shop: SHOP }), 'Bargain');
    expect(s.players[0].members).toEqual([]);
    expect(R(s).blue).toBe(2);
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
    expect(s.pending?.kind).not.toBe('buy'); // it was your buy
    // a member costing 1 is free
    let t = take(scene({ round: 2, shop: CHEAP }), 'Clearance');
    t = move(t, card(t, 'red.intern'));
    expect(has(t, 'red.intern')).toBe(true);
  });
  it('Price Check (ring II): blue equal to half the cost of your priciest member', () => {
    expect(R(take(scene({ round: 2, members: [['gold.tycoon', 'red.intern']] }), 'Price Check')).blue).toBe(2);
    expect(R(take(scene({ round: 2 }), 'Price Check')).blue).toBe(0);
  });
  it('Spree (ring III): three buys this turn', () => {
    let s = take(scene({ round: 3, res: [{ red: 8, gold: 8, green: 8 }], shop: CHEAP }), 'Spree');
    s = move(s, card(s, 'red.intern'));
    expect(s.pending.kind).toBe('buy');
    s = move(s, 'tier:big');
    expect(s.pending.kind).toBe('buy');
    s = move(s, card(s, 'red.twins'));
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].members).toHaveLength(2);
    expect(s.players[0].bonus).toBe(6);
  });
  it('Free recruits from Bargain trigger recruit hooks (Recruiter pays)', () => {
    let s = take(scene({ res: [{ green: 5 }], members: [['red.recruiter']], shop: SHOP }), 'Bargain');
    s = move(s, card(s, 'gold.midas'));
    s = move(s, 'pay:0-0-0-5');
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

  it('Stylist: whenever anyone recruits a blue member, +1 blue', () => {
    expect(R(rivalBuys([['market.stylist']], 'market.underbidder')).blue).toBe(1);
    expect(R(rivalBuys([['market.stylist']], 'red.intern')).blue).toBe(0);
  });
  it('Onlooker: whenever a rival recruits a badged member, +1 blue', () => {
    expect(R(rivalBuys([['market.onlooker']], 'gold.tycoon')).blue).toBe(1);
    expect(R(rivalBuys([['market.onlooker']], 'gold.taxman')).blue).toBe(0);
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
  it('Curator: round start, +1 blue per badged member', () => {
    expect(R(start([['market.curator', 'gold.midas', 'gold.tycoon', 'red.intern']])).blue).toBe(2); // Midas 5, Tycoon 4
  });
  it('Planner: round start, your next member costs 2 less per round number', () => {
    expect(start([['market.planner']]).players[0].discount).toBe(4);
  });
  it('Underbidder: round start, next member 2 less per rival with more members', () => {
    const s = scene({ n: 3, members: [['market.underbidder'], ['red.intern', 'red.volunteer'], ['red.twins', 'red.drive']], queue: [{ t: 'round', r: 2 }] });
    expect(s.players[0].discount).toBe(4);
    const t = scene({ n: 3, members: [['market.underbidder', 'red.twins'], ['red.intern', 'red.drive'], []], queue: [{ t: 'round', r: 2 }] });
    expect(t.players[0].discount).toBe(0);
  });
  it('Minimalist: round start, +1 blue per rival with more members', () => {
    const s = scene({ n: 3, members: [['market.minimalist'], ['red.intern', 'red.volunteer'], ['red.twins', 'red.drive']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).blue).toBe(2);
    const t = scene({ members: [['market.minimalist', 'red.twins'], ['red.intern']], queue: [{ t: 'round', r: 2 }] });
    expect(R(t).blue).toBe(0);
  });
  it('Social Climber: once per game at a round start, trade a member back to the pile; your next member costs that much less', () => {
    let s = start([['market.climber', 'gold.midas', 'red.intern']]);
    expect(s.pending.prompt).toContain('Social Climber');
    const m = uidOf(s, 'gold.midas', 0);
    s = move(s, `card:${m}`);
    expect(s.players[0].members.includes(m)).toBe(false);
    expect(s.pile.at(-1)).toBe(m);
    expect(s.players[0].discount).toBe(5);
    // once per game: next round start asks nothing
    const c = uidOf(s, 'market.climber', 0);
    expect(s.cards[c].used).toBe(true);
    s.round = 2; s.queue = [{ t: 'round', r: 3 }]; s = resume(s);
    expect(s.pending?.prompt || '').not.toContain('Social Climber');
    let k = start([['market.climber', 'red.intern']]);
    k = move(k, 'none');
    expect(k.players[0].members).toHaveLength(2);
    expect(k.cards[uidOf(k, 'market.climber', 0)].used).toBeFalsy(); // keeping everyone doesn't use it up
  });
  it('Auctioneer: whenever a rival recruits an unbadged member, +1 blue', () => {
    expect(R(rivalBuys([['market.auctioneer']], 'red.twins')).blue).toBe(1);
    expect(R(rivalBuys([['market.auctioneer']], 'gold.tycoon')).blue).toBe(0);
  });
  it('Sommelier: whenever you recruit a badged member, your next costs 2 less', () => {
    let s = take(scene({ res: [{ gold: 9 }], members: [['market.sommelier']], shop: SHOP }), 'Showroom');
    s = move(s, card(s, 'gold.tycoon'));
    expect(s.players[0].discount).toBe(2);
  });
  it('Patroness: whenever you recruit a badged member, +1 follower', () => {
    let s = take(scene({ res: [{ gold: 9 }], members: [['market.patroness']], shop: SHOP }), 'Showroom');
    s = move(s, card(s, 'gold.tycoon'));
    expect(s.players[0].bonus).toBe(1);
    let t = take(scene({ res: [{ red: 9 }], members: [['market.patroness']], shop: CHEAP }), 'Showroom');
    t = move(t, card(t, 'red.twins'));
    expect(t.players[0].bonus).toBe(0);
  });
  it('Black Market: once per game, also recruit one of the top 5 of the pile at its cost', () => {
    let s = scene({ res: [{ gold: 9 }], members: [['market.blackmarket']], shop: CHEAP, pileFirst: ['red.mob', 'red.host', 'gold.jackpot', 'red.sponsor', 'red.patriarch', 'gold.midas'] });
    s = take(s, 'Showroom');
    s = move(s, `use:${uidOf(s, 'market.blackmarket', 0)}`);
    s = move(s, 'pass'); // your normal buy comes first
    expect(s.pending.prompt).toContain('top 5');
    expect(ids(s)).not.toContain(`card:${uidOf(s, 'gold.midas', 'pile')}`); // 6th card is out of reach
    const j = uidOf(s, 'gold.jackpot', 'pile');
    s = move(s, `card:${j}`); // 3 gold + 3 any → all gold, one way to pay
    expect(has(s, 'gold.jackpot')).toBe(true);
    expect(R(s).gold).toBe(3);
    expect(s.shop).toHaveLength(6);
    expect(s.pile.includes(j)).toBe(false);
  });
  it('Snob: game end, +1 follower per badged member (itself included)', () => {
    const s = scene({ members: [['market.snob', 'gold.midas', 'gold.tycoon', 'red.intern']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(3);
  });
  it('Recluse: game end, +2 followers per rival with more members', () => {
    const s = scene({ n: 3, members: [['market.recluse'], ['red.intern', 'red.drive'], ['red.twins']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(2);
  });
});

describe('Blue table: 200 seeded bot games', () => {
  it('finish cleanly with invariants holding', { timeout: 120000 }, () => {
    const restoreReal = restore; restoreReal(); setBadge(8); restore = () => {};
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
