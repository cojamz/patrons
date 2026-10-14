// @vitest-environment node
// Magenta (thieves): every action and every member, with exact numbers. Plus 200 seeded bot games.
// Stolen goods turn magenta in the thief's supply right away; the ring goes to most magenta.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import thieves, { install } from '../../../../engine/v4/content/thieves.js';
import { take, move, play, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { SHOP_SIZE } from '../../../../engine/v4/core.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (the fast gate plays 20; budget.js)
const GAMES = games(200);

install();
const QUADS = ['gold', 'red', 'blue', 'thieves'];
const BLACK_COSTS = Object.fromEntries(thieves.members.map(d => [d.id, [d.s, d.w]]));
// the costs these tests are written against (repricing the real cards doesn't break them)
const PINNED = {
  ...TEST_COSTS, ...BLACK_COSTS,
  'thieves.cutpurse': [1, 1], 'thieves.mole': [1, 1], 'thieves.accomplice': [2, 0], 'thieves.grifter': [2, 1],
  'thieves.sticky': [1, 1], 'thieves.desperado': [1, 1], 'thieves.robinhood': [2, 1], 'thieves.lookout': [2, 1],
  'thieves.lightfingers': [1, 1], 'thieves.extortionist': [1, 1], 'thieves.watchdog': [2, 1], 'thieves.crew': [2, 1],
  'thieves.doubleagent': [2, 2], 'thieves.bigscore': [3, 1], 'thieves.kingpin': [3, 2],
};
delete PINNED['green.recruit'];
for (const k of Object.keys(PINNED)) if (k.startsWith('green.')) delete PINNED[k];
let restore;
beforeEach(() => { restore = pinCosts(PINNED); });
afterEach(() => { restore(); });

const Z = { gold: 0, red: 0, blue: 0, magenta: 0 };
const R = s => s.players.map(p => p.res);
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.sponsor'];

// scene() from helpers, on the Magenta table
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

describe('Magenta actions', () => {
  it('Help Yourself: take 2 / 3 / 4 resources by round, split as you like (one pick at a time, from what is left)', () => {
    let s = scene({ res: [{}, { gold: 2 }, { red: 1, blue: 1 }] });
    s = take(s, 'Help Yourself');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red', 'take:2:blue']);
    s = play(s, 'take:1:gold', 'take:1:gold');
    expect(R(s)).toEqual([{ ...Z, magenta: 2 }, { ...Z }, { ...Z, red: 1, blue: 1 }]);
    for (const [round, n] of [[2, 3], [3, 4]]) {
      let t = scene({ round, res: [{}, { gold: 9 }] });
      t = take(t, 'Help Yourself');
      for (let k = 0; k < n; k++) t = move(t, 'take:1:gold');
      expect(R(t)[0].magenta).toBe(n);
      expect(t.pending?.kind).not.toBe('choose');
    }
  });

  it('Help Yourself: takes only what there is; nothing asks nothing', () => {
    let s = play(take(scene({ res: [{}, { gold: 1 }] }), 'Help Yourself'), 'take:1:gold');
    expect(R(s)[0].magenta).toBe(1);
    const z = take(scene({}), 'Help Yourself');
    expect(z.pending?.kind).not.toBe('choose');
    expect(R(z)[0].magenta).toBe(0);
  });

  it('Redistribute: take 1 from each player holding more than you (you pick what)', () => {
    let s = scene({ n: 4, res: [{ gold: 2 }, { gold: 3 }, { red: 1, blue: 2 }, { gold: 2 }] });
    s = take(s, 'Redistribute');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red', 'take:2:blue']);
    s = play(s, 'take:2:red', 'take:1:gold');
    expect(R(s).map(r => [r.gold, r.red, r.blue, r.magenta])).toEqual([[2, 0, 0, 2], [2, 0, 0, 0], [0, 0, 2, 0], [2, 0, 0, 0]]);
    const z = take(scene({ res: [{ gold: 5 }, { gold: 1 }] }), 'Redistribute');
    expect(z.pending?.kind).not.toBe('choose');
  });

  it('Lie Low: take 1 from a rival; then no one can steal resources from you this round, Gold’s Collect Debts included (members stay takeable)', () => {
    let s = scene({ round: 2, res: [{ gold: 4 }, {}, { gold: 2 }], members: [['red.intern'], [], []],
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 1 }, { t: 'turn', p: 1 }] });
    s = take(s, 'Lie Low');
    expect(ids(s)).toEqual(['take:2:gold']);
    s = pass(move(s, 'take:2:gold'));
    expect(R(s)[0]).toEqual({ ...Z, gold: 4, magenta: 1 });
    s = take(s, 'Help Yourself');
    expect(ids(s)).toEqual(['take:2:gold']);
    s = pass(play(s, 'take:2:gold'));
    // Cory: Lie Low shields resources only, so Shake Down can still pick the Intern
    s = take(s, 'Shake Down');
    expect(ids(s)).toEqual([`card:${uidOf(s, 'red.intern', 0)}`]);
    s = pass(play(s, `card:${uidOf(s, 'red.intern', 0)}`, 'let'));
    expect(defs(s, 0)).toEqual([]);
    s = take(s, 'Collect Debts');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0].gold).toBe(4);
    expect(s.players[0].hideout).toBe(2);
  });

  it('Crime Wave: take 3 from rivals, at least 1 from each (4 players: 1 each)', () => {
    let s = scene({ n: 4, round: 2, res: [{}, { gold: 5 }, { red: 2, blue: 1 }, { gold: 1 }] });
    s = take(s, 'Crime Wave');
    s = move(s, 'take:2:blue');
    expect(ids(s)).toEqual(['take:1:gold', 'take:3:gold']);
    s = play(s, 'take:1:gold', 'take:3:gold');
    expect(R(s).map(r => [r.gold, r.red, r.blue, r.magenta])).toEqual([[0, 0, 0, 3], [4, 0, 0, 0], [0, 2, 0, 0], [0, 0, 0, 0]]);
  });

  it('Crime Wave: 3 players — one free pick, but the last picks must cover whoever is still owed', () => {
    let s = scene({ n: 3, round: 2, res: [{}, { gold: 5 }, { red: 2 }] });
    s = take(s, 'Crime Wave');
    s = move(s, 'take:1:gold');
    // 2 left, P3 still owed: P2 may still be picked
    expect(ids(s).sort()).toEqual(['take:1:gold', 'take:2:red']);
    s = move(s, 'take:1:gold');
    // 1 left, P3 owed: only P3
    expect(ids(s)).toEqual(['take:2:red']);
    s = move(s, 'take:2:red');
    expect(R(s).map(r => r.magenta)).toEqual([3, 0, 0]);
  });

  it('Crime Wave: 2 players — all 3 from the one rival', () => {
    let s = scene({ n: 2, round: 2, res: [{}, { gold: 5 }] });
    s = play(take(s, 'Crime Wave'), 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s).map(r => [r.gold, r.magenta])).toEqual([[0, 3], [2, 0]]);
  });

  it('Shake Down: the owner pays its cost (from their biggest piles) to keep it', () => {
    let s = scene({ round: 2, res: [{}, { gold: 2, red: 3 }], members: [[], ['red.recruiter']] });
    const card = uidOf(s, 'red.recruiter', 1), c = s.cards[card];
    s = take(s, 'Shake Down');
    s = move(s, `card:${card}`);
    expect(s.pending.player).toBe(1);
    expect(ids(s)).toEqual(['pay', 'let']);
    s = move(s, 'pay');
    void c;
    expect(defs(s, 1)).toEqual(['red.recruiter']);
    expect(R(s)[0].magenta).toBe(2);
    expect(R(s)[1]).toEqual({ ...Z, gold: 1, red: 2 });
  });

  it('Shake Down: or they let it go; only cost 1–6 members are targets; can’t pay means let go', () => {
    let s = scene({ round: 2, res: [{}, { gold: 1 }], members: [[], ['red.mob', 'red.bigfamily', 'red.volunteer']] });
    s = take(s, 'Shake Down');
    const mob = uidOf(s, 'red.mob', 1), fam = uidOf(s, 'red.bigfamily', 1);
    // Volunteer costs 0, so only Mob (3) and Big Family (4) are targets
    expect(ids(s).sort()).toEqual([`card:${mob}`, `card:${fam}`].sort());
    s = move(s, `card:${mob}`);
    expect(ids(s)).toEqual(['let']);
    s = move(s, 'let');
    expect(defs(s, 0)).toEqual(['red.mob']);
  });

  it('Poach: take any rival member; they recruit any face-up member costing up to the same, free', () => {
    let s = scene({ round: 3, members: [[], ['red.proselytizer']], shop: ['red.volunteer', 'red.intern', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.sponsor'] });
    s = take(s, 'Poach');
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(s.pending.player).toBe(1);
    // Proselytizer costs 6 (3+3): every face-up card costs 6 or less
    expect(s.pending.options).toHaveLength(6); // the hand-made scene has 6 face up
    s = move(s, `card:${uidOf(s, 'red.patriarch', 'shop')}`);
    expect(defs(s, 1)).toEqual(['red.patriarch']);
  });
});

describe('Scoring and stolen goods', () => {
  it('stolen goods are magenta in your supply at once, spendable on the same turn', () => {
    let s = scene({ round: 2, res: [{}, { gold: 3 }], shop: ['thieves.mole', ...SHOP.slice(1)] });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0].magenta).toBe(3);
    s = move(s, `card:${uidOf(s, 'thieves.mole', 'shop')}`);
    expect(defs(s, 0)).toEqual(['thieves.mole']);
    expect(R(s)[0].magenta).toBe(1);
  });
  it('Gold’s Collect Debts still takes gold as gold', () => {
    let s = scene({ round: 2, res: [{}, { gold: 3 }] });
    s = play(take(s, 'Collect Debts'), 'player:1', 'player:1', 'player:1');
    expect([R(s)[0].gold, R(s)[0].magenta]).toEqual([3, 0]);
  });
  it('scores most Magenta members (members only; stolen magenta members count for the thief)', () => {
    let s = scene({ round: 3, res: [{}, { magenta: 9 }], members: [['thieves.mole'], ['thieves.crew', 'thieves.cutpurse', 'red.twins']] });
    const ctx = contextFor(s);
    expect(thieves.scoring.label).toBe('Most Magenta members');
    expect([thieves.scoring.score(ctx, s.players[0]), thieves.scoring.score(ctx, s.players[1])]).toEqual([1, 2]);
    s = move(take(s, 'Poach'), `card:${uidOf(s, 'thieves.crew', 1)}`);
    const c2 = contextFor(s);
    expect([thieves.scoring.score(c2, s.players[0]), thieves.scoring.score(c2, s.players[1])]).toEqual([2, 1]);
  });
});

