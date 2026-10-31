// @vitest-environment node
// Card-by-card: every Yellow action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { EXTRA_WILD } from '../../../engine/v4/content/index.js';
import { resume, followers, memberCount, cardDef } from '../../../engine/v4/core.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const Q = ['gold', 'red', 'yellow', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const R = (s, i = 0) => s.players[i].res;
const rich = { gold: 30, red: 30, yellow: 30, green: 30 };

describe('Yellow actions', () => {
  it('Harvest: +3 in round I, +4 in II, +5 in III, one color at a time, named', () => {
    let s = take(sc({}), 'yellow.harvest');
    for (const c of ['red', 'red', 'green']) s = move(s, `color:${c}`);
    expect(R(s)).toEqual({ gold: 0, red: 2, yellow: 0, green: 1 });
    s = take(sc({ round: 3 }), 'yellow.harvest');
    for (let i = 0; i < 5; i++) s = move(s, 'color:gold');
    expect(R(s).gold).toBe(5);
  });
  it('Trade Seeds: +2 yellow, then up to 3 one-for-one swaps', () => {
    let s = take(sc({ res: [{ gold: 4 }] }), 'yellow.transmute');
    s = move(s, 'swap:gold:red'); s = move(s, 'swap:gold:green'); s = move(s, 'swap:gold:red');
    expect(R(s)).toEqual({ gold: 1, red: 2, yellow: 2, green: 1 });
  });
  it("Dilute: +2 yellow, then change up to 3 of rivals' resources one for one, each named", () => {
    let s = take(sc({ res: [{}, { red: 3 }] }), 'yellow.dilute');
    expect(R(s).yellow).toBe(2);
    s = move(s, 'res:1:red'); s = move(s, 'color:gold');
    s = move(s, 'res:1:red'); s = move(s, 'color:green');
    s = move(s, 'done');
    expect(R(s, 1)).toEqual({ gold: 1, red: 1, yellow: 0, green: 1 });
    expect(named(s, 'Dilute')).toHaveLength(3); // the +2 yellow and both changes
  });
  it("Big Dilute (round II): +4 yellow, then up to 6 changes; it stops at 6", () => {
    let s = take(sc({ round: 2, res: [{}, { red: 9 }] }), 'yellow.bigdilute');
    for (let i = 0; i < 6; i++) { s = move(s, 'res:1:red'); s = move(s, 'color:gold'); }
    expect(R(s).yellow).toBe(4);
    expect(R(s, 1)).toMatchObject({ red: 3, gold: 6 });
    expect(s.pending?.options?.some(o => o.id === 'res:1:red')).toBeFalsy();
  });
  it('Melting Pot (round II): +2 yellow, and +1 in colors you choose per color among your members', () => {
    let s = take(sc({ round: 2, members: [['red.twins', 'gold.banker', 'yellow.explorer']] }), 'yellow.meltingpot');
    for (let i = 0; i < 3; i++) s = move(s, 'color:green');
    expect(R(s)).toMatchObject({ yellow: 2, green: 3 });
  });
  it('Makeover (round III): +4 yellow, then rearrange everything', () => {
    let s = take(sc({ round: 3, res: [{ gold: 2, red: 2 }] }), 'yellow.makeover');
    s = move(s, 'color:red');
    expect(R(s)).toEqual({ gold: 0, red: 8, yellow: 0, green: 0 });
  });
});

