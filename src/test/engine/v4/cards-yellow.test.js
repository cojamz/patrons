// @vitest-environment node
// Card-by-card: every Yellow action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { resume, followers } from '../../../engine/v4/core.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const Q = ['gold', 'red', 'yellow', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const R = (s, i = 0) => s.players[i].res;
const rich = { gold: 30, red: 30, yellow: 30, green: 30 };

describe('Yellow actions', () => {
  it('Harvest: +1 yellow plus 1 per other color held; Top Up: +1 of each color you lack', () => {
    expect(R(take(sc({ res: [{ gold: 1, red: 2 }] }), 'yellow.harvest')).yellow).toBe(3);
    expect(R(take(sc({ res: [{ gold: 1 }] }), 'yellow.bloom'))).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
  });
  // the fewest, not "none of" (dead-window audit, 2026-10-14): it was dead whenever you held every color
  it('Top Up: +1 of each color you hold the fewest of (ties: all), named; holding every color still pays', () => {
    let s = take(sc({ res: [{ gold: 2, red: 1, yellow: 1, green: 3 }] }), 'yellow.bloom');
    expect(R(s)).toEqual({ gold: 2, red: 2, yellow: 2, green: 3 });
    // a tie says why it pays each tied color (panel tester C: only the hover said so)
    expect(named(s, 'Top Up')).toEqual(["P1's Top Up: red and yellow tie for your fewest (1 each), so +1 of each.", "P1's Top Up: +1 red, +1 yellow."]);
    expect(R(take(sc({ res: [{ gold: 1, red: 1, yellow: 1, green: 1 }] }), 'yellow.bloom'))).toEqual({ gold: 2, red: 2, yellow: 2, green: 2 });
  });
  it('Trade Seeds: +2 yellow, then up to 3 one-for-one swaps', () => {
    let s = take(sc({ res: [{ gold: 4 }] }), 'yellow.transmute');
    s = move(s, 'swap:gold:red'); s = move(s, 'swap:gold:green'); s = move(s, 'swap:gold:red');
    expect(R(s)).toEqual({ gold: 1, red: 2, yellow: 2, green: 1 });
  });
  it('Branch Out: +1 of each other color per 3 yellow (yellow kept); Potluck: 1 per member of its color; Bumper Crop: per full set', () => {
    expect(R(take(sc({ round: 2, res: [{ yellow: 7 }] }), 'yellow.prism'))).toEqual({ gold: 2, red: 2, yellow: 7, green: 2 });
    expect(R(take(sc({ round: 2, members: [['gold.banker', 'red.twins', 'red.intern']] }), 'yellow.gather'))).toMatchObject({ gold: 1, red: 2 });
    expect(R(take(sc({ round: 3, res: [{ gold: 2, red: 2, yellow: 3, green: 2 }] }), 'yellow.flourish'))).toEqual({ gold: 4, red: 4, yellow: 3, green: 4 });
  });
});

