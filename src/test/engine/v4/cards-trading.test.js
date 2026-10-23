// @vitest-environment node
// Card-by-card verifier, White (trading): every action and member against its printed text at the doubled
// member costs, through real legal moves, plus cross-sphere cases. Every number a card changes must
// show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'trading', 'thieves'];
const QE = ['gold', 'red', 'trading', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.midas': [4, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0],
  'echo.doppel': [4, 2],
  'trading.shopkeeper': [2, 2], 'trading.heiress': [4, 4], 'trading.bulkbuyer': [2, 2], 'trading.broker': [2, 0],
  'trading.exporter': [2, 2], 'trading.raider': [4, 2], 'trading.cashier': [2, 2], 'trading.undertaker': [2, 2],
  'trading.appraiser': [2, 2], 'trading.changer': [2, 2], 'trading.martyr': [2, 2], 'trading.hoarder': [4, 4],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern'];
const R = (s, i = 0) => s.players[i].res;
const B = (s, i = 0) => s.players[i].bonus;
const buy = { queue: [{ t: 'buy', p: 0 }] };
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;
const use = (s, def) => move(s, `use:${uidIn(s, def, 0)}`);
const W = quadrant('trading');
const text = k => [...W.actions, ...W.members].find(c => c.key === k).text;

describe('White: the printed cards', () => {
  it('six actions on their rings, with their text', () => {
    expect(W.actions.map(a => [a.key, a.ring])).toEqual([
      ['stipend', 1], ['splurge', 1], ['exchange', 1], ['farewell', 2], ['estatesale', 2], ['cashin', 3],
    ]);
    expect(text('splurge')).toBe('This turn, +1 follower for every 2 resources you spend on your recruit. +1 white.');
    expect(text('farewell')).toBe('Send one of your members to the bottom of the pile, gain followers equal to its cost. +1 white.');
    expect(text('estatesale')).toBe('Send one of your members to the bottom of the pile, gain white equal to its cost. +1 white.');
    expect(text('cashin')).toBe('Turn all your white into followers. +1 white.');
    expect(W.scoring.label).toBe('Most white');
  });
});

describe('White actions', () => {
  it('Allowance: round II pays +2 followers and +3 white (named)', () => {
    const s = take(table(Q, { round: 2, shop: ROW }), 'trading.stipend');
    expect([B(s), R(s).white]).toEqual([2, 3]);
    expect(named(s, 'Allowance')).toEqual(["P1's Allowance: +2 followers, +3 white."]);
  });

  it('Splurge: a 12-cost Tycoon pays +6 followers, named; Broker adds 1 in the same line', () => {
    let s = take(table(Q, { res: [{ gold: 12 }], shop: ROW }), 'trading.splurge');
    s = move(s, cardOpt(s, 'gold.tycoon', 'shop'));
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    expect(B(s)).toBe(6);
    expect(named(s, 'Splurge')).toContain("P1's Splurge: +6 followers for spending.");
    let b = take(table(Q, { res: [{ gold: 12 }], members: [['trading.broker']], shop: ROW }), 'trading.splurge');
    b = move(b, cardOpt(b, 'gold.tycoon', 'shop'));
    expect(B(b)).toBe(7);
    expect(named(b, 'Splurge')).toContain("P1's Splurge: +6 followers for spending. Broker: +1.");
  });

  it('Exchange: round III, three resources into 6 followers, each trade named', () => {
    let s = take(table(Q, { round: 3, left: 5, res: [{ red: 2, gold: 1 }], shop: ROW }), 'trading.exchange');
    s = move(move(move(s, 'color:red'), 'color:gold'), 'color:white');
    expect([B(s), R(s).red, R(s).gold, R(s).white]).toEqual([6, 1, 0, 0]);
    expect(named(s, 'Exchange').filter(l => l.includes('became 2 followers'))).toHaveLength(3);
  });

  it('Farewell: Big Family (4+4) pays 8 followers, named; it goes to the bottom of the pile', () => {
    let s = take(table(Q, { round: 2, members: [['red.bigfamily']], shop: ROW }), 'trading.farewell');
    const u = uidIn(s, 'red.bigfamily', 0);
    s = move(s, `card:${u}`);
    expect([B(s), R(s).white]).toEqual([8, 1]);
    expect(s.pile.at(-1)).toBe(u);
    expect(named(s, 'Farewell')).toContain("P1's Farewell: Big Family paid 8 followers.");
  });

  it('Estate Sale: Tycoon (8+4) pays 12 white, named', () => {
    let s = take(table(Q, { round: 2, members: [['gold.tycoon']], shop: ROW }), 'trading.estatesale');
    s = move(s, cardOpt(s, 'gold.tycoon', 0));
    expect([R(s).white, B(s), owns(s, 0, 'gold.tycoon')]).toEqual([13, 0, false]);
    expect(named(s, 'Estate Sale')).toContain("P1's Estate Sale: Tycoon paid 12 white.");
  });

  it('Cash In: 7 white become 7 followers, then +1 white (named)', () => {
    const s = take(table(Q, { round: 3, left: 5, res: [{ white: 7 }], shop: ROW }), 'trading.cashin');
    expect([B(s), R(s).white]).toEqual([7, 1]);
    expect(named(s, 'Cash In')).toEqual(["P1's Cash In: 7 white became 7 followers."]);
  });
});

describe('White members', () => {
  it('Shopkeeper: +2 white now and at round start (named)', () => {
    let s = table(Q, { res: [{ white: 4 }], shop: ['trading.shopkeeper', ...ROW], ...buy });
    s = move(s, cardOpt(s, 'trading.shopkeeper', 'shop'));
    expect(R(s).white).toBe(2);
    const t = table(Q, { members: [['trading.shopkeeper']], shop: ROW, queue: [{ t: 'round', r: 2 }] });
    expect(R(t).white).toBe(2);
    expect(named(t, 'Shopkeeper').length).toBe(1);
  });

  it('Heiress: once per game, +1 white per member (named)', () => {
    const s = use(table(Q, { members: [['trading.heiress', 'red.twins', 'red.bigfamily']], shop: ROW, ...buy }), 'trading.heiress');
    expect(R(s).white).toBe(2 + 2 + 3);
    expect(named(s, 'Heiress')).toEqual(['P1 used Heiress: +7 white.']);
  });

  it('Bulk Buyer: buying 5 followers gives 6 (named); buying 1 gives 1', () => {
    let s = move(table(Q, { res: [{ red: 5 }], members: [['trading.bulkbuyer']], shop: ROW, ...buy }), 'tier:mid');
    expect(B(s)).toBe(6);
    expect(named(s, 'Bulk Buyer')).toEqual(["P1's Bulk Buyer: +1 follower."]);
    s = move(table(Q, { res: [{ red: 1 }], members: [['trading.bulkbuyer']], shop: ROW, ...buy }), 'tier:small');
    expect(B(s)).toBe(1);
  });

  it('Broker: +1 on Farewell (named)', () => {
    let s = take(table(Q, { round: 2, members: [['trading.broker', 'red.twins']], shop: ROW }), 'trading.farewell');
    s = move(s, cardOpt(s, 'red.twins', 0));
    expect(B(s)).toBe(4 + 1);
    expect(named(s, 'Broker')).toEqual(["P1's Broker: +1 follower."]);
  });
  it('× Doppelganger copying Broker: two Brokers, +2 on Allowance', () => {
    let s = table(QE, { members: [['trading.broker', 'echo.doppel']], shop: ROW });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'trading.broker';
    s = take(s, 'trading.stipend');
    expect(B(s)).toBe(1 + 2);
  });

  it('Exporter: recruiting a non-white member +1 white (named); a white one, nothing', () => {
    let s = table(Q, { res: [{ red: 2 }], members: [['trading.exporter']], shop: ROW, ...buy });
    s = move(s, cardOpt(s, 'red.intern', 'shop'));
    expect(R(s).white).toBe(1);
    expect(named(s, 'Exporter').length).toBe(1);
    s = table(Q, { res: [{ white: 2 }], members: [['trading.exporter']], shop: ['trading.broker', ...ROW], ...buy });
    s = move(s, cardOpt(s, 'trading.broker', 'shop'));
    expect(R(s).white).toBe(0);
  });

  it('Raider: steals 4 from the leader\'s bought or won followers and pays them 2 white (named)', () => {
    const s = use(table(Q, { n: 3, res: [{ white: 2 }], bonus: [0, 5, 2], members: [['trading.raider']], shop: ROW, ...buy }), 'trading.raider');
    expect([B(s, 0), B(s, 1), R(s, 0).white, R(s, 1).white]).toEqual([4, 1, 0, 2]);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 4);
    expect(named(s, 'Raider')).toEqual(["P1's Raider stole 4 followers from P2 and paid 2 white."]);
  });

  it('Cashier: when recruited, all your white becomes followers (named)', () => {
    let s = table(Q, { res: [{ white: 9 }], shop: ['trading.cashier', ...ROW], ...buy });
    s = move(s, cardOpt(s, 'trading.cashier', 'shop'));
    expect([R(s).white, B(s)]).toEqual([0, 5]);
    expect(named(s, 'Cashier')).toEqual(["P1's Cashier: 5 white became 5 followers."]);
  });

  it('Undertaker + Appraiser: get rid of Tycoon for 12 white, +2 followers (both named)', () => {
    let s = use(table(Q, { members: [['trading.appraiser', 'trading.undertaker', 'gold.tycoon']], shop: ROW, ...buy }), 'trading.appraiser');
    expect(ids(s)).toEqual([cardOpt(s, 'trading.undertaker', 0), cardOpt(s, 'gold.tycoon', 0)]);
    s = move(move(s, cardOpt(s, 'gold.tycoon', 0)), 'pick:white');
    expect([R(s).white, B(s), owns(s, 0, 'gold.tycoon')]).toEqual([12, 2, false]);
    expect(named(s, 'Appraiser')).toEqual(["P1's Appraiser: Tycoon paid 12 white."]);
    expect(named(s, 'Undertaker')).toEqual(["P1's Undertaker: +2 followers."]);
  });

  it('Money Changer: Cash In turns white into followers, +1 white (named)', () => {
    const s = take(table(Q, { round: 3, left: 5, res: [{ white: 3 }], members: [['trading.changer']], shop: ROW }), 'trading.cashin');
    expect([B(s), R(s).white]).toEqual([3, 2]);
    expect(named(s, 'Money Changer')).toEqual(["P1's Money Changer: +1 white."]);
  });
  it('× Doppelganger copying Money Changer: +1 white each', () => {
    let s = table(QE, { round: 3, left: 5, res: [{ white: 3 }], members: [['trading.changer', 'echo.doppel']], shop: ROW });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'trading.changer';
    s = take(s, 'trading.cashin');
    expect(R(s).white).toBe(1 + 2);
  });

  it('Martyr: sent away with Farewell, 4 + 4 followers (named)', () => {
    let s = take(table(Q, { round: 2, members: [['trading.martyr']], shop: ROW }), 'trading.farewell');
    s = move(s, cardOpt(s, 'trading.martyr', 0));
    expect(B(s)).toBe(8);
    expect(named(s, 'Martyr')).toEqual(["P1's Martyr left: +4 followers."]);
  });
  it('× Poach: a stolen Martyr pays its old owner 4 followers', () => {
    let s = table(Q, { round: 3, left: 5, members: [[], ['trading.martyr']], shop: ROW });
    const u = uidIn(s, 'trading.martyr', 1);
    s = move(take(s, 'thieves.heist'), `card:${u}`);
    expect(s.players[0].members).toContain(u);
    expect(B(s, 1)).toBe(4);
    expect(named(s, 'Martyr')).toEqual(["P2's Martyr left: +4 followers."]);
  });

  it('Hoarder: once per game, every resource becomes white (named)', () => {
    const s = use(table(Q, { res: [{ gold: 3, red: 2, white: 1, magenta: 1 }], members: [['trading.hoarder']], shop: ROW, ...buy }), 'trading.hoarder');
    expect(R(s).white).toBe(7);
    expect(Object.entries(R(s)).filter(([r, n]) => r !== 'white' && n).length).toBe(0);
    expect(named(s, 'Hoarder')).toEqual(["P1's Hoarder: 6 resources became white."]);
  });
});
