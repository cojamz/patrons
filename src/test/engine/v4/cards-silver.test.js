// @vitest-environment node
// Card-by-card: every Silver action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { followers, resume, memberCount, contestTable } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const Q = ['gold', 'red', 'silver', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const named = (s, name) => linesNaming(s.log, name);
const S = (s, i = 0) => s.players[i].res.silver;
const rich = { gold: 30, red: 30, silver: 30, green: 30 };

describe('Silver actions', () => {
  it('Toast 3 / 6 / 9 and everyone else +1 / +2 / +3; Goody Bags +2 silver +2 of a color, others 1 of it; Good Deed +4, a rival gets 2', () => {
    let s = take(sc({ n: 3, round: 2 }), 'silver.toast');
    expect(s.players.map(p => p.res.silver)).toEqual([6, 2, 2]);
    s = move(take(sc({ n: 3 }), 'silver.gift'), 'color:red');
    expect(s.players.map(p => [p.res.silver, p.res.red])).toEqual([[2, 2], [0, 1], [0, 1]]);
    s = move(take(sc({ n: 3 }), 'silver.alms'), 'give:2:green');
    expect(s.players.map(p => [p.res.silver, p.res.green])).toEqual([[4, 0], [0, 0], [0, 2]]);
  });
  it.each([1, 2, 3])('Toast round %i scales each rival gift, with Guest, Caterer and Grand Host', round => {
    const s = take(sc({ n: 3, round, members: [['silver.grandhost', 'silver.caterer'], ['silver.guest']] }), 'silver.toast');
    expect(s.players.map(p => p.res.silver)).toEqual([6 * round + 1, round + 1, round]);
    expect(named(s, 'Caterer')).toHaveLength(1); // one gift, not one per recipient
    expect(s.log).toContain(`P1 raised a toast: +${6 * round} silver, +${round} silver to everyone else.`);
  });
  it('Sweet Talk +4 then swap; Rising Tide: others +1 then half the richest rival’s, rounded up; Hold Court', () => {
    let s = move(take(sc({ round: 2 }), 'silver.tongue'), 'swap:red:4');
    expect(s.players.map(p => [p.res.silver, p.res.red])).toEqual([[0, 4], [1, 0]]);
    s = take(sc({ round: 2, res: [{}, { silver: 4 }] }), 'silver.tide');
    expect(s.players.map(p => p.res.silver)).toEqual([3, 5]);
    s = take(sc({ round: 3, res: [{ silver: 7 }] }), 'silver.jubilee');
    expect(s.players[0].bonus).toBe(3);
    expect(s.players.map(p => p.res.silver)).toEqual([7, 2]);
  });
});

