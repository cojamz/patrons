// @vitest-environment node
// Card-by-card verifier, Magenta (thieves): every action and member against its printed text at the doubled
// member costs, through real legal moves, plus one cross-sphere case each. Every number a card changes must
// show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { take, move, play, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'thieves', 'market'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0],
  'red.volunteer': [0, 0], 'red.doppel': [4, 2], 'red.mentor': [6, 4],
  'thieves.cutpurse': [2, 2], 'thieves.mole': [2, 2], 'thieves.accomplice': [4, 4], 'thieves.grifter': [4, 2],
  'thieves.sticky': [4, 4], 'thieves.desperado': [2, 2], 'thieves.robinhood': [2, 2], 'thieves.lookout': [4, 2],
  'thieves.lightfingers': [4, 4], 'thieves.extortionist': [4, 2], 'thieves.watchdog': [4, 2], 'thieves.crew': [2, 2],
  'thieves.doubleagent': [4, 2], 'thieves.bigscore': [2, 2], 'thieves.kingpin': [2, 0],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const sum = r => Object.values(r).reduce((a, b) => a + b, 0);
const cardOpt = (s, def, who) => `card:${uidIn(s, def, who)}`;

describe('Magenta actions', () => {
  it('Help Yourself: take 2 / 3 / 4 (by round) from rivals, split as you like; stolen goods turn magenta', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 3 }, { red: 3 }], shop: ROW });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:2:red');
    expect([R(s).magenta, R(s, 1).gold, R(s, 2).red]).toEqual([2, 2, 2]);
    expect(s.log).toContain('P1 stole 2 (1 from P2, 1 from P3).');
    s = table(Q, { round: 3, left: 5, res: [{}, { gold: 9 }], shop: ROW });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold', 'take:1:gold', 'take:1:gold');
    expect(R(s).magenta).toBe(4);
  });
  it('× Sticky Fingers +1 and Desperado double: round I Help Yourself takes (2+1)×2 = 6', () => {
    let s = table(Q, { res: [{}, { gold: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 3], shop: ROW });
    s = take(s, 'Help Yourself');
    for (let k = 0; k < 6; k++) s = move(s, 'take:1:gold');
    expect(R(s).magenta).toBe(6);
    expect(R(s, 1).gold).toBe(3);
    expect(named(s, 'Sticky Fingers').length).toBe(1);
    expect(named(s, 'Desperado').length).toBe(1);
  });
  it('× Sticky Fingers and Desperado on Gold\'s Collect Debts: (3+1)×2 = 8, and the log names both', () => {
    let s = table(Q, { round: 2, left: 4, res: [{}, { gold: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 3], shop: ROW });
    s = take(s, 'Collect Debts');
    for (let k = 0; k < 8; k++) s = move(s, 'player:1');
    expect(R(s).gold).toBe(8);
    expect(R(s, 1).gold).toBe(1);
    expect(named(s, 'Sticky Fingers').length).toBe(1);
    expect(named(s, 'Desperado').length).toBe(1);
  });

  it('Redistribute: take 1 from each player holding more than you', () => {
    let s = table(Q, { n: 4, res: [{ red: 2 }, { gold: 3 }, { red: 1 }, { gold: 1, red: 2 }], shop: ROW });
    s = play(take(s, 'Redistribute'), 'take:1:gold', 'take:3:red');
    expect([R(s).magenta, R(s, 1).gold, R(s, 2).red, R(s, 3).red]).toEqual([2, 2, 1, 1]);
  });
  it('× Lie Low: a richer player in the Lie Low can\'t be tipped off', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 3 }, { red: 3 }], shop: ROW, queue: turns(1, 0) });
    s = pass(play(take(s, 'Lie Low'), 'take:2:red'));
    s = take(s, 'Redistribute');
    expect(ids(s).every(id => id.startsWith('take:2:'))).toBe(true);
  });

  it('Lie Low: take 1 from a rival; then no one can steal resources from you this round', () => {
    let s = table(Q, { res: [{ gold: 4 }, { red: 1 }], shop: ROW, queue: turns(0, 1) });
    s = pass(play(take(s, 'Lie Low'), 'take:1:red'));
    expect(R(s).magenta).toBe(1);
    s = take(s, 'Help Yourself');
    expect(s.pending?.kind).toBe('buy'); // nothing to take
    expect(R(s).gold).toBe(4);
    expect(s.log).toContain('P2 found nothing to steal.');
  });
  it('Lie Low (Cory\'s ruling): your members can still be taken, by Poach, Shake Down and Swap Sides', () => {
    const base = { round: 3, left: 5, res: [{ gold: 4 }, { red: 1 }], members: [['red.twins'], ['red.intern']], shop: ROW, queue: turns(0, 1) };
    // Poach
    let s = pass(play(take(table(Q, base), 'Lie Low'), 'take:1:red'));
    s = take(s, 'Poach');
    expect(ids(s)).toContain(cardOpt(s, 'red.twins', 0));
    s = move(s, cardOpt(s, 'red.twins', 0));
    expect(owns(s, 1, 'red.twins')).toBe(true);
    // Shake Down (the payment still goes through: it's the holder's choice to pay)
    s = pass(play(take(table(Q, { ...base, round: 2 }), 'Lie Low'), 'take:1:red'));
    s = take(s, 'Shake Down');
    s = move(move(s, cardOpt(s, 'red.twins', 0)), 'pay');
    expect(owns(s, 0, 'red.twins')).toBe(true);
    expect([R(s).gold, R(s, 1).magenta]).toEqual([0, 4]);
    // Red's Swap Sides
    s = pass(play(take(table(Q, { ...base, round: 2 }), 'Lie Low'), 'take:1:red'));
    s = take(s, 'Swap Sides');
    expect(ids(s).some(id => id.endsWith(`:${uidIn(s, 'red.twins', 0)}`))).toBe(true);
  });

  it('Crime Wave: take 3 from rivals, at least 1 from each', () => {
    let s = table(Q, { n: 3, round: 2, res: [{}, { gold: 3 }, { red: 3 }], shop: ROW });
    s = take(s, 'Crime Wave');
    expect(ids(s).every(id => /^take:[12]:/.test(id))).toBe(true);
    s = play(s, 'take:1:gold', 'take:1:gold');
    expect(ids(s)).toEqual(['take:2:red']); // owed 1 from P3
    s = move(s, 'take:2:red');
    expect([R(s).magenta, R(s, 1).gold, R(s, 2).red]).toEqual([3, 1, 2]);
  });
  it('× Lookout: once per round, a bystander takes 1 back from the thief (named)', () => {
    let s = table(Q, { n: 3, round: 2, res: [{}, { gold: 3 }, { red: 3 }], members: [[], [], ['thieves.lookout']], shop: ROW, queue: turns(0, 0) });
    s = pass(play(take(s, 'Crime Wave'), 'take:1:gold', 'take:2:red', 'take:1:gold'));
    // Crime Wave is one steal per victim: the first victim's steal sets Lookout off; P3 is a victim, not a bystander, for its own
    expect(R(s).magenta).toBe(2);
    expect(R(s, 2).magenta).toBe(1);
    expect(named(s, 'Lookout').length).toBe(1);
    s = take(s, 'Help Yourself');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(R(s, 2).magenta).toBe(1); // spent this round
    expect(named(s, 'Lookout').length).toBe(1);
  });

  it('Shake Down: a rival\'s member costing 6 or less; they pay its cost to keep it, or it\'s yours', () => {
    let s = table(Q, { round: 2, res: [{}, { red: 3 }], members: [[], ['red.twins', 'red.bigfamily', 'red.intern']], shop: ROW });
    s = take(s, 'Shake Down');
    expect(ids(s).sort()).toEqual([cardOpt(s, 'red.twins', 1), cardOpt(s, 'red.intern', 1)].sort()); // Big Family is 8
    // Twins (4): P2 holds only 3, so they can't pay
    let t = move(s, cardOpt(s, 'red.twins', 1));
    expect(ids(t)).toEqual(['let']);
    t = move(t, 'let');
    expect(owns(t, 0, 'red.twins')).toBe(true);
    // Intern (2): P2 pays 2, and it turns magenta for P1
    t = move(move(s, cardOpt(s, 'red.intern', 1)), 'pay');
    expect([R(t).magenta, R(t, 1).red]).toEqual([2, 1]);
    expect(owns(t, 1, 'red.intern')).toBe(true);
  });
  it('× Bodyguard: Shake Down, Poach and Double Agent can\'t reach a Bodyguard owner\'s members', () => {
    let s = table(Q, { round: 2, members: [[], ['thieves.watchdog', 'red.twins']], shop: ROW });
    s = take(s, 'Shake Down');
    expect(s.log).toContain('P1 found no one to hold to ransom.');
    s = take(table(Q, { round: 3, left: 5, members: [[], ['thieves.watchdog', 'red.twins']], shop: ROW }), 'Poach');
    expect(s.log).toContain('P1 found nothing worth a heist.');
  });

  it('Poach: take any rival\'s member; they recruit any face-up member costing up to the same, free', () => {
    let s = table(Q, { round: 3, left: 5, members: [[], ['red.bigfamily']], shop: ROW });
    s = move(take(s, 'Poach'), cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    // up to 8: not Tycoon (12)
    expect(ids(s)).not.toContain(cardOpt(s, 'gold.tycoon', 'shop'));
    expect(s.pending.player).toBe(1);
    s = move(s, cardOpt(s, 'red.twins', 'shop'));
    expect(owns(s, 1, 'red.twins')).toBe(true);
    expect(s.log.some(l => /P2 recruited Twins \(free\)/.test(l))).toBe(true);
  });
  it('× Light Fingers: the Poach victim\'s free recruit costing 8+ sets off a third player\'s Light Fingers', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{}, { red: 2 }], members: [[], ['gold.tycoon'], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'Poach'), cardOpt(s, 'gold.tycoon', 1));
    s = move(s, cardOpt(s, 'red.bigfamily', 'shop'));
    expect(R(s, 2).magenta).toBe(1);
    expect(named(s, 'Light Fingers').length).toBe(1);
  });
});

