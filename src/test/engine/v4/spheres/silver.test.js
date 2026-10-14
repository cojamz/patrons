// @vitest-environment node
// Silver: every action and every member with exact numbers, plus 200 seeded bot games on a Silver table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, memberCount } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import silver from '../../../../engine/v4/content/silver.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (the fast gate plays 20; budget.js)
const GAMES = games(200);

registerQuadrant(silver);
const Q = ['gold', 'red', 'blue', 'silver'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const SILVER_TEST_COSTS = {
  'silver.guest': [1, 0], 'silver.benefactor': [1, 1], 'silver.caterer': [1, 1], 'silver.majordomo': [1, 1],
  'silver.silversmith': [1, 1], 'silver.steward': [1, 1], 'silver.retinue': [1, 1], 'silver.revelers': [2, 0],
  'silver.heir': [1, 1], 'silver.spoon': [2, 0], 'silver.toastmaster': [3, 2], 'silver.gala': [2, 2],
  'silver.dowager': [2, 2], 'silver.grandhost': [3, 2], 'silver.saint': [3, 2],
};
let restore;
beforeEach(() => { restore = pinCosts({ ...TEST_COSTS, ...SILVER_TEST_COSTS }); });
afterEach(() => restore());

// The shared scene() helper always builds the default table, so Silver tests build their own.
function scene({ n = 3, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], turn = 0, queue = null } = {}) {
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
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: turn }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const Z = { gold: 0, red: 0, blue: 0, silver: 0 };
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];

