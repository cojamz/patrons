// @vitest-environment node
// Purple: every action and every member with exact numbers, plus 200 seeded bot games on a Purple table.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, followers, contextFor } from '../../../../engine/v4/core.js';
import { chooseBotMove } from '../../../../engine/v4/bots.js';
import { seededRandom } from '../../../../engine/v4/rng.js';
import { registerQuadrant } from '../../../../engine/v4/content/index.js';
import purple, { restingOf } from '../../../../engine/v4/content/purple.js';
import { take, move, uidOf, ids, pinCosts, TEST_COSTS } from '../helpers.js';
import { checkInvariants } from '../fuzz-runner.js';

registerQuadrant(purple);
const Q = ['gold', 'red', 'purple', 'green'];

const PURPLE_TEST_COSTS = {
  'purple.lamplighter': [1, 1], 'purple.dreamer': [1, 1], 'purple.insomniac': [2, 1], 'purple.hibernator': [2, 1],
  'purple.straggler': [1, 0], 'purple.hermit': [3, 2], 'purple.secondwind': [3, 2], 'purple.moonlighter': [1, 1],
  'purple.timekeeper': [1, 1], 'purple.nightcrew': [2, 1], 'purple.hourglass': [1, 1], 'purple.drifter': [1, 1],
  'purple.rooster': [1, 1], 'purple.reveille': [2, 2], 'purple.lullaby': [2, 1],
};
let restore;
beforeEach(() => {
  const base = Object.fromEntries(Object.entries(TEST_COSTS).filter(([k]) => !k.startsWith('blue.')));
  restore = pinCosts({ ...base, ...PURPLE_TEST_COSTS });
});
afterEach(() => restore());

function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [], queue = null, slots = {}, rest = [] } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: Q });
  s.queue = []; s.pending = null; s.round = round; s.slots = { ...slots }; s.order = []; s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = 3;
    if (rest[i]) { p.rest = rest[i]; p.restRound = round; }
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: 0 }];
  return resume(s);
}
const R = (s, i = 0) => s.players[i].res;
const rest = (s, i = 0) => restingOf(contextFor(s), s.players[i]);
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
// who places next, after the current turn ends
const nextPlacer = s => { while (s.pending && s.pending.kind !== 'place') s = pass(s); return s.pending?.player; };
const RUSH = '0-1', JV = '0-0', STRIKE = '0-5', HIREUP = '1-3', REST = '2-0';

