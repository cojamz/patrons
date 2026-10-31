// @vitest-environment node
// Yellow: every action and every member with exact numbers, plus 200 seeded bot games on a Yellow table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import yellow, { setsOf } from '../../../../engine/v4/content/yellow.js';
import { take, move, uidOf, ids, fol, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';
import { games } from '../budget.js';

// seeded games in the table block below: a game count, not a time budget (budget.js). The verdict plays 100 (catches a
// bug in ≥3% of this table's games with 95% confidence), the nightly full run (check:v4:full) all 200, the fast gate 20.
const GAMES = games(200);

registerQuadrant(yellow);
const Q = ['gold', 'red', 'yellow', 'green'];

// Costs these tests are written against; repricing the real cards doesn't break them.
const YELLOW_TEST_COSTS = {
  'yellow.gardener': [1, 1], 'yellow.peddler': [2, 1], 'yellow.gleaner': [1, 1], 'yellow.admirer': [2, 1],
  'yellow.gobetween': [1, 0], 'yellow.dyer': [1, 1], 'yellow.latebloomer': [1, 0], 'yellow.sower': [2, 1],
  'yellow.harmonist': [4, 2], 'yellow.rainmaker': [3, 2], 'yellow.pilgrim': [2, 1], 'yellow.farmer': [1, 1],
  'yellow.weaver': [1, 1], 'yellow.explorer': [1, 1], 'yellow.chefs': [2, 2],
};
let restore;
beforeEach(() => {
  const base = Object.fromEntries(Object.entries(TEST_COSTS).filter(([k]) => !k.startsWith('blue.')));
  restore = pinCosts({ ...base, ...YELLOW_TEST_COSTS });
});
afterEach(() => restore());

// The shared scene() helper always builds the default table, so Yellow tests build their own.
function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], turn = 0, queue = null } = {}) {
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
const Z = { gold: 0, red: 0, yellow: 0, green: 0 };
const pass = s => move(s, 'pass');
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];

// Yellow 2.0 (Cory, 2026-10-30/31): the card-by-card cases live in cards-yellow.test.js; here, the contest and a table.
describe('Yellow scoring: most yellow, as every 2.0 color', () => {
  it('scores the yellow you hold', () => {
    const ctxless = { state: { resources: ['gold', 'red', 'yellow', 'green'] } };
    expect(yellow.scoring.score(ctxless, { res: { ...Z, yellow: 3, gold: 9 } })).toBe(3);
  });
  it('a full set is one of each color (Harmonist reads it)', () => {
    const s = scene({ res: [{ gold: 2, red: 2, yellow: 3, green: 2 }] });
    expect(setsOf({ state: s }, s.players[0])).toBe(2);
  });
});

describe(`Yellow table: ${GAMES} seeded bot games`, () => {
  it('finish cleanly with every invariant holding', () => {
    for (let seed = 1; seed <= GAMES; seed++) {
      const n = 2 + (seed % 3);
      const rand = seededRandom(seed * 31 + n);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed, quadrants: Q });
      let k = 0;
      while (s.pending) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (++k % 7 === 0) checkInvariants(s, `yellow seed ${seed}`);
        if (k > 2500) throw new Error(`seed ${seed} did not end`);
      }
      checkInvariants(s, `yellow seed ${seed}`);
      expect(s.over).toBe(true);
      expect(s.ranking).toHaveLength(n);
      expect(followers(s, s.players[s.ranking[0]])).toBeGreaterThan(1);
    }
  });
});
