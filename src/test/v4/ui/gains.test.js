// gains.js: every resource and follower a player sees change travels from a source, and the pieces add up to the
// engine's own diff (nothing flies that didn't happen, nothing that happened is left out), across whole bot games.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, followers } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { gainsBetween } from '../../../v4/game/gains.js';

function* steps(seed, n = 4) {
  const seats = Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  for (let k = 0; k < 600 && !s.over; k++) {
    const next = applyMove(s, chooseBotMove(s, rand));
    yield [s, next];
    s = next;
  }
}

describe('gainsBetween', () => {
  it('accounts for every resource change mid-round, from a named source', () => {
    let steals = 0, members = 0, slots = 0, pays = 0;
    for (const seed of [3, 11]) {
      for (const [a, b] of steps(seed)) {
        if (a.round !== b.round || b.round < 1) continue;
        const moves = gainsBetween(a, b);
        for (const p of b.players) {
          for (const r of b.resources) {
            const d = (p.res[r] || 0) - (a.players[p.id].res[r] || 0);
            const gained = moves.filter(m => m.what === 'res' && m.r === r && m.to.kind === 'stack' && m.to.pid === p.id).reduce((t, m) => t + m.n, 0);
            const lost = moves.filter(m => m.what === 'res' && m.r === r && m.from.kind === 'stack' && m.from.pid === p.id).reduce((t, m) => t + m.n, 0);
            expect(gained - lost, `seed ${seed} move ${b.moves}: ${p.name} ${r}`).toBe(d);
          }
          const f = followers(b, p) - followers(a, a.players[p.id]);
          const fl = moves.filter(m => m.what === 'fol' && m.to.pid === p.id).reduce((t, m) => t + m.n, 0);
          if (f > 0) expect(fl).toBe(f);
        }
        for (const m of moves) {
          expect(m.n).toBeGreaterThan(0);
          expect(m.from && m.to).toBeTruthy();
          if (m.from.kind === 'stack' && m.to.kind === 'stack') steals++;
          if (m.from.kind === 'member') members++;
          if (m.from.kind === 'slot') slots++;
          if (m.pay) pays++;
        }
      }
    }
    // the bots' games include each kind of source
    expect(slots).toBeGreaterThan(10);
    expect(pays).toBeGreaterThan(10);
    expect(steals + members).toBeGreaterThan(0);
  });

  it('flies nothing on an undo (fewer moves) or the same state', () => {
    const [[a, b]] = [...steps(5)].slice(20, 21);
    expect(gainsBetween(b, a)).toEqual([]);
    expect(gainsBetween(b, b)).toEqual([]);
  });
});