describe('Purple scoring: most resting workers at round end', () => {
  it('resting workers win the ring; none scores nothing', () => {
    const s = scene({ rest: [1, 0], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most resting workers: P1 +2');
    const z = scene({ queue: [{ t: 'endRound' }] });
    expect(z.log.at(-1)).not.toContain('Most resting');
  });
  it('ties all score; resting from an earlier round counts as none', () => {
    const s = scene({ round: 2, rest: [2, 2], queue: [{ t: 'endRound' }] });
    expect(s.log.at(-1)).toContain('Most resting workers: P1 & P2 +4');
    const stale = scene({ round: 2, queue: [{ t: 'endRound' }] });
    stale.players[0].rest = 3; stale.players[0].restRound = 1;
    expect(purple.scoring.score(contextFor(stale), stale.players[0])).toBe(0);
  });
});

describe('Purple actions', () => {
  it('Rest: +3 purple, your next turn is skipped and that worker rests', () => {
    let s = scene({ queue: turns(0, 1, 0, 1) });
    s = take(s, 'Rest');
    expect(R(s).purple).toBe(3);
    expect(rest(s)).toBe(1);
    expect(s.players[0].left).toBe(1); // 3 - placed - skipped
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 0)).toHaveLength(0);
    expect(nextPlacer(s)).toBe(1);
  });
  it('Rest on your last turn: just +3 purple', () => {
    let s = take(scene({ queue: turns(0, 1) }), 'Rest');
    expect(R(s).purple).toBe(3);
    expect(rest(s)).toBe(0);
  });
  it('Doze: +2 purple, +2 per resting worker', () => {
    expect(R(take(scene(), 'Doze')).purple).toBe(2);
    expect(R(take(scene({ rest: [2] }), 'Doze')).purple).toBe(6);
  });
  it('Wake: +1 purple, every resting worker takes a turn right after this one', () => {
    let s = take(scene({ rest: [2], queue: turns(0, 1, 1) }), 'Wake');
    expect(R(s).purple).toBe(1);
    expect(rest(s)).toBe(0);
    s = pass(s);
    expect(s.pending.kind).toBe('place');
    expect(s.pending.player).toBe(0);
    s = pass(take(s, 'Rush'));
    expect(s.pending.player).toBe(0); // the second woken worker
    s = take(s, 'Doze');
    expect(R(s)).toMatchObject({ gold: 2, purple: 3 });
    expect(nextPlacer(s)).toBe(1);
  });
  it('Wake with nobody resting: +1 purple only', () => {
    const s = take(scene({ queue: turns(0, 1) }), 'Wake');
    expect(R(s).purple).toBe(1);
    expect(nextPlacer(s)).toBe(1);
  });
  it('Slumber (ring II): skip your next turn, then +3 purple per resting worker', () => {
    expect(() => take(scene({ round: 1 }), 'Slumber')).toThrow();
    let s = take(scene({ round: 2, rest: [1], queue: turns(0, 1, 0) }), 'Slumber');
    expect(rest(s)).toBe(2);
    expect(R(s).purple).toBe(6);
    // with no turn left it doesn't add a worker
    s = take(scene({ round: 2, rest: [1], queue: turns(0, 1) }), 'Slumber');
    expect(rest(s)).toBe(1);
    expect(R(s).purple).toBe(3);
  });
  it('Linger (ring II): take a worker back from an outer or middle space of another color, and go again', () => {
    let s = take(scene({ round: 3, slots: { [RUSH]: 0, [STRIKE]: 0, [REST]: 0, [HIREUP]: 1 }, queue: turns(0, 1) }), 'Linger');
    expect(ids(s)).toEqual([`slot:${RUSH}`]); // not the center, not purple, not a rival's
    s = move(s, `slot:${RUSH}`);
    expect(s.slots[RUSH]).toBeUndefined();
    s = pass(s);
    expect(s.pending.player).toBe(0);
    s = take(s, 'Rush'); // the reopened space, again
    expect(R(s).gold).toBe(6);
    expect(nextPlacer(s)).toBe(1);
  });
  it('Linger with nothing to take back does nothing', () => {
    const s = take(scene({ round: 2, queue: turns(0, 1) }), 'Linger');
    expect(s.pending.player).toBe(1);
  });
  it('Rally (ring III): every resting worker takes a turn now, then one more', () => {
    let s = take(scene({ round: 3, rest: [2], queue: turns(0, 1) }), 'Rally');
    expect(rest(s)).toBe(0);
    let n = 0;
    s = pass(s);
    while (s.pending.kind === 'place' && s.pending.player === 0) { s = pass(take(s, s.pending.options[0].label)); n++; while (s.pending.kind !== 'place') s = applyMove(s, chooseBotMove(s, () => 0.5)); }
    expect(n).toBe(3);
    expect(s.pending.player).toBe(1);
  });
});

