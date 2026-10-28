// @vitest-environment node
// Tryout (Red's round I space, key 'evenswap'; it replaced Even Swap, Cory 2026-10-27): use a shop member's On Recruit;
// it stays in the shop. +2 red.
import { describe, it, expect } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move, uidOf, ids } from './helpers.js';
import { sceneQ } from './cards-helpers.js';
const T = ['gold', 'red', 'thieves', 'echo'];

describe('Tryout — a shop member’s On Recruit, and it stays in the shop', () => {
  it('stays in round I, says the On Recruit stays in the shop, plus +1 red', () => {
    const a = quadrant('red').actions.find(a => a.key === 'evenswap');
    expect(a.ring).toBe(1); expect(a.name).toBe('Tryout');
    expect(a.text).toMatch(/On Recruit effect of a shop member; it stays in the shop/);
    expect(a.text).toMatch(/\+1 red/);
  });
  it('offers only shop members with an On Recruit, never your own members', () => {
    const s = take(sceneQ({ quadrants: T, members: [['echo.evergreen']], shop: ['gold.banker', 'red.twins', 'red.intern'] }), 'red.evenswap');
    expect(s.players[0].res.red).toBe(1);
    expect(ids(s)).toEqual([`card:${uidOf(s, 'gold.banker', 'shop')}`]);
  });
  it('skips shop members whose On Recruit acts on the card itself', () => {
    const s = take(sceneQ({ quadrants: T, shop: ['gold.banker', 'thieves.doubleagent', 'echo.doppel'] }), 'red.evenswap');
    expect(ids(s)).toEqual([`card:${uidOf(s, 'gold.banker', 'shop')}`]);
  });
  it('uses the On Recruit; the member stays in the shop, nobody recruits, and your recruit watchers stay quiet', () => {
    let s = take(sceneQ({ quadrants: T, members: [['red.recruiter', 'red.proselytizer']], shop: ['gold.banker', 'red.twins'] }), 'red.evenswap');
    const banker = uidOf(s, 'gold.banker', 'shop'), shop = [...s.shop], pile = [...s.pile];
    s = move(s, `card:${banker}`);
    expect(s.players[0].res).toMatchObject({ gold: 3, red: 1 });
    expect(s.players[0].bonus).toBe(0);
    expect(s.players[0].members).toHaveLength(2);
    expect(s.shop).toEqual(shop); expect(s.pile).toEqual(pile);
    expect(s.recruits).toBe(0);
    expect(s.log.some(l => /uses Banker’s On Recruit; it stays in the shop/.test(l))).toBe(true);
  });
  it('with no On Recruit member in the shop, keeps the +1 red, says so and finishes', () => {
    let s = sceneQ({ quadrants: T, members: [['red.intern']] });
    s.shop = []; s.pile = [];
    s = take(s, 'red.evenswap');
    expect(s.players[0].res.red).toBe(1);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.log.some(l => /no shop member has an On Recruit effect/.test(l))).toBe(true);
  });
});