describe('Magenta members', () => {
  const roundStart = (opts) => table(Q, { shop: ROW, queue: [{ t: 'round', r: 2 }], ...opts });
  it('Cutpurse: at round start, take 1 from the rival holding the most (named)', () => {
    const s = roundStart({ n: 3, res: [{}, { gold: 2 }, { red: 3 }], members: [['thieves.cutpurse']] });
    expect([R(s).magenta, R(s, 2).red]).toEqual([1, 2]);
    expect(named(s, 'Cutpurse').length).toBe(1);
  });
  it('Mole: at round start, take 1 from each player with more followers (named)', () => {
    const s = roundStart({ n: 3, res: [{}, { gold: 2 }, { red: 3 }], bonus: [0, 2, 0], members: [['thieves.mole']] });
    expect([R(s).magenta, R(s, 1).gold, R(s, 2).red]).toEqual([1, 1, 3]);
    expect(named(s, 'Mole').length).toBe(1);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III they used to give nothing
  it('Cutpurse and Mole recruited: their steal happens right away too (named)', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{ magenta: 4 }, { gold: 2 }, { red: 3 }], shop: ['thieves.cutpurse', ...ROW] });
    s = move(take(s, 'Golden Years'), cardOpt(s, 'thieves.cutpurse', 'shop'));
    expect([R(s).magenta, R(s, 2).red]).toEqual([1, 2]);
    expect(named(s, 'Cutpurse')).toEqual(["P1's Cutpurse: took 1 from P3."]);
    let t = table(Q, { n: 3, round: 3, left: 5, res: [{ magenta: 4 }, { gold: 2 }, { red: 3 }], bonus: [0, 2, 0], shop: ['thieves.mole', ...ROW] });
    t = move(take(t, 'Golden Years'), cardOpt(t, 'thieves.mole', 'shop'));
    expect([R(t).magenta, R(t, 1).gold, R(t, 2).red]).toEqual([1, 1, 3]);
    expect(named(t, 'Mole')).toEqual(["P1's Mole: took 1 from P2."]);
  });
  it('× Sticky Fingers: a member\'s steal (Mole) takes 1 only today (see the ledger question)', () => {
    const s = roundStart({ res: [{}, { gold: 5 }], bonus: [0, 5], members: [['thieves.mole', 'thieves.sticky']] });
    expect(R(s).magenta).toBe(1);
  });

  it('Accomplice: when recruited, take 1 from each rival (named)', () => {
    let s = table(Q, { n: 3, res: [{ magenta: 8 }, { gold: 1 }, { red: 2 }], shop: ['thieves.accomplice', ...ROW] });
    s = move(take(s, 'Redistribute'), cardOpt(s, 'thieves.accomplice', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect([R(s).magenta, R(s, 1).gold, R(s, 2).red]).toEqual([2, 0, 1]);
    expect(named(s, 'Accomplice').length).toBe(2);
  });
  it('× Poach: a stolen Accomplice doesn\'t fire again (it wasn\'t recruited)', () => {
    let s = table(Q, { round: 3, left: 5, res: [{}, { gold: 3 }], members: [[], ['thieves.accomplice']], shop: ROW });
    s = move(take(s, 'Poach'), cardOpt(s, 'thieves.accomplice', 1));
    expect(R(s, 1).gold).toBe(3);
  });

  it('Grifter: when recruited, take 1 per 2 members you have, from the rivals holding the most', () => {
    let s = table(Q, { n: 3, res: [{ magenta: 6 }, { gold: 3 }, { red: 2 }], members: [['red.twins', 'red.intern', 'red.volunteer']], shop: ['thieves.grifter', ...ROW] });
    s = move(take(s, 'Redistribute'), cardOpt(s, 'thieves.grifter', 'shop'));
    // 4 members: take 2, one at a time from whoever holds the most then
    expect(R(s).magenta).toBe(2);
    expect(R(s, 1).gold + R(s, 2).red).toBe(3);
    expect(named(s, 'Grifter').length).toBe(2);
  });

  it('Robin Hood: whenever you steal from the player with the most followers, +1 follower (named)', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 3 }, { red: 3 }], bonus: [0, 3, 0], members: [['thieves.robinhood']], shop: ROW });
    s = play(take(s, 'Help Yourself'), 'take:1:gold', 'take:2:red');
    expect(s.players[0].bonus).toBe(1);
    expect(named(s, 'Robin Hood').length).toBe(1);
  });
  it('× Poach: taking a member from the leader counts, even when it leaves them behind', () => {
    // P2 leads 4 to 3 only through Big Family (3 followers)
    let s = table(Q, { round: 3, left: 5, members: [['thieves.robinhood'], ['red.bigfamily'], ['red.twins']], n: 3, shop: ROW });
    expect(followers(s, s.players[1])).toBeGreaterThan(followers(s, s.players[2]));
    s = move(take(s, 'Poach'), cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(s.players[0].bonus).toBe(1);
  });

  it('Lookout: stolen after it fired this round, it stays spent for the new owner', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{}, { gold: 9 }, { red: 9 }], members: [[], [], ['thieves.lookout']], shop: ROW, queue: turns(0, 0, 0) });
    s = pass(play(take(s, 'Help Yourself'), 'take:1:gold', 'take:1:gold', 'take:1:gold', 'take:1:gold'));
    expect(named(s, 'Lookout').length).toBe(1);
    s = pass(move(take(s, 'Poach'), cardOpt(s, 'thieves.lookout', 2)));
    expect(owns(s, 0, 'thieves.lookout')).toBe(true);
    // P1 now holds Lookout; nobody else steals this round in this scene, but the card is marked spent for round III
    expect(s.cards[uidIn(s, 'thieves.lookout', 0)].round).toBe(3);
  });

  it('Light Fingers: whenever a rival recruits a member costing 8 or more, take 1 from them', () => {
    let s = table(Q, { res: [{ red: 10 }], members: [[], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'Redistribute'), cardOpt(s, 'red.bigfamily', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect([R(s).red, R(s, 1).magenta]).toEqual([1, 1]);
    expect(named(s, 'Light Fingers').length).toBe(1);
    s = table(Q, { res: [{ red: 10 }], members: [[], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'Redistribute'), cardOpt(s, 'red.twins', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect(R(s, 1).magenta).toBe(0); // Twins costs 4
  });

  it('Extortionist: whenever a rival buys 6 followers, take 2 from them (not for 3) (named)', () => {
    let s = table(Q, { res: [{ gold: 4, red: 3, magenta: 3 }], members: [[], ['thieves.extortionist']], shop: ROW });
    s = move(take(s, 'Redistribute'), 'tier:big');
    expect(s.players[0].bonus).toBe(6);
    expect(R(s, 1).magenta).toBe(2);
    expect(sum(R(s))).toBe(0);
    expect(named(s, 'Extortionist').length).toBe(1);
    s = table(Q, { res: [{ gold: 2, red: 2 }, {}], members: [[], ['thieves.extortionist']], shop: ROW });
    s = move(take(s, 'Redistribute'), 'tier:mid');
    expect(R(s, 1).magenta).toBe(0);
  });

  it('Double Agent: when recruited, swap it for any rival\'s member (named)', () => {
    let s = table(Q, { res: [{ magenta: 6 }], members: [[], ['red.bigfamily']], shop: ['thieves.doubleagent', ...ROW] });
    s = move(take(s, 'Redistribute'), cardOpt(s, 'thieves.doubleagent', 'shop'));
    expect(s.pending.prompt).toMatch(/Double Agent/);
    s = move(s, cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(owns(s, 1, 'thieves.doubleagent')).toBe(true);
    expect(named(s, 'Double Agent').length).toBe(1);
  });

  it('Safecracker: once per game, half (rounded down) of the magenta of the rival holding the most (named)', () => {
    let s = table(Q, { n: 3, res: [{ gold: 20 }, { magenta: 7 }, { magenta: 3 }], members: [['thieves.bigscore']], shop: ROW });
    s = take(s, 'Redistribute');
    s = move(s, `use:${uidIn(s, 'thieves.bigscore', 0)}`);
    expect([R(s).magenta, R(s, 1).magenta, R(s, 2).magenta]).toEqual([3, 4, 3]);
    expect(named(s, 'Safecracker').length).toBe(1);
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'thieves.bigscore', 0)}`);
  });
  it('× Doppelganger copying Safecracker: a second use (the copy\'s own once-per-game)', () => {
    let s = table(Q, { res: [{ gold: 20 }, { magenta: 8 }], members: [['thieves.bigscore', 'red.doppel']], shop: ROW });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'thieves.bigscore';
    s = take(s, 'Redistribute');
    s = move(s, `use:${uidIn(s, 'thieves.bigscore', 0)}`);
    s = move(s, `use:${uidIn(s, 'red.doppel', 0)}`);
    expect([R(s).magenta, R(s, 1).magenta]).toEqual([6, 2]);
  });

  it('Kingpin: game end, +1 follower per 2 magenta', () => {
    const s = table(Q, { res: [{ magenta: 7 }], members: [['thieves.kingpin']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Kingpin +3');
  });
});
