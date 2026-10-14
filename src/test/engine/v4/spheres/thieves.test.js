// @vitest-environment node
// Black (thieves): every action and every member, with exact numbers. Plus 200 seeded bot games.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import thieves, { install, setScoring, releaseLoot, SCORING } from '../../../../engine/v4/content/thieves.js';
import { take, move, play, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

install();
const QUADS = ['gold', 'red', 'blue', 'thieves'];
const BLACK_COSTS = Object.fromEntries(thieves.members.map(d => [d.id, [d.s, d.w]]));
// the costs these tests are written against (repricing the real cards doesn't break them)
const PINNED = {
  ...TEST_COSTS, ...BLACK_COSTS,
  'thieves.cutpurse': [1, 1], 'thieves.sticky': [2, 1], 'thieves.safehouse': [1, 0], 'thieves.watchdog': [1, 0],
  'thieves.robinhood': [1, 1], 'thieves.desperado': [1, 1], 'thieves.lookout': [1, 1], 'thieves.accomplice': [2, 0],
  'thieves.understudy': [0, 1], 'thieves.fixer': [1, 0], 'thieves.extortionist': [1, 1], 'thieves.doubleagent': [3, 2],
  'thieves.burglar': [2, 2], 'thieves.kingpin': [3, 2], 'thieves.mastermind': [3, 2],
};
delete PINNED['green.recruit'];
for (const k of Object.keys(PINNED)) if (k.startsWith('green.')) delete PINNED[k];
let restore;
beforeEach(() => { restore = pinCosts(PINNED); setScoring('black'); });
afterEach(() => { restore(); setScoring('loot'); });

const Z = { gold: 0, red: 0, blue: 0, black: 0 };
const R = s => s.players.map(p => p.res);
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.sponsor'];

// scene() from helpers, on the Black table
function scene({ n = 3, seed = 7, round = 1, res = [], members = [], shop = SHOP, bonus = [], turn = 0, queue = null } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: QUADS });
  Object.assign(s, { queue: [], pending: null, round, slots: {}, order: [], log: [] });
  s.players.forEach((p, i) => { p.res = { ...Z, ...(res[i] || {}) }; p.bonus = bonus[i] || 0; p.left = 3; });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(def); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  for (const d of shop) s.shop.push(grab(d));
  s.queue = queue || [{ t: 'turn', p: turn }];
  return resume(s);
}
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);

