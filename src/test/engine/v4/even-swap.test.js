// @vitest-environment node
// Even Swap (Red, ring I; Cory 2026-10-14, "let's try it"): "+1 red, and swap one of your members for a rival's of
// equal cost." It replaced Scout. It is Swap Sides' weak twin and shares its swap: the same options, the same
// handler, the same protection (a Bodyguard owner's members are out of reach), and no fallback when there's no pair.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contextFor, followers } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move, uidOf, ids, pinCosts } from './helpers.js';
import { sceneQ } from './cards-helpers.js';

// printed costs these tests are written against: Intern 1, Twins 2, Banker 2, Big Family 2, Volunteer 0, Tycoon 6,
// Bodyguard 2
const COSTS = {
  'red.intern': [1, 0], 'red.twins': [1, 1], 'gold.banker': [2, 0], 'red.bigfamily': [1, 1], 'red.volunteer': [0, 0],
  'gold.tycoon': [3, 3], 'thieves.watchdog': [1, 1],
};
let restore;
beforeEach(() => { restore = pinCosts(COSTS); });
afterEach(() => { restore(); });

const T = ['gold', 'red', 'thieves', 'green'];
const R = (s, i = 0) => s.players[i].res;
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const evenSwap = () => quadrant('red').actions.find(a => a.name === 'Even Swap');

describe('Even Swap', () => {
  it('sits in Red’s outer ring where Scout was, and Scout is gone', () => {
    const red = quadrant('red').actions;
    expect(red.filter(a => a.ring === 1).map(a => a.name)).toEqual(['Even Swap', 'Bandwagon', 'Open Door']);
    expect(red.some(a => a.key === 'scout' || a.name === 'Scout')).toBe(false);
    expect(evenSwap().text).toBe('+1 red, and swap one of your members for a rival’s of equal cost.');
  });

  it('+1 red, and offers only rivals’ members of exactly equal cost', () => {
    let s = sceneQ({ quadrants: T, n: 3, members: [['red.twins', 'red.intern'], ['gold.banker', 'red.volunteer', 'gold.tycoon'], ['red.bigfamily']] });
    s = take(s, 'Even Swap');
    expect(R(s).red).toBe(1);
    const twins = uidOf(s, 'red.twins', 0);
    // Twins (2) ↔ Banker (2) or Big Family (2); Intern (1) matches nobody; Volunteer (0) and Tycoon (6) are never offered
    expect(ids(s).sort()).toEqual([`trade:${twins}:${uidOf(s, 'gold.banker', 1)}`, `trade:${twins}:${uidOf(s, 'red.bigfamily', 2)}`].sort());
    expect(s.pending.prompt).toMatch(/^Even Swap:/);
  });

  it('the swap moves both members, and their followers with them', () => {
    let s = sceneQ({ quadrants: T, members: [['red.twins'], ['red.bigfamily']] });
    const before = [followers(s, s.players[0]), followers(s, s.players[1])];
    s = take(s, 'Even Swap');
    s = move(s, `trade:${uidOf(s, 'red.twins', 0)}:${uidOf(s, 'red.bigfamily', 1)}`);
    expect(defs(s, 0)).toEqual(['red.bigfamily']);
    expect(defs(s, 1)).toEqual(['red.twins']);
    // Big Family is worth 3, Twins 2: one follower changes hands with them
    expect([followers(s, s.players[0]), followers(s, s.players[1])]).toEqual([before[0] + 1, before[1] - 1]);
    expect(s.log).toContain("P1 traded Twins for P2's Big Family.");
  });

  it('respects Bodyguard: its owner’s members can’t be swapped for, like Swap Sides', () => {
    let s = sceneQ({ quadrants: T, n: 3, members: [['red.twins'], ['thieves.watchdog', 'gold.banker'], ['red.bigfamily']] });
    s = take(s, 'Even Swap');
    expect(ids(s)).toEqual([`trade:${uidOf(s, 'red.twins', 0)}:${uidOf(s, 'red.bigfamily', 2)}`]);
    // the only equal-cost rival is guarded: +1 red and nothing else
    let t = sceneQ({ quadrants: T, members: [['red.twins'], ['thieves.watchdog', 'gold.banker']] });
    t = take(t, 'Even Swap');
    expect(R(t).red).toBe(1);
    expect(t.pending?.kind).not.toBe('choose');
    expect(defs(t, 0)).toEqual(['red.twins']);
  });

  it('Lie Low doesn’t stop it (it shields resources only)', () => {
    let s = sceneQ({ quadrants: T, members: [['red.twins'], ['gold.banker']] });
    s.players[1].hideout = s.round;
    s = take(s, 'Even Swap');
    expect(ids(s)).toEqual([`trade:${uidOf(s, 'red.twins', 0)}:${uidOf(s, 'gold.banker', 1)}`]);
  });

  it('with no members of your own: +1 red, nothing to swap, no fallback', () => {
    const s = take(sceneQ({ quadrants: T, members: [[], ['gold.banker']] }), 'Even Swap');
    expect(R(s)).toMatchObject({ red: 1, gold: 0 });
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.log).toContain('P1 had no equal-cost member to swap.');
    expect(defs(s, 1)).toEqual(['gold.banker']);
  });

  it('when no rival holds a member of equal cost: +1 red and nothing else', () => {
    const s = take(sceneQ({ quadrants: T, n: 3, members: [['red.intern', 'red.twins'], ['red.volunteer', 'gold.tycoon'], []] }), 'Even Swap');
    expect(R(s).red).toBe(1);
    expect(s.pending?.kind).not.toBe('choose');
    expect(defs(s, 0)).toEqual(['red.intern', 'red.twins']);
  });

  it('bots value it like Swap Sides does: +1 for the red, +1 when a swap is there', () => {
    const none = sceneQ({ quadrants: T, members: [['red.intern'], ['gold.banker']] });
    expect(evenSwap().estimate(contextFor(none), none.players[0])).toBe(1);
    const pair = sceneQ({ quadrants: T, members: [['red.twins'], ['gold.banker']] });
    expect(evenSwap().estimate(contextFor(pair), pair.players[0])).toBe(2);
  });
});