describe('Silver members', () => {
  it('Guest: another player’s gift gives +1 more, named', () => {
    const s = take(sc({ members: [[], ['silver.guest']] }), 'silver.toast');
    expect(S(s, 1)).toBe(2);
    expect(named(s, 'Guest')[0]).toMatch(/P2's Guest: \+1 silver/);
  });
  it('Guest × Kickback: Gold’s gift counts, named', () => {
    const s = move(take(sc({ members: [[], ['silver.guest']] }), 'gold.jv'), 'player:1');
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
    const s = take(sc({ n: 4, members: [['silver.caterer']] }), 'silver.toast');
    expect(S(s)).toBe(3 + 1);
    expect(named(s, 'Caterer')[0]).toMatch(/P1's Caterer: \+1 silver/);
  });
  it('Caterer × Kickback: giving gold is giving too', () => {
    const s = move(take(sc({ members: [['silver.caterer']] }), 'gold.jv'), 'player:1');
    expect(S(s)).toBe(1);
    expect(named(s, 'Caterer')).toHaveLength(1);
  });

  it('Majordomo: +2 silver for taking a Silver space, named', () => {
    const s = take(sc({ members: [['silver.majordomo']] }), 'silver.toast');
    expect(S(s)).toBe(5);
    expect(named(s, 'Majordomo')).toHaveLength(1);
  });
  it('Majordomo × Straggler: moving onto a Silver space is taking it', () => {
    let s = sc({ round: 2, members: [['silver.majordomo', 'benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'to:2-0');
    expect(S(s)).toBe(6 + 2);
    expect(named(s, 'Majordomo')).toHaveLength(1);
    expect(named(s, 'Straggler')).toHaveLength(1);
  });

  // rewards not hosting (dead-window audit, 2026-10-14): it was "+1 more when an action gains you silver"
  it('Silversmith: whenever a rival takes a Silver space, +1 silver, named; not your own, not other spaces', () => {
    let s = take(sc({ members: [[], ['silver.silversmith']] }), 'silver.toast');
    expect(S(s, 1)).toBe(1 + 1); // Toast's +1 to everyone else, and Silversmith's
    expect(named(s, 'Silversmith')).toEqual(["P2's Silversmith: +1 silver."]);
    s = take(sc({ members: [['silver.silversmith']] }), 'silver.toast');
    expect(S(s)).toBe(3);
    expect(named(s, 'Silversmith')).toHaveLength(0);
    s = take(sc({ members: [[], ['silver.silversmith']] }), 'gold.rush');
    expect(S(s, 1)).toBe(0);
  });
  it('Silversmith × Grand Host: the host’s doubling doesn’t touch the rival’s +1', () => {
    const s = take(sc({ members: [['silver.grandhost'], ['silver.silversmith']] }), 'silver.toast');
    expect([S(s), S(s, 1)]).toEqual([6, 2]);
  });

  it('Steward: round start +1 per 3 silver held, named', () => {
    const s = sc({ res: [{ silver: 7 }], members: [['silver.steward']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(9);
    expect(named(s, 'Steward')).toHaveLength(1);
  });

  it('Steward counts after other round-start income: listed before Benefactor, 1 + 3 = 4 silver pays +1 (Cory hit this)', () => {
    const s = sc({ res: [{ silver: 1 }], members: [['silver.steward', 'silver.benefactor']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(5);
    expect(named(s, 'Steward')).toHaveLength(1);
  });

  it('Retinue: worth 2 followers; when recruited everyone else +1 silver, named; a rival’s Guest gets 1 more', () => {
    let s = sc({ n: 3, res: [rich], members: [[], [], ['silver.guest']], shop: ['silver.retinue'] });
    const f0 = followers(s, s.players[0]);
    s = take(s, 'gold.rush'); s = buy(s, 'silver.retinue');
    expect(followers(s, s.players[0])).toBe(f0 + 2);
    expect([S(s, 1), S(s, 2)]).toEqual([1, 2]);
    expect(named(s, 'Retinue').length).toBeGreaterThanOrEqual(1);
  });

  // Cory (2026-10-14): Feast Hall became Revelers, a group: more members, not more silver
  it('Revelers: counts as 3 members: Red’s most-members contest, Patriarch, Tithe and Heir all see 3; worth 1 follower', () => {
    let s = sc({ members: [['silver.revelers'], ['red.intern', 'red.twins']], queue: [] });
    expect(memberCount(s, s.players[0])).toBe(3);
    expect(followers(s, s.players[0])).toBe(2);
    const red = contestTable(s).find(c => c.qid === 'red');
    expect(red.rows.find(r => r.player === 0).count).toBe(3);
    expect(red.winners).toEqual([0]);
    expect(take(sc({ round: 2, members: [['silver.revelers']] }), 'gold.windfall').players[0].res.gold).toBe(3);
    s = sc({ members: [['silver.revelers', 'red.patriarch']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Patriarch +2');
    s = sc({ members: [['silver.heir', 'silver.revelers']], queue: [{ t: 'round', r: 3 }] });
    expect(S(s)).toBe(4);
  });

  // pays when recruited too (dead-window audit, 2026-10-14): recruited in round III it used to give nothing
  it('Heir: when recruited, +1 silver per member you have (itself included), named', () => {
    let s = sc({ round: 3, res: [{ silver: 8 }], members: [['red.intern', 'red.twins']], shop: ['silver.heir'], queue: [{ t: 'buy', p: 0 }] });
    s = buy(s, 'silver.heir');
    expect(S(s)).toBe(3);
    expect(named(s, 'Heir')).toEqual(["P1's Heir: +3 silver."]);
  });
  it('Heir: at round start, only round III pays, +1 silver per member, named', () => {
    let s = sc({ members: [['silver.heir', 'red.intern', 'red.twins']], queue: [{ t: 'round', r: 2 }] });
    expect(S(s)).toBe(0);
    s = sc({ members: [['silver.heir', 'red.intern', 'red.twins']], queue: [{ t: 'round', r: 3 }] });
    expect(S(s)).toBe(3);
    expect(named(s, 'Heir')).toHaveLength(1);
  });

  it('Upstart: when recruited, half the silver of the richest rival (rounded up), named', () => {
    let s = sc({ n: 3, round: 3, res: [{}, { silver: 4 }, { silver: 9 }], shop: ['silver.spoon'] });
    s = move(take(s, 'red.take'), `card:${uidOf(s, 'silver.spoon', 'shop')}`);
    expect(S(s)).toBe(5); // half of 9, rounded up
    expect(named(s, 'Upstart')).toHaveLength(1);
  });

  it('Toastmaster: +1 follower per Silver space, named; Straggler onto Silver counts', () => {
    let s = take(sc({ members: [['silver.toastmaster']] }), 'silver.alms');
    expect(s.players[0].bonus).toBe(1);
    expect(named(s, 'Toastmaster')[0]).toMatch(/P1's Toastmaster: \+1 follower/);
    s = sc({ round: 2, members: [['silver.toastmaster', 'benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'to:2-0');
    expect(s.players[0].bonus).toBe(1);
  });

  it('Debutante: once per game, double your silver and everyone else +2; named; a rival’s Guest gets 1 more', () => {
    let s = sc({ res: [{ silver: 5 }], members: [['silver.gala'], ['silver.guest']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'silver.gala', 0)}`);
    expect(S(s)).toBe(10);
    expect(S(s, 1)).toBe(3);
    expect(named(s, 'Debutante')).toHaveLength(1);
  });

  it('Grand Host: Silver spaces give twice the silver, and the log says Grand Host did it', () => {
    const s = take(sc({ members: [['silver.grandhost']] }), 'silver.toast');
    expect(S(s)).toBe(6);
    expect(S(s, 1)).toBe(1); // the spill is not doubled
    expect(named(s, 'Grand Host')).toHaveLength(1);
  });
  it('Grand Host × Doppelganger: each copy doubles again (×4)', () => {
    let s = sc({ members: [['silver.grandhost', 'echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'silver.grandhost';
    s = take(s, 'silver.toast');
    expect(S(s)).toBe(12);
  });

  it('Patron Saint: game end +1 follower per 2 silver members in play, anyone’s', () => {
    const s = sc({ members: [['silver.saint', 'silver.dowager'], ['silver.guest', 'silver.heir']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toEqual(['Patron Saint +2']);
    void resume;
  });
});
