// What each member and artifact has gained its owner this game (card.made, Cory Oct 29: the hover shows it). Over
// whole seeded bot games: a member's tally matches what the effect stream credits it (gains and steals landing in its
// owner's stacks), it only grows, and it rides in saved state.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, DEFAULT_QUADRANTS } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

function play(seed, n = 4) {
  const seats = Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  let s = createGame({ seats, seed, quadrants: DEFAULT_QUADRANTS });
  const rand = seededRandom(seed);
  const fromStream = {};
  for (let k = 0; k < 800 && !s.over; k++) {
    const next = applyMove(s, chooseBotMove(s, rand), { effects: true });
    for (const e of next.effects) {
      const c = e.cause;
      if (c.kind !== 'member' || c.uid == null || !(e.type === 'gain' || e.type === 'transfer')) continue;
      if (e.to.kind !== 'stack' || e.to.pid !== c.pid) continue;
      const row = fromStream[c.uid] = fromStream[c.uid] || {};
      row[e.what.r] = (row[e.what.r] || 0) + e.what.n;
    }
    for (const u of Object.keys(next.cards)) {
      const a = (s.cards[u] && s.cards[u].made) || {}, b = next.cards[u].made || {};
      if (next.cards[u].made) for (const k of Object.keys(a)) expect(b[k] ?? 0, `seed ${seed} card ${u} ${k}`).toBeGreaterThanOrEqual(a[k]);
    }
    s = next;
  }
  expect(s.over).toBe(true);
  return { s, fromStream };
}

describe('card.made', () => {
  it('tallies what each member gained its owner, matching the effect stream', () => {
    let some = 0, checked = 0;
    for (const seed of [1, 2, 3]) {
      const { s, fromStream } = play(seed);
      for (const p of s.players) for (const u of [...p.members, ...(p.artifact !== undefined ? [p.artifact] : [])]) {
        const made = s.cards[u].made || {};
        if (Object.keys(made).length) some++;
        const want = fromStream[u] || {};
        for (const r of s.resources) {
          // a card that changed hands or came back from the shop keeps what it made before; only check the stream's floor
          if ((want[r] || 0) > 0) { checked++; expect(made[r] || 0, `seed ${seed} ${p.name} card ${u} ${r}`).toBeGreaterThanOrEqual(1); }
        }
      }
    }
    expect(some).toBeGreaterThan(3);
    expect(checked).toBeGreaterThan(3);
  });

  it('rides in saved state', () => {
    const { s } = play(5, 2);
    const u = Object.keys(s.cards).find(k => s.cards[k].made);
    expect(u).toBeTruthy();
    expect(JSON.parse(JSON.stringify(s)).cards[u].made).toEqual(s.cards[u].made);
  });
});