describe('Black actions', () => {
  it('Pickpocket: take 2 resources, split however you like; they turn black', () => {
    let s = scene({ res: [{}, { gold: 2 }, { red: 1, blue: 1 }] });
    s = take(s, 'Pickpocket');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red', 'take:2:blue']);
    s = play(s, 'take:1:gold', 'take:2:red');
    expect(R(s)).toEqual([{ ...Z, black: 2 }, { ...Z, gold: 1 }, { ...Z, blue: 1 }]);
  });

  it('Pickpocket: takes only what there is, and nothing asks nothing', () => {
    let s = scene({ res: [{}, { gold: 1 }] });
    s = take(s, 'Pickpocket');
    s = move(s, 'take:1:gold');
    expect(R(s)[0].black).toBe(1);
    const z = take(scene({}), 'Pickpocket');
    expect(z.pending?.kind).not.toBe('choose');
    expect(R(z)[0].black).toBe(0);
  });

  it('Hideout: +3 black, and rivals cannot steal from you this round (resources or members)', () => {
    let s = scene({ round: 2, res: [{ gold: 4 }, {}, { gold: 1 }], members: [['red.intern'], [], []], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 1 }] });
    s = pass(take(s, 'Hideout'));
    expect(R(s)[0]).toEqual({ ...Z, gold: 4, black: 3 });
    s = take(s, 'Pickpocket');
    expect(ids(s)).toEqual(['take:2:gold']);
    s = pass(move(s, 'take:2:gold'));
    s = take(s, 'Ransom');
    expect(s.pending?.kind).not.toBe('choose'); // P0's Intern is safe too
    expect(s.players[0].hideout).toBe(2);
  });

  it('Fence: +2 black, +1 per rival holding more resources than you', () => {
    const s = take(scene({ n: 4, res: [{ gold: 2 }, { gold: 3 }, { red: 1, blue: 2 }, { gold: 1 }] }), 'Fence');
    expect(R(s)[0].black).toBe(4);
    const z = take(scene({}), 'Fence');
    expect(R(z)[0].black).toBe(2);
  });

  it('Rob: take 3, split however you like', () => {
    let s = scene({ round: 2, res: [{}, { gold: 5 }, { red: 2 }] });
    s = take(s, 'Rob');
    s = play(s, 'take:1:gold', 'take:1:gold', 'take:2:red');
    expect(R(s).map(r => [r.gold, r.red, r.black])).toEqual([[0, 0, 3], [3, 0, 0], [0, 1, 0]]);
  });

  it('Ransom: the owner pays its cost to keep it (paid from their biggest piles, it turns black)', () => {
    let s = scene({ round: 2, res: [{}, { gold: 2, red: 3 }], members: [[], ['red.bigfamily']] });
    s = take(s, 'Ransom');
    const bf = uidOf(s, 'red.bigfamily', 1);
    s = move(s, `card:${bf}`);
    expect(s.pending.player).toBe(1);
    expect(ids(s)).toEqual(['pay', 'let']);
    s = move(s, 'pay');
    expect(defs(s, 1)).toEqual(['red.bigfamily']);
    expect(R(s)[0].black).toBe(4);
    expect(R(s)[1]).toEqual({ ...Z, gold: 0, red: 1 });
  });

  it('Ransom: or they let it go; if they can’t pay, only letting go is offered; free members are not targets', () => {
    let s = scene({ round: 2, res: [{}, { gold: 1 }], members: [[], ['red.bigfamily', 'red.volunteer']] });
    s = take(s, 'Ransom');
    const bf = uidOf(s, 'red.bigfamily', 1);
    expect(ids(s)).toEqual([`card:${bf}`]);
    s = move(s, `card:${bf}`);
    expect(ids(s)).toEqual(['let']);
    s = move(s, 'let');
    expect(defs(s, 0)).toEqual(['red.bigfamily']);
    expect(R(s)[0].black).toBe(0);
  });

  it('Heist: take any rival member; they recruit the cheapest face-up member free', () => {
    let s = scene({ round: 3, members: [[], ['red.proselytizer']], shop: ['red.volunteer', ...SHOP.slice(1)] });
    s = take(s, 'Heist');
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(defs(s, 1)).toEqual(['red.volunteer']);
  });
});

describe('Loot pile scoring', () => {
  beforeEach(() => setScoring('loot'));
  it('stolen goods go on the loot pile, not the supply; a pile can be robbed; it joins the supply at round start', () => {
    let s = scene({ round: 2, res: [{}, { gold: 3 }, {}], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 2 }] });
    s = pass(play(take(s, 'Pickpocket'), 'take:1:gold', 'take:1:gold'));
    expect(s.players[0].loot).toBe(2);
    expect(R(s)[0].black).toBe(0);
    s = take(s, 'Rob');
    expect(ids(s)).toEqual(['take:0:loot', 'take:1:gold']);
    s = play(s, 'take:0:loot', 'take:0:loot', 'take:1:gold');
    expect([s.players[0].loot, s.players[2].loot]).toEqual([0, 3]);
    releaseLoot(s);
    expect([R(s)[2].black, s.players[2].loot]).toEqual([3, 0]);
  });
  it('scores the visible pile', () => {
    const s = scene({});
    s.players[1].loot = 3;
    expect(SCORING.loot.score(null, s.players[1])).toBe(3);
  });
});

