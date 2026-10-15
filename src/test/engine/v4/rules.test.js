// @vitest-environment node
// Table rules: setup, turn order, workers, rings, shop, follower buys, contests, payment, followers, endgame.
import { guestMembers, quadrant } from '../../../engine/v4/content/index.js';
import { describe, it, expect } from 'vitest';
import {
  createGame, applyMove, legalMoves, isLegal, resume, followers, paymentPlan, followerPlan, openSlots, TIERS,
} from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { scene, take, move, uidOf, ids, hasOpt, fol, useTestCosts } from './helpers.js';
import { SHOP_SIZE } from '../../../engine/v4/core.js';

useTestCosts();

const R = s => s.players.map(p => p.res);
const tier = key => TIERS.find(t => t.key === key);
const seats = n => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));

function orderOf(seed) {
  let s = createGame({ seats: [{}, {}, {}, {}], seed });
  while (s.pending?.kind === 'setup') s = applyMove(s, { player: s.pending.player, option: s.pending.options[0].id });
  return s.order[0];
}

describe('setup', () => {
  it('each player picks 2 starting resources, first seat to last, then round I starts', () => {
    let s = createGame({ seats: seats(3), seed: 3 });
    expect(s.round).toBe(0);
    const picks = [['gold', 'gold'], ['red', 'blue'], ['green', 'red']];
    for (let p = 0; p < 3; p++) for (let k = 0; k < 2; k++) {
      expect(s.pending.kind).toBe('setup');
      expect(s.pending.player).toBe(p);
      expect(ids(s)).toEqual(['color:gold', 'color:red', 'color:blue', 'color:green']);
      s = applyMove(s, { player: p, option: `color:${picks[p][k]}` });
    }
    expect(R(s)).toEqual([
      { gold: 2, red: 0, blue: 0, green: 0 }, { gold: 0, red: 1, blue: 1, green: 0 }, { gold: 0, red: 1, blue: 0, green: 1 },
    ]);
    expect(s.round).toBe(1);
    expect(s.pending.kind).toBe('place');
  });

  it('rejects bad seat counts', () => {
    expect(() => createGame({ seats: seats(1) })).toThrow();
    expect(() => createGame({ seats: seats(5) })).toThrow();
  });

  it('starts with a shuffled deck of every table sphere\'s members (plus the guest rule-benders) and a full row face up', () => {
    const s = createGame({ seats: seats(2), seed: 9, rules: { guests: false } });
    // 59 on this table since Doppelganger left Red for Green (Cory, 2026-10-15); the deck is whatever the spheres hold
    const deck = 59;
    expect(Object.keys(s.cards)).toHaveLength(deck);
    expect(s.shop).toHaveLength(SHOP_SIZE);
    expect(s.pile).toHaveLength(deck - SHOP_SIZE);
    expect(Object.keys(createGame({ seats: seats(2), seed: 9 }).cards)).toHaveLength(deck + guestMembers().length);
    expect(s.stock).toEqual({ big: 4 }); // only the 8-follower buy is limited (10→10 is unlimited)
    const t = createGame({ seats: seats(2), seed: 10 });
    expect(t.shop).not.toEqual(s.shop);
  });
});

