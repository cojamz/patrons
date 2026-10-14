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

registerQuadrant(silver);
const Q = ['gold', 'red', 'blue', 'silver'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const SILVER_TEST_COSTS = {
  'silver.guest': [1, 0], 'silver.benefactor': [1, 1], 'silver.caterer': [1, 1], 'silver.almoner': [1, 1],
  'silver.saint': [3, 2], 'silver.retinue': [1, 1], 'silver.gala': [2, 2], 'silver.ambassador': [1, 1],
  'silver.diplomat': [2, 2], 'silver.heir': [1, 1], 'silver.hangeron': [1, 0], 'silver.toastmaster': [3, 2],
  'silver.confidant': [1, 1], 'silver.socialite': [1, 1], 'silver.spoon': [2, 0],
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
  it('Feast: +4 silver, everyone else +1 silver', () => {
    const s = take(scene({ res: [{}, { gold: 2 }] }), 'Feast');
    expect(R(s)).toEqual({ ...Z, silver: 4 });
    expect(R(s, 1)).toEqual({ ...Z, gold: 2, silver: 1 });
    expect(R(s, 2)).toEqual({ ...Z, silver: 1 });
  });

  it('Gift: +2 silver and +2 of the color you pick; everyone else 1 of it; silver is not a pick', () => {
    let s = take(scene(), 'Gift');
    expect(ids(s)).toEqual(['color:gold', 'color:red', 'color:blue']);
    s = move(s, 'color:red');
    expect(R(s)).toEqual({ ...Z, silver: 2, red: 2 });
    expect(R(s, 1)).toEqual({ ...Z, red: 1 });
    expect(R(s, 2)).toEqual({ ...Z, red: 1 });
  });

  it('Alms: +3 silver; the rival with the fewest followers gets 2 of the color you pick', () => {
    let s = take(scene({ bonus: [0, 3, 1] }), 'Alms');
    expect(R(s).silver).toBe(3);
    // P3 trails the rivals (2 followers vs 4): only P3 is offered, in any color
    expect(ids(s)).toEqual(['give:2:gold', 'give:2:red', 'give:2:blue', 'give:2:silver']);
    s = move(s, 'give:2:blue');
    expect(R(s, 2)).toEqual({ ...Z, blue: 2 });
    expect(R(s, 1)).toEqual(Z);
  });

  it('Alms: tied trailing rivals are both offered; you are never the target', () => {
    const s = take(scene({ bonus: [0, 1, 1] }), 'Alms');
    expect(ids(s)).toHaveLength(8);
    expect(ids(s).some(id => id.startsWith('give:0:'))).toBe(false);
  });

  it('Banquet (ring II): +3 silver and +3 of the color you pick; everyone else 1 of it', () => {
    const s = move(take(scene({ round: 2 }), 'Banquet'), 'color:gold');
    expect(R(s)).toEqual({ ...Z, silver: 3, gold: 3 });
    expect(R(s, 1).gold).toBe(1);
    expect(R(s, 2).gold).toBe(1);
  });

  it('Rising Tide (ring II): everyone else +1 silver, then half the richest rival’s silver, rounded up', () => {
    const s = take(scene({ round: 2, res: [{ silver: 1 }, { silver: 4 }, { silver: 2 }] }), 'Rising Tide');
    expect(R(s, 1).silver).toBe(5);
    expect(R(s, 2).silver).toBe(3);
    expect(R(s).silver).toBe(1 + 3);
  });

  it('Jubilee (ring III): +1 follower per 2 silver, silver kept; everyone else +2 silver', () => {
    const s = take(scene({ round: 3, res: [{ silver: 9 }] }), 'Jubilee');
    expect(s.players[0].bonus).toBe(4);
    expect(R(s).silver).toBe(9);
    expect(R(s, 1).silver).toBe(2);
    expect(R(s, 2).silver).toBe(2);
  });

  it('rings: Banquet and Rising Tide open in round II, Jubilee in round III', () => {
    const names = s => s.pending.options.map(o => o.label);
    expect(names(scene())).not.toContain('Banquet');
    expect(names(scene({ round: 2 }))).toContain('Rising Tide');
    expect(names(scene({ round: 2 }))).not.toContain('Jubilee');
    expect(names(scene({ round: 3 }))).toContain('Jubilee');
  });
});