describe('Magenta members', () => {
  it('Cutpurse: round start, take 1 from the rival holding the most (their biggest pile)', () => {
    const s = scene({ res: [{}, { gold: 2, red: 1 }, { blue: 2 }], members: [['thieves.cutpurse']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].magenta).toBe(1);
    expect(R(s)[1]).toEqual({ ...Z, gold: 1, red: 1 });
  });

  it('Mole: round start, take 1 from each player with more followers', () => {
    const s = scene({ res: [{}, { gold: 2 }, { red: 2 }], bonus: [0, 3, 0], members: [['thieves.mole']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).map(r => [r.gold, r.red, r.magenta])).toEqual([[0, 0, 1], [1, 0, 0], [0, 2, 0]]);
  });

  it('Accomplice: when recruited, take 1 from each rival', () => {
    let s = scene({ res: [{ magenta: 2 }, { gold: 2 }, { red: 1 }], shop: ['thieves.accomplice', ...SHOP.slice(1)] });
    s = take(s, 'Golden Years');
    s = move(s, `card:${uidOf(s, 'thieves.accomplice', 'shop')}`);
    expect(R(s).map(r => [r.gold, r.red, r.magenta])).toEqual([[2, 0, 2], [1, 0, 0], [0, 0, 0]]);
  });

  it('Grifter: when recruited, take 1 per 2 members you have, from the rivals holding the most', () => {
    let s = scene({ res: [{ magenta: 2, gold: 1 }, { gold: 3 }, { red: 2 }], members: [['red.intern', 'red.volunteer', 'red.mob', 'red.drive']], shop: ['thieves.grifter', ...SHOP.slice(1)] });
    s = take(s, 'Bandwagon');
    s = move(s, `card:${uidOf(s, 'thieves.grifter', 'shop')}`);
    // 5 members → take 2: P2 (3) first, then P2 vs P3 tied at 2 → P2 (first found)
    expect(R(s)[0].magenta).toBe(2);
    expect(R(s)[1].gold + R(s)[2].red).toBe(3);
  });

  it('Sticky Fingers: steals take 1 more — Magenta’s and Gold’s', () => {
    let s = scene({ res: [{}, { gold: 5 }], members: [['thieves.sticky']] });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0].magenta).toBe(3);
    s = scene({ round: 2, res: [{}, { gold: 9 }], members: [['thieves.sticky']] });
    s = play(take(s, 'Collect Debts'), 'player:1', 'player:1', 'player:1', 'player:1');
    expect(R(s)[0].gold).toBe(4);
  });

  it('Desperado: while no one has fewer followers, steals take double', () => {
    let s = scene({ res: [{}, { gold: 9 }], bonus: [0, 2, 1], members: [['thieves.desperado']] });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0].magenta).toBe(4);
  });

  it('Robin Hood: stealing from the follower leader gives +1 follower', () => {
    let s = scene({ res: [{}, { gold: 3 }, { gold: 3 }], bonus: [0, 5, 0], members: [['thieves.robinhood']] });
    const f0 = followers(s, s.players[0]);
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:2:gold');
    expect(followers(s, s.players[0])).toBe(f0 + 1);
  });

  it('Lookout: once per round, when a rival steals from someone else, take 1 from the thief (also on Gold’s Collect Debts)', () => {
    let s = scene({ res: [{}, { gold: 3 }, {}], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold');
    expect(R(s).map(r => r.magenta)).toEqual([1, 0, 1]);
    // once per round: a second steal in the same round doesn't trigger it
    s = pass(s);
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = play(take(s, 'Lie Low'), 'take:1:gold');
    expect(R(s)[2].magenta).toBe(1);
    s = scene({ round: 2, res: [{}, { gold: 3 }, {}], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'Collect Debts'), 'player:1', 'player:1', 'player:1');
    expect(R(s)[0].gold).toBe(2);
    expect(R(s)[2].magenta).toBe(1);
  });

  it('Light Fingers: when a rival recruits a member costing 8+, take 1 from them', () => {
    let s = scene({ res: [{ gold: 9 }], members: [[], ['thieves.lightfingers']] });
    s = take(s, 'Golden Years');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`); // 5: too cheap
    expect(R(s)[1].magenta).toBe(0);
    const back = pinCosts({ 'gold.midas': [5, 3] });
    try {
      let t = scene({ res: [{ gold: 9 }], members: [[], ['thieves.lightfingers']] });
      t = take(t, 'Golden Years');
      t = move(t, `card:${uidOf(t, 'gold.midas', 'shop')}`); // 8
      expect(R(t)[1].magenta).toBe(1);
    } finally { back(); }
  });

  it('Extortionist: only when a rival buys 6 followers, take 2 from them', () => {
    let s = scene({ res: [{ gold: 9, red: 1, blue: 1 }], members: [[], ['thieves.extortionist']] });
    s = move(take(s, 'Golden Years'), 'tier:small');
    expect(R(s)[1].magenta).toBe(0);
    s = scene({ res: [{ gold: 9, red: 1, blue: 1 }], members: [[], ['thieves.extortionist']] });
    s = move(take(s, 'Golden Years'), 'tier:big');
    expect(R(s)[1].magenta).toBe(2);
  });

  it('Bodyguard: your members can’t be taken', () => {
    const s = take(scene({ round: 3, members: [[], ['thieves.watchdog', 'red.intern']] }), 'Poach');
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[1].members).toHaveLength(2);
  });

  it('Crew: worth 2 followers', () => {
    const s = scene({ members: [['thieves.crew']] });
    expect(followers(s, s.players[0])).toBe(3);
  });

  it('Double Agent: when recruited, swap it for any rival member', () => {
    let s = scene({ res: [{ magenta: 5 }], members: [[], ['red.proselytizer']], shop: ['thieves.doubleagent', ...SHOP.slice(1)] });
    s = take(s, 'Golden Years');
    s = move(s, `card:${uidOf(s, 'thieves.doubleagent', 'shop')}`);
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(defs(s, 1)).toEqual(['thieves.doubleagent']);
  });

  it('Safecracker: once per game, take half the magenta of the rival with the most magenta', () => {
    let s = scene({ res: [{}, { magenta: 7, gold: 9 }, { magenta: 5 }], members: [['thieves.bigscore']] });
    s = take(s, 'Golden Years');
    const b = uidOf(s, 'thieves.bigscore', 0);
    s = move(s, `use:${b}`);
    expect(R(s).map(r => r.magenta)).toEqual([3, 4, 5]);
    expect(R(s)[1].gold).toBe(9);
    expect(s.cards[b].used).toBe(true);
  });

  it('Kingpin: game end, +1 follower per 2 magenta', () => {
    const s = scene({ res: [{ magenta: 7 }] });
    const km = thieves.members.find(d => d.key === 'kingpin');
    expect(km.onGameEnd(contextFor(s), s.players[0])).toBe(3);
  });
});

describe(`Magenta on the table: ${GAMES} seeded bot games`, () => {
  it(`${GAMES} games finish cleanly with every invariant`, () => {
    restore(); restore = () => {};
    for (let g = 1; g <= GAMES; g++) {
      const rand = seededRandom(g * 31);
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: QUADS });
      let guard = 0;
      while (!s.over && guard++ < 1500) {
        s = applyMove(s, chooseBotMove(s, rand));
        checkInvariants(s, `game ${g}`);
      }
      expect(s.over).toBe(true);
    }
  });
});
