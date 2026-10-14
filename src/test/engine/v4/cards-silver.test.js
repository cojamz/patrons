// @vitest-environment node
// Card-by-card: every Silver action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { followers, resume } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const Q = ['gold', 'red', 'silver', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const S = (s, i = 0) => s.players[i].res.silver;
const rich = { gold: 30, red: 30, silver: 30, green: 30 };

describe('Silver actions', () => {
  it('Toast 3 / 6 / 9 and everyone else +1; Gift +2 silver +2 of a color, others 1 of it; Alms +4, a rival gets 2', () => {
    let s = take(sc({ n: 3, round: 2 }), 'Toast');
    expect(s.players.map(p => p.res.silver)).toEqual([6, 1, 1]);
    s = move(take(sc({ n: 3 }), 'Gift'), 'color:red');
    expect(s.players.map(p => [p.res.silver, p.res.red])).toEqual([[2, 2], [0, 1], [0, 1]]);
    s = move(take(sc({ n: 3 }), 'Alms'), 'give:2:green');
    expect(s.players.map(p => [p.res.silver, p.res.green])).toEqual([[4, 0], [0, 0], [0, 2]]);
  });
  it('Silver Tongue +4 then swap; Rising Tide: others +1 then half the richest rival’s, rounded up; Jubilee', () => {
    let s = move(take(sc({ round: 2 }), 'Silver Tongue'), 'swap:red:4');
    expect(s.players.map(p => [p.res.silver, p.res.red])).toEqual([[0, 4], [1, 0]]);
    s = take(sc({ round: 2, res: [{}, { silver: 4 }] }), 'Rising Tide');
    expect(s.players.map(p => p.res.silver)).toEqual([3, 5]);
    s = take(sc({ round: 3, res: [{ silver: 7 }] }), 'Jubilee');
    expect(s.players[0].bonus).toBe(3);
    expect(s.players.map(p => p.res.silver)).toEqual([7, 2]);
  });
});

