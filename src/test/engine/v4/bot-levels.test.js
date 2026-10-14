// @vitest-environment node
// Bot difficulty levels: legal, deterministic, picked from the seat, and the normal bot doesn't waste its last buy.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, isLegal, quadrant } from '../../../engine/v4/index.js';
import { chooseBotMove, botLevel, horizon, BOT_LEVELS } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';

const T = 300000;

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
  });

  it('easy and normal play whole games legally at 2, 3 and 4 players', { timeout: T }, () => {
    for (const n of [2, 3, 4]) for (let seed = 1; seed <= 4; seed++) {
      const { s } = play(n, seed, Array.from({ length: n }, (_, i) => (i % 2 ? 'easy' : 'normal')));
      expect(s.over).toBe(true);
    }
  });

  it('hard plays a whole game legally (small budget)', { timeout: T }, () => {
    const { s } = play(3, 5, ['hard', 'normal', 'easy'], { budget: 20 });
    expect(s.over).toBe(true);
  });

  it('every level is deterministic for a seed', { timeout: T }, () => {
    for (const levels of [['easy', 'easy', 'easy'], ['normal', 'normal', 'normal'], ['hard', 'normal', 'easy']]) {
      const a = play(3, 9, levels, { budget: 20 });
      const b = play(3, 9, levels, { budget: 20 });
      expect(b.moves).toEqual(a.moves);
      expect(b.s).toStrictEqual(a.s);
    }
  });

  it("normal never passes its last buy with a follower buy affordable, unless what it holds leads a contest", { timeout: T }, () => {
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
});