describe('Yellow members', () => {
  it('Gardener: round start +1 of each color you have none of, named; Midas leaves member income alone', () => {
    const s = sc({ res: [{ gold: 2 }], members: [['yellow.gardener', 'gold.midas']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 2, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Gardener')).toHaveLength(1);
  });
  it('Peddler: round start +1 of each other color, named', () => {
    const s = sc({ members: [['yellow.peddler']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 0, green: 1 });
    expect(named(s, 'Peddler')).toHaveLength(1);
  });
  it('Gleaner: an action gaining 2+ of another color at once gives +1 yellow, named; Midas’s converted gain counts', () => {
    let s = take(sc({ members: [['yellow.gleaner']] }), 'green.a1');
    expect(R(s).yellow).toBe(1);
    expect(named(s, 'Gleaner')).toHaveLength(1);
    s = sc({ members: [['yellow.gleaner', 'gold.midas']] });
    s.cards[uidOf(s, 'gold.midas', 0)].on = true;
    s = take(s, 'green.a1');
    expect(R(s)).toMatchObject({ gold: 3, green: 0, yellow: 1 });
  });
  it('Admirer: a rival recruiting a member of a color you lack gives +1 of it, named; a gold-leaning guest is gold', () => {
    let s = sc({ res: [{}, rich], members: [['yellow.admirer']], shop: ['benders.bigspender'], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'gold.rush'); s = buy(s, 'benders.bigspender');
    expect(R(s).gold).toBe(1);
    expect(named(s, 'Admirer')).toHaveLength(1);
  });
  it('Go-Between: your non-yellow recruit gives +1 of its color, named; a guest leaning to an absent sphere gives nothing', () => {
    const restore = pinCosts({ 'red.volunteer': [0, 0] });
    let s = take(sc({ members: [['yellow.gobetween']], shop: ['red.volunteer'] }), 'red.hire');
    restore();
    expect(R(s).red).toBe(1);
    expect(named(s, 'Go-Between')).toHaveLength(1);
    s = sc({ round: 3, members: [['yellow.gobetween']], shop: ['benders.squatter'] }); // leans to Thieves, not on this table
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'benders.squatter', 'shop')}`);
    expect(Object.values(R(s)).reduce((a, b) => a + b, 0)).toBe(0);
  });
  it('Dyer: round end +1 yellow per color held, named', () => {
    const s = sc({ res: [{ gold: 1, red: 3 }], members: [['yellow.dyer']], queue: [{ t: 'endRound' }] });
    expect(R(s).yellow).toBe(2);
    expect(named(s, 'Dyer')).toHaveLength(1);
  });
  it('Late Bloomers: round start +1 of each color with the fewest followers (ties count), named; not when ahead', () => {
    let s = sc({ members: [['yellow.latebloomer']], bonus: [0, 0], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Late Bloomers')).toHaveLength(1);
    s = sc({ members: [['yellow.latebloomer']], bonus: [3, 0], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).gold).toBe(0);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III it used to give nothing
  it('Late Bloomers recruited with the fewest followers: +1 of each color right away, named', () => {
    let s = sc({ round: 3, res: [{ yellow: 4 }], bonus: [0, 2], shop: ['yellow.latebloomer'], queue: [{ t: 'buy', p: 0 }] });
    s = buy(s, 'yellow.latebloomer');
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Late Bloomers')).toHaveLength(1);
  });
  it('Late Bloomers is worth 2 followers and excludes only itself from the comparison', () => {
    const s = sc({ members: [['yellow.latebloomer', 'gold.tycoon']], queue: [{ t: 'round', r: 2 }] });
    expect(followers(s, s.players[0])).toBe(4);
    expect(followers(s, s.players[1])).toBe(1);
    // The other member leaves the owner ahead even after Late Bloomers is excluded.
    expect(R(s)).toEqual({ gold: 0, red: 0, yellow: 0, green: 0 });
  });
  it('a Doppelganger copying Late Bloomers excludes its copied follower value at round start', () => {
    let s = sc({ members: [['echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'yellow.latebloomer';
    s.queue = [{ t: 'round', r: 2 }];
    s = resume(s);
    expect(followers(s, s.players[0])).toBe(3);
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
  });
  it('Sower: plant at round start, harvest that many of each other color at round end; both named', () => {
    let s = sc({ res: [{ yellow: 4 }], members: [['yellow.sower']], queue: [{ t: 'round', r: 2 }] });
    s = move(s, 'amount:2');
    expect(R(s).yellow).toBe(2);
    s.queue = [{ t: 'endRound' }]; s = resume(s);
    expect(R(s)).toMatchObject({ gold: 2, red: 2, green: 2 });
    expect(named(s, 'Sower')).toHaveLength(2);
  });
  it('Sower × Release: planted yellow comes back when the Sower leaves (as Cory ruled for Investor)', () => {
    const restore = pinCosts({ 'yellow.sower': [2, 2] });
    let s = sc({ round: 2, res: [{ yellow: 1 }], members: [['yellow.sower']], queue: [{ t: 'buy', p: 0 }] });
    const u = uidOf(s, 'yellow.sower', 0);
    s.cards[u].sown = 3;
    s = move(s, `release:${u}`);
    restore();
    // plus Sower's colored part, 2 yellow: Release gives back only that, in its color (Cory, 2026-10-14)
    expect(R(s).yellow).toBe(1 + 3 + 2);
    expect(named(s, 'Sower')).toHaveLength(1);
  });
  it('Harmonist: game end +1 follower per full set', () => {
    const s = sc({ res: [{ gold: 2, red: 3, yellow: 2, green: 5 }], members: [['yellow.harmonist']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Harmonist +2']);
  });
  it('Rainmaker: once per game, each color up to your yellow, named', () => {
    let s = sc({ res: [{ gold: 1, red: 5, yellow: 4 }], members: [['yellow.rainmaker']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    expect(R(s)).toEqual({ gold: 3 + 1, red: 5, yellow: 4, green: 4 });
    expect(named(s, 'Rainmaker')).toHaveLength(1);
  });
  // bots left it unused (dead-window audit, 2026-10-14): they now use it on their last buy of the game if it gives anything
  it('Rainmaker: a bot uses it on its last buy of the game for a small catch-up; not earlier in round III', async () => {
    const { chooseEasyMove } = await import('../../../engine/v4/bots.js');
    const res = [{ yellow: 3, gold: 2, red: 2, green: 2 }];
    const s = sc({ round: 3, left: 0, res, members: [['yellow.rainmaker']], queue: [{ t: 'buy', p: 0 }] });
    expect(chooseEasyMove(s, () => 0.5).option).toBe(`use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    const t = sc({ round: 3, left: 2, res, members: [['yellow.rainmaker']], queue: [{ t: 'buy', p: 0 }] });
    expect(chooseEasyMove(t, () => 0.5).option).not.toMatch(/^use:/);
  });
  it('Rainmaker × Underdog: the gold part is a gold gain, so it doubles past the match (see ledger question)', () => {
    let s = sc({ res: [{ gold: 1, yellow: 5 }, { gold: 20 }], members: [['yellow.rainmaker', 'gold.underdog']] });
    s = take(s, 'yellow.harvest');
    const y = R(s).yellow;
    s = move(s, `use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    expect(R(s).gold).toBe(1 + 2 * (y - 1));
  });
  it('Pilgrim: when recruited +1 of each color, named', () => {
    let s = sc({ round: 3, shop: ['yellow.pilgrim'] });
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'yellow.pilgrim', 'shop')}`);
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Pilgrim')[0]).toMatch(/P1's Pilgrim: \+1 gold, \+1 red, \+1 yellow, \+1 green/);
  });
  it('Farmer: +1 more when an action gains yellow, named; a Doppelganger copy adds another', () => {
    let s = take(sc({ members: [['yellow.farmer']] }), 'yellow.harvest');
    expect(R(s).yellow).toBe(2);
    expect(named(s, 'Farmer')).toHaveLength(1);
    s = sc({ members: [['yellow.farmer', 'echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'yellow.farmer';
    expect(R(take(s, 'yellow.harvest')).yellow).toBe(3); // Harvest's 1 (no other colors held), +1 Farmer, +1 its copy
  });
  it('Weaver: buying 6+ followers gives +1 of each color, named; a 3-buy does not', () => {
    let s = sc({ res: [{ gold: 3, red: 3, yellow: 3, green: 3 }], members: [['yellow.weaver']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:big');
    expect(named(s, 'Weaver')).toHaveLength(1);
    s = take(sc({ res: [{ gold: 3, red: 3 }], members: [['yellow.weaver']] }), 'gold.rush');
    s = move(s, 'tier:mid');
    expect(named(s, 'Weaver')).toHaveLength(0);
  });
  it('Explorer: +1 yellow for a space outside Yellow, named; Straggler’s move counts', () => {
    let s = take(sc({ members: [['yellow.explorer']] }), 'gold.rush');
    expect(R(s).yellow).toBe(1);
    expect(named(s, 'Explorer')).toHaveLength(1);
    s = sc({ round: 2, members: [['yellow.explorer', 'benders.straggler']], slots: { '2-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'to:0-1');
    expect(R(s).yellow).toBe(1);
  });
  it('Feastmaker: once per game, +1 of each color per round number, named', () => {
    let s = sc({ round: 2, members: [['yellow.feastmaker']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'yellow.feastmaker', 0)}`);
    expect(R(s)).toEqual({ gold: 6, red: 2, yellow: 2, green: 2 });
    expect(named(s, 'Feastmaker')).toHaveLength(1);
  });
});
