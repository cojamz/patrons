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
  'yellow.weaver': [1, 1], 'yellow.explorer': [1, 1], 'yellow.feastmaker': [2, 2],
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

describe('Yellow scoring: most full sets, ties all score', () => {
  const sc = (res, j = 0) => yellow.scoring.score({ state: { resources: Q } }, { res: { ...Z, ...res } });
  it('a full set is one of each color', () => {
    expect(setsOf({ state: { resources: Q } }, { res: { gold: 3, red: 2, yellow: 5, green: 2 } })).toBe(2);
  });
  it('no full set scores nothing, even with yellow', () => {
    expect(sc({ yellow: 9, gold: 9, red: 9 })).toBe(0);
  });
  it('more sets beat more yellow; equal sets stay tied', () => {
    expect(sc({ gold: 2, red: 2, yellow: 2, green: 2 })).toBeGreaterThan(sc({ gold: 1, red: 1, yellow: 9, green: 1 }));
    expect(sc({ gold: 1, red: 1, yellow: 3, green: 1 })).toBe(sc({ gold: 5, red: 1, yellow: 2, green: 1 }));
  });
  it('pays the ring value at round end to the leader', () => {
    let s = scene({ res: [{ gold: 1, red: 1, yellow: 1, green: 1 }, { gold: 5 }], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most full sets: P1 +2');
  });
});

describe('Yellow actions', () => {
  it('Harvest: +1 yellow, plus 1 per other color you hold', () => {
    expect(R(take(scene({ res: [{ gold: 2, red: 1 }] }), 'yellow.harvest')).yellow).toBe(3);
    expect(R(take(scene({ res: [{ gold: 2, red: 1, yellow: 1 }] }), 'yellow.harvest')).yellow).toBe(4);
    expect(R(take(scene({ res: [{ gold: 1, red: 1, yellow: 1, green: 1 }] }), 'yellow.harvest')).yellow).toBe(5);
    expect(R(take(scene({}), 'yellow.harvest')).yellow).toBe(1);
  });

  it('Top Up: +1 of each color you hold the fewest of (ties: all), which always adds a full set', () => {
    expect(R(take(scene({ res: [{ gold: 3, red: 1 }] }), 'yellow.bloom'))).toEqual({ gold: 3, red: 1, yellow: 1, green: 1 });
    expect(R(take(scene({}), 'yellow.bloom'))).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    // holding every color: the fewest (here all, tied) still get +1 (dead-window audit, 2026-10-14; it gave nothing)
    expect(R(take(scene({ res: [{ gold: 1, red: 1, yellow: 1, green: 1 }] }), 'yellow.bloom'))).toEqual({ gold: 2, red: 2, yellow: 2, green: 2 });
  });

  it('Trade Seeds: +2 yellow first, then up to 3 one-for-one swaps (the new yellow can be swapped too)', () => {
    let s = take(scene({ res: [{ gold: 5, red: 1 }] }), 'yellow.transmute');
    expect(s.pending.kind).toBe('choose');
    expect(R(s)).toEqual({ gold: 5, red: 1, yellow: 2, green: 0 });
    expect(ids(s)).toContain('swap:gold:yellow');
    expect(ids(s)).toContain('swap:yellow:gold');
    s = move(s, 'swap:gold:yellow');
    s = move(s, 'swap:gold:green');
    expect(R(s)).toEqual({ gold: 3, red: 1, yellow: 3, green: 1 });
    s = move(s, 'done');
    expect(R(s)).toEqual({ gold: 3, red: 1, yellow: 3, green: 1 });
    expect(s.pending.kind).toBe('buy');
    expect(s.log.join('\n')).toContain('P1 transmuted 1 gold → yellow, 1 gold → green.');
  });

  it('Trade Seeds: stops after 3 swaps; with nothing held it still gives +2 yellow', () => {
    let s = take(scene({ res: [{ gold: 9 }] }), 'yellow.transmute');
    s = move(s, 'swap:gold:red');
    s = move(s, 'swap:gold:green');
    s = move(s, 'swap:gold:yellow');
    expect(s.pending?.kind).not.toBe('choose');
    expect(R(s)).toEqual({ gold: 6, red: 1, yellow: 3, green: 1 });
    expect(R(take(scene({}), 'yellow.transmute')).yellow).toBe(2);
  });

  it('Trade Seeds: +2 yellow, then swap up to 3 resources for other colors (the rule, whatever a bot picks)', () => {
    let s = take(scene({ res: [{ gold: 7, red: 1 }] }), 'yellow.transmute');
    while (s.pending?.kind === 'choose') s = applyMove(s, chooseBotMove(s, () => 0.5));
    const r = R(s), total = Object.values(r).reduce((a, b) => a + b, 0);
    expect(total).toBe(8 + 2); // +2 yellow; swaps keep the count
  });

  it('Branch Out (ring II): +1 of each other color per 3 yellow you have, and keeps the yellow', () => {
    expect(() => take(scene({ round: 1, res: [{ yellow: 4 }] }), 'yellow.prism')).toThrow();
    expect(R(take(scene({ round: 2, res: [{ yellow: 7, gold: 1 }] }), 'yellow.prism'))).toEqual({ gold: 3, red: 2, yellow: 7, green: 2 });
    expect(R(take(scene({ round: 2, res: [{ yellow: 2 }] }), 'yellow.prism'))).toEqual({ ...Z, yellow: 2 });
  });

  it('Potluck (ring II): each member brings 1 of its color (Twins is one member)', () => {
    const s = take(scene({ round: 2, members: [['gold.banker', 'red.twins', 'red.intern', 'yellow.farmer']] }), 'yellow.gather');
    expect(R(s)).toEqual({ gold: 1, red: 2, yellow: 2, green: 0 }); // Farmer adds 1 to the yellow
  });

  it('Bumper Crop (ring III): +1 of each other color per full set', () => {
    expect(R(take(scene({ round: 3, res: [{ gold: 4, red: 2, yellow: 3, green: 2 }] }), 'yellow.flourish'))).toEqual({ gold: 6, red: 4, yellow: 3, green: 4 });
    expect(R(take(scene({ round: 3, res: [{ gold: 4, red: 2, yellow: 3 }] }), 'yellow.flourish'))).toEqual({ gold: 4, red: 2, yellow: 3, green: 0 });
  });

  it('Midas turns Top Up into gold (action gains)', () => {
    const s = take(scene({ members: [['gold.midas']] }), 'yellow.bloom');
    expect(R(s)).toEqual({ ...Z, gold: 4 });
  });
});

describe('Yellow members', () => {
  const start = (members, res = [{}, {}], extra = {}) => scene({ members, res, queue: [{ t: 'round', r: 2 }], ...extra });

  it('Gardener: round start, +1 of each color you have none of', () => {
    const s = start([['yellow.gardener']], [{ gold: 2 }, {}]);
    expect(R(s)).toEqual({ gold: 2, red: 1, yellow: 1, green: 1 });
  });

  it('Peddler: round start, +1 of each other color', () => {
    expect(R(start([['yellow.peddler']]))).toEqual({ gold: 1, red: 1, yellow: 0, green: 1 });
  });

  it('Gleaner: an action gaining 2+ of another color gives +1 yellow (once per color gained)', () => {
    const s = take(scene({ members: [['yellow.gleaner']], res: [{ gold: 1 }] }), 'yellow.bloom');
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 }); // 1s don't trigger it
    expect(R(take(scene({ members: [['yellow.gleaner']] }), 'gold.rush')).yellow).toBe(1);
    expect(R(take(scene({ members: [['yellow.gleaner']] }), 'gold.jv')).yellow).toBe(1);
    expect(R(take(scene({ members: [['yellow.gleaner']], res: [{ gold: 1 }] }), 'yellow.harvest')).yellow).toBe(2);
  });

  it('Admirer: a rival recruiting a member of a color you have none of gives +1 of that color', () => {
    let s = scene({ members: [['yellow.admirer']], res: [{}, { gold: 9, red: 9 }], shop: SHOP, turn: 1 });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`);
    expect(R(s).gold).toBe(1);
    // already holding that color: nothing
    let h = scene({ members: [['yellow.admirer']], res: [{ gold: 2 }, { gold: 9, red: 9 }], shop: SHOP, turn: 1 });
    h = take(h, 'gold.rush');
    h = move(h, `card:${uidOf(h, 'gold.midas', 'shop')}`);
    expect(R(h).gold).toBe(2);
    // its owner recruiting doesn't count
    let t = scene({ members: [['yellow.admirer']], res: [{ red: 3, gold: 2 }], shop: SHOP });
    t = take(t, 'gold.rush');
    t = move(t, `card:${uidOf(t, 'red.mentor', 'shop')}`);
    expect(R(t).red).toBe(0);
  });

  it('Go-Between: your non-yellow recruit gives +1 of its color', () => {
    let s = scene({ members: [['yellow.gobetween']], res: [{ red: 5 }], shop: ['red.intern', 'yellow.farmer', ...SHOP.slice(0, 4)] });
    s = take(s, 'yellow.harvest');
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(R(s).red).toBe(5);
  });

  it('Dyer: round end, +1 yellow per color you hold', () => {
    const s = scene({ members: [['yellow.dyer']], res: [{ gold: 1, red: 2 }], queue: [{ t: 'endRound' }] });
    expect(R(s).yellow).toBe(2);
  });

  it('Late Bloomers: round start, +1 of each color if you have the fewest followers (ties count)', () => {
    // Its own two followers are excluded, so an otherwise tied table pays.
    expect(R(start([['yellow.latebloomer']], [{}, {}], { bonus: [0, 0] }))).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(R(start([['yellow.latebloomer']], [{}, {}], { bonus: [3, 0] }))).toEqual(Z);
  });

  it('Sower: plant yellow at round start; at round end gain that many of each other color', () => {
    let s = scene({ members: [['yellow.sower']], res: [{ yellow: 4 }], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.prompt).toContain('Sower');
    s = move(s, 'amount:2');
    expect(R(s).yellow).toBe(2);
    s.queue = [{ t: 'endRound' }];
    s = resume(s);
    expect(R(s)).toEqual({ gold: 2, red: 2, yellow: 2, green: 2 });
    expect(s.log.at(-1)).toContain('Most full sets: P1 +4'); // planted colors come in before scoring
  });

  it('Harmonist: game end, +1 follower per full set', () => {
    const s = scene({ round: 3, members: [['yellow.harmonist']], res: [{ gold: 3, red: 3, yellow: 4, green: 3 }], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(3);
    expect(fol(s, 0)).toBe(1 + 1 + 3);
  });

  it('Rainmaker: once per game, every color rises to match your yellow (never lowers one)', () => {
    let s = scene({ members: [['yellow.rainmaker']], res: [{ gold: 7, red: 1, yellow: 2 }] });
    s = take(s, 'yellow.harvest'); // +3 yellow (1 + gold, red) → 5
    const use = `use:${uidOf(s, 'yellow.rainmaker', 0)}`;
    s = move(s, use);
    expect(R(s)).toEqual({ gold: 7, red: 5, yellow: 5, green: 5 });
    expect(ids(s)).not.toContain(use);
  });

  it('Pilgrim: when recruited, +1 of each color', () => {
    let s = scene({ res: [{ yellow: 2, gold: 1 }], shop: ['yellow.pilgrim', ...SHOP.slice(1)] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'yellow.pilgrim', 'shop')}`);
    // Golden Years +2 gold (3), paid 2 yellow + 1 gold, then +1 of each
    expect(R(s)).toEqual({ gold: 3, red: 1, yellow: 1, green: 1 });
  });

  it('Farmer: whenever an action gains you yellow, +1 more', () => {
    expect(R(take(scene({ members: [['yellow.farmer']], res: [{ gold: 1 }] }), 'yellow.harvest')).yellow).toBe(3);
    expect(R(take(scene({ members: [['yellow.farmer']], res: [{ gold: 1 }] }), 'yellow.bloom')).yellow).toBe(2);
  });

  it('Weaver: buying 6 followers gives +1 of each color; smaller buys don’t', () => {
    let s = scene({ members: [['yellow.weaver']], res: [{ gold: 2, red: 2, green: 2 }] });
    s.cards[uidOf(s, 'yellow.weaver', 0)].seenBig = s.bigLeft;
    s = take(s, 'yellow.harvest'); // +3 yellow
    s = move(s, 'tier:top');
    const after = R(s);
    expect(after.gold + after.red + after.green + after.yellow).toBe(2 + 2 + 2 + 4 - 10 + 4); // Harvest +4 (1 + 3 other colors), the top buy costs 10
    expect(s.players[0].bonus).toBe(10);
    let t = scene({ members: [['yellow.weaver']], res: [{ gold: 2, red: 2 }] });
    t.cards[uidOf(t, 'yellow.weaver', 0)].seenBig = t.bigLeft;
    t = take(t, 'gold.rush');
    t = move(t, 'tier:mid');
    expect(Object.values(R(t)).reduce((a, b) => a + b, 0)).toBe(6 - 5);
  });

  it('Weaver: remembers the pile when recruited, and a rival’s 6-buy doesn’t trigger it', () => {
    let s = scene({ res: [{ yellow: 1, gold: 1 }, { gold: 3, red: 3, green: 3 }], shop: ['yellow.weaver', ...SHOP.slice(1)], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'yellow.harvest');
    s = move(s, `card:${uidOf(s, 'yellow.weaver', 'shop')}`);
    s = take(s, 'gold.rush');
    s = move(s, 'tier:top');
    expect(s.players[1].bonus).toBe(10);
    expect(R(s, 0)).toEqual({ gold: 1, red: 0, yellow: 1, green: 0 }); // untouched by the rival's buy
  });

  it('Explorer: taking a space outside Yellow gives +1 yellow', () => {
    expect(R(take(scene({ members: [['yellow.explorer']] }), 'gold.rush')).yellow).toBe(1);
    expect(R(take(scene({ members: [['yellow.explorer']] }), 'yellow.harvest')).yellow).toBe(1);
  });

  it('Feastmaker: once per game, +1 of each color per round number', () => {
    let s = scene({ round: 3, members: [['yellow.feastmaker']] });
    s = take(s, 'yellow.harvest');
    s = move(s, `use:${uidOf(s, 'yellow.feastmaker', 0)}`);
    expect(R(s)).toEqual({ gold: 3, red: 3, yellow: 4, green: 3 });
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