describe('Other scoring modes', () => {
  it('others / black / fewest measure what players hold', () => {
    const s = scene({ res: [{ black: 2, gold: 1 }], members: [['thieves.watchdog', 'red.twins', 'gold.banker']] });
    const ctx = { memberCount: p => p.members.reduce((a, u) => a + (s.cards[u].def === 'red.twins' ? 2 : 1), 0), countMembersOfColor: (p, q) => p.members.filter(u => s.cards[u].def.startsWith(q === 'black' ? 'thieves' : q)).length };
    expect(SCORING.others.score(ctx, s.players[0])).toBe(3);
    expect(SCORING.black.score(ctx, s.players[0])).toBe(2);
    expect(SCORING.fewest.score(ctx, s.players[0])).toBe(997);
  });
});

describe('Black members', () => {
  it('Cutpurse: round start, take 1 from the rival holding the most (their biggest pile)', () => {
    let s = scene({ res: [{}, { gold: 2, red: 1 }, { blue: 2 }], members: [['thieves.cutpurse']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].black).toBe(1);
    expect(R(s)[1]).toEqual({ ...Z, gold: 1, red: 1 });
  });

  it('Sticky Fingers: steals take 1 more', () => {
    let s = scene({ res: [{}, { gold: 5 }], members: [['thieves.sticky']] });
    s = play(take(s, 'Pickpocket'), 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0].black).toBe(3);
  });

  it('Safehouse: when a rival steals from you, +2 black (once per steal)', () => {
    let s = scene({ res: [{}, { gold: 5 }], members: [[], ['thieves.safehouse']] });
    s = play(take(s, 'Pickpocket'), 'take:1:gold', 'take:1:gold');
    expect(R(s)[1]).toEqual({ ...Z, gold: 3, black: 2 });
  });

  it('Watchdog: your members can’t be taken', () => {
    const s = take(scene({ round: 3, members: [[], ['thieves.watchdog', 'red.intern']] }), 'Heist');
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[1].members).toHaveLength(2);
  });

  it('Robin Hood: stealing from the follower leader gives +1 follower', () => {
    let s = scene({ res: [{}, { gold: 3 }, { gold: 3 }], bonus: [0, 5, 0], members: [['thieves.robinhood']] });
    const f0 = followers(s, s.players[0]);
    s = play(take(s, 'Pickpocket'), 'take:1:gold', 'take:2:gold');
    expect(followers(s, s.players[0])).toBe(f0 + 1);
  });

  it('Desperado: while no one has fewer followers, steals take double', () => {
    let s = scene({ res: [{}, { gold: 9 }], bonus: [0, 2, 1], members: [['thieves.desperado']] });
    s = play(take(s, 'Pickpocket'), 'take:1:gold', 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0].black).toBe(4);
  });

  it('Lookout: +1 black whenever a rival steals', () => {
    let s = scene({ res: [{}, { gold: 3 }], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'Pickpocket'), 'take:1:gold', 'take:1:gold');
    expect(R(s)[2].black).toBe(1);
  });

  it('Accomplice: when recruited, take 1 from each rival', () => {
    let s = scene({ res: [{ black: 2 }, { gold: 2 }, { red: 1 }], shop: ['thieves.accomplice', ...SHOP.slice(1)] });
    s = move(take(s, 'Hideout'), `card:${uidOf(s, 'thieves.accomplice', 'shop')}`);
    expect(R(s).map(r => [r.gold, r.red, r.black])).toEqual([[0, 0, 3 + 2], [1, 0, 0], [0, 0, 0]]);
  });

  it('Understudy: when a member is taken from you, recruit the cheapest face-up member free', () => {
    let s = scene({ round: 3, members: [[], ['thieves.understudy', 'red.intern']], shop: ['red.volunteer', 'red.twins', ...SHOP.slice(2)] });
    s = move(take(s, 'Heist'), `card:${uidOf(s, 'red.intern', 1)}`);
    // Heist's free recruit and the Understudy's: the two cheapest
    expect(defs(s, 1)).toHaveLength(3);
    expect(defs(s, 1).slice(0, 2)).toEqual(['thieves.understudy', 'red.volunteer']);
  });

  it('Fixer: +1 black whenever you take a Black space', () => {
    let s = scene({ members: [['thieves.fixer']] });
    s = take(s, 'Fence');
    expect(R(s)[0].black).toBe(3);
    s = scene({ members: [['thieves.fixer']] });
    expect(R(take(s, 'Rush'))[0].black).toBe(0);
  });

  it('Extortionist: when a rival buys followers, take 1 from them (not while they hide)', () => {
    let s = scene({ res: [{ gold: 5 }], members: [[], ['thieves.extortionist']] });
    s = move(take(s, 'Rush'), 'tier:small');
    expect(R(s)[1].black).toBe(1);
    expect(R(s)[0].gold).toBe(4);
    s = scene({ res: [{ gold: 5 }], members: [[], ['thieves.extortionist']] });
    s = take(s, 'Hideout');
    s = move(s, 'tier:small');
    expect(R(s)[1].black).toBe(0);
  });

  it('Double Agent: when recruited, swap it for any rival member', () => {
    let s = scene({ res: [{ black: 5 }], members: [[], ['red.proselytizer']], shop: ['thieves.doubleagent', ...SHOP.slice(1)] });
    s = take(s, 'Pickpocket');
    s = move(s, `card:${uidOf(s, 'thieves.doubleagent', 'shop')}`);
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(defs(s, 1)).toEqual(['thieves.doubleagent']);
  });

  it('Burglar: once per game, take any rival member; they recruit the cheapest face-up free', () => {
    let s = scene({ res: [{ gold: 0 }], members: [['thieves.burglar'], ['red.proselytizer']], shop: ['red.volunteer', ...SHOP.slice(1)] });
    s = take(s, 'Hideout');
    const b = uidOf(s, 'thieves.burglar', 0);
    s = move(s, `use:${b}`);
    // the buy comes back first (engine order), then the Burglar's pick
    s = move(s, 'pass');
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['thieves.burglar', 'red.proselytizer']);
    expect(defs(s, 1)).toEqual(['red.volunteer']);
    expect(s.cards[b].used).toBe(true);
  });

  it('Kingpin and Mastermind: game-end followers', () => {
    const s = scene({ res: [{ black: 7 }], members: [['thieves.kingpin', 'thieves.mastermind', 'red.intern', 'red.twins']] });
    s.cards[uidOf(s, 'red.intern', 0)].takenBy = 0;
    s.cards[uidOf(s, 'red.twins', 0)].takenBy = 1; // taken by someone else, then traded over: doesn't count
    const ctx = { membersOf: p => p.members.map(u => ({ ...s.cards[u] })) };
    const km = thieves.members.find(d => d.key === 'kingpin'), mm = thieves.members.find(d => d.key === 'mastermind');
    expect(km.onGameEnd(ctx, s.players[0])).toBe(3);
    expect(mm.onGameEnd(ctx, s.players[0])).toBe(2);
  });
});

describe('Black on the table: 200 seeded bot games', () => {
  for (const mode of ['loot', 'black']) it(`${mode}: games finish cleanly with every invariant`, () => {
    setScoring(mode);
    restore(); restore = () => {};
    for (let g = 1; g <= 100; g++) {
      const rand = seededRandom(g * 31);
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: QUADS });
      let last = s.round, guard = 0;
      while (!s.over && guard++ < 1500) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (mode === 'loot' && s.round !== last) { releaseLoot(s); last = s.round; }
        checkInvariants(s, `${mode} game ${g}`);
        for (const p of s.players) expect(p.loot || 0).toBeGreaterThanOrEqual(0);
      }
      expect(s.over).toBe(true);
    }
  }, 120000);
});
