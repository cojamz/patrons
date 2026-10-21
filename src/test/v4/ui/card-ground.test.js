// Silver, white and colorless members each have their own card ground (lane 8, 2026-10-21): tinted into cream they
// looked alike at card size. Info.jsx cardGround names the ground; shop.css paints it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cardGround } from '../../../v4/game/Info.jsx';

const state = { quadrants: ['silver', 'trading', 'thieves', 'red'] };
describe('card grounds', () => {
  it('names silver, white (Trading) and colorless, and nothing else', () => {
    expect(cardGround(state, { quadrant: 'silver' })).toBe('silver');
    expect(cardGround(state, { quadrant: 'trading' })).toBe('white');
    expect(cardGround(state, { quadrant: 'gold' })).toBe('colorless'); // not on this table
    expect(cardGround(state, { quadrant: 'guest' })).toBe('colorless');
    expect(cardGround(state, { quadrant: 'red' })).toBeUndefined();
    expect(cardGround(state, { quadrant: 'thieves' })).toBeUndefined();
  });
  it('the three grounds differ from each other in the shop', () => {
    const css = readFileSync(join(__dirname, '../../../v4/game/shop.css'), 'utf8');
    const bg = g => (css.match(new RegExp(`\\[data-ground="${g}"\\] \\.art,[^{]*\\{\\s*background:([^;}]+)`)) || [])[1];
    const all = ['silver', 'white', 'colorless'].map(bg);
    expect(all.every(Boolean)).toBe(true);
    expect(new Set(all).size).toBe(3);
  });
});
