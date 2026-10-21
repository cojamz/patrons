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
import { shopSize } from '../../../../engine/v4/core.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (budget.js). The verdict plays all 200 here,
// not half: the block asserts a rate (Spree in over 60% of games), and a rate needs its whole sample. The fast gate 20.
const GAMES = games(200, 20, 200);

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
beforeEach(() => { restore = pinCosts({ ...TEST_COSTS, ...MARKET_TEST_COSTS }); });
afterEach(() => { restore(); });

function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], turn = 0, queue = null, pileFirst = null, rules = {} } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q, rules });
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

describe('Blue scoring: most blue held', () => {
  it('member value (a helper the sims use) counts printed cost, not what was paid', () => {
    const s = scene({ members: [['gold.midas', 'red.volunteer', 'red.twins'], ['red.intern']] });
    const ctx = contextFor(s);
    expect(memberValue(ctx, s.players[0])).toBe(5 + 0 + 2);
    expect(memberValue(ctx, s.players[1])).toBe(1);
  });
  it('scores the blue you hold; members and other colors do not count', () => {
    const s = scene({ res: [{ blue: 3, gold: 9 }, { blue: 5 }], members: [['market.snob', 'market.stylist'], []] });
    const ctx = contextFor(s);
    expect(market.scoring.label).toBe('Most blue');
    expect(market.scoring.score(ctx, s.players[0])).toBe(3);
    expect(market.scoring.score(ctx, s.players[1])).toBe(5);
  });
  it('pays the ring value at round end', () => {
    const s = scene({ res: [{ blue: 2 }, { blue: 1 }], members: [[], ['gold.midas', 'market.snob']], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most blue: P1 +2');
  });
});

describe('Blue actions', () => {
  const S5 = SHOP.slice(0, 5);
  it('Churn (ring I): +1 blue × round and +1; send exactly 3 members to the bottom; the row refills once, after', () => {
    let s = take(scene({ shop: S5 }), 'market.bargain');
    expect(R(s).blue).toBe(2);
    const sent = [];
    for (let k = 0; k < 3; k++) { sent.push(s.pending.options.at(-1).value); s = move(s, s.pending.options.at(-1).id); }
    expect(s.pending.kind).toBe('buy');
    expect(s.pile.slice(-3)).toEqual(sent);
    expect(s.shop.filter(u => sent.includes(u))).toEqual([]);
    expect(s.shop).toHaveLength(shopSize(s));
  });
  it('Out of Style (ring I): one color to the bottom, +1 blue per member sent, +1', () => {
    let s = take(scene({ shop: S5 }), 'market.restock'); // Midas, Jackpot, Tycoon gold; Mentor, Proselytizer red
    s = move(s, 'color:gold');
    expect(R(s).blue).toBe(1 + 3);
    expect(s.shop.some(u => s.cards[u].def.startsWith('gold.'))).toBe(s.shop.slice(2).some(u => s.cards[u].def.startsWith('gold.')));
    expect(s.shop).toHaveLength(shopSize(s));
  });
  it('Peek (ring I): reorder the top 4; one of them may be this turn\'s buy', () => {
    let s = take(scene({ res: [{ red: 20, gold: 20, blue: 20, green: 20 }], shop: S5 }), 'market.showroom');
    const top = s.pile.slice(0, 4);
    s = move(s, `card:${top[2]}`); s = move(s, `card:${top[0]}`); s = move(s, `card:${top[3]}`);
    expect(s.pile.slice(0, 4)).toEqual([top[2], top[0], top[3], top[1]]);
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).toContain(`card:${top[1]}`);
    expect(ids(s)).not.toContain(`card:${s.pile[4]}`);
  });
  it('Buy Twice (ring II): two buys', () => {
    expect(() => take(scene({ round: 1, shop: SHOP }), 'market.clearance')).toThrow();
    let s = take(scene({ round: 2, res: [{ red: 10, gold: 8 }], shop: CHEAP }), 'market.clearance');
    s = move(s, card(s, 'red.intern'));
    expect(s.pending.kind).toBe('buy');
    s = move(s, card(s, 'red.twins'));
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].members).toHaveLength(2);
  });
  it('Bury (ring II): gain floor(cost / 2) + 1', () => {
    let s = take(scene({ round: 2, shop: SHOP }), 'market.pricecheck');
    s = move(s, card(s, 'gold.jackpot')); // 6
    expect(R(s).blue).toBe(3 + 1);
    s = take(scene({ round: 2, shop: SHOP }), 'market.pricecheck');
    s = move(s, card(s, 'gold.midas')); // 5
    expect(R(s).blue).toBe(2 + 1);
  });
  it('Spree (ring III): +3 blue and three buys this turn', () => {
    let s = take(scene({ round: 3, res: [{ red: 10, gold: 8, green: 8 }], shop: CHEAP }), 'market.spree');
    expect(R(s).blue).toBe(3);
    s = move(s, card(s, 'red.intern'));
    expect(s.pending.kind).toBe('buy');
    s = move(s, 'tier:mid');
    expect(s.pending.kind).toBe('buy');
    s = move(s, card(s, 'red.twins'));
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].members).toHaveLength(2);
    expect(s.players[0].bonus).toBe(5);
  });
});

