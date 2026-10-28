// @vitest-environment node
// Structural sharing (session/share.js): a game played with every state shared against the one before must be the same
// game byte for byte as one played without (states, effects, bot picks), across thousands of bot moves, and no older
// state reads differently after a newer one is made from it (the engine's scratch writes, like a payment's dry run on
// p.res, are put back before it returns).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { share } from '../../../v4/session/share.js';
import { games } from '../../engine/v4/budget.js';

// where one state holds the same object twice, as path pairs (the engine makes some: a choice's options sit on its
// queued task and on state.pending); sharing must keep exactly these, never split one or add one
const aliases = s => {
  const seen = new Map(), out = [];
  const walk = (v, path) => {
    if (!v || typeof v !== 'object') return;
    if (seen.has(v)) { out.push(`${seen.get(v)} == ${path}`); return; }
    seen.set(v, path);
    for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`);
  };
  walk(s, 's');
  return out;
};

const TABLES = [undefined, ['red', 'echo', 'thieves', 'purple'], ['market', 'trading', 'red', 'purple']];

function play(n, seed, quadrants) {
  const seats = Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  const ra = seededRandom(seed * 31 + n), rb = seededRandom(seed * 31 + n);
  let a = createGame({ seats, seed, ...(quadrants ? { quadrants: quadrants.slice(0, Math.max(2, n)) } : {}) });
  let b = structuredClone(a);
  let moves = 0, reused = 0, parts = 0;
  let older = [];
  while (a.pending && moves < 1500) {
    const ma = chooseBotMove(a, ra), mb = chooseBotMove(b, rb);
    expect(mb).toEqual(ma);
    const na = applyMove(a, ma, { effects: true });
    const raw = applyMove(b, mb, { effects: true });
    const nb = share(b, raw);
    expect(nb).toBe(raw);
    expect(JSON.stringify(nb)).toBe(JSON.stringify(na));
    expect(JSON.stringify(nb.effects)).toBe(JSON.stringify(na.effects));
    expect(Object.keys(nb)).toEqual(Object.keys(na));
    if (moves % 3 === 0) expect(aliases(nb)).toEqual(aliases(na));
    for (const p of nb.players) { parts++; if (b.players.includes(p)) reused++; }
    for (const [st, json] of older) expect(JSON.stringify(st)).toBe(json);
    older = [...older.slice(-2), [nb, JSON.stringify(nb)]];
    a = na; b = nb; moves++;
  }
  expect(a.over).toBe(true);
  return { moves, reused, parts };
}

describe('structural sharing keeps every game the same', () => {
  it('bot games on three tables, 2 to 4 players: same states, effects and picks, old states unchanged', () => {
    // 27 games (~2,900 moves) nightly, 9 in the verdict, 3 in the fast gate: every table and seat count each seed
    const all = [];
    for (let seed = 1; seed <= 3; seed++) for (const q of TABLES) for (const n of [2, 3, 4]) all.push([n, seed, q]);
    const plan = all.slice(0, games(27, 3, 9));
    let moves = 0, reused = 0, parts = 0;
    for (const [n, seed, q] of plan) {
      const r = play(n, seed, q);
      moves += r.moves; reused += r.reused; parts += r.parts;
    }
    expect(moves).toBeGreaterThan(plan.length * 60);
    // most steps change one player: the others are the very same objects as the step before
    expect(reused / parts).toBeGreaterThan(0.4);
  });

  it('an online snapshot (JSON) shares with the one before, and reads the same', () => {
    let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 7 });
    const rand = seededRandom(7);
    let prev = JSON.parse(JSON.stringify(s)), prevJson = JSON.stringify(prev);
    for (let i = 0; i < 300 && s.pending; i++) {
      s = applyMove(s, chooseBotMove(s, rand));
      const json = JSON.stringify(s);
      const next = share(prev, JSON.parse(json));
      expect(JSON.stringify(next)).toBe(json);
      expect(JSON.stringify(prev)).toBe(prevJson);
      prev = next; prevJson = json;
    }
  });

  it('keeps next where keys differ in order, kind or presence', () => {
    const prev = { a: { x: 1, y: 2 }, b: [1, 2], c: { k: undefined }, d: { p: [1] } };
    const next = { a: { y: 2, x: 1 }, b: { 0: 1, 1: 2 }, c: {}, d: { p: [1] } };
    const out = share(prev, next);
    expect(out).toBe(next);
    expect(out.a).not.toBe(prev.a);
    expect(out.b).not.toBe(prev.b);
    expect(out.c).not.toBe(prev.c);
    expect(out.d).toBe(prev.d);
    expect(JSON.stringify(out)).toBe('{"a":{"y":2,"x":1},"b":{"0":1,"1":2},"c":{},"d":{"p":[1]}}');
  });
});
