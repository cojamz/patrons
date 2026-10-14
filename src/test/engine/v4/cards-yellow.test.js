// @vitest-environment node
// Card-by-card: every Yellow action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { resume } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const Q = ['gold', 'red', 'yellow', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const R = (s, i = 0) => s.players[i].res;
const rich = { gold: 30, red: 30, yellow: 30, green: 30 };

describe('Yellow actions', () => {
  it('Harvest: +1 yellow plus 1 per other color held; Bloom: +1 of each color you lack', () => {
    expect(R(take(sc({ res: [{ gold: 1, red: 2 }] }), 'Harvest')).yellow).toBe(3);
    expect(R(take(sc({ res: [{ gold: 1 }] }), 'Bloom'))).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
  });
  it('Transmute: up to 3 one-for-one swaps, then +1 yellow', () => {
    let s = take(sc({ res: [{ gold: 4 }] }), 'Transmute');
    s = move(s, 'swap:gold:red'); s = move(s, 'swap:gold:green'); s = move(s, 'swap:gold:red');
    expect(R(s)).toEqual({ gold: 1, red: 2, yellow: 1, green: 1 });
  });
  it('Prism: +1 of each other color per 3 yellow (yellow kept); Gather: 1 per member of its color; Flourish: per full set', () => {
    expect(R(take(sc({ round: 2, res: [{ yellow: 7 }] }), 'Prism'))).toEqual({ gold: 2, red: 2, yellow: 7, green: 2 });
    expect(R(take(sc({ round: 2, members: [['gold.banker', 'red.twins', 'red.intern']] }), 'Gather'))).toMatchObject({ gold: 1, red: 2 });
    expect(R(take(sc({ round: 3, res: [{ gold: 2, red: 2, yellow: 3, green: 2 }] }), 'Flourish'))).toEqual({ gold: 4, red: 4, yellow: 3, green: 4 });
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
    let s = take(sc({ members: [['yellow.gleaner']] }), 'Scout');
    expect(R(s).yellow).toBe(1);
    expect(named(s, 'Gleaner')).toHaveLength(1);
    s = sc({ members: [['yellow.gleaner', 'gold.midas']] });
    s.cards[uidOf(s, 'gold.midas', 0)].on = true;
    s = take(s, 'Scout');
    expect(R(s)).toMatchObject({ gold: 2, red: 0, yellow: 1 });
  });
  it('Admirer: a rival recruiting a member of a color you lack gives +1 of it, named; a gold-leaning guest is gold', () => {
    let s = sc({ res: [{}, rich], members: [['yellow.admirer']], shop: ['benders.bigspender'], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'Rush'); s = buy(s, 'benders.bigspender');
    expect(R(s).gold).toBe(1);
    expect(named(s, 'Admirer')).toHaveLength(1);
  });
  it('Go-Between: your non-yellow recruit gives +1 of its color, named; a guest leaning to an absent sphere gives nothing', () => {
    let s = take(sc({ members: [['yellow.gobetween']], shop: ['red.volunteer'] }), 'Hire');
    expect(R(s).red).toBe(1);
    expect(named(s, 'Go-Between')).toHaveLength(1);
    s = sc({ round: 3, members: [['yellow.gobetween']], shop: ['benders.squatter'] }); // leans to Thieves, not on this table
    s = move(take(s, 'Take'), `card:${uidOf(s, 'benders.squatter', 'shop')}`);
    expect(Object.values(R(s)).reduce((a, b) => a + b, 0)).toBe(0);
  });
  it('Dyer: round end +1 yellow per color held, named', () => {
    const s = sc({ res: [{ gold: 1, red: 3 }], members: [['yellow.dyer']], queue: [{ t: 'endRound' }] });
    expect(R(s).yellow).toBe(2);
    expect(named(s, 'Dyer')).toHaveLength(1);
  });
  it('Late Bloomer: round start +1 of each color with the fewest followers (ties count), named; not when ahead', () => {
    let s = sc({ members: [['yellow.latebloomer']], bonus: [0, 1], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Late Bloomer')).toHaveLength(1);
    s = sc({ members: [['yellow.latebloomer']], bonus: [3, 0], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).gold).toBe(0);
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
    let s = sc({ round: 2, res: [{ yellow: 1 }], members: [['yellow.sower']], queue: [{ t: 'buy', p: 0 }] });
    const u = uidOf(s, 'yellow.sower', 0);
    s.cards[u].sown = 3;
    s = move(s, `release:${u}`);
    while (s.pending?.kind === 'choose') s = move(s, 'all:red');
    expect(R(s).yellow).toBe(1 + 3);
    expect(named(s, 'Sower')).toHaveLength(1);
  });
  it('Harmonist: game end +1 follower per full set', () => {
    const s = sc({ res: [{ gold: 2, red: 3, yellow: 2, green: 5 }], members: [['yellow.harmonist']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Harmonist +2']);
  });
  it('Rainmaker: once per game, each color up to your yellow, named', () => {
    let s = sc({ res: [{ gold: 1, red: 5, yellow: 4 }], members: [['yellow.rainmaker']] });
    s = take(s, 'Rush');
    s = move(s, `use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    expect(R(s)).toEqual({ gold: 3 + 1, red: 5, yellow: 4, green: 4 });
    expect(named(s, 'Rainmaker')).toHaveLength(1);
  });
  it('Rainmaker × Underdog: the gold part is a gold gain, so it doubles past the match (see ledger question)', () => {
    let s = sc({ res: [{ gold: 1, yellow: 5 }, { gold: 20 }], members: [['yellow.rainmaker', 'gold.underdog']] });
    s = take(s, 'Harvest');
    const y = R(s).yellow;
    s = move(s, `use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    expect(R(s).gold).toBe(1 + 2 * (y - 1));
  });
  it('Pilgrim: when recruited +1 of each color, named', () => {
    let s = sc({ round: 3, shop: ['yellow.pilgrim'] });
    s = move(take(s, 'Take'), `card:${uidOf(s, 'yellow.pilgrim', 'shop')}`);
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Pilgrim')[0]).toMatch(/P1's Pilgrim: \+1 gold, \+1 red, \+1 yellow, \+1 green/);
  });
  it('Farmer: +1 more when an action gains yellow, named; a Doppelganger copy adds another', () => {
    let s = take(sc({ members: [['yellow.farmer']] }), 'Harvest');
    expect(R(s).yellow).toBe(2);
    expect(named(s, 'Farmer')).toHaveLength(1);
    s = sc({ members: [['yellow.farmer', 'red.doppel']] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'yellow.farmer';
    expect(R(take(s, 'Harvest')).yellow).toBe(3); // Harvest's 1 (no other colors held), +1 Farmer, +1 its copy
  });
  it('Weaver: buying 6+ followers gives +1 of each color, named; a 3-buy does not', () => {
    let s = sc({ res: [{ gold: 3, red: 3, yellow: 3, green: 3 }], members: [['yellow.weaver']] });
    s = take(s, 'Rush');
    s = move(s, 'tier:big');
    expect(named(s, 'Weaver')).toHaveLength(1);
    s = take(sc({ res: [{ gold: 3, red: 3 }], members: [['yellow.weaver']] }), 'Rush');
    s = move(s, 'tier:mid');
    expect(named(s, 'Weaver')).toHaveLength(0);
  });
  it('Explorer: +1 yellow for a space outside Yellow, named; Straggler’s move counts', () => {
    let s = take(sc({ members: [['yellow.explorer']] }), 'Rush');
    expect(R(s).yellow).toBe(1);
    expect(named(s, 'Explorer')).toHaveLength(1);
    s = sc({ round: 2, members: [['yellow.explorer', 'benders.straggler']], slots: { '2-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(move(s, 'from:2-0'), 'to:0-1');
    expect(R(s).yellow).toBe(1);
  });
  it('Feastmaker: once per game, +1 of each color per round number, named', () => {
    let s = sc({ round: 2, members: [['yellow.feastmaker']] });
    s = take(s, 'Rush');
    s = move(s, `use:${uidOf(s, 'yellow.feastmaker', 0)}`);
    expect(R(s)).toEqual({ gold: 6, red: 2, yellow: 2, green: 2 });
    expect(named(s, 'Feastmaker')).toHaveLength(1);
  });
});