describe('Blue members', () => {
  const start = (members, res = [{}, {}], extra = {}) => scene({ members, res, queue: [{ t: 'round', r: 2 }], ...extra });
  // P2 recruits def from the shop by buying it outright
  const rivalBuys = (members, def, res = { red: 9, gold: 9, blue: 9 }) => {
    let s = scene({ members, res: [{}, res], shop: [def, ...CHEAP.filter(d => d !== def).slice(0, 5)], turn: 1, round: 2 });
    s = take(s, 'market.clearance');
    return move(s, card(s, def));
  };

  it('Stylist: whenever anyone recruits a blue member, +1 blue', () => {
    expect(R(rivalBuys([['market.stylist']], 'market.underbidder')).blue).toBe(1);
    expect(R(rivalBuys([['market.stylist']], 'red.intern')).blue).toBe(0);
  });
  it('Onlooker: whenever a rival recruits a blue member, +2 blue', () => {
    expect(R(rivalBuys([['market.onlooker']], 'market.recluse')).blue).toBe(2);
    expect(R(rivalBuys([['market.onlooker']], 'gold.tycoon')).blue).toBe(0);
  });
  it('Connoisseur: whenever you recruit a blue member, +2 blue', () => {
    let s = take(scene({ round: 2, res: [{ gold: 9, blue: 1 }], members: [['market.connoisseur']], shop: ['market.recluse', ...SHOP.slice(0, 5)] }), 'market.clearance');
    s = move(s, card(s, 'market.recluse'));
    expect(R(s).gold).toBe(8); // the 1 blue held and Buy Twice's 1 pay Recluse's blue part, 1 gold the rest
    expect(R(s).blue).toBe(2 - 2 + 2);
    let t = take(scene({ round: 2, res: [{ red: 9 }], members: [['market.connoisseur']], shop: CHEAP }), 'market.clearance');
    t = move(t, card(t, 'red.twins'));
    // Buy Twice's 1 blue is kept (Blue scores held blue since Oct 20, like Red's held red), Twins is all red,
    // and no +2 comes back for a red member
    expect(R(t)).toMatchObject({ red: 7, blue: 1 });
  });
  it('Reseller: whenever you recruit, +1 of that member’s color', () => {
    let s = take(scene({ round: 2, res: [{ gold: 9 }], members: [['market.reseller']], shop: SHOP }), 'market.clearance');
    s = move(s, card(s, 'gold.tycoon'));
    // Held-blue scoring keeps Buy Twice's blue out of the default payment: 4 gold paid, Reseller's +1 gold back.
    expect(R(s)).toEqual({ gold: 6, red: 0, blue: 1, green: 0 });
  });
  it('Curator: round start, +1 blue per other blue member', () => {
    expect(R(start([['market.curator', 'market.stylist', 'market.planner', 'gold.midas']])).blue).toBe(2); // Stylist, Planner
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
  // replaced (dead-window audit, 2026-10-14): the round-start trade-in became a payout on Release
  it('Social Climber: whenever you release another member, +2 of any color you choose (not for itself)', () => {
    let s = scene({ round: 2, rules: { release: true }, members: [['market.climber', 'gold.midas']], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `release:${uidOf(s, 'gold.midas', 0)}`);
    expect(s.pending.prompt).toContain('Social Climber');
    s = move(s, 'color:green');
    expect(R(s).green).toBe(2);
    let k = scene({ round: 2, rules: { release: true }, members: [['market.climber']], queue: [{ t: 'buy', p: 0 }] });
    k = move(k, `release:${uidOf(k, 'market.climber', 0)}`);
    expect(k.pending?.prompt || '').not.toContain('Social Climber');
  });
  it('Auctioneer: whenever a rival recruits a non-blue member, +1 blue', () => {
    expect(R(rivalBuys([['market.auctioneer']], 'gold.tycoon')).blue).toBe(1);
    expect(R(rivalBuys([['market.auctioneer']], 'market.recluse')).blue).toBe(0);
  });
  it('Sommelier: whenever you recruit a blue member, your next costs 2 less', () => {
    let s = take(scene({ round: 2, res: [{ gold: 9, blue: 1 }], members: [['market.sommelier']], shop: ['market.recluse', ...SHOP.slice(0, 5)] }), 'market.clearance');
    s = move(s, card(s, 'market.recluse'));
    expect(s.players[0].discount).toBe(2);
    let t = take(scene({ round: 2, res: [{ gold: 9 }], members: [['market.sommelier']], shop: SHOP }), 'market.clearance');
    t = move(t, card(t, 'gold.tycoon'));
    expect(t.players[0].discount).toBe(0);
  });
  it('Patroness: whenever you recruit a blue member, +1 follower', () => {
    let s = take(scene({ round: 2, res: [{ gold: 9, blue: 1 }], members: [['market.patroness']], shop: ['market.recluse', ...SHOP.slice(0, 5)] }), 'market.clearance');
    s = move(s, card(s, 'market.recluse'));
    expect(s.players[0].bonus).toBe(1);
    let t = take(scene({ round: 2, res: [{ red: 9 }], members: [['market.patroness']], shop: CHEAP }), 'market.clearance');
    t = move(t, card(t, 'red.twins'));
    expect(t.players[0].bonus).toBe(0);
  });
  it('Talent Scout: once per game, also recruit one of the top 5 of the pile at its cost', () => {
    let s = scene({ res: [{ gold: 9 }], members: [['market.blackmarket']], shop: CHEAP, pileFirst: ['red.mob', 'red.host', 'gold.jackpot', 'red.sponsor', 'red.patriarch', 'gold.midas'] });
    s = take(s, 'red.turnout'); // Gather (v0.8.0): +1 red × round and +1 red, so 9 gold and 2 red
    const use = `use:${uidOf(s, 'market.blackmarket', 0)}`;
    s = move(s, use); // its question comes at once (gut call, 2026-10-15); your normal buy follows
    expect(s.pending.prompt).toContain('top 5');
    expect(ids(s)).not.toContain(`card:${uidOf(s, 'gold.midas', 'pile')}`); // 6th card is out of reach
    const j = uidOf(s, 'gold.jackpot', 'pile');
    s = move(s, `card:${j}`); // 3 gold + 3 any: several ways now; the default keeps both leads and spends less gold
    expect(s.pending.options.filter(o => o.kind === 'pay').length).toBeGreaterThan(1);
    const pay = s.pending.options[0]; // the suggested way comes first
    expect(pay.breaks).toBeUndefined();
    expect(pay.value).toMatchObject({ gold: 5, red: 1 });
    expect(s.pending.options.find(o => o.id === 'pay:4-2-0-0').breaks).toEqual(['red']);
    s = move(s, pay.id);
    expect(has(s, 'gold.jackpot')).toBe(true);
    expect(R(s)).toMatchObject({ gold: 4, red: 1 });
    expect(s.shop).toHaveLength(CHEAP.length); // a pile recruit leaves the row as it was
    expect(s.pile.includes(j)).toBe(false);
    expect(s.pending.kind).toBe('buy'); // then the buy step, fresh: used, so no second use
    expect(ids(s)).not.toContain(use);
  });
  it('Snob: game end, +1 follower per blue member (itself included)', () => {
    const s = scene({ members: [['market.snob', 'market.stylist', 'gold.midas', 'gold.tycoon', 'red.intern']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(2);
  });
  it('Recluse: game end, +2 followers per rival with more members', () => {
    const s = scene({ n: 3, members: [['market.recluse'], ['red.intern', 'red.drive'], ['red.twins']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(4); // Both rivals hold two members; Recluse holds one.
  });
});

describe(`Blue table: ${GAMES} seeded bot games`, () => {
  it('finish cleanly with invariants holding', () => {
    const restoreReal = restore; restoreReal(); restore = () => {};
    let usedSpree = 0;
    for (let g = 1; g <= GAMES; g++) {
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
    // Bots still reach Spree in about half the games. The bar was 0.75 under the old 10→10 clock (166/200 then), then
    // 0.6 with 10→10 unlimited (134/200). Re-measured 2026-10-15 on these 200 seeds, Normal bots: 105/200 at c90c278
    // and the live tree. Bisected: 134 through balance pass 1, 129 at a6ebe85 (pass 2), 95 at 86a7c8a (Cory's six
    // pass-1 fixes, Tax Collector and Open House here, together with the Blue pricing and scoring change; neither
    // alone moves it that far). Spree still pays: 2.1 buys a Spree turn on average, 8 of 20 use all 3 (40 seeds).
    // A bot-use rate, not a design verdict: the bar guards against Spree going dead.
    expect(usedSpree).toBeGreaterThan(GAMES * 0.45);
  });
});