describe('Silver members', () => {
  it('Guest: whenever another player gives you something, +1 more of it (not on your own gains)', () => {
    let s = take(scene({ members: [[], ['silver.guest']] }), 'Feast');
    expect(R(s, 1).silver).toBe(2);
    expect(R(s, 2).silver).toBe(1);
    s = move(take(scene({ members: [[], ['silver.guest']] }), 'Gift'), 'color:blue');
    expect(R(s, 1).blue).toBe(2);
    s = take(scene({ members: [['silver.guest']] }), 'Feast');
    expect(R(s).silver).toBe(4);
  });

  it('Benefactor: at round start +3 silver, and the rival you pick gets 1 silver', () => {
    let s = scene({ members: [['silver.benefactor']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(3);
    expect(s.pending.kind).toBe('choose');
    expect(ids(s)).toEqual(['player:1', 'player:2']);
    s = move(s, 'player:2');
    expect(R(s, 2).silver).toBe(1);
    expect(R(s, 1).silver).toBe(0);
  });

  it('Caterer: whenever you give to other players, +1 silver (once per gift, not per player)', () => {
    let s = take(scene({ members: [['silver.caterer']] }), 'Feast');
    expect(R(s).silver).toBe(5);
    s = move(take(scene({ members: [['silver.caterer']] }), 'Alms'), 'give:1:gold');
    expect(R(s).silver).toBe(4);
  });

  it('Almoner: at round start +2 silver per player with more followers than you', () => {
    const s = scene({ n: 4, members: [['silver.almoner']], bonus: [0, 3, 3, 0], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(4);
  });

  it('Patron Saint: game end +1 follower per 2 silver members in play, anyone’s', () => {
    const s = scene({ members: [['silver.saint', 'gold.banker'], ['silver.caterer', 'silver.heir'], ['silver.retinue']], queue: [{ t: 'finish' }] });
    // Saint, Caterer, Heir, and Retinue (counts as 2 members): 5 silver members, so +2
    expect(s.players[0].final.total).toBe(2);
  });

  it('Retinue: counts as 2 members and 2 followers; when recruited, everyone else +1 silver', () => {
    let s = scene({ res: [{ silver: 1, gold: 1 }], shop: ['silver.retinue'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.retinue', 'shop')}`);
    expect(memberCount(s, s.players[0])).toBe(2);
    expect(followers(s, s.players[0])).toBe(3);
    expect(R(s, 1).silver).toBe(1);
    expect(R(s, 2).silver).toBe(1);
  });

  it('Gala: once per game, double your silver and everyone else +2 silver', () => {
    let s = scene({ res: [{ silver: 5 }], members: [['silver.gala']], queue: [{ t: 'buy', p: 0 }] });
    const u = uidOf(s, 'silver.gala', 0);
    s = move(s, `use:${u}`);
    expect(R(s).silver).toBe(10);
    expect(R(s, 1).silver).toBe(2);
    expect(ids(s)).not.toContain(`use:${u}`);
  });

  it('Ambassador: whenever a rival recruits a silver member, +1 silver', () => {
    let s = scene({ res: [{ silver: 2, gold: 3 }], members: [[], ['silver.ambassador']], shop: ['silver.heir', 'gold.banker'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.heir', 'shop')}`);
    expect(R(s, 1).silver).toBe(1);
    s = scene({ res: [{ silver: 2, gold: 3 }], members: [[], ['silver.ambassador']], shop: ['silver.heir', 'gold.banker'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'gold.banker', 'shop')}`);
    expect(R(s, 1).silver).toBe(0);
  });

  it('Diplomat: a space outside Silver gives +2 silver and everyone else +1 silver; Silver spaces don’t', () => {
    let s = take(scene({ members: [['silver.diplomat']] }), 'Rush');
    expect(R(s)).toEqual({ ...Z, gold: 2, silver: 2 });
    expect(R(s, 1).silver).toBe(1);
    s = take(scene({ members: [['silver.diplomat']] }), 'Feast');
    expect(R(s).silver).toBe(4);
  });

  it('Heir: at the start of round III, +1 silver per member (nothing in round II)', () => {
    let s = scene({ members: [['silver.heir', 'silver.retinue', 'gold.banker']], queue: [{ t: 'round', r: 3 }] });
    // Heir 1 + Retinue 2 + Banker 1 = 4 members; Banker also pays its 3 gold
    expect(R(s).silver).toBe(4);
    s = scene({ members: [['silver.heir']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(0);
  });

  it('Hanger-On: whenever a rival takes a Silver space, +1 silver (not your own)', () => {
    let s = take(scene({ members: [[], ['silver.hangeron']] }), 'Feast');
    expect(R(s, 1).silver).toBe(2);
    s = take(scene({ members: [['silver.hangeron']] }), 'Feast');
    expect(R(s).silver).toBe(4);
  });

  it('Toastmaster: whenever you take a Silver space, +1 follower', () => {
    let s = take(scene({ members: [['silver.toastmaster']] }), 'Feast');
    expect(s.players[0].bonus).toBe(1);
    s = take(scene({ members: [['silver.toastmaster']] }), 'Rush');
    expect(s.players[0].bonus).toBe(0);
  });

  it('Confidant: pick a rival when recruited; whenever they recruit, +1 silver', () => {
    let s = scene({ res: [{ silver: 1, gold: 1 }, { gold: 5 }], shop: ['silver.confidant', 'gold.banker'], queue: [{ t: 'buy', p: 0 }, { t: 'buy', p: 1 }] });
    s = move(s, `card:${uidOf(s, 'silver.confidant', 'shop')}`);
    expect(ids(s)).toEqual(['player:1', 'player:2']);
    s = move(s, 'player:1');
    s = move(s, `card:${uidOf(s, 'gold.banker', 'shop')}`);
    expect(R(s).silver).toBe(1);
  });

  it('Socialite: at round start +1 silver per rival who has any silver', () => {
    const s = scene({ n: 4, res: [{}, { silver: 1 }, { silver: 4 }, { gold: 3 }], members: [['silver.socialite']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).silver).toBe(2);
  });

  it('Silver Spoon: when recruited, gain silver equal to the most silver any rival has', () => {
    let s = scene({ res: [{ silver: 2 }, { silver: 5 }, { silver: 3 }], shop: ['silver.spoon'], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `card:${uidOf(s, 'silver.spoon', 'shop')}`);
    expect(R(s).silver).toBe(5);
  });
});

describe('Silver on the table: 200 seeded bot games', () => {
  it('every game finishes with no errors and every invariant holds', () => {
    let silverTakes = 0;
    for (let g = 1; g <= 200; g++) {
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
    expect(silverTakes).toBeGreaterThan(200 * 6);
  }, 180000);
});
