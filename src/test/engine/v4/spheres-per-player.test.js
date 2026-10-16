// @vitest-environment node
// One sphere per player (Cory, 2026-10-15: "there are only X number of spheres for X number of players"): 2 and 3
// players get 2 and 3 spheres, and every round-I space still fills (3 per sphere, 3 minions each).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { quadrant, classicFor, defaultQuadrants } from '../../../engine/v4/content/index.js';
import { fitTable, tableProblem, randomTable, sphereCount } from '../../../v4/tables.js';

const bots = n => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));

/** Plays bots to the end; returns the round-I board as it stood when round I closed, and the finished game. */
function play(n, seed, quadrants) {
  const rand = seededRandom(seed * 7919 + n);
  let s = createGame({ seats: bots(n), seed, ...(quadrants ? { quadrants } : {}) });
  let lastR1 = null;
  while (!s.over) {
    if (s.round === 1) lastR1 = s;
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return { r1: lastR1, end: s };
}
const ringOneTaken = s => Object.keys(s.slots).filter(k => { const [q, i] = k.split('-').map(Number); return quadrant(s.quadrants[q]).actions[i].ring === 1; }).length;

describe('spheres = players', () => {
  it('the engine deals one sphere per seat by default', () => {
    for (const n of [2, 3, 4]) expect(createGame({ seats: bots(n), seed: 1 }).quadrants).toHaveLength(n);
    expect(defaultQuadrants(2)).toEqual(['gold', 'red']);
    expect(defaultQuadrants(3)).toEqual(['gold', 'red', 'market']);
  });

  it('Classic for 2 and 3 players is its first 2 and 3 spheres', () => {
    expect(classicFor(2)).toEqual(['gold', 'red']);
    expect(classicFor(3)).toEqual(['gold', 'red', 'market']);
    expect(classicFor(4)).toEqual(['gold', 'red', 'market', 'echo']);
    expect(fitTable({ mode: 'classic', quadrants: ['gold', 'red', 'market', 'echo'] }, 2).quadrants).toEqual(['gold', 'red']);
  });

  it('every round-I space fills with 2 and 3 players, on Classic and random tables', () => {
    for (const n of [2, 3]) {
      const tables = [classicFor(n), ...[11, 12, 13].map(k => randomTable(seededRandom(k * 31 + n), n))];
      tables.forEach((t, k) => {
        expect(tableProblem(t, n)).toBe('');
        const { r1, end } = play(n, 100 + k, t);
        expect(end.quadrants).toEqual(t);
        expect(ringOneTaken(r1)).toBe(3 * n);
        expect(end.over).toBe(true);
      });
    }
  });

  it('the table follows the seats: Random keeps its first N, Custom asks for the rest', () => {
    const r = randomTable(seededRandom(5), 4);
    expect(fitTable({ mode: 'random', quadrants: r }, 2).quadrants).toEqual(r.slice(0, 2));
    const grown = fitTable({ mode: 'random', quadrants: r.slice(0, 2) }, 4).quadrants;
    expect(grown).toHaveLength(4);
    expect(grown.slice(0, 2)).toEqual(r.slice(0, 2));
    expect(fitTable({ mode: 'random', quadrants: r.slice(0, 2) }, 4).quadrants).toEqual(grown); // the same every time
    expect(tableProblem(grown, 4)).toBe('');
    expect(fitTable({ mode: 'custom', quadrants: ['gold'] }, 3).quadrants).toEqual(['gold']);
    expect(tableProblem(['gold'], 3)).toBe('Pick 3 spheres.');
    expect(tableProblem(['gold', 'red', 'market'], 2)).toBe('Pick 2 spheres.');
    expect(sphereCount(1)).toBe(2);
  });
});
