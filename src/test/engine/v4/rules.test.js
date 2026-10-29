// @vitest-environment node
// Table rules: setup, turn order, workers, rings, shop, follower buys, contests, payment, followers, endgame.
import { guestMembers, quadrant } from '../../../engine/v4/content/index.js';
import { describe, it, expect } from 'vitest';
import {
  createGame, applyMove, legalMoves, isLegal, resume, followers, paymentPlan, followerPlan, openSlots, TIERS,
} from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { scene as baseScene, take, move, uidOf, ids, hasOpt, fol, useTestCosts } from './helpers.js';
import { SHOP_SIZE, shopSize } from '../../../engine/v4/core.js';

useTestCosts();

// These shared-rule fixtures exercise all four colors regardless of the seat-count default.
const TABLE = ['gold', 'red', 'blue', 'green'];
const scene = opts => baseScene({ quadrants: TABLE, ...opts });

const R = s => s.players.map(p => p.res);
const tier = key => TIERS.find(t => t.key === key);
const seats = n => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));

function orderOf(seed) {
  let s = createGame({ quadrants: TABLE, seats: [{}, {}, {}, {}], seed });
  while (s.pending?.kind === 'setup') s = applyMove(s, { player: s.pending.player, option: s.pending.options[0].id });
  return s.order[0];
}

describe('setup', () => {
  it('drafts one table resource each in reverse round-I order, without replacement; the last color is automatic', () => {
    let s = createGame({ quadrants: TABLE, seats: seats(4), seed: 3 });
    const draftOrder = [...s.firstOrder].reverse();
    const remaining = [...TABLE];
    expect(s.round).toBe(0);
    for (const p of draftOrder.slice(0, -1)) {
      expect(s.pending).toMatchObject({ kind: 'setup', player: p });
      expect(ids(s)).toEqual(remaining.map(c => `color:${c}`));
      const color = remaining.pop();
      s = applyMove(s, { player: p, option: `color:${color}` });
      expect(s.players[p].res[color]).toBe(1);
      expect(Object.values(s.players[p].res).reduce((a, b) => a + b, 0)).toBe(1);
    }
    const last = draftOrder.at(-1);
    expect(s.players[last].res[remaining[0]]).toBe(1);
    expect(s.players.every(p => Object.values(p.res).reduce((a, b) => a + b, 0) === 1)).toBe(true);
    expect(s.round).toBe(1);
    expect(s.pending).toMatchObject({ kind: 'place', player: s.firstOrder[0] });
    expect(s.log.filter(l => /drafts \+1/.test(l))).toHaveLength(4);
  });

  it('fixes round I order before drafting and retains it regardless of the colors chosen', () => {
    for (let seed = 1; seed <= 12; seed++) {
      let s = createGame({ quadrants: TABLE, seats: seats(4), seed });
      const first = [...s.firstOrder];
      expect([...first].sort()).toEqual([0, 1, 2, 3]);
      expect(s.pending.player).toBe(first.at(-1));
      expect(s.log.join(' ')).toMatch(/turn order/i);
      const seen = [], colors = [];
      while (s.pending?.kind === 'setup') {
        seen.push(s.pending.player);
        expect(s.pending.options.every(o => !colors.includes(o.id))).toBe(true);
        const option = s.pending.options[(seed + seen.length) % s.pending.options.length].id;
        colors.push(option);
        s = applyMove(s, { player: s.pending.player, option });
      }
      expect(seen).toEqual([...first].reverse().slice(0, -1));
      expect(s.round).toBe(1);
      expect(s.order.slice(0, 4)).toEqual(first);
    }
  });

  it('offers only this table’s colors and autoassigns the second player on a two-color table', () => {
    let s = createGame({ quadrants: ['purple', 'thieves'], seats: seats(2), seed: 3 });
    expect(ids(s)).toEqual(['color:purple', 'color:thieves']);
    const picker = s.pending.player, other = s.firstOrder[0];
    s = applyMove(s, { player: picker, option: 'color:thieves' });
    expect(s.players[picker].res.magenta).toBe(1);
    expect(s.players[other].res.purple).toBe(1);
    expect(s.pending.kind).toBe('place');
  });

  it('rejects bad seat counts', () => {
    expect(() => createGame({ quadrants: TABLE, seats: seats(1) })).toThrow();
    expect(() => createGame({ quadrants: TABLE, seats: seats(7) })).toThrow();
  });

  it('starts with a shuffled deck of every table sphere\'s members (plus the guest rule-benders) and a full row face up', () => {
    const s = createGame({ quadrants: TABLE, seats: seats(2), seed: 9, rules: { guests: false } });
    // 64 on this table (tests deal the full deck, cut cards too): the 12-member Red deck (v0.8.2: Recruit Bonus,
    // Movement Penalty, Panel, Loyalists joined) plus Headhunter (Oct 24); the deck is whatever the spheres hold
    const deck = 64;
    expect(TABLE.reduce((n, q) => n + quadrant(q).members.reduce((a, d) => a + d.copies, 0), 0)).toBe(deck);
    expect(Object.keys(s.cards)).toHaveLength(deck);
    expect(Object.values(s.cards).every(c => TABLE.includes(c.def.split('.')[0]))).toBe(true);
    expect(s.shop).toHaveLength(shopSize(s));
    expect(s.pile).toHaveLength(deck - shopSize(s));
    expect(Object.keys(createGame({ quadrants: TABLE, seats: seats(2), seed: 9 }).cards)).toHaveLength(deck + guestMembers().length);
    expect(s.stock).toEqual({}); // all three buys are unlimited
    const t = createGame({ quadrants: TABLE, seats: seats(2), seed: 10 });
    expect(t.shop).not.toEqual(s.shop);
  });
});

