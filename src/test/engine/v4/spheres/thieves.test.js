// @vitest-environment node
// Magenta (thieves): every action and every member, with exact numbers. Plus 200 seeded bot games.
// Stolen resources keep their colors; every Magenta action gives +1 magenta; the ring goes to most magenta held.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import thieves, { install } from '../../../../engine/v4/content/thieves.js';
import { take, move, play, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { SHOP_SIZE } from '../../../../engine/v4/core.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (budget.js). The verdict plays 100 (catches a
// bug in ≥3% of this table's games with 95% confidence), the nightly full run (check:v4:full) all 200, the fast gate 20.
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
  // every Magenta action gives +1 magenta on top of its printed effect; stolen resources keep their colors
  it('Help Yourself: steal 1 / 2 / 3 resources by round and gain 1 / 2 / 3 followers, +1 magenta (one pick at a time, from what is left)', () => {
    let s = scene({ res: [{}, { gold: 2 }, { red: 1, blue: 1 }] });
    const f0 = followers(s, s.players[0]);
    s = take(s, 'thieves.pickpocket');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red', 'take:2:blue']);
    s = move(s, 'take:1:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)).toEqual([{ ...Z, gold: 1, magenta: 1 }, { ...Z, gold: 1 }, { ...Z, red: 1, blue: 1 }]);
    expect(followers(s, s.players[0])).toBe(f0 + 1);
    // the follower comes from whoever you took from (Cory, Oct 22)
    expect(followers(s, s.players[1])).toBe(0);
    expect(followers(s, s.players[2])).toBe(1);
    for (const [round, n] of [[2, 2], [3, 3]]) {
      let t = scene({ round, res: [{}, { gold: 9 }] });
      const g0 = followers(t, t.players[0]);
      t.players[1].bonus = 5;
      const v0 = followers(t, t.players[1]);
      t = take(t, 'thieves.pickpocket');
      for (let k = 0; k < n; k++) t = move(t, 'take:1:gold');
      expect(followers(t, t.players[1])).toBe(v0 - round);
      expect(t.pending?.kind).not.toBe('choose');
      expect(R(t)[0]).toEqual({ ...Z, gold: n, magenta: 1 });
      expect(R(t)[1].gold).toBe(9 - n);
      expect(followers(t, t.players[0])).toBe(g0 + round);
    }
  });

  it('Help Yourself: followers split across whoever you took from, and never below 0', () => {
    let s = scene({ round: 3, res: [{}, { gold: 2 }, { red: 1 }], bonus: [0, 0, 4] });
    const f = i => followers(s, s.players[i]);
    const [a0, b0, c0] = [f(0), f(1), f(2)];
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold', 'take:1:gold', 'take:2:red');
    expect(s.pending?.kind).not.toBe('choose');
    // P2 was robbed most and gives 1 (all they have); P3 gives the other 2
    expect([f(0) - a0, b0 - f(1), c0 - f(2)]).toEqual([3, 1, 2]);
  });

  it('Help Yourself: takes only what there is; nothing to take gives no followers, just the magenta', () => {
    let s = take(scene({ round: 2, res: [{}, { gold: 1 }] }), 'thieves.pickpocket');
    s = move(s, 'take:1:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0]).toEqual({ ...Z, gold: 1, magenta: 1 });
    let z = scene({});
    const f0 = followers(z, z.players[0]);
    z = take(z, 'thieves.pickpocket');
    expect(z.pending?.kind).not.toBe('choose');
    expect(R(z)[0]).toEqual({ ...Z, magenta: 1 });
    expect(followers(z, z.players[0])).toBe(f0);
  });

  it('Redistribute: steal 1 per Magenta action that has a minion (the one just placed too), split as you like', () => {
    let s = scene({ n: 4, res: [{ gold: 2 }, { gold: 3 }, { red: 1, blue: 2 }, { gold: 2 }] });
    // Magenta is the 4th quadrant (index 3): Help Yourself (3-0) and Lie Low (3-2) are taken; a Gold space doesn't count
    s.slots = { '3-0': 1, '3-2': 2, '0-0': 3 };
    s = take(s, 'thieves.tipoff');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red', 'take:2:blue', 'take:3:gold']);
    s = play(s, 'take:2:red', 'take:2:blue', 'take:3:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s).map(r => [r.gold, r.red, r.blue, r.magenta])).toEqual([[3, 1, 1, 1], [3, 0, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]]);
    // no other Magenta space taken: its own space still counts, so 1 to steal
    let z = take(scene({ res: [{}, { gold: 5 }] }), 'thieves.tipoff');
    z = play(z, 'take:1:gold');
    expect(z.pending?.kind).not.toBe('choose');
    expect(R(z)).toEqual([{ ...Z, gold: 1, magenta: 1 }, { ...Z, gold: 4 }, { ...Z }]);
  });

  it('Lie Low: steal 1 resource × round; then no one can steal your resources or members this round, Gold’s Collect Debts included', () => {
    let s = scene({ round: 2, res: [{ gold: 4 }, {}, { gold: 3 }], members: [['red.intern'], [], []],
      queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 1 }, { t: 'turn', p: 1 }] });
    s = take(s, 'thieves.hideout');
    expect(ids(s)).toEqual(['take:2:gold']);
    s = pass(play(s, 'take:2:gold', 'take:2:gold'));
    expect(R(s)[0]).toEqual({ ...Z, gold: 6, magenta: 1 });
    expect(s.players[0].hideout).toBe(2);
    // P2's Help Yourself can only reach P3
    s = take(s, 'thieves.pickpocket');
    expect(ids(s)).toEqual(['take:2:gold']);
    s = pass(move(s, 'take:2:gold'));
    // Shake Down can't pick the Intern
    s = take(s, 'thieves.ransom');
    expect(s.pending?.kind).not.toBe('choose');
    s = pass(s);
    expect(defs(s, 0)).toEqual(['red.intern']);
    s = take(s, 'gold.steal');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0].gold).toBe(6);
  });

  it('Crime Wave: steal half (rounded down) of one rival’s pile of one color, +1 magenta', () => {
    let s = scene({ n: 3, round: 2, res: [{}, { gold: 5, red: 3 }, { blue: 4, red: 1 }] });
    s = take(s, 'thieves.rob');
    // one color's pile, not the rival's whole holding; a pile of 1 halves to nothing
    expect(ids(s)).toEqual(['take:1:gold', 'take:1:red', 'take:2:blue']);
    expect(s.pending.options.map(o => o.take)).toEqual([2, 1, 2]);
    s = move(s, 'take:1:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)).toEqual([{ ...Z, gold: 2, magenta: 1 }, { ...Z, gold: 3, red: 3 }, { ...Z, blue: 4, red: 1 }]);
  });

  it('Crime Wave: no pile of 2 or more anywhere means nothing to steal, just the magenta', () => {
    const s = take(scene({ n: 3, round: 2, res: [{}, { gold: 1, red: 1 }, { blue: 1 }] }), 'thieves.rob');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)).toEqual([{ ...Z, magenta: 1 }, { ...Z, gold: 1, red: 1 }, { ...Z, blue: 1 }]);
  });

  it('Shake Down: the owner pays its cost (from their biggest piles, colors kept) to keep it', () => {
    let s = scene({ round: 2, res: [{}, { gold: 2, red: 3 }], members: [[], ['red.recruiter']] });
    const card = uidOf(s, 'red.recruiter', 1);
    s = take(s, 'thieves.ransom');
    s = move(s, `card:${card}`);
    expect(s.pending.player).toBe(1);
    expect(ids(s)).toEqual(['pay', 'let']);
    s = move(s, 'pay');
    expect(defs(s, 1)).toEqual(['red.recruiter']);
    expect(R(s)[0]).toEqual({ ...Z, gold: 1, red: 1, magenta: 1 });
    expect(R(s)[1]).toEqual({ ...Z, gold: 1, red: 2 });
  });

  it('Shake Down: or they let it go; only cost 1–5 members are targets; can’t pay means let go', () => {
    let s = scene({ round: 2, res: [{}, { gold: 1 }], members: [[], ['red.mob', 'red.bigfamily', 'red.volunteer', 'gold.speculator', 'red.proselytizer']] });
    s = take(s, 'thieves.ransom');
    const mob = uidOf(s, 'red.mob', 1), fam = uidOf(s, 'red.bigfamily', 1), spec = uidOf(s, 'gold.speculator', 1);
    // Volunteer costs 0 and Proselytizer 6 (over 5), so Mob (3), Big Family (4) and Speculator (5) are targets
    expect(ids(s).sort()).toEqual([`card:${mob}`, `card:${fam}`, `card:${spec}`].sort());
    // can't pay: no question with one answer (skeptic r2), it just goes
    s = move(s, `card:${mob}`);
    expect(s.pending?.player).not.toBe(1);
    expect(defs(s, 0)).toEqual(['red.mob']);
    let t = scene({ round: 2, res: [{}, { gold: 5 }], members: [[], ['red.mob']] });
    t = play(take(t, 'thieves.ransom'), `card:${uidOf(t, 'red.mob', 1)}`, 'let');
    expect(defs(t, 0)).toEqual(['red.mob']);
    expect(R(t)).toEqual([{ ...Z, magenta: 1 }, { ...Z, gold: 5 }, { ...Z }]);
  });

  it('Poach takes a rival member with no replacement', () => {
    let s = scene({ round: 3, members: [[], ['red.proselytizer']], shop: ['red.volunteer', 'red.intern', 'gold.tycoon', 'red.mentor', 'red.patriarch', 'red.sponsor'] });
    const shop = [...s.shop];
    s = move(take(s, 'thieves.heist'), `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(defs(s, 1)).toEqual([]);
    expect(s.shop).toEqual(shop);
    expect(s.pending?.player).not.toBe(1);
  });
});

describe('Scoring and stolen goods', () => {
  it('stolen goods keep their colors in your supply at once, spendable on the same turn', () => {
    let s = scene({ round: 3, res: [{ red: 1 }, { gold: 5 }] });
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s)[0]).toEqual({ ...Z, gold: 3, red: 1, magenta: 1 });
    // Midas (3 gold + 2 any) paid with the stolen gold
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`);
    expect(defs(s, 0)).toEqual(['gold.midas']);
    expect(R(s)[0]).toEqual({ ...Z });
    expect(R(s)[1].gold).toBe(2);
  });
  it('Gold’s Collect Debts still takes gold as gold', () => {
    let s = scene({ round: 2, res: [{}, { gold: 3 }] });
    s = play(take(s, 'gold.steal'), 'player:1', 'player:1', 'player:1');
    expect([R(s)[0].gold, R(s)[0].magenta]).toEqual([3, 0]);
  });
  it('scores held magenta resources; stealing a member does not move resource counts (only Poach’s own +1 magenta)', () => {
    let s = scene({ round: 3, res: [{}, { magenta: 9 }], members: [['thieves.mole'], ['thieves.crew', 'thieves.cutpurse', 'red.twins']] });
    const ctx = contextFor(s);
    expect(thieves.scoring.label).toBe('Most magenta');
    expect([thieves.scoring.score(ctx, s.players[0]), thieves.scoring.score(ctx, s.players[1])]).toEqual([0, 9]);
    s = move(take(s, 'thieves.heist'), `card:${uidOf(s, 'thieves.crew', 1)}`);
    const c2 = contextFor(s);
    expect([thieves.scoring.score(c2, s.players[0]), thieves.scoring.score(c2, s.players[1])]).toEqual([1, 9]);
    expect(R(s)[1]).toEqual({ ...Z, magenta: 9 });
  });
});

