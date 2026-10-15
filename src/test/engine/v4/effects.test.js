// The effect stream (engine/v4/effects.js): over whole seeded bot games, every move's effects add up exactly to its
// change of state (each resource, each follower count, each cult's members), so nothing on the table moves unseen.
// And the stream stays out of saved state.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, followers, DEFAULT_QUADRANTS, allQuadrantIds } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

function checkMove(a, b, tag) {
  const fx = b.effects;
  expect(Array.isArray(fx), `${tag}: effects recorded`).toBe(true);
  for (const p of b.players) {
    for (const r of b.resources) {
      let sum = 0;
      for (const e of fx) {
        if (!e.what || e.what.r !== r) continue;
        if (e.to.kind === 'stack' && e.to.pid === p.id) sum += e.what.n;
        if (e.from.kind === 'stack' && e.from.pid === p.id) sum -= e.what.n;
      }
      expect(sum, `${tag}: ${p.name} ${r}`).toBe((p.res[r] || 0) - (a.players[p.id].res[r] || 0));
    }
    let f = 0;
    const members = new Set(a.players[p.id].members);
    for (const e of fx) {
      if (e.type === 'followers' && ((e.to.kind === 'count' && e.to.pid === p.id) || (e.from.kind === 'count' && e.from.pid === p.id))) f += e.what.n;
      if (['recruit', 'member-move', 'release'].includes(e.type)) {
        if (e.to.kind === 'crowd' && e.to.pid === p.id) { f += e.what.worth; members.add(e.what.uid); }
        if (e.from.kind === 'crowd' && e.from.pid === p.id) { f -= e.what.worth; members.delete(e.what.uid); }
      }
    }
    expect(f, `${tag}: ${p.name} followers`).toBe(followers(b, p) - followers(a, a.players[p.id]));
    expect([...members].sort(), `${tag}: ${p.name} members`).toEqual([...p.members].sort());
  }
  for (const e of fx) { expect(e.cause && e.cause.kind, `${tag}: a cause`).toBeTruthy(); expect(e.from && e.to, `${tag}: from and to`).toBeTruthy(); }
}

function play(seed, quadrants, n = 4) {
  const seats = Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  let s = createGame({ seats, seed, ...(quadrants ? { quadrants } : {}) });
  const rand = seededRandom(seed);
  const kinds = new Set();
  for (let k = 0; k < 800 && !s.over; k++) {
    const next = applyMove(s, chooseBotMove(s, rand), { effects: true });
    checkMove(s, next, `seed ${seed} move ${next.moves}`);
    for (const e of next.effects) kinds.add(`${e.type}:${e.cause.kind}`);
    s = next;
  }
  expect(s.over).toBe(true);
  return kinds;
}

describe('effects', () => {
  it('add up to every change of state, move by move, over whole games (classic and mixed tables)', () => {
    const kinds = new Set();
    const all = allQuadrantIds();
    const mixed = seed => { const r = seededRandom(seed); const ids = [...all]; for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, 4); };
    for (const [seed, q] of [[1, DEFAULT_QUADRANTS], [2, mixed(2)], [3, mixed(3)], [4, mixed(4)]]) for (const k of play(seed, q)) kinds.add(k);
    // the stream names its causes: spaces, members, recruits, follower buys, contests
    for (const k of ['gain:space', 'pay:recruit', 'recruit:recruit', 'followers:contest']) expect(kinds.has(k), k).toBe(true);
  });

  it('stays out of saved state and of the next move', () => {
    let s = createGame({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed: 9 });
    const rand = seededRandom(9);
    // play on to a move that has effects (a pass has none, and which move that is depends on the prices)
    for (let k = 0; k < 12 || !s.effects.length; k++) s = applyMove(s, chooseBotMove(s, rand), { effects: true });
    expect(s.effects.length).toBeGreaterThan(0);
    expect(JSON.stringify(s)).not.toContain('"effects"');
    expect(structuredClone(s).effects).toBeUndefined();
    expect(applyMove(s, chooseBotMove(s, rand)).effects).toBeUndefined();
  });
});
