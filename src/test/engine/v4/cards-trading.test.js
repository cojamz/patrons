// @vitest-environment node
// Card-by-card verifier, White (trading): every action and member against its printed text at the doubled
// member costs, through real legal moves, plus one cross-sphere case each. Every number a card changes must
// show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { take, move, play, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'trading', 'thieves'];
const QE = ['gold', 'red', 'trading', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'gold.midas': [4, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2],
  'red.intern': [2, 0], 'red.volunteer': [0, 0], 'red.doppel': [4, 2],
  'trading.shopkeeper': [2, 2], 'trading.dealer': [2, 2], 'trading.pawnbroker': [2, 2], 'trading.safetynet': [2, 0],
  'trading.tipster': [4, 2], 'trading.lender': [2, 0], 'trading.magnate': [4, 4], 'trading.heiress': [6, 4],
  'trading.bulkbuyer': [4, 2], 'trading.broker': [2, 2], 'trading.exporter': [4, 4], 'trading.liquidator': [4, 2],
  'trading.reinvestor': [2, 2], 'trading.raider': [2, 0],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;
const payDefault = s => (s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s);

describe('White actions', () => {
  it('Haggle: +2 white, +1 per player with more followers', () => {
    const s = take(table(Q, { n: 4, bonus: [1, 2, 3, 1], shop: ROW }), 'Haggle');
    expect(R(s).white).toBe(4);
  });
  it('× Midas: Haggle\'s white comes as gold, named', () => {
    const s = take(table(Q, { members: [['gold.midas']], shop: ROW }), 'Haggle');
    expect([R(s).white, R(s).gold]).toEqual([0, 2]);
    expect(named(s, 'Midas').length).toBe(1);
  });

  it('Buy Low: trade up to 2 per round number for followers, 1 for 1', () => {
    let s = table(Q, { res: [{ red: 5 }], shop: ROW });
    s = play(take(s, 'Buy Low'), 'color:red', 'color:red');
    expect([R(s).red, s.players[0].bonus]).toEqual([3, 2]);
    expect(s.pending.kind).toBe('buy'); // cap of 2 in round I
    s = take(table(Q, { round: 3, left: 5, res: [{ red: 9 }], shop: ROW }), 'Buy Low');
    for (let k = 0; k < 6; k++) s = move(s, 'color:red');
    expect([R(s).red, s.players[0].bonus]).toEqual([3, 6]);
  });

  it('Pawn: +2 white, sell up to 1 follower per round number for 2 white each', () => {
    let s = table(Q, { round: 2, bonus: [3], shop: ROW });
    s = take(s, 'Pawn');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:2');
    expect([R(s).white, s.players[0].bonus]).toEqual([6, 1]);
  });
  it('× Echo: copying a Pawn (it sold followers) does Pawn again for the copier', () => {
    let s = table(QE, { round: 2, bonus: [3, 2], shop: ROW, queue: turns(0, 1) });
    s = pass(move(take(s, 'Pawn'), 'amount:1'));
    s = take(s, 'Echo');
    s = move(s, s.pending.options.find(o => o.label.startsWith('Pawn')).id);
    expect(R(s, 1).white).toBe(2);
    expect(s.pending.prompt).toMatch(/Pawn: sell/);
  });

  it('Sell High: sell up to 2 followers for 3 white each; only won or bought followers', () => {
    let s = take(table(Q, { round: 2, bonus: [5], shop: ROW }), 'Sell High');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:2');
    expect([R(s).white, s.players[0].bonus]).toEqual([6, 3]);
    s = take(table(Q, { round: 2, members: [['red.twins']], shop: ROW }), 'Sell High');
    expect(s.log).toContain('P1 had no followers to sell.');
  });

  it('Cash In: +1 follower, then trade any of your white for followers 1 for 1', () => {
    let s = take(table(Q, { round: 2, res: [{ white: 4 }], shop: ROW }), 'Cash In');
    expect(s.players[0].bonus).toBe(1);
    s = move(s, 'amount:4');
    expect([R(s).white, s.players[0].bonus]).toEqual([0, 5]);
  });

  it('Boom: trade all resources for followers 1 for 1, or keep your white', () => {
    let s = take(table(Q, { round: 3, left: 5, res: [{ white: 3, red: 2, gold: 1 }], shop: ROW }), 'Boom');
    expect(ids(s)).toEqual(['boom:all', 'boom:keep', 'boom:none']);
    const all = move(s, 'boom:all');
    expect([all.players[0].bonus, R(all).white]).toEqual([6, 0]);
    const keep = move(s, 'boom:keep');
    expect([keep.players[0].bonus, R(keep).white, R(keep).red]).toEqual([3, 3, 0]);
  });
});

describe('White members', () => {
  const roundStart = opts => table(Q, { shop: ROW, queue: [{ t: 'round', r: 2 }], ...opts });
  it('Shopkeeper: at round start, +2 white (named)', () => {
    const s = roundStart({ members: [['trading.shopkeeper']] });
    expect(R(s).white).toBe(2);
    expect(named(s, 'Shopkeeper').length).toBe(1);
  });
  it('Dealer: whenever you sell followers, +1 white each (named)', () => {
    let s = take(table(Q, { round: 2, bonus: [5], members: [['trading.dealer']], shop: ROW }), 'Sell High');
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(6 + 2);
    expect(named(s, 'Dealer')).toEqual(["P1's Dealer: +2 white."]);
  });
  it('× Doppelganger copying Dealer: +1 more each', () => {
    let s = table(Q, { round: 2, bonus: [5], members: [['trading.dealer', 'red.doppel']], shop: ROW });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'trading.dealer';
    s = move(take(s, 'Sell High'), 'amount:2');
    expect(R(s).white).toBe(6 + 4);
  });
  it('Pawnbroker: once per round, sell 1 follower for 3 white (named); back next round', () => {
    let s = take(table(Q, { bonus: [2], members: [['trading.pawnbroker']], shop: ROW }), 'Haggle');
    s = move(s, `use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    expect([R(s).white, s.players[0].bonus]).toEqual([2 + 3, 1]);
    expect(named(s, 'Pawnbroker').length).toBe(1);
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    const t = roundStart({ members: [['trading.pawnbroker']] });
    expect(t.cards[uidIn(t, 'trading.pawnbroker', 0)].used).toBe(false);
  });
  it('× Reinvestor + Pawnbroker: the sale makes the next member 2 cheaper', () => {
    let s = take(table(Q, { bonus: [2], members: [['trading.pawnbroker', 'trading.reinvestor']], shop: ROW }), 'Haggle');
    s = move(s, `use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    expect(s.players[0].discount).toBe(2);
  });
  it('Safety Net: at round start, +3 white only if you have none', () => {
    const s = roundStart({ n: 2, members: [['trading.safetynet'], ['trading.shopkeeper']], res: [{}, { white: 1 }] });
    expect(R(s).white).toBe(3);
    expect(named(s, 'Safety Net').length).toBe(1);
    const t = roundStart({ members: [['trading.safetynet']], res: [{ white: 1 }] });
    expect(R(t).white).toBe(1);
  });
  it('Tipster: whenever a rival buys followers, +1 white (named)', () => {
    let s = take(table(Q, { res: [{ red: 2 }], members: [[], ['trading.tipster']], shop: ROW }), 'Haggle');
    s = payDefault(move(s, 'tier:small'));
    expect(R(s, 1).white).toBe(1);
    expect(named(s, 'Tipster').length).toBe(1);
  });
  it('Lender: when it joins you +5 white; game end lose 2 followers (never below won/bought)', () => {
    let s = take(table(Q, { res: [{ white: 2 }], shop: ['trading.lender', ...ROW] }), 'Haggle');
    s = payDefault(move(s, cardOpt(s, 'trading.lender', 'shop')));
    expect(R(s).white).toBe(4 - 2 + 5);
    expect(named(s, 'Lender').length).toBe(1);
    const f = table(Q, { members: [['trading.lender'], ['trading.lender'.replace('lender', 'magnate')]], bonus: [1], shop: ROW, queue: [{ t: 'finish' }] });
    expect(f.players[0].final.parts).toContain('Lender −1');
  });
  it('× Heist: a stolen Lender doesn\'t pay its +5 again; its debt goes with it', () => {
    let s = table(Q, { round: 3, left: 5, bonus: [2], members: [[], ['trading.lender']], shop: ROW });
    s.cards[uidIn(s, 'trading.lender', 1)].loanPaid = true;
    s = pass(move(take(s, 'Heist'), cardOpt(s, 'trading.lender', 1)));
    while (s.pending && s.pending.player === 1) s = move(s, s.pending.options[0].id);
    expect(R(s).white).toBe(0);
  });
  it('× Doppelganger copying Lender: the copy gets +5 at the end of that turn (Cory: a full copy)', () => {
    let s = table(Q, { members: [['trading.lender', 'red.twins']], shop: ['red.doppel', ...ROW], res: [{ red: 4, gold: 2 }] });
    s.cards[uidIn(s, 'trading.lender', 0)].loanPaid = true;
    s = payDefault(move(take(s, 'Haggle'), cardOpt(s, 'red.doppel', 'shop')));
    expect(R(s).white).toBe(0); // Haggle's 2 went on the Doppelganger
    s = pass(move(s, `card:${uidIn(s, 'trading.lender', 0)}`)); // the copy, then the turn ends
    expect(R(s).white).toBe(5);
    expect(named(s, 'Lender').length).toBe(1);
  });
  it('Magnate: game end +1 follower per 3 white', () => {
    const s = table(Q, { res: [{ white: 8 }], members: [['trading.magnate']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Magnate +2');
  });
  it('Heiress: once per game, +1 white per member (named)', () => {
    let s = take(table(Q, { members: [['trading.heiress', 'red.twins', 'red.bigfamily']], shop: ROW }), 'Haggle');
    s = move(s, `use:${uidIn(s, 'trading.heiress', 0)}`);
    expect(R(s).white).toBe(2 + 3);
    expect(named(s, 'Heiress').length).toBe(1);
  });
  it('Bulk Buyer: whenever you buy 3 or more followers, +1 more (not for 1)', () => {
    let s = take(table(Q, { res: [{ gold: 2, red: 2 }], members: [['trading.bulkbuyer']], shop: ROW }), 'Haggle');
    s = payDefault(move(s, 'tier:mid'));
    expect(s.players[0].bonus).toBe(4);
    expect(named(s, 'Bulk Buyer').length).toBe(1);
    s = payDefault(move(take(table(Q, { res: [{ red: 2 }], members: [['trading.bulkbuyer']], shop: ROW }), 'Haggle'), 'tier:small'));
    expect(s.players[0].bonus).toBe(1);
  });
  it('Broker: whenever a White action gives you followers, +1 more (Cash In)', () => {
    let s = take(table(Q, { round: 2, members: [['trading.broker']], shop: ROW }), 'Cash In');
    expect(s.players[0].bonus).toBe(2);
    expect(named(s, 'Broker').length).toBe(1);
  });
  it('× Broker on Buy Low: today +1 per traded resource, not +1 per action (see the ledger question)', () => {
    let s = table(Q, { res: [{ red: 5 }], members: [['trading.broker']], shop: ROW });
    s = play(take(s, 'Buy Low'), 'color:red', 'color:red');
    expect(s.players[0].bonus).toBe(4);
  });
  it('Exporter: whenever you recruit a non-white member, +1 white (not for white)', () => {
    let s = take(table(Q, { res: [{ red: 4 }], members: [['trading.exporter']], shop: ['trading.lender', ...ROW] }), 'Tip-off');
    s = payDefault(move(s, cardOpt(s, 'red.twins', 'shop')));
    expect(R(s).white).toBe(1);
    expect(named(s, 'Exporter').length).toBe(1);
  });
  it('Liquidator: once per game, sell up to 5 followers for 2 white each (named)', () => {
    let s = take(table(Q, { bonus: [7], members: [['trading.liquidator']], shop: ROW }), 'Tip-off');
    s = move(s, `use:${uidIn(s, 'trading.liquidator', 0)}`);
    expect([R(s).white, s.players[0].bonus]).toEqual([10, 2]);
    expect(named(s, 'Liquidator').length).toBe(1);
  });
  it('Reinvestor: whenever you sell, next member costs 2 less per follower sold, at the doubled costs (named)', () => {
    let s = take(table(Q, { round: 2, bonus: [2], res: [{ gold: 6 }], members: [['trading.reinvestor']], shop: ROW }), 'Sell High');
    s = move(s, 'amount:2');
    expect(s.players[0].discount).toBe(4);
    expect(named(s, 'Reinvestor').length).toBe(1);
    // Tycoon (8 gold + 4) with 4 off: 4 gold + 4 any
    s = payDefault(move(s, cardOpt(s, 'gold.tycoon', 'shop')));
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    expect(R(s).gold + R(s).white).toBe(6 + 6 - 8);
  });
  it('Raider: once per game, buy up to 3 followers from the leader for 1 white each; they get the white', () => {
    let s = take(table(Q, { n: 3, res: [{ white: 5 }], bonus: [0, 4, 2], members: [['trading.raider']], shop: ROW }), 'Tip-off');
    s = move(s, `use:${uidIn(s, 'trading.raider', 0)}`);
    expect([R(s).white, R(s, 1).white, s.players[0].bonus, s.players[1].bonus]).toEqual([2, 3, 3, 1]);
    expect(named(s, 'Raider').length).toBe(1);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 3);
  });
});