describe('Yellow members', () => {
  it('Guest Book (artifact): a recruit in a new member color gives +2 yellow, named; a second of that color gives nothing', () => {
    let s = sc({ round: 3, res: [rich], shop: ['red.intern', 'red.volunteer'] });
    const art = Math.max(...Object.keys(s.cards).map(Number)) + 1;
    s.cards[art] = { uid: art, def: 'yellow.guestbook' }; s.players[0].artifact = art;
    const y0 = R(s).yellow;
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(named(s, 'Guest Book')).toHaveLength(1);
    expect(R(s).yellow - y0).toBe(2);
  });
  it('Customs: +1 yellow when a rival changes or steals your resources, named', () => {
    let s = take(sc({ res: [{}, { red: 2 }], members: [[], ['yellow.customs']] }), 'yellow.dilute');
    s = move(s, 'res:1:red'); s = move(s, 'color:gold'); s = move(s, 'done');
    expect(R(s, 1)).toMatchObject({ red: 1, gold: 1, yellow: 1 });
    expect(named(s, 'Customs')).toHaveLength(1);
  });
  it('Go-Between: once per space, you may change 1 gained resource to another color', () => {
    let s = take(sc({ members: [['yellow.gobetween']] }), 'yellow.transmute');
    s = move(s, 'color:red');
    expect(R(s)).toMatchObject({ yellow: 1, red: 1 });
    expect(named(s, 'Go-Between')).toHaveLength(1);
  });
  it('Tinker: On Recruit and Round Start, up to 3 swaps of your own', () => {
    let s = sc({ res: [{ gold: 3 }], members: [['yellow.tinker']], queue: [{ t: 'round', r: 2 }] });
    s = move(s, 'swap:gold:red'); s = move(s, 'done');
    expect(R(s)).toMatchObject({ gold: 2, red: 1 });
  });
  it('Matchmaker: a recruit in a new member color gives +1 follower and +2 in colors you choose', () => {
    let s = sc({ round: 3, res: [rich], members: [['yellow.matchmaker']], shop: ['red.intern'] });
    const f0 = followers(s, s.players[0]);
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'red.intern', 'shop')}`);
    const g0 = R(s).green;
    s = move(s, 'color:green'); s = move(s, 'color:green');
    expect(R(s).green - g0).toBe(2);
    expect(followers(s, s.players[0]) - f0).toBe(1 + cardDef(s, uidOf(s, 'red.intern', 0)).f);
  });
  it('Dyer: round start, +1 yellow per color you hold', () => {
    const s = sc({ members: [['yellow.dyer']], res: [{ gold: 1, red: 2 }], queue: [{ t: 'round', r: 2 }] });
    expect(R(s).yellow).toBe(2);
  });
  it("Agitator: On Recruit, change up to 4 of rivals' resources", () => {
    let s = sc({ round: 3, res: [{}, { red: 5 }], shop: ['yellow.agitator'] });
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'yellow.agitator', 'shop')}`);
    for (let i = 0; i < 4; i++) { s = move(s, 'res:1:red'); s = move(s, 'color:green'); }
    expect(R(s, 1)).toMatchObject({ red: 1, green: 4 });
  });
  it('Drifters: counts as a member of the color chosen on recruit', () => {
    let s = sc({ round: 3, shop: ['yellow.drifters'] });
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'yellow.drifters', 'shop')}`);
    s = move(s, 'color:green');
    expect(s.cards[uidOf(s, 'yellow.drifters', 0)].asColor).toBe('green');
  });
  it("Leveler: once per round, 1 of each rival's biggest color becomes the color you choose", () => {
    let s = sc({ res: [{}, { red: 3, gold: 1 }], members: [['yellow.leveler']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'yellow.leveler', 0)}`);
    s = move(s, 'color:green');
    expect(R(s, 1)).toMatchObject({ red: 2, green: 1, gold: 1 });
  });
  it('Big Tent: game end, +2 followers per color you have exactly one member of', () => {
    const s = sc({ members: [['yellow.bigtent', 'red.twins', 'red.intern', 'gold.banker']] });
    expect(cardDef(s, uidOf(s, 'yellow.bigtent', 0)).onGameEnd({ state: s, countMembersOfColor: (p, q) => ({ yellow: 1, red: 2, gold: 1 })[q] || 0 }, s.players[0])).toBe(4);
  });
  it('Gardener: round start +1 of each color you have none of, named; Midas leaves member income alone', () => {
    const s = sc({ res: [{ gold: 2 }], members: [['yellow.gardener', 'gold.midas']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 2, red: 1, yellow: 1, green: 1 });
    expect(named(s, 'Gardener')).toHaveLength(1);
  });
  it('Peddler: round start +1 of each color, named', () => {
    const s = sc({ members: [['yellow.peddler']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 1, green: 1 });
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
  it('Admirer: a rival recruiting a member of a color you lack gives +1 of it, named; a guest (leans gold) is colorless and gives nothing', () => {
    let s = sc({ res: [{}, rich], members: [['yellow.admirer']], shop: ['gold.banker'], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'gold.rush'); s = buy(s, 'gold.banker');
    expect(R(s).gold).toBe(1);
    expect(named(s, 'Admirer')).toHaveLength(1);
    // neutral cards stay neutral (Cory, 2026-10-18): the rival recruits Big Spender, Admirer stays quiet
    s = sc({ res: [{}, rich], members: [['yellow.admirer']], shop: ['benders.bigspender'], queue: [{ t: 'turn', p: 1 }] });
    const u = uidOf(s, 'benders.bigspender', 'shop');
    s = take(s, 'gold.rush'); s = buy(s, 'benders.bigspender');
    expect(s.players[1].members).toContain(u);
    expect(R(s)).toEqual({ gold: 0, red: 0, yellow: 0, green: 0 });
    expect(named(s, 'Admirer')).toEqual([]);
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
    let s = sc({ round: 3, res: [{ yellow: 5 }], bonus: [0, 2], shop: ['yellow.latebloomer'], queue: [{ t: 'buy', p: 0 }] });
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
    let s = sc({ round: 2, rules: { release: true }, res: [{ yellow: 1 }], members: [['yellow.sower']], queue: [{ t: 'buy', p: 0 }] });
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
    s = move(take(s, 'yellow.transmute'), 'done');
    const y = R(s).yellow;
    s = move(s, `use:${uidOf(s, 'yellow.rainmaker', 0)}`);
    expect(R(s).gold).toBe(1 + 2 * (y - 1));
  });
  it('Pilgrim: when recruited +1 of each color, named', () => {
    let s = sc({ round: 3, shop: ['yellow.pilgrim'] });
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'yellow.pilgrim', 'shop')}`);
    expect(R(s)).toEqual({ gold: 1, red: 2, yellow: 1, green: 1 }); // and Recruit a Member's own +1 red (v0.8.0)
    expect(named(s, 'Pilgrim')[0]).toMatch(/P1's Pilgrim: \+1 gold, \+1 red, \+1 yellow, \+1 green/);
  });
  it('Farmer: +1 more when an action gains yellow, named; a Doppelganger copy adds another', () => {
    let s = take(sc({ members: [['yellow.farmer']] }), 'yellow.transmute');
    expect(R(s).yellow).toBe(3);
    expect(named(s, 'Farmer')).toHaveLength(1);
    s = sc({ members: [['yellow.farmer', 'echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'yellow.farmer';
    expect(R(take(s, 'yellow.transmute')).yellow).toBe(4); // Trade Seeds' 2, +1 Farmer, +1 its copy
  });
  it('Weaver: buying 5+ followers gives +1 of each color, named; a 1-buy does not', () => {
    let s = sc({ res: [{ gold: 3, red: 3, yellow: 3, green: 3 }], members: [['yellow.weaver']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:mid'); // The five-follower tier now reaches Weaver's threshold.
    expect(named(s, 'Weaver')).toHaveLength(1);
    expect(s.players[0].bonus).toBe(5);
    expect(named(s, 'Weaver')[0]).toContain('+1 gold, +1 red, +1 yellow, +1 green');
    s = take(sc({ res: [{ gold: 3, red: 3 }], members: [['yellow.weaver']] }), 'gold.rush');
    s = move(s, 'tier:small');
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
  it('Chefs: once per game, +1 of each color per round number, named', () => {
    let s = sc({ round: 2, members: [['yellow.chefs']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'yellow.chefs', 0)}`);
    expect(R(s)).toEqual({ gold: 6, red: 2, yellow: 2, green: 2 });
    expect(named(s, 'Chefs')).toHaveLength(1);
  });
  // Cory, 2026-10-18: Feastmaker became Chefs, a little cheaper (6+4 → 6+3) and counting as 2 members
  it('Chefs: costs 6 yellow + 3 any, worth 2 followers, 1 member', () => {
    const s = sc({ members: [['yellow.chefs']] });
    const d = cardDef(s, uidOf(s, 'yellow.chefs', 0));
    expect([d.s, d.w, d.f]).toEqual([6, 3 + EXTRA_WILD, 2]);
    expect(memberCount(s, s.players[0])).toBe(1);
    expect(followers(s, s.players[0]) - followers(sc({}), sc({}).players[0])).toBe(2);
  });
});