describe('Purple members', () => {
  const start = (members, extra = {}) => scene({ members, queue: [{ t: 'round', r: 2 }], ...extra });

  it('Lamplighter: round start, +1 purple per worker you get this round', () => {
    expect(R(start([['purple.lamplighter']])).purple).toBe(4);
    expect(R(scene({ members: [['purple.lamplighter']], queue: [{ t: 'round', r: 3 }] })).purple).toBe(5);
  });
  it('Dreamer: round end, +2 purple per resting worker', () => {
    const s = scene({ members: [['purple.dreamer']], rest: [2], queue: [{ t: 'endRound' }] });
    expect(R(s).purple).toBe(4);
  });
  it('Insomniac: once per round, wake one resting worker for a turn right after this one', () => {
    let s = scene({ members: [['purple.insomniac']], rest: [2], queue: turns(0, 1) });
    s = take(s, 'Doze');
    const u = uidOf(s, 'purple.insomniac', 0);
    s = move(s, `use:${u}`);
    expect(rest(s)).toBe(1);
    expect(ids(s)).not.toContain(`use:${u}`);
    s = pass(s);
    expect(s.pending.player).toBe(0);
    expect(s.pending.kind).toBe('place');
  });
  it('Insomniac with nobody resting is not used up', () => {
    let s = take(scene({ members: [['purple.insomniac']], queue: turns(0, 1) }), 'Doze');
    const u = uidOf(s, 'purple.insomniac', 0);
    s = move(s, `use:${u}`);
    expect(ids(s)).toContain(`use:${u}`);
  });
  it('Insomniac comes back each round', () => {
    const s = scene({ members: [['purple.insomniac']], queue: [{ t: 'round', r: 2 }] });
    s.cards[uidOf(s, 'purple.insomniac', 0)].used = true;
    const t = resume(Object.assign(s, { queue: [{ t: 'round', r: 3 }] }));
    expect(t.cards[uidOf(t, 'purple.insomniac', 0)].used).toBe(false);
  });
  it('Hibernator: resting workers at round end stay resting next round', () => {
    let s = scene({ members: [['purple.hibernator']], rest: [2], queue: [{ t: 'endRound' }, { t: 'round', r: 2 }] });
    expect(s.round).toBe(2);
    expect(rest(s)).toBe(2);
    expect(s.players[0].left).toBe(4); // scheduled turns unchanged
  });
  it('Straggler: round start, +1 resting worker if you have the fewest followers (ties count)', () => {
    expect(rest(start([['purple.straggler']], { bonus: [0, 3] }))).toBe(1);
    expect(rest(start([['purple.straggler']], { bonus: [0, 1] }))).toBe(1); // tied at 2 (Straggler is a follower too)
    expect(rest(start([['purple.straggler']], { bonus: [3, 0] }))).toBe(0);
  });
  it('Hermit: game end, +3 followers per resting worker', () => {
    const s = scene({ round: 3, members: [['purple.hermit']], rest: [2], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Hermit +6');
  });
  it('Second Wind: once per game, an extra turn right after this one', () => {
    let s = take(scene({ members: [['purple.secondwind']], queue: turns(0, 1) }), 'Doze');
    const u = uidOf(s, 'purple.secondwind', 0);
    s = pass(move(s, `use:${u}`));
    expect(s.pending.player).toBe(0);
    expect(s.pending.kind).toBe('place');
    s = take(s, 'Rush');
    expect(ids(s)).not.toContain(`use:${u}`);
  });
  it('Moonlighter: whenever you take back a worker, +2 of that space’s color', () => {
    let s = take(scene({ round: 2, members: [['purple.moonlighter']], slots: { [HIREUP]: 0 }, queue: turns(0, 1) }), 'Linger');
    s = move(s, `slot:${HIREUP}`);
    expect(R(s).red).toBe(2);
  });
  it('Timekeeper: whenever a rival buys 6 followers, +3 purple', () => {
    let s = scene({ members: [[], ['purple.timekeeper']], res: [{ gold: 2, red: 2, green: 2, purple: 2 }], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, 'tier:big');
    expect(R(s, 1).purple).toBe(3);
    s = scene({ members: [[], ['purple.timekeeper']], res: [{ gold: 2, red: 2 }], queue: [{ t: 'buy', p: 0 }] });
    s = move(s, 'tier:mid');
    expect(R(s, 1).purple).toBe(0);
  });
  it('Night Crew: worth 3 followers; when recruited, your next turn is skipped and that worker rests', () => {
    let s = scene({ res: [{ purple: 2, gold: 1 }], shop: ['purple.nightcrew'], queue: [...turns(0, 1, 0)] });
    s = take(s, 'Doze');
    s = move(s, `card:${uidOf(s, 'purple.nightcrew', 'shop')}`);
    expect(rest(s)).toBe(1);
    expect(followers(s, s.players[0])).toBe(4);
    expect(nextPlacer(s)).toBe(1);
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 0)).toHaveLength(0);
  });
  it('Hourglass: at round start, may rest your last worker for +4 purple', () => {
    let s = start([['purple.hourglass']]);
    expect(s.pending.kind).toBe('choose');
    s = move(s, 'yes');
    expect(R(s).purple).toBe(4);
    expect(rest(s)).toBe(1);
    expect(s.players[0].left).toBe(3);
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 0)).toHaveLength(3);
    s = move(start([['purple.hourglass']]), 'no');
    expect(R(s).purple).toBe(0);
    expect(rest(s)).toBe(0);
  });
  it('Drifter: when recruited, +1 resting worker this round', () => {
    let s = scene({ res: [{ purple: 1, gold: 1 }], shop: ['purple.drifter'], queue: turns(0, 1) });
    s = take(s, 'Rush');
    s = move(s, `card:${uidOf(s, 'purple.drifter', 'shop')}`);
    expect(rest(s)).toBe(1);
  });
  it('Rooster: whenever a resting worker wakes, +1 of each other color', () => {
    const s = take(scene({ members: [['purple.rooster']], rest: [2], queue: turns(0, 1) }), 'Wake');
    expect(R(s)).toEqual({ gold: 2, red: 2, purple: 1, green: 2 });
  });
  it('Reveille: once per game, wake every resting worker', () => {
    let s = take(scene({ members: [['purple.reveille']], rest: [2], queue: turns(0, 1) }), 'Doze');
    s = move(s, `use:${uidOf(s, 'purple.reveille', 0)}`);
    expect(rest(s)).toBe(0);
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 0)).toHaveLength(2);
  });
  it('Lullaby: once per game, the leader skips their next turn (it rests)', () => {
    let s = scene({ members: [['purple.lullaby']], bonus: [0, 5], queue: turns(0, 1, 1) });
    s = take(s, 'Doze');
    s = move(s, `use:${uidOf(s, 'purple.lullaby', 0)}`);
    expect(rest(s, 1)).toBe(1);
    expect(s.queue.filter(t => t.t === 'turn' && t.p === 1)).toHaveLength(1);
  });
  it('Lullaby does nothing (and is kept) when you lead', () => {
    let s = scene({ members: [['purple.lullaby']], bonus: [5, 0], queue: turns(0, 1) });
    s = take(s, 'Doze');
    const u = uidOf(s, 'purple.lullaby', 0);
    s = move(s, `use:${u}`);
    expect(ids(s)).toContain(`use:${u}`);
  });
});

describe('Purple table: 200 seeded bot games', () => {
  it('finish cleanly with every invariant holding', { timeout: 180000 }, () => {
    for (let seed = 1; seed <= 200; seed++) {
      const n = 2 + (seed % 3);
      const rand = seededRandom(seed * 31 + n);
      let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed, quadrants: Q });
      let k = 0;
      while (s.pending) {
        s = applyMove(s, chooseBotMove(s, rand));
        if (++k % 7 === 0) checkInvariants(s, `purple seed ${seed}`);
        if (k > 2500) throw new Error(`seed ${seed} did not end`);
      }
      checkInvariants(s, `purple seed ${seed}`);
      expect(s.over).toBe(true);
      expect(s.ranking).toHaveLength(n);
      expect(followers(s, s.players[s.ranking[0]])).toBeGreaterThan(1);
    }
  });
});