describe('Magenta members', () => {
  it('Cutpurse: round start, choose 1 resource from the rival holding the most', () => {
    let s = scene({ res: [{}, { gold: 2, red: 1 }, { blue: 2 }], members: [['thieves.cutpurse']], queue: [{ t: 'round', r: 2 }] });
    expect(ids(s)).toEqual(['take:1:gold', 'take:1:red']);
    s = move(s, 'take:1:gold');
    expect(R(s)[0]).toEqual({ ...Z, gold: 1 });
    expect(R(s)[1]).toEqual({ ...Z, gold: 1, red: 1 });
  });

  it('Mole: round start, take 1 from each player with more followers', () => {
    const s = scene({ res: [{}, { gold: 2 }, { red: 2 }], bonus: [0, 3, 0], members: [['thieves.mole']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).map(r => [r.gold, r.red, r.magenta])).toEqual([[1, 0, 0], [1, 0, 0], [0, 2, 0]]);
  });

  it('Accomplice: when recruited, take 1 from each rival', () => {
    let s = scene({ res: [{ magenta: 2 }, { gold: 2 }, { red: 1 }], shop: ['thieves.accomplice', ...SHOP.slice(1)] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'thieves.accomplice', 'shop')}`);
    expect(R(s).map(r => [r.gold, r.red, r.magenta])).toEqual([[3, 1, 0], [1, 0, 0], [0, 0, 0]]);
  });

  // first sentence only (Cory, 2026-10-18): the picks split freely among rivals, no longer only the richest
  it('Grifter: when recruited, take 1 per 2 members you have, from any rivals you choose', () => {
    let s = scene({ res: [{ magenta: 2, gold: 1 }, { gold: 3 }, { red: 2 }], members: [['red.intern', 'red.volunteer', 'red.reserve', 'red.drive']], shop: ['thieves.grifter', ...SHOP.slice(1)] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'thieves.grifter', 'shop')}`);
    // 5 members (Mob would count as 5, so plain ones here) → take 2; P3 (2 red) is open on the first pick, not only P2 (3)
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red']);
    const paid = { ...R(s)[0] };
    s = move(s, 'take:2:red');
    expect(ids(s)).toEqual(['take:1:gold', 'take:2:red']);
    s = move(s, 'take:2:red');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0]).toEqual({ ...paid, red: paid.red + 2 });
    expect([R(s)[1].gold, R(s)[2].red]).toEqual([3, 0]);
  });

  it('Sticky Fingers: steals take 1 more — Magenta’s and Gold’s', () => {
    let s = scene({ res: [{}, { gold: 5 }], members: [['thieves.sticky']] });
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold', 'take:1:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0]).toEqual({ ...Z, gold: 2, magenta: 1 });
    s = scene({ round: 2, res: [{}, { gold: 9 }], members: [['thieves.sticky']] });
    s = play(take(s, 'gold.steal'), 'player:1', 'player:1', 'player:1', 'player:1');
    expect(R(s)[0].gold).toBe(4);
  });

  it('Desperado: while no one has fewer followers, steals take double (Help Yourself’s followers come after the steal)', () => {
    // P1 (Desperado's 1 follower + 1) ties P2 for fewest; Help Yourself's +1 follower would end that, but it lands after the steal is sized
    let s = scene({ res: [{}, { gold: 9 }], bonus: [1, 2, 5], members: [['thieves.desperado']] });
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold', 'take:1:gold');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)[0]).toEqual({ ...Z, gold: 2, magenta: 1 });
    // not the fewest: no doubling
    let t = scene({ res: [{}, { gold: 9 }], bonus: [2, 2, 5], members: [['thieves.desperado']] });
    t = play(take(t, 'thieves.pickpocket'), 'take:1:gold');
    expect(t.pending?.kind).not.toBe('choose');
    expect(R(t)[0]).toEqual({ ...Z, gold: 1, magenta: 1 });
  });

  it('Robin Hood: stealing from the follower leader gives +1 follower', () => {
    let s = scene({ res: [{}, { gold: 3 }, { gold: 3 }], bonus: [0, 5, 0], members: [['thieves.robinhood']] });
    const f0 = followers(s, s.players[0]);
    // Help Yourself's own +1 follower, plus Robin Hood's +1
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold');
    expect(followers(s, s.players[0])).toBe(f0 + 2);
    let t = scene({ res: [{}, { gold: 3 }, { gold: 3 }], bonus: [0, 5, 0], members: [['thieves.robinhood']] });
    t = play(take(t, 'thieves.pickpocket'), 'take:2:gold');
    expect(followers(t, t.players[0])).toBe(f0 + 1);
  });

  it('Lookout: once per round, when a rival steals from someone else, take 1 from the thief (also on Gold’s Collect Debts)', () => {
    let s = scene({ res: [{}, { gold: 3 }, {}], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold');
    // the thief held 1 gold, 1 magenta: Lookout takes from the first biggest pile
    expect(R(s)).toEqual([{ ...Z, magenta: 1 }, { ...Z, gold: 2 }, { ...Z, gold: 1 }]);
    // once per round: a second steal in the same round doesn't trigger it
    s = pass(s);
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    s = play(take(s, 'thieves.hideout'), 'take:1:gold');
    expect(R(s)[0]).toEqual({ ...Z, gold: 1, magenta: 2 });
    expect(R(s)[2]).toEqual({ ...Z, gold: 1 });
    s = scene({ round: 2, res: [{}, { gold: 3 }, {}], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'gold.steal'), 'player:1', 'player:1', 'player:1');
    expect(R(s)[0].gold).toBe(2);
    expect(R(s)[2]).toEqual({ ...Z, gold: 1 });
  });

  it('Light Fingers: when a rival recruits a member costing 8+, take 1 from them', () => {
    let s = scene({ res: [{ gold: 9 }], members: [[], ['thieves.lightfingers']] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`); // 5: too cheap
    expect(R(s)[1]).toEqual({ ...Z });
    const back = pinCosts({ 'gold.midas': [5, 3] });
    try {
      let t = scene({ res: [{ gold: 9 }], members: [[], ['thieves.lightfingers']] });
      t = take(t, 'gold.rush');
      t = move(t, `card:${uidOf(t, 'gold.midas', 'shop')}`); // 8
      expect(R(t)[1]).toEqual({ ...Z, gold: 1 });
      expect(R(t)[0].gold).toBe(2);
    } finally { back(); }
  });

  it('Extortionist: only when a rival buys 5 or more followers, take 2 from them', () => {
    let s = scene({ res: [{ gold: 9, red: 1, blue: 1 }], members: [[], ['thieves.extortionist']] });
    s = move(take(s, 'gold.rush'), 'tier:small');
    expect(R(s)[1]).toEqual({ ...Z });
    for (const tier of ['mid', 'top']) {
      let t = scene({ res: [{ gold: 9, red: 1, blue: 1 }], members: [[], ['thieves.extortionist']] });
      t = move(take(t, 'gold.rush'), `tier:${tier}`);
      // 2 taken from the buyer's biggest pile, colors kept
      expect(R(t)[1]).toEqual({ ...Z, gold: 2 });
    }
  });

  it('Bodyguard: rivals can’t steal your members or your resources', () => {
    const s = take(scene({ round: 3, members: [[], ['thieves.watchdog', 'red.intern']] }), 'thieves.heist');
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[1].members).toHaveLength(2);
    let t = scene({ res: [{}, { gold: 3 }, { red: 1 }], members: [[], ['thieves.watchdog']] });
    t = take(t, 'thieves.pickpocket');
    expect(ids(t)).toEqual(['take:2:red']);
    t = move(t, 'take:2:red');
    expect(R(t)[1]).toEqual({ ...Z, gold: 3 });
  });

  it('Crew: worth 2 followers', () => {
    const s = scene({ members: [['thieves.crew']] });
    expect(followers(s, s.players[0])).toBe(3);
  });

  it('Double Agent: when recruited, swap it for any rival member', () => {
    let s = scene({ res: [{ magenta: 5 }], members: [[], ['red.proselytizer']], shop: ['thieves.doubleagent', ...SHOP.slice(1)] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'thieves.doubleagent', 'shop')}`);
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 1)}`);
    expect(defs(s, 0)).toEqual(['red.proselytizer']);
    expect(defs(s, 1)).toEqual(['thieves.doubleagent']);
  });

  it('Safecracker: once per game, take half the magenta of the rival with the most magenta', () => {
    let s = scene({ res: [{}, { magenta: 7, gold: 9 }, { magenta: 5 }], members: [['thieves.bigscore']] });
    s = take(s, 'gold.rush');
    const b = uidOf(s, 'thieves.bigscore', 0);
    s = move(s, `use:${b}`);
    expect(R(s).map(r => r.magenta)).toEqual([3, 4, 5]);
    expect(R(s)[1].gold).toBe(9);
    expect(s.cards[b].used).toBe(true);
  });

  it('Kingpin: game end, +1 follower per magenta member you have', () => {
    const s = scene({ res: [{ magenta: 7 }] });
    const km = thieves.members.find(d => d.key === 'kingpin');
    expect(km.onGameEnd(contextFor(s), s.players[0])).toBe(contextFor(s).countMembersOfColor(s.players[0], 'thieves'));
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