describe('turn order and workers', () => {
  it('round I, all tied: a seeded random order, snaking, 3 workers', () => {
    const s = scene({ n: 3, queue: [{ t: 'round', r: 1 }] });
    // random since 2026-10-14 (core.js startRound); pinned to this seed's draw
    expect(s.order).toEqual([1, 0, 2, 2, 0, 1, 1, 0, 2]);
    expect(s.pending.player).toBe(1);
    expect(s.players.map(p => p.left)).toEqual([3, 3, 3]);
  });

  it('fewest followers picks first (after round I)', () => {
    const s = scene({ n: 3, bonus: [0, 2, 1], queue: [] });
    s.order = [0, 1, 2, 2, 1, 0, 0, 1, 2];
    s.queue = [{ t: 'round', r: 2 }];
    resume(s);
    expect(s.order.slice(0, 3)).toEqual([0, 2, 1]);
  });

  it('round I order is random and seeded', () => {
    const firsts = new Set();
    for (let seed = 1; seed <= 40; seed++) firsts.add(createGame({ seats: [{}, {}, {}, {}], seed }).players.length && orderOf(seed));
    expect(firsts.size).toBe(4);
    expect(orderOf(9)).toBe(orderOf(9));
  });

  it('round II: 4 workers; ties go to whoever was later in last round\'s order', () => {
    const s = scene({ n: 3, queue: [] });
    s.order = [0, 1, 2, 2, 1, 0, 0, 1, 2];
    s.queue = [{ t: 'round', r: 2 }];
    resume(s);
    expect(s.order).toEqual([2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]);
  });

  it('round III: 5 workers; ties use last round\'s turn order, not its reversed last pass', () => {
    const s = scene({ n: 3, bonus: [0, 0, 5], queue: [] });
    s.order = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0]; // round II: 0 picked first, 2 last
    s.queue = [{ t: 'round', r: 3 }];
    resume(s);
    expect(s.order.slice(0, 3)).toEqual([1, 0, 2]);
    expect(s.order).toHaveLength(15);
  });

  it('a full game gives 3, 4, 5 turns per player per round', () => {
    // guests off: Extra Hand (a guest) adds a round-III minion, and with cheaper members the bots now buy it here
    let s = createGame({ seats: seats(3), seed: 42, rules: { guests: false } });
    const rand = seededRandom(42);
    const turns = {};
    let lastSlots = null;
    while (s.pending) {
      const before = s.round;
      if (s.pending.kind === 'place') {
        const k = `${s.round}:${s.pending.player}`;
        turns[k] = (turns[k] || 0) + 1;
      }
      s = applyMove(s, chooseBotMove(s, rand));
      if (s.round !== before && s.round > 1) {
        // spaces reopen each round
        expect(Object.keys(s.slots).length).toBeLessThanOrEqual(1);
        lastSlots = s.round;
      }
    }
    expect(lastSlots).toBe(3);
    for (let r = 1; r <= 3; r++) for (let p = 0; p < 3; p++) expect(turns[`${r}:${p}`]).toBe(r + 2);
  });
});

describe('rings', () => {
  it('ring I opens in round I, ring II in round II, the center in round III', () => {
    expect(scene({ round: 1 }).pending.options).toHaveLength(12);
    expect(scene({ round: 2 }).pending.options).toHaveLength(20);
    expect(scene({ round: 3 }).pending.options).toHaveLength(24);
  });

  it('a taken space is closed for the rest of the round, open again next round', () => {
    let s = scene({ queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'endRound' }, { t: 'afterRound' }] });
    s = take(s, 'gold.rush');
    s = move(s, 'pass');
    expect(() => take(s, 'gold.rush')).toThrow(/not open/);
    s = move(take(s, 'blue.a1'), 'pass');
    expect(s.round).toBe(2);
    expect(openSlots(s)).toHaveLength(20);
  });
});

