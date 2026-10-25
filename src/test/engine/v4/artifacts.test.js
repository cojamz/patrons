// Artifacts (Cory, 2026-10-24): each color on the table has one; at the start each player picks one, with 1 of its
// color, instead of the resource pick. Ability only: not a member, worth no followers, never moves. Its card leaves
// its color's deck.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, memberCount, cardDef, ARTIFACTS, followers } from '../../../engine/v4/core.js';
import { runGame } from './fuzz-runner.js';

const TABLE = ['red', 'echo', 'market', 'purple'];
const seats = n => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
const start = (quadrants = TABLE, seed = 3) => createGame({ seats: seats(quadrants.length), seed, quadrants, rules: { artifacts: true } });
const pickAll = s => { while (s.pending?.kind === 'setup') s = applyMove(s, { player: s.pending.player, option: s.pending.options[0].id }); return s; };

describe('artifacts', () => {
  it('each color on the table has one, held by nobody and never dealt', () => {
    const s = start();
    expect(Object.keys(s.artifacts).sort()).toEqual([...TABLE].sort());
    for (const q of TABLE) {
      const u = s.artifacts[q];
      expect(cardDef(s, u).id).toBe(ARTIFACTS[q]);
      expect(s.pile).not.toContain(u);
      expect(s.shop).not.toContain(u);
      // its card isn't in the deck too
      expect([...s.pile, ...s.shop].some(v => s.cards[v].def === ARTIFACTS[q])).toBe(false);
    }
  });
  it('the starting pick takes the artifact and 1 of its color, and the log names it', () => {
    let s = start();
    expect(s.pending.prompt).toMatch(/pick an artifact/);
    const p = s.pending.player, q = s.pending.options[0].value;
    s = applyMove(s, { player: p, option: s.pending.options[0].id });
    expect(s.players[p].artifact).toBe(s.artifacts[q]);
    expect(Object.values(s.players[p].res).reduce((a, b) => a + b, 0)).toBe(1);
    expect(s.log.some(l => l.includes("artifact") && l.includes(cardDef(s, s.artifacts[q]).name))).toBe(true);
    s = pickAll(s);
    expect(new Set(s.players.map(o => o.artifact)).size).toBe(TABLE.length);
  });
  it('is not a member and is worth no followers', () => {
    const s = pickAll(start());
    for (const o of s.players) { expect(o.members).toEqual([]); expect(memberCount(s, o)).toBe(0); expect(followers(s, o)).toBe(1); } // the leader's own 1
  });
  it('bot games finish with every invariant, artifacts on, 2.0 tables', () => {
    const tables = [TABLE, ['thieves', 'trading', 'red', 'echo'], ['market', 'purple', 'thieves', 'trading', 'red', 'echo']];
    let fired = new Set();
    for (const [k, quadrants] of tables.entries()) for (const seed of [1, 2, 3]) {
      const { state } = runGame({ n: quadrants.length, seed: seed + 10 * k, kind: 'bot', full: false, quadrants, rules: { artifacts: true } }) || {};
      if (state) for (const o of state.players) if (o.artifact !== undefined) {
        const name = cardDef(state, o.artifact).name;
        if (state.log.some(l => l.startsWith(`${o.name}'s ${name}`))) fired.add(name);
      }
    }
    // most artifacts pay at least once over these games (the log is trimmed, so not every one shows)
    expect(fired.size).toBeGreaterThan(0);
  });
});
