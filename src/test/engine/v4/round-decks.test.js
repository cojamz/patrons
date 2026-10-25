// Round decks (Cory, 2026-10-25): one deck; round II and round III members wait out of it and are shuffled in when
// their round starts. By printed cost unless a member says its round: 3 or less round I, 4-5 round II, 6+ round III.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, cardDef, memberRound } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { runGame } from './fuzz-runner.js';

const TABLE = ['red', 'echo', 'market', 'purple'];
const seats = n => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
const start = (roundDecks = 3, seed = 5) => createGame({ seats: seats(4), seed, quadrants: TABLE, rules: { roundDecks } });
const cost = (s, u) => cardDef(s, u).s + cardDef(s, u).w;
const playTo = (s, r, rand = seededRandom(1)) => { while (!s.over && s.round < r) s = applyMove(s, chooseBotMove(s, rand, { level: 'easy' })); return s; };

describe('round decks', () => {
  it('bands by cost, and a member can name its own round', () => {
    expect([2, 3, 4, 5, 6, 10].map(c => memberRound({ s: c, w: 0 }))).toEqual([1, 1, 2, 2, 3, 3]);
    expect(memberRound({ s: 8, w: 0, round: 1 })).toBe(1);
  });
  it('round I deals only round I members; the rest wait', () => {
    const s = start();
    for (const u of [...s.pile, ...s.shop]) expect(cost(s, u)).toBeLessThanOrEqual(3);
    expect(s.waiting[2].every(u => [4, 5].includes(cost(s, u)))).toBe(true);
    expect(s.waiting[3].every(u => cost(s, u) >= 6)).toBe(true);
  });
  it('each round shuffles its members in, with a log line', () => {
    let s = playTo(start(), 2);
    expect(s.waiting[2]).toBeUndefined();
    expect(s.waiting[3].length).toBeGreaterThan(0);
    expect([...s.pile, ...s.shop].some(u => [4, 5].includes(cost(s, u)))).toBe(true);
    expect(s.log.some(l => /^Round II members \(\d+\) are shuffled into the deck/.test(l))).toBe(true);
    s = playTo(s, 3);
    expect(Object.keys(s.waiting)).toEqual([]);
  });
  it('2 batches folds round III members into round II', () => {
    const s = start(2);
    expect(Object.keys(s.waiting)).toEqual(['2']);
    expect(s.waiting[2].some(u => cost(s, u) >= 6)).toBe(true);
  });
  it('off: everything starts in the deck', () => {
    expect(Object.keys(start(0).waiting)).toEqual([]);
  });
  it('seeded games with round decks finish cleanly, every card accounted for', () => {
    for (let seed = 1; seed <= 6; seed++) runGame({ n: 2 + (seed % 3), seed, kind: 'bot', full: false, quadrants: TABLE, rules: { roundDecks: 3, artifacts: true } });
  });
});
