// @vitest-environment node
// Card-by-card verifier, White (trading): every action and member against its printed text at the doubled
// member costs, through real legal moves, plus one cross-sphere case each. Every number a card changes must
// show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { term } from '../../../v4/glossary.js';
import { take, move, play, ids, actionName } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'trading', 'thieves'];
const QE = ['gold', 'red', 'trading', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'gold.midas': [4, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2],
  'red.intern': [2, 0], 'red.volunteer': [0, 0], 'echo.doppel': [4, 2],
  'trading.shopkeeper': [2, 2], 'trading.dealer': [2, 0], 'trading.pawnbroker': [2, 2], 'trading.safetynet': [2, 0],
  'trading.tipster': [4, 2], 'trading.lender': [2, 0], 'trading.magnate': [4, 4], 'trading.heiress': [6, 4],
  'trading.bulkbuyer': [4, 2], 'trading.broker': [2, 0], 'trading.exporter': [4, 4], 'trading.liquidator': [4, 2],
  'trading.reinvestor': [2, 2], 'trading.raider': [2, 0],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;
const payDefault = s => (s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s);

describe('White actions', () => {
  it('Sob Story: +2 white, +1 per player with more followers', () => {
    const s = take(table(Q, { n: 4, bonus: [1, 2, 3, 1], shop: ROW }), 'trading.haggle');
    expect(R(s).white).toBe(4);
  });
  it('× Midas: Sob Story\'s white comes as gold, named', () => {
    const s = take(table(Q, { members: [['gold.midas']], shop: ROW }), 'trading.haggle');
    expect([R(s).white, R(s).gold]).toEqual([0, 2]);
    expect(named(s, 'Midas').length).toBe(1);
  });

  it('Cheap Seats: +1 follower per 3 white you hold (white kept), named', () => {
    const s = take(table(Q, { res: [{ white: 9 }], shop: ROW }), 'trading.buylow');
    expect([R(s).white, s.players[0].bonus]).toEqual([9, 3]);
    expect(named(s, 'Cheap Seats').length).toBe(1);
  });

  it('Your Call: per round number, +1 follower or +2 white (named)', () => {
    let s = table(Q, { round: 2, bonus: [3], shop: ROW });
    s = take(s, 'trading.pawn');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:1');
    expect([R(s).white, s.players[0].bonus]).toEqual([2, 4]);
    expect(named(s, 'Your Call')).toEqual(["P1's Your Call: +1 follower, +2 white."]);
  });
  it('Your Call in round I with nothing bought or won still pays: 1 follower or 2 white (Cory\'s play: the old sale was dead)', () => {
    const s = take(table(Q, { members: [['red.twins']], shop: ROW }), 'trading.pawn');
    expect(ids(s)).toEqual(['amount:0', 'amount:1']);
    const f = move(s, 'amount:0');
    expect([R(f).white, f.players[0].bonus]).toEqual([0, 1]);
    const w = move(s, 'amount:1');
    expect([R(w).white, w.players[0].bonus]).toEqual([2, 0]);
  });
  it('× Echo: a Your Call taken as white is copied as that white; taken as followers, there is nothing to copy', () => {
    let s = table(QE, { round: 2, bonus: [3, 2], shop: ROW, queue: turns(0, 1) });
    s = pass(move(take(s, 'trading.pawn'), 'amount:1'));
    s = take(s, 'echo.echo');
    const copy = s.pending.options.find(o => o.label.startsWith(actionName('trading.pawn')));
    expect(copy.label).toBe('Your Call (P1): +2 white');
    s = move(s, copy.id);
    expect(R(s, 1).white).toBe(2);
    let t = table(QE, { round: 2, shop: ROW, queue: turns(0, 1) });
    t = pass(move(take(t, 'trading.pawn'), 'amount:0'));
    t = take(t, 'echo.echo');
    expect((t.pending?.options || []).some(o => o.label.startsWith(actionName('trading.pawn')))).toBe(false);
  });

  // one name for one thing (blind testers, 2026-10-15): "loose followers" on the cards and "bought or won" on the faces
  // read as two things; the cards now say "followers you bought or won", as the faces do (the glossary keeps the old word)
  it('"followers you bought or won", one name: Dividend, Sell High, Pawnbroker and Liquidator say it', () => {
    expect(term('loose followers').def).toMatch(/^Followers you bought or won, not the ones your members are worth/);
    const W = quadrant('trading'), text = k => [...W.actions, ...W.members].find(c => c.key === k).text;
    expect(text('dividend')).toBe('+1 white per follower you bought or won.');
    expect(text('sellhigh')).toBe('Sell up to 2 followers you bought or won, for 3 white each.');
    expect(text('pawnbroker')).toBe('Once per round: sell 1 follower you bought or won, for 3 white.');
    expect(text('liquidator')).toBe('Once per game: sell up to 5 followers you bought or won, for 2 white each.');
  });
  it('Sell High: sell up to 2 followers for 3 white each; only won or bought followers', () => {
    let s = take(table(Q, { round: 2, bonus: [5], shop: ROW }), 'trading.sellhigh');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = move(s, 'amount:2');
    expect([R(s).white, s.players[0].bonus]).toEqual([6, 3]);
    s = take(table(Q, { round: 2, members: [['red.twins']], shop: ROW }), 'trading.sellhigh');
    expect(s.log).toContain('Sell High: P1 has no followers to sell (only followers you bought or won can be sold).');
  });

  // Cory cut Barter (2026-10-14: "I don't like that"); Dividend fills its ring-II slot (Claude, go-with-your-gut)
  it('Barter is gone; Dividend: +1 white per follower you bought or won (named); members and yourself don\'t count, nothing is sold', () => {
    expect(quadrant('trading').actions.map(a => a.key)).not.toContain('barter');
    expect(quadrant('trading').actions.find(a => a.key === 'dividend').ring).toBe(2);
    let s = take(table(Q, { round: 2, bonus: [4], members: [['red.twins', 'trading.dealer']], shop: ROW }), 'trading.dividend');
    expect([R(s).white, s.players[0].bonus]).toEqual([4, 4]);
    expect(named(s, 'Dividend')).toEqual(["P1's Dividend: +4 white (4 followers bought or won)."]);
    expect(named(s, 'Dealer')).toEqual([]); // not a sale
    expect(s.pending.kind).toBe('buy');
    s = take(table(Q, { round: 2, members: [['red.twins']], shop: ROW }), 'trading.dividend');
    expect(R(s).white).toBe(0);
    expect(s.log).toContain("P1's Dividend: no followers bought or won yet.");
  });
  it('× Echo: a Dividend is copied as the white it gave (the chip), whatever the copier holds', () => {
    const N = (q, k) => quadrant(q).actions.find(a => a.key === k).name; // by key: space names get renamed
    let s = table(QE, { round: 2, bonus: [3, 0], shop: ROW, queue: turns(0, 1) });
    s = pass(take(s, N('trading', 'dividend')));
    s = take(s, N('echo', 'echo'));
    const copy = s.pending.options.find(o => o.label.startsWith(N('trading', 'dividend')));
    expect(copy.label).toBe(`${N('trading', 'dividend')} (P1): +3 white`);
    s = move(s, copy.id);
    expect(R(s, 1).white).toBe(3);
  });

  it('All In: trade all resources for followers 1 for 1, or keep your white', () => {
    let s = take(table(Q, { round: 3, left: 5, res: [{ white: 3, red: 2, gold: 1 }], shop: ROW }), 'trading.boom');
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
    let s = take(table(Q, { round: 2, bonus: [5], members: [['trading.dealer']], shop: ROW }), 'trading.sellhigh');
    s = move(s, 'amount:2');
    expect(R(s).white).toBe(6 + 2);
    expect(named(s, 'Dealer')).toEqual(["P1's Dealer: +2 white."]);
  });
  it('× Doppelganger copying Dealer: +1 more each', () => {
    let s = table(Q, { round: 2, bonus: [5], members: [['trading.dealer', 'echo.doppel']], shop: ROW });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'trading.dealer';
    s = move(take(s, 'trading.sellhigh'), 'amount:2');
    expect(R(s).white).toBe(6 + 4);
  });
  it('Pawnbroker: once per round, sell 1 follower for 3 white (named); back next round', () => {
    let s = take(table(Q, { bonus: [2], members: [['trading.pawnbroker']], shop: ROW }), 'trading.haggle');
    s = move(s, `use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    expect([R(s).white, s.players[0].bonus]).toEqual([2 + 3, 1]);
    expect(named(s, 'Pawnbroker').length).toBe(1);
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    const t = roundStart({ members: [['trading.pawnbroker']] });
    expect(t.cards[uidIn(t, 'trading.pawnbroker', 0)].used).toBe(false);
  });
  it('× Reinvestor + Pawnbroker: the sale makes the next member 2 cheaper', () => {
    let s = take(table(Q, { bonus: [2], members: [['trading.pawnbroker', 'trading.reinvestor']], shop: ROW }), 'trading.haggle');
    s = move(s, `use:${uidIn(s, 'trading.pawnbroker', 0)}`);
    expect(s.players[0].discount).toBe(2);
  });
  it('Rich Uncle: at round start, +3 white only if you have none', () => {
    const s = roundStart({ n: 2, members: [['trading.safetynet'], ['trading.shopkeeper']], res: [{}, { white: 1 }] });
    expect(R(s).white).toBe(3);
    expect(named(s, 'Rich Uncle').length).toBe(1);
    const t = roundStart({ members: [['trading.safetynet']], res: [{ white: 1 }] });
    expect(R(t).white).toBe(1);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III it used to give nothing
  it('Rich Uncle recruited with no white left: +3 white right away (named)', () => {
    let s = table(Q, { round: 3, res: [{ white: 2 }], shop: ['trading.safetynet', ...ROW], queue: [{ t: 'buy', p: 0 }] });
    s = payDefault(move(s, cardOpt(s, 'trading.safetynet', 'shop')));
    expect(R(s).white).toBe(3);
    expect(named(s, 'Rich Uncle').length).toBe(1);
  });
  it('Tipster: whenever a rival buys followers, +1 white (named)', () => {
    let s = take(table(Q, { res: [{ red: 2 }], members: [[], ['trading.tipster']], shop: ROW }), 'trading.haggle');
    s = payDefault(move(s, 'tier:small'));
    expect(R(s, 1).white).toBe(1);
    expect(named(s, 'Tipster').length).toBe(1);
  });
  it('Lender: when it joins you +5 white; game end lose 2 followers (never below won/bought)', () => {
    let s = take(table(Q, { res: [{ white: 2 }], shop: ['trading.lender', ...ROW] }), 'trading.haggle');
    s = payDefault(move(s, cardOpt(s, 'trading.lender', 'shop')));
    expect(R(s).white).toBe(4 - 2 + 5);
    expect(named(s, 'Lender').length).toBe(1);
    const f = table(Q, { members: [['trading.lender'], ['trading.lender'.replace('lender', 'magnate')]], bonus: [1], shop: ROW, queue: [{ t: 'finish' }] });
    expect(f.players[0].final.parts).toContain('Lender −1');
  });
  it('× Poach: a stolen Lender doesn\'t pay its +5 again; its debt goes with it', () => {
    let s = table(Q, { round: 3, left: 5, bonus: [2], members: [[], ['trading.lender']], shop: ROW });
    s.cards[uidIn(s, 'trading.lender', 1)].loanPaid = true;
    s = pass(move(take(s, 'thieves.heist'), cardOpt(s, 'trading.lender', 1)));
    while (s.pending && s.pending.player === 1) s = move(s, s.pending.options[0].id);
    expect(R(s).white).toBe(0);
  });
  it('× Doppelganger copying Lender: the copy gets +5 at once (Cory: a full copy; its when-recruited fires)', () => {
    let s = table(Q, { members: [['trading.lender', 'red.twins']], shop: ['echo.doppel', ...ROW], res: [{ red: 4, gold: 2 }] });
    s.cards[uidIn(s, 'trading.lender', 0)].loanPaid = true;
    s = payDefault(move(take(s, 'trading.haggle'), cardOpt(s, 'echo.doppel', 'shop')));
    // whatever the suggested payment left (it keeps your rim leads, 2026-10-15), the copy adds exactly Lender's 5
    const w0 = R(s).white;
    s = move(s, `card:${uidIn(s, 'trading.lender', 0)}`); // the copy
    expect(R(s).white).toBe(w0 + 5);
    s = pass(s); // the turn ends: no second payout
    expect(R(s).white).toBe(w0 + 5);
    expect(named(s, 'Lender').length).toBe(1);
  });
  it('Magnate: game end +1 follower per 3 white', () => {
    const s = table(Q, { res: [{ white: 8 }], members: [['trading.magnate']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Magnate +2');
  });
  it('Heiress: once per game, +1 white per member (named)', () => {
    let s = take(table(Q, { members: [['trading.heiress', 'red.twins', 'red.bigfamily']], shop: ROW }), 'trading.haggle');
    s = move(s, `use:${uidIn(s, 'trading.heiress', 0)}`);
    expect(R(s).white).toBe(2 + 3);
    expect(named(s, 'Heiress').length).toBe(1);
  });
  it('Bulk Buyer: whenever you buy 3 or more followers, +1 more (not for the 1-for-1 buy)', () => {
    let s = take(table(Q, { res: [{ gold: 2, red: 2 }], members: [['trading.bulkbuyer']], shop: ROW }), 'trading.haggle');
    s = payDefault(move(s, 'tier:mid'));
    expect(s.players[0].bonus).toBe(6);
    expect(named(s, 'Bulk Buyer').length).toBe(1);
    s = payDefault(move(take(table(Q, { res: [{ red: 2 }], members: [['trading.bulkbuyer']], shop: ROW }), 'trading.haggle'), 'tier:small'));
    expect(s.players[0].bonus).toBe(1);
  });
  it('Broker: whenever a White action gives you followers, +1 more (Your Call)', () => {
    let s = move(take(table(Q, { round: 2, members: [['trading.broker']], shop: ROW }), 'trading.pawn'), 'amount:0');
    expect(s.players[0].bonus).toBe(3);
    expect(named(s, 'Broker').length).toBe(1);
  });
  it('× Broker on Cheap Seats: +1 once per action, not per traded resource (ledger question 6, gut call)', () => {
    const s = take(table(Q, { res: [{ white: 6 }], members: [['trading.broker']], shop: ROW }), 'trading.buylow');
    expect(s.players[0].bonus).toBe(3);
    expect(named(s, 'Broker').length).toBe(1);
  });
  it('Exporter: whenever you recruit a non-white member, +1 white (not for white)', () => {
    let s = take(table(Q, { res: [{ red: 4 }], members: [['trading.exporter']], shop: ['trading.lender', ...ROW] }), 'thieves.tipoff');
    s = payDefault(move(s, cardOpt(s, 'red.twins', 'shop')));
    expect(R(s).white).toBe(1);
    expect(named(s, 'Exporter').length).toBe(1);
  });
  it('Liquidator: once per game, sell up to 5 followers for 2 white each (named)', () => {
    let s = take(table(Q, { bonus: [7], members: [['trading.liquidator']], shop: ROW }), 'thieves.tipoff');
    s = move(s, `use:${uidIn(s, 'trading.liquidator', 0)}`);
    expect([R(s).white, s.players[0].bonus]).toEqual([10, 2]);
    expect(named(s, 'Liquidator').length).toBe(1);
  });
  it('Reinvestor: whenever you sell, next member costs 2 less per follower sold, at the doubled costs (named)', () => {
    let s = take(table(Q, { round: 2, bonus: [2], res: [{ gold: 6 }], members: [['trading.reinvestor']], shop: ROW }), 'trading.sellhigh');
    s = move(s, 'amount:2');
    expect(s.players[0].discount).toBe(4);
    expect(named(s, 'Reinvestor').length).toBe(1);
    // Tycoon (8 gold + 4) with 4 off: 4 gold + 4 any
    s = payDefault(move(s, cardOpt(s, 'gold.tycoon', 'shop')));
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    expect(R(s).gold + R(s).white).toBe(6 + 6 - 8);
  });
  it('Raider: once per game, buy up to 3 followers from the leader for 1 white each; they get the white', () => {
    let s = take(table(Q, { n: 3, res: [{ white: 5 }], bonus: [0, 4, 2], members: [['trading.raider']], shop: ROW }), 'thieves.tipoff');
    s = move(s, `use:${uidIn(s, 'trading.raider', 0)}`);
    s = move(s, 'amount:3');
    expect([R(s).white, R(s, 1).white, s.players[0].bonus, s.players[1].bonus]).toEqual([2, 3, 3, 1]);
    expect(named(s, 'Raider').length).toBe(1);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 3);
  });
});