describe('Silver scoring: most silver', () => {
  it('the most silver at round end takes the ring; ties all score; none scores nothing', () => {
    let s = scene({ res: [{ silver: 3 }, { silver: 2 }, { gold: 9 }], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most silver: P1 +2');
    s = scene({ res: [{ silver: 3 }, { silver: 3 }], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most silver: P1 & P2 +2');
    s = scene({ res: [{ gold: 1 }], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).not.toContain('Most silver');
  });
});

describe('Silver actions', () => {
  it('Toast: +3 silver per round number, everyone else +1 silver', () => {
    let s = take(scene({ res: [{}, { gold: 2 }] }), 'Toast');
    expect(R(s)).toEqual({ ...Z, silver: 3 });
    expect(R(s, 1)).toEqual({ ...Z, gold: 2, silver: 1 });
    expect(R(s, 2)).toEqual({ ...Z, silver: 1 });
    s = take(scene({ round: 3 }), 'Toast');
    expect(R(s).silver).toBe(9);
    expect(R(s, 1).silver).toBe(1);
  });

  it('Goody Bags: +2 silver and +2 of the color you pick; everyone else 1 of it; silver is not a pick', () => {
    let s = take(scene(), 'Goody Bags');
    expect(ids(s)).toEqual(['color:gold', 'color:red', 'color:blue']);
    s = move(s, 'color:red');
    expect(R(s)).toEqual({ ...Z, silver: 2, red: 2 });
    expect(R(s, 1)).toEqual({ ...Z, red: 1 });
    expect(R(s, 2)).toEqual({ ...Z, red: 1 });
  });

  it('Good Deed: +4 silver; any rival you choose gets 2 of the color you choose; never yourself', () => {
    let s = take(scene({ bonus: [0, 3, 1] }), 'Good Deed');
    expect(R(s).silver).toBe(4);
    expect(ids(s)).toHaveLength(8);
    expect(ids(s).some(id => id.startsWith('give:0:'))).toBe(false);
    s = move(s, 'give:1:blue');
    expect(R(s, 1)).toEqual({ ...Z, blue: 2 });
    expect(R(s, 2)).toEqual(Z);
  });

  it('Sweet Talk (ring II): +4 silver, swap silver into one other color, then everyone else +1 silver', () => {
    let s = take(scene({ round: 2, res: [{ silver: 2 }] }), 'Sweet Talk');
    expect(R(s).silver).toBe(6);
    expect(ids(s)).toEqual(['keep', 'swap:gold:3', 'swap:gold:6', 'swap:red:3', 'swap:red:6', 'swap:blue:3', 'swap:blue:6']);
    s = move(s, 'swap:red:6');
    expect(R(s)).toEqual({ ...Z, red: 6 });
    expect(R(s, 1).silver).toBe(1);
    s = move(take(scene({ round: 2 }), 'Sweet Talk'), 'keep');
    expect(R(s).silver).toBe(4);
  });

  it('Rising Tide (ring II): everyone else +1 silver, then half the richest rival’s silver, rounded up', () => {
    const s = take(scene({ round: 2, res: [{ silver: 1 }, { silver: 4 }, { silver: 2 }] }), 'Rising Tide');
    expect(R(s, 1).silver).toBe(5);
    expect(R(s, 2).silver).toBe(3);
    expect(R(s).silver).toBe(1 + 3);
  });

  it('Hold Court (ring III): +1 follower per 2 silver, silver kept; everyone else +2 silver', () => {
    const s = take(scene({ round: 3, res: [{ silver: 9 }] }), 'Hold Court');
    expect(s.players[0].bonus).toBe(4);
    expect(R(s).silver).toBe(9);
    expect(R(s, 1).silver).toBe(2);
    expect(R(s, 2).silver).toBe(2);
  });

  it('rings: Sweet Talk and Rising Tide open in round II, Hold Court in round III', () => {
    const names = s => s.pending.options.map(o => o.label);
    expect(names(scene())).not.toContain('Sweet Talk');
    expect(names(scene({ round: 2 }))).toContain('Rising Tide');
    expect(names(scene({ round: 2 }))).not.toContain('Hold Court');
    expect(names(scene({ round: 3 }))).toContain('Hold Court');
  });
});

describe('Silver members', () => {
  it('Guest: whenever another player gives you something, +1 more of it (not on your own gains)', () => {
    let s = take(scene({ members: [[], ['silver.guest']] }), 'Toast');
    expect(R(s, 1).silver).toBe(2);
    expect(R(s, 2).silver).toBe(1);
    s = move(take(scene({ members: [[], ['silver.guest']] }), 'Goody Bags'), 'color:blue');
    expect(R(s, 1).blue).toBe(2);
    s = take(scene({ members: [['silver.guest']] }), 'Toast');
    expect(R(s).silver).toBe(3);
  });

  it('Benefactor: at round start +3 silver, and the rival you pick gets 1 silver', () => {
    let s = scene({ members: [['silver.benefactor']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(3);
    expect(ids(s)).toEqual(['player:1', 'player:2']);
    s = move(s, 'player:2');
    expect(R(s, 2).silver).toBe(1);
    expect(R(s, 1).silver).toBe(0);
  });

  it('Caterer: whenever you give to other players, +1 silver (once per gift, not per player)', () => {
    let s = take(scene({ members: [['silver.caterer']] }), 'Toast');
    expect(R(s).silver).toBe(4);
    s = move(take(scene({ members: [['silver.caterer']] }), 'Good Deed'), 'give:1:gold');
    expect(R(s).silver).toBe(5);
  });

  it('Majordomo: whenever you take a Silver space, +2 silver (not elsewhere)', () => {
    let s = take(scene({ members: [['silver.majordomo']] }), 'Toast');
    expect(R(s).silver).toBe(5);
    s = take(scene({ members: [['silver.majordomo']] }), 'Golden Years');
    expect(R(s).silver).toBe(0);
  });

  // rewards not hosting (dead-window audit, 2026-10-14)
  it('Silversmith: whenever a rival takes a Silver space, +1 silver (not your own)', () => {
    let s = take(scene({ members: [[], ['silver.silversmith']] }), 'Toast');
    expect([R(s, 1).silver, R(s, 2).silver]).toEqual([2, 1]);
    s = take(scene({ members: [['silver.silversmith']] }), 'Toast');
    expect(R(s).silver).toBe(3);
  });

  it('Steward: at round start +1 silver per 3 silver you hold', () => {
    const s = scene({ res: [{ silver: 7 }], members: [['silver.steward']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(9);
  });

  it('Retinue: worth 2 followers but 1 member; when recruited, everyone else +1 silver', () => {
    let s = scene({ res: [{ silver: 1, gold: 1 }], shop: ['silver.retinue'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.retinue', 'shop')}`);
    expect(memberCount(s, s.players[0])).toBe(1);
    expect(followers(s, s.players[0])).toBe(3);
    expect(R(s, 1).silver).toBe(1);
    expect(R(s, 2).silver).toBe(1);
  });

  // Cory (2026-10-14): Feast Hall became Revelers
  it('Revelers: counts as 3 members, no silver', () => {
    let s = scene({ round: 3, res: [{ silver: 2 }], shop: ['silver.revelers'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.revelers', 'shop')}`);
    expect(memberCount(s, s.players[0])).toBe(3);
    expect(R(s).silver).toBe(0);
  });

  it('Heir: at the start of round III, +1 silver per member (nothing in round II)', () => {
    let s = scene({ members: [['silver.heir', 'silver.retinue', 'gold.banker']], queue: [{ t: 'round', r: 3 }] });
    expect(R(s).silver).toBe(3);
    s = scene({ members: [['silver.heir']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(0);
  });

  it('Upstart: when recruited, gain silver equal to the most silver any rival has', () => {
    let s = scene({ res: [{ silver: 2 }, { silver: 5 }, { silver: 3 }], shop: ['silver.spoon'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.spoon', 'shop')}`);
    expect(R(s).silver).toBe(5);
  });

  it('Toastmaster: whenever you take a Silver space, +1 follower', () => {
    let s = take(scene({ members: [['silver.toastmaster']] }), 'Toast');
    expect(s.players[0].bonus).toBe(1);
    s = take(scene({ members: [['silver.toastmaster']] }), 'Golden Years');
    expect(s.players[0].bonus).toBe(0);
  });

  it('Debutante: once per game, double your silver and everyone else +2 silver', () => {
    let s = scene({ res: [{ silver: 5 }], members: [['silver.gala']], queue: [{ t: 'buy', p: 0 }] });
    const u = uidOf(s, 'silver.gala', 0);
    s = move(s, `use:${u}`);
    expect(R(s).silver).toBe(10);
    expect(R(s, 1).silver).toBe(2);
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Dowager: worth 3 followers, 1 member', () => {
    const s = scene({ members: [['silver.dowager']] });
    expect(followers(s, s.players[0])).toBe(4);
    expect(memberCount(s, s.players[0])).toBe(1);
  });

  it('Grand Host: silver from Silver spaces is doubled; gifts and other spaces are not', () => {
    let s = take(scene({ round: 2, members: [['silver.grandhost']] }), 'Toast');
    expect(R(s).silver).toBe(12);
    expect(R(s, 1).silver).toBe(1);
    s = move(take(scene({ members: [['silver.grandhost']] }), 'Goody Bags'), 'color:red');
    expect(R(s)).toEqual({ ...Z, silver: 4, red: 2 });
    s = take(scene({ members: [['silver.grandhost'], ['silver.guest']] }), 'Toast');
    expect(R(s).silver).toBe(6);
  });

  it('Patron Saint: game end +1 follower per 2 silver members in play, anyone’s', () => {
    const s = scene({ members: [['silver.saint', 'gold.banker'], ['silver.caterer', 'silver.heir'], ['silver.steward']], queue: [{ t: 'finish' }] });
    // Saint, Caterer, Heir, Steward: 4 silver members, so +2
    expect(s.players[0].final.total).toBe(2);
  });
});

describe(`Silver on the table: ${GAMES} seeded bot games`, () => {
  it('every game finishes with no errors and every invariant holds', () => {
    let silverTakes = 0;
    for (let g = 1; g <= GAMES; g++) {
      const n = 2 + (g % 3);
      const rand = seededRandom(g * 31 + 5);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed: g, quadrants: Q });
      let guard = 0;
      while (!s.over) {
        const m = chooseBotMove(s, rand);
        const o = s.pending.options.find(x => x.id === m.option);
        if (o?.kind === 'slot' && o.q === 3) silverTakes++;
        s = applyMove(s, m);
        checkInvariants(s, `silver game ${g}`);
        if (++guard > 1500) throw new Error(`game ${g} did not finish`);
      }
      expect(s.ranking).toHaveLength(n);
    }
    expect(silverTakes).toBeGreaterThan(GAMES * 6);
  });
});