describe('Silver members', () => {
  it('Guest: another player’s gift gives +1 more, named', () => {
    const s = take(sc({ members: [[], ['silver.guest']] }), 'Toast');
    expect(S(s, 1)).toBe(2);
    expect(named(s, 'Guest')[0]).toMatch(/P2's Guest: \+1 silver/);
  });
  it('Guest × Joint Venture: Gold’s gift counts, named', () => {
    const s = move(take(sc({ members: [[], ['silver.guest']] }), 'Joint Venture'), 'player:1');
    expect(s.players[1].res.gold).toBe(2);
    expect(named(s, 'Guest')).toHaveLength(1);
  });

  it('Benefactor: round start +3 silver, a rival you pick +1; named', () => {
    let s = sc({ n: 3, members: [['silver.benefactor']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(3);
    s = move(s, 'player:2');
    expect(S(s, 2)).toBe(1);
    expect(named(s, 'Benefactor')).toHaveLength(2);
  });
  it('Benefactor × a rival’s Guest: the gift gives 1 more', () => {
    let s = sc({ members: [['silver.benefactor'], ['silver.guest']], queue: [{ t: 'round', r: 2 }] });
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options.find(o => o.id === 'player:1')?.id ?? s.pending.options[0].id);
    expect(S(s, 1)).toBe(2);
  });

  it('Caterer: +1 silver per gift (not per player), named', () => {
    const s = take(sc({ n: 4, members: [['silver.caterer']] }), 'Toast');
    expect(S(s)).toBe(3 + 1);
    expect(named(s, 'Caterer')[0]).toMatch(/P1's Caterer: \+1 silver/);
  });
  it('Caterer × Joint Venture: giving gold is giving too', () => {
    const s = move(take(sc({ members: [['silver.caterer']] }), 'Joint Venture'), 'player:1');
    expect(S(s)).toBe(1);
    expect(named(s, 'Caterer')).toHaveLength(1);
  });

  it('Majordomo: +2 silver for taking a Silver space, named', () => {
    const s = take(sc({ members: [['silver.majordomo']] }), 'Toast');
    expect(S(s)).toBe(5);
    expect(named(s, 'Majordomo')).toHaveLength(1);
  });
  it('Majordomo × Straggler: moving onto a Silver space is taking it', () => {
    let s = sc({ round: 2, members: [['silver.majordomo', 'benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(move(s, 'from:0-0'), 'to:2-0');
    expect(S(s)).toBe(6 + 2);
    expect(named(s, 'Majordomo')).toHaveLength(1);
    expect(named(s, 'Straggler')).toHaveLength(1);
  });

  it('Silversmith: +1 more when an action gains silver, named; not on gifts', () => {
    let s = take(sc({ members: [['silver.silversmith']] }), 'Toast');
    expect(S(s)).toBe(4);
    expect(named(s, 'Silversmith')).toHaveLength(1);
    s = take(sc({ members: [[], ['silver.silversmith']] }), 'Toast');
    expect(S(s, 1)).toBe(1);
  });
  it('Silversmith × Grand Host: the doubled Toast still gets just +1', () => {
    const s = take(sc({ members: [['silver.silversmith', 'silver.grandhost']] }), 'Toast');
    expect(S(s)).toBe(7);
  });

  it('Steward: round start +1 per 3 silver held, named', () => {
    const s = sc({ res: [{ silver: 7 }], members: [['silver.steward']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(9);
    expect(named(s, 'Steward')).toHaveLength(1);
  });

  it('Retinue: worth 2 followers; when recruited everyone else +1 silver, named; a rival’s Guest gets 1 more', () => {
    let s = sc({ n: 3, res: [rich], members: [[], [], ['silver.guest']], shop: ['silver.retinue'] });
    const f0 = followers(s, s.players[0]);
    s = take(s, 'Rush'); s = buy(s, 'silver.retinue');
    expect(followers(s, s.players[0])).toBe(f0 + 2);
    expect([S(s, 1), S(s, 2)]).toEqual([1, 2]);
    expect(named(s, 'Retinue').length).toBeGreaterThanOrEqual(1);
  });

  it('Feast Hall: when recruited +2 silver per round number, named (Red’s Take in round III: +6)', () => {
    let s = sc({ round: 3, shop: ['silver.feasthall'] });
    s = move(take(s, 'Take'), `card:${uidOf(s, 'silver.feasthall', 'shop')}`);
    expect(S(s)).toBe(6);
    expect(named(s, 'Feast Hall')[0]).toMatch(/P1's Feast Hall: \+6 silver/);
  });

  it('Heir: start of round III only, +1 silver per member, named', () => {
    let s = sc({ members: [['silver.heir', 'red.intern', 'red.twins']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(0);
    s = sc({ members: [['silver.heir', 'red.intern', 'red.twins']], queue: [{ t: 'round', r: 3 }] });
    expect(S(s)).toBe(3);
    expect(named(s, 'Heir')).toHaveLength(1);
  });

  it('Silver Spoon: when recruited, silver equal to the richest rival’s, named', () => {
    let s = sc({ n: 3, round: 3, res: [{}, { silver: 4 }, { silver: 9 }], shop: ['silver.spoon'] });
    s = move(take(s, 'Take'), `card:${uidOf(s, 'silver.spoon', 'shop')}`);
    expect(S(s)).toBe(9);
    expect(named(s, 'Silver Spoon')).toHaveLength(1);
  });

  it('Toastmaster: +1 follower per Silver space, named; Straggler onto Silver counts', () => {
    let s = take(sc({ members: [['silver.toastmaster']] }), 'Alms');
    expect(s.players[0].bonus).toBe(1);
    expect(named(s, 'Toastmaster')[0]).toMatch(/P1's Toastmaster: \+1 follower/);
    s = sc({ round: 2, members: [['silver.toastmaster', 'benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(move(s, 'from:0-0'), 'to:2-0');
    expect(s.players[0].bonus).toBe(1);
  });

  it('Gala: once per game, double your silver and everyone else +2; named; a rival’s Guest gets 1 more', () => {
    let s = sc({ res: [{ silver: 5 }], members: [['silver.gala'], ['silver.guest']] });
    s = take(s, 'Rush');
    s = move(s, `use:${uidOf(s, 'silver.gala', 0)}`);
    expect(S(s)).toBe(10);
    expect(S(s, 1)).toBe(3);
    expect(named(s, 'Gala')).toHaveLength(1);
  });

  it('Grand Host: Silver spaces give twice the silver, and the log says Grand Host did it', () => {
    const s = take(sc({ members: [['silver.grandhost']] }), 'Toast');
    expect(S(s)).toBe(6);
    expect(S(s, 1)).toBe(1); // the spill is not doubled
    expect(named(s, 'Grand Host')).toHaveLength(1);
  });
  it('Grand Host × Doppelganger: each copy doubles again (×4)', () => {
    let s = sc({ members: [['silver.grandhost', 'red.doppel']] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'silver.grandhost';
    s = take(s, 'Toast');
    expect(S(s)).toBe(12);
  });

  it('Patron Saint: game end +1 follower per 2 silver members in play, anyone’s', () => {
    const s = sc({ members: [['silver.saint', 'silver.dowager'], ['silver.guest', 'silver.heir']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Patron Saint +2']);
    void resume;
  });
});