describe('shop', () => {
  it('refills to 6 after each recruit while the pile lasts, then shrinks', () => {
    let s = scene({ shop: ['red.volunteer', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.bigfamily'], queue: [] });
    s.pile = s.pile.slice(0, 1);
    s.queue = [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }];
    resume(s);
    s = take(s, 'red.hire');
    expect(s.shop).toHaveLength(6) // only 1 card left in the pile to refill with;
    expect(s.pile).toHaveLength(0);
    const t = scene({ shop: ['red.volunteer', 'gold.midas'], queue: [] });
    t.pile = [];
    t.queue = [{ t: 'turn', p: 0 }];
    resume(t);
    expect(take(t, 'red.hire').shop).toHaveLength(1);
  });
});

describe('follower buys', () => {
  it('2 of anything buys 1 follower', () => {
    let s = scene({ res: [{ gold: 2 }] });
    s = take(s, 'blue.a1');
    expect(hasOpt(s, 'tier:small')).toBe(true);
    s = move(s, 'tier:small');
    // gold is spent last
    expect(R(s)[0]).toEqual({ gold: 2, red: 0, blue: 1, green: 0 });
    expect(fol(s, 0)).toBe(2);
  });

  it('follower buys take any resources, one color is fine (Cory, 2026-10-14): 4 buys 4, 8 buys 8, 10 buys 10', () => {
    const s = scene({});
    const p = { res: { gold: 0, red: 9, blue: 0, green: 0 } };
    expect(followerPlan(s, p, tier('mid'))).toEqual({ gold: 0, red: 4, blue: 0, green: 0 });
    expect(followerPlan(s, p, tier('big'))).toEqual({ gold: 0, red: 8, blue: 0, green: 0 });
    expect(followerPlan(s, p, tier('top'))).toBe(null); // only 9
    p.res = { gold: 0, red: 10, blue: 0, green: 0 };
    expect(followerPlan(s, p, tier('top'))).toEqual({ gold: 0, red: 10, blue: 0, green: 0 });
    // gold is spent last by default
    p.res = { gold: 5, red: 7, blue: 1, green: 0 };
    expect(followerPlan(s, p, tier('big'))).toEqual({ gold: 0, red: 7, blue: 1, green: 0 });
    for (const t of ['mid', 'big', 'top']) expect(tier(t).colors).toBe(1);
    expect(tier('top')).toMatchObject({ cost: 10, get: 10 });
    expect([tier('top').limited, tier('top').clock, tier('top').oncePerRound]).toEqual([undefined, undefined, undefined]);
  });

  // Cory, 2026-10-14: "the turns are the end game clock. there should basically be unlimited number of the 10 follower
  // buys." (It was a stock of 4 whose last buy ended the game after that round, then once per player per round.)
  it('10→10 is unlimited: buy it every turn, more than 4 in a round, and the game still goes on to round II', () => {
    let s = scene({ res: [{ gold: 10, red: 10, blue: 10, green: 10 }, { gold: 10, red: 10 }], queue: [] });
    s.queue = [0, 1, 0, 1, 0].map(p => ({ t: 'turn', p })).concat([{ t: 'endRound' }, { t: 'afterRound' }]);
    resume(s);
    // plain gains, looked up by key (space names get renamed)
    const names = [['green', 'a1'], ['blue', 'a1'], ['gold', 'rush'], ['green', 'a2'], ['green', 'a3']].map(([q, k]) => quadrant(q).actions.find(a => a.key === k).name);
    for (const name of names) {
      s = take(s, name);
      expect(hasOpt(s, 'tier:top'), name).toBe(true);
      s = move(s, 'tier:top');
    }
    expect(s.players.map(p => p.bought)).toEqual([30, 20]); // 5 buys of 10 in round I
    expect(s.stock.top).toBeUndefined();
    expect(s.over).toBe(false);
    expect(s.round).toBe(2);
    expect(s.log.some(l => /game ends after this round/.test(l))).toBe(false);
  });

  it('an 8-follower buy uses up one of 2 per player and does not end the game', () => {
    let s = scene({ res: [{ gold: 2, red: 3, blue: 3 }], queue: [] });
    s.stock.big = 1;
    s.queue = [{ t: 'turn', p: 0 }];
    resume(s);
    s = take(s, 'green.a1');
    expect(hasOpt(s, 'tier:big')).toBe(true);
    s = move(s, 'tier:big');
    expect(s.stock.big).toBe(0);
    expect(s.over).toBe(false);
    expect(s.players[0].bonus).toBe(8);
  });

  it('no 8-follower buy once they are gone', () => {
    const s = scene({ res: [{ gold: 3, red: 3, blue: 3 }], queue: [] });
    s.stock.big = 0;
    expect(followerPlan(s, s.players[0], tier('big'))).toBe(null);
  });
});

describe('round-end contests', () => {
  it('rings pay +2/+4/+6 to the leader of each color; ties all score; zero scores nothing', () => {
    for (const [round, v] of [[1, 2], [2, 4], [3, 6]]) {
      const s = scene({ n: 3, round, res: [{ gold: 5, blue: 1 }, { gold: 5 }, { gold: 3 }], queue: [{ t: 'endRound' }] });
      expect(s.players.map(p => p.contest)).toEqual([2 * v, v, 0]);
    }
  });

  it('most members wins red; red members break member ties', () => {
    let s = scene({ n: 3, members: [['gold.banker', 'gold.midas'], ['red.intern', 'gold.tycoon'], ['red.twins', 'red.crowd']], queue: [{ t: 'endRound' }] });
    // all have 2 members; P2 has 1 red, P3 has 2 red
    expect(s.players.map(p => p.contest)).toEqual([0, 0, 2]);
    s = scene({ n: 3, members: [['red.intern', 'gold.midas'], ['red.mob', 'gold.tycoon'], ['gold.banker']], queue: [{ t: 'endRound' }] });
    expect(s.players.map(p => p.contest)).toEqual([2, 2, 0]);
    // more members beats more red members, and Twins' 2 followers don't make it 2 members
    s = scene({ n: 2, members: [['gold.banker', 'gold.midas', 'gold.tycoon'], ['red.twins', 'red.bigfamily']], queue: [{ t: 'endRound' }] });
    expect(s.players.map(p => p.contest)).toEqual([2, 0]);
  });
});

describe('payment', () => {
  const setup = (res, members = [], extra = {}) => {
    const s = scene({ members: [members], res: [res], shop: ['gold.midas', 'red.mentor', 'gold.banker', 'red.intern', 'red.volunteer', 'gold.seed'], queue: [] });
    Object.assign(s.players[0], extra);
    return [s, s.players[0]];
  };

  it('pays the color part in its own color, the wild part from non-gold you hold most of', () => {
    const [s, p] = setup({ gold: 5, red: 1, blue: 3 });
    expect(paymentPlan(s, p, uidOf(s, 'gold.midas', 'shop'))).toEqual({ gold: 3, red: 0, blue: 2, green: 0 });
    expect(paymentPlan(s, p, uidOf(s, 'red.mentor', 'shop'))).toBe(null); // needs 3 red
  });

  it('wild falls back to gold only when nothing else is left', () => {
    const [s, p] = setup({ gold: 5, red: 1 });
    expect(paymentPlan(s, p, uidOf(s, 'gold.midas', 'shop'))).toEqual({ gold: 4, red: 1, blue: 0, green: 0 });
    const [t, q] = setup({ gold: 3, red: 1 });
    expect(paymentPlan(t, q, uidOf(t, 'gold.midas', 'shop'))).toBe(null);
  });

  it('the color part cannot be paid with other colors', () => {
    const [s, p] = setup({ gold: 2, red: 9, blue: 9 });
    expect(paymentPlan(s, p, uidOf(s, 'gold.midas', 'shop'))).toBe(null);
  });

  it('discounts come off the color part first, then the wild part', () => {
    let [s, p] = setup({ gold: 1, blue: 2 }, [], { discount: 2 });
    expect(paymentPlan(s, p, uidOf(s, 'gold.midas', 'shop'))).toEqual({ gold: 1, red: 0, blue: 2, green: 0 });
    [s, p] = setup({ blue: 1 }, ['red.sponsor'], { discount: 2 });
    // Banker 2 gold + 1 wild, 3 off: free
    expect(paymentPlan(s, p, uidOf(s, 'gold.banker', 'shop'))).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
    [s, p] = setup({}, ['red.sponsor']);
    expect(paymentPlan(s, p, uidOf(s, 'red.intern', 'shop'))).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
  });

  it('Penny Pincher halves the gold color part (rounded up) and gold pays 2 wild', () => {
    const [s, p] = setup({ gold: 3 }, ['gold.thrift']);
    // Midas 3 gold + 2 wild: 2 gold for the color part, 1 gold for 2 wild
    expect(paymentPlan(s, p, uidOf(s, 'gold.midas', 'shop'))).toEqual({ gold: 3, red: 0, blue: 0, green: 0 });
    const [t, q] = setup({ gold: 1, red: 3 }, ['gold.thrift']);
    // Mentor: red part is full price; 1 gold covers the 2 wild
    expect(paymentPlan(t, q, uidOf(t, 'red.mentor', 'shop'))).toEqual({ gold: 1, red: 3, blue: 0, green: 0 });
    q.res.red = 4;
    expect(paymentPlan(t, q, uidOf(t, 'red.mentor', 'shop'))).toEqual({ gold: 1, red: 4, blue: 0, green: 0 });
  });

  it('only affordable members are offered at the buy', () => {
    let s = scene({ res: [{ gold: 2 }], shop: ['gold.midas', 'red.mentor', 'gold.banker', 'red.intern', 'red.volunteer', 'gold.seed'] });
    s = take(s, 'red.turnout');
    const offered = s.pending.options.filter(o => o.kind === 'card').map(o => s.cards[o.uid].def).sort();
    expect(offered).toEqual(['gold.seed', 'red.volunteer']);
    expect(hasOpt(s, 'tier:small')).toBe(true);
    expect(hasOpt(s, 'pass')).toBe(true);
  });
});

describe('followers and the end', () => {
  it('followers = 1 + bonus + members\' follower values', () => {
    const s = scene({ members: [['red.twins', 'red.bigfamily', 'gold.midas']], bonus: [4] });
    expect(followers(s, s.players[0])).toBe(1 + 4 + 2 + 3 + 1);
    expect(followers(s, s.players[1])).toBe(1);
  });

  it('ranking: most followers, then most members', () => {
    const s = scene({ n: 3, members: [['red.twins'], ['red.intern', 'red.crowd'], []], bonus: [0, 0, 3], queue: [{ t: 'finish' }] });
    // P1: 1+2 = 3 (1 member), P2: 1+1+1 = 3 (2 members), P3: 4
    expect(s.ranking).toEqual([2, 1, 0]);
    expect(s.over).toBe(true);
    expect(s.pending).toBe(null);
  });

  it('a full game ends after round III', () => {
    let s = createGame({ seats: seats(2), seed: 5 });
    const rand = seededRandom(5);
    while (s.pending) s = applyMove(s, chooseBotMove(s, rand));
    expect(s.over).toBe(true);
    expect(s.ranking).toHaveLength(2);
    expect(legalMoves(s)).toEqual([]);
    expect(chooseBotMove(s, rand)).toBe(null);
  });
});

describe('move validation', () => {
  it('rejects the wrong player, bogus options and moves after the end', () => {
    const s = createGame({ seats: seats(2), seed: 1 });
    expect(isLegal(s, { player: 0, option: 'color:gold' })).toBe(true);
    expect(() => applyMove(s, { player: 1, option: 'color:gold' })).toThrow(/Illegal/);
    expect(() => applyMove(s, { player: 0, option: 'color:purple' })).toThrow(/Illegal/);
    expect(() => applyMove(s, null)).toThrow(/Illegal/);
    expect(() => applyMove(s, { player: 0 })).toThrow(/Illegal/);
    const done = scene({ queue: [{ t: 'finish' }] });
    expect(() => applyMove(done, { player: 0, option: 'pass' })).toThrow(/Illegal/);
  });

  it('legalMoves lists exactly the pending options', () => {
    const s = createGame({ seats: seats(2), seed: 1 });
    expect(legalMoves(s)).toEqual(['gold', 'red', 'blue', 'green'].map(c => ({ player: 0, option: `color:${c}` })));
  });

  it('the game does not share arrays with the caller', () => {
    const quadrants = ['gold', 'red', 'blue', 'green'];
    const s = createGame({ seats: seats(2), seed: 1, quadrants });
    expect(s.quadrants).not.toBe(quadrants);
  });
});