describe('turn order and workers', () => {
  it('round I, all tied: a seeded random order, snaking, 3 workers', () => {
    const s = scene({ n: 3, queue: [{ t: 'round', r: 1 }] });
    // random since 2026-10-14 (core.js startRound); pinned to this seed's draw
    expect(s.order).toEqual([0, 1, 2, 2, 1, 0, 0, 1, 2]); // redrawn when Saboteur joined the deck (Oct 28)
    expect(s.order.slice(3, 6)).toEqual([...s.order.slice(0, 3)].reverse()); // the snake
    expect(s.pending.player).toBe(0);
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
    for (let seed = 1; seed <= 40; seed++) firsts.add(createGame({ quadrants: TABLE, seats: [{}, {}, {}, {}], seed }).players.length && orderOf(seed));
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
    let s = createGame({ quadrants: TABLE, seats: seats(3), seed: 42, rules: { guests: false } });
    const rand = seededRandom(42);
    const turns = {};
    let lastSlots = null;
    while (s.pending) {
      const before = s.round;
      if (s.round >= 1) expect(s.pending.kind).not.toBe('setup');
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
  it('refills to the round\'s size (5 in round I) after each recruit while the pile lasts, then shrinks', () => {
    let s = scene({ shop: ['red.volunteer', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor'], queue: [] });
    s.pile = s.pile.slice(0, 1);
    s.queue = [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }];
    resume(s);
    s = take(s, 'red.hire');
    expect(s.shop).toHaveLength(5); // only 1 card left in the pile to refill with
    expect(s.pile).toHaveLength(0);
    const t = scene({ shop: ['red.volunteer', 'gold.midas'], queue: [] });
    t.pile = [];
    t.queue = [{ t: 'turn', p: 0 }];
    resume(t);
    expect(take(t, 'red.hire').shop).toHaveLength(2); // Walk-In draws from the deck: an empty deck leaves the shop as is
  });
});

describe('follower buys', () => {
  it('1 of anything buys 1 follower', () => {
    let s = take(scene({ res: [{ gold: 2 }] }), 'blue.a1');
    expect(hasOpt(s, 'tier:small')).toBe(true);
    s = move(s, 'tier:small');
    expect(R(s)[0]).toEqual({ gold: 2, red: 0, blue: 2, green: 0 });
    expect(fol(s, 0)).toBe(2);
  });

  it('offers exactly 1, 5 and 10, unlimited and payable in any colors', () => {
    expect(TIERS.map(t => [t.cost, t.get])).toEqual([[1, 1], [5, 5], [10, 10]]);
    const s = scene({});
    for (const t of TIERS) {
      const p = { res: { gold: 0, red: t.cost, blue: 0, green: 0 } };
      expect(followerPlan(s, p, t)).toEqual(p.res);
      expect(t.limited).toBeUndefined();
      p.res.red--;
      expect(followerPlan(s, p, t)).toBe(null);
    }
    const p = { res: { gold: 5, red: 4, blue: 1, green: 0 } };
    expect(followerPlan(s, p, tier('mid'))).toEqual({ gold: 0, red: 4, blue: 1, green: 0 });
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


});

describe('round-end contests', () => {
  it('rings pay full +4/+6/+10 to a solo leader, half rounded up to every tied leader, and nothing for zero', () => {
    for (const [round, v] of [[1, 4], [2, 6], [3, 10]]) {
      const s = scene({ n: 3, round, members: [['blue.hand'], [], []], res: [{ gold: 5, blue: 1 }, { gold: 5 }, { gold: 3 }], queue: [{ t: 'endRound' }] });
      expect(s.players.map(p => p.contest)).toEqual([v + Math.ceil(v / 2), Math.ceil(v / 2), 0]);
    }
  });

  it('most held red resources wins Red; tied resource leaders each score half', () => {
    let s = scene({ n: 3, members: [['gold.banker', 'gold.midas'], ['red.intern', 'gold.tycoon'], ['red.volunteer', 'red.crowd']], res: [{ red: 4 }, { red: 1 }, {}], queue: [{ t: 'endRound' }] });
    // Red resources win even without a Red member.
    expect(s.players.map(p => p.contest)).toEqual([4, 0, 0]);
    s = scene({ n: 3, members: [['red.intern', 'gold.midas'], ['red.mob', 'gold.tycoon'], ['gold.banker']], res: [{ red: 3 }, { red: 3 }, { red: 1 }], queue: [{ t: 'endRound' }] });
    expect(s.players.map(p => p.contest)).toEqual([2, 2, 0]);
    // Printed groups do not substitute for resources in the contest.
    s = scene({ n: 2, members: [['gold.banker', 'gold.midas', 'gold.tycoon'], ['red.twins', 'red.bigfamily']], res: [{ red: 1 }, {}], queue: [{ t: 'endRound' }] });
    expect(s.players.map(p => p.contest)).toEqual([4, 0]);
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
    // Gather gives +1 red × round and +1 red (v0.8.0), so 2 gold + 3 red (+3 since Oct 25): Banker (2+1), Intern (1) and Mentor (3+2) are in reach,
    // Midas (3 gold) is not
    expect(s.players[0].res).toMatchObject({ gold: 2, red: 3 });
    expect(offered).toEqual(['gold.banker', 'gold.seed', 'red.intern', 'red.mentor', 'red.volunteer']);
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
    const s = scene({ n: 3, members: [['gold.midas'], ['red.intern', 'red.crowd'], []], bonus: [1, 0, 3], queue: [{ t: 'finish' }] });
    // P1: 1+1+1 bonus = 3 (1 member), P2: 1+1+1 = 3 (2 members), P3: 4
    expect(s.ranking).toEqual([2, 1, 0]);
    expect(s.over).toBe(true);
    expect(s.pending).toBe(null);
  });

  it('a full game ends after round III', () => {
    let s = createGame({ quadrants: TABLE, seats: seats(2), seed: 5 });
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
    const s = createGame({ quadrants: TABLE, seats: seats(2), seed: 1 });
    const [b, a] = s.firstOrder; // resource draft reverses the order already drawn
    expect(isLegal(s, { player: a, option: 'color:gold' })).toBe(true);
    expect(() => applyMove(s, { player: b, option: 'color:gold' })).toThrow(/Illegal/);
    expect(() => applyMove(s, { player: a, option: 'color:purple' })).toThrow(/Illegal/);
    expect(() => applyMove(s, null)).toThrow(/Illegal/);
    expect(() => applyMove(s, { player: a })).toThrow(/Illegal/);
    const done = scene({ queue: [{ t: 'finish' }] });
    expect(() => applyMove(done, { player: 0, option: 'pass' })).toThrow(/Illegal/);
  });

  it('legalMoves lists exactly the pending options', () => {
    const s = createGame({ quadrants: TABLE, seats: seats(2), seed: 1 });
    expect(legalMoves(s)).toEqual(['gold', 'red', 'blue', 'green'].map(c => ({ player: s.firstOrder.at(-1), option: `color:${c}` })));
  });

  it('the game does not share arrays with the caller', () => {
    const quadrants = ['gold', 'red', 'blue', 'green'];
    const s = createGame({ seats: seats(2), seed: 1, quadrants });
    expect(s.quadrants).not.toBe(quadrants);
  });
});
