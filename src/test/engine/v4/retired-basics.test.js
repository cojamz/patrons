// @vitest-environment node
import { it, expect } from 'vitest';
import { spheres, tableProblem, parseTable, fitTable, randomTable } from '../../../v4/tables.js';
import { quadrant } from '../../../engine/v4/content/index.js';
it('retires Basic arcs from all new table entry paths while retaining replay definitions', () => {
  expect(spheres()).not.toContain('blue');
  expect(spheres()).not.toContain('green');
  expect(spheres()).toEqual(expect.arrayContaining(['market', 'echo']));
  expect(tableProblem(['gold', 'red', 'blue', 'green'])).toContain('retired');
  expect(parseTable('gold,red,blue,green')).toEqual(['gold', 'red', 'market', 'echo']);
  expect(fitTable({ mode: 'custom', quadrants: ['gold', 'red', 'blue', 'green'] }, 4).quadrants).toEqual(['gold', 'red', 'market', 'echo']);
  expect(randomTable(() => 0.3, 4).every(id => !quadrant(id).standIn)).toBe(true);
  expect(quadrant('blue').standIn).toBe(true);
  expect(quadrant('green').standIn).toBe(true);
});
