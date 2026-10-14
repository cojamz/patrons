// @vitest-environment node
// Bot difficulty levels: legal, deterministic, picked from the seat, and the normal bot doesn't waste its last buy.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, isLegal, quadrant } from '../../../engine/v4/index.js';
import { chooseBotMove, botLevel, horizon, BOT_LEVELS, setBotLevels, SIM_LEVELS, blendProfile, BOT_PROFILES } from '../../../engine/v4/bots.js';
import { followers, memberCount } from '../../../engine/v4/index.js';
import * as engine from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

// No wall-clock timeouts: games are bounded by move caps, and the blocks by game counts (budget.js).

function play(n, seed, levels, opts = {}) {
  const rand = seededRandom(seed * 101);
  let s = createGame({ seats: Array.from({ length: n }, () => ({ kind: 'bot' })), seed });
  levels.forEach((l, i) => { s.players[i].bot = l; });
  const moves = [];
  while (!s.over) {
    const m = chooseBotMove(s, rand, opts);
    expect(isLegal(s, m)).toBe(true);
    moves.push(m);
    s = applyMove(s, m);
  }
  return { s, moves };
}

describe('bot levels', () => {
  it('the level comes from opts, then the seat, then defaults to normal', () => {
    const s = createGame({ seats: [{}, {}], seed: 1 });
    expect(botLevel(s, 0)).toBe('normal');
    s.players[0].bot = 'easy';
    expect(botLevel(s, 0)).toBe('easy');
    expect(botLevel(s, 0, { level: 'hard' })).toBe('hard');
    s.players[1].bot = 'nonsense';
    expect(botLevel(s, 1)).toBe('normal');
    expect(BOT_LEVELS).toEqual(['easy', 'normal', 'hard']);
    s.players[1].bot = { level: 'hard' };
    expect(botLevel(s, 1)).toBe('hard');
  });

  it('setBotLevels marks seats, survives JSON, and is exported from the engine', () => {
    const s = setBotLevels(createGame({ seats: [{}, {}, {}], seed: 2 }), ['easy', undefined, 'hard']);
    const t = JSON.parse(JSON.stringify(s));
    expect([0, 1, 2].map(i => botLevel(t, i))).toEqual(['easy', 'normal', 'hard']);
    expect(engine.BOT_LEVELS).toEqual(BOT_LEVELS);
    expect(engine.BOT_LEVEL_INFO.map(x => x.level)).toEqual(BOT_LEVELS);
  });

  it('easy and normal play whole games legally at 2, 3 and 4 players', () => {
    for (const n of [2, 3, 4]) for (let seed = 1; seed <= 4; seed++) {
      const { s } = play(n, seed, Array.from({ length: n }, (_, i) => (i % 2 ? 'easy' : 'normal')));
      expect(s.over).toBe(true);
    }
  });

  it('hard plays a whole game legally (small budget)', () => {
    const { s } = play(3, 5, ['hard', 'normal', 'easy'], { budget: 20, maxMs: Infinity });
    expect(s.over).toBe(true);
  });

  it('hard stops thinking at its time cap and still moves legally', () => {
    let t = 0, calls = 0;
    const now = () => { calls++; return (t += 100); }; // every look at the clock costs 100ms
    let s = createGame({ seats: [{}, {}, {}], seed: 3 });
    const rand = seededRandom(3);
    let thought = 0;
    while (!s.over && thought < 6) {
      const before = calls;
      const m = chooseBotMove(s, rand, { level: 'hard', now, maxMs: 250 });
      expect(isLegal(s, m)).toBe(true);
      if (calls > before) { thought++; expect(calls - before).toBeLessThan(12); }
      s = applyMove(s, m);
    }
    expect(thought).toBeGreaterThan(0);
  });

  it('every level is deterministic for a seed', () => {
    for (const levels of [['easy', 'easy', 'easy'], ['normal', 'normal', 'normal'], ['hard', 'normal', 'easy']]) {
      const a = play(3, 9, levels, { budget: 20, maxMs: Infinity });
      const b = play(3, 9, levels, { budget: 20, maxMs: Infinity });
      expect(b.moves).toEqual(a.moves);
      expect(b.s).toStrictEqual(a.s);
    }
  });

  it("normal never passes its last buy with a follower buy affordable, unless what it holds leads a contest", () => {
    let lastBuys = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const rand = seededRandom(seed);
      let s = createGame({ seats: [{}, {}, {}, {}], seed });
      while (!s.over) {
        const pend = s.pending;
        const m = chooseBotMove(s, rand);
        const finalBuy = pend.kind === 'buy' && (s.round === 3 || s.endEarly) && horizon(s).turns[pend.player] === 0;
        if (finalBuy && pend.options.some(o => o.kind === 'tier')) {
          lastBuys++;
          if (m.option === 'pass') {
            const p = s.players[pend.player];
            const leads = s.quadrants.map(quadrant).some(q => q.resource && p.res[q.resource] > 0
              && s.players.every(o => (o.res[q.resource] || 0) <= p.res[q.resource]));
            expect(leads).toBe(true);
          }
        }
        s = applyMove(s, m);
      }
    }
    expect(lastBuys).toBeGreaterThan(10);
  });

  it('sim-only levels play when asked for, but setup still offers easy, normal and hard', () => {
    const s = createGame({ seats: [{}, {}], seed: 4 });
    expect(botLevel(s, 0, { level: 'casual' })).toBe('casual');
    s.players[0].bot = 'collector';
    expect(botLevel(s, 0)).toBe('collector');
    expect(SIM_LEVELS.slice(0, 3)).toEqual(BOT_LEVELS);
    expect(blendProfile(0)).toEqual(BOT_PROFILES.easy);
    const { s: end } = play(3, 6, ['casual', 'collector', 'easy']);
    expect(end.over).toBe(true);
  });

  it("easy and normal tables don't recruit everything or hoard", () => {
    for (const level of ['easy', 'normal']) {
      let members = 0, left = 0, seats = 0;
      for (let seed = 1; seed <= 6; seed++) {
        const { s } = play(4, seed, [level, level, level, level]);
        for (const p of s.players) {
          seats++;
          members += memberCount(s, p);
          left += Object.values(p.res).reduce((a, b) => a + b, 0);
          expect(followers(s, p)).toBeGreaterThan(10);
        }
      }
      // the old greedy easy bot: ~11 members and ~17 resources left a player
      expect(members / seats).toBeLessThan(9.5);
      expect(left / seats).toBeLessThan(16);
    }
  });
});
