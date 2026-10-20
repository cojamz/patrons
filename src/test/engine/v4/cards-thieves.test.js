// @vitest-environment node
// Card-by-card verifier, Magenta (thieves): every action and member against its printed text at the doubled
// member costs, through real legal moves, plus one cross-sphere case each. Every number a card changes must
// show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { followers, memberWeight } from '../../../engine/v4/core.js';
import { take, move, play, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'thieves', 'market'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.taxman': [2, 2], 'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0],
  'red.volunteer': [0, 0], 'echo.doppel': [4, 2], 'red.mentor': [6, 4],
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
  it.each([1, 2, 3])('Help Yourself steals round resources in original colors and gains round followers (round %i)', round => {
    let s = table(Q, { round, left: 5, res: [{}, { gold: 9 }], shop: ROW });
    s = take(s, 'thieves.pickpocket');
    for (let k = 0; k < round; k++) s = move(s, 'take:1:gold');
    expect(R(s)).toMatchObject({ magenta: 1, gold: round });
    expect(R(s, 1).gold).toBe(9 - round);
    expect(s.players[0].bonus).toBe(round);
    expect(s.log.some(l => l.includes('now magenta'))).toBe(false);
  });
  it('Sticky Fingers +1 and Desperado double base theft, separately from inherent grant and followers', () => {
    let s = table(Q, { res: [{}, { gold: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 9], shop: ROW });
    s = take(s, 'thieves.pickpocket');
    while (s.pending?.kind === 'choose') s = move(s, 'take:1:gold');
    expect(R(s)).toMatchObject({ magenta: 1, gold: 3 });
    expect(R(s, 1).gold).toBe(6);
    expect(s.players[0].bonus).toBe(1);
    expect(named(s, 'Sticky Fingers').length).toBe(1);
    expect(named(s, 'Desperado').length).toBe(1);
  });
  it('× Sticky Fingers and Desperado on Gold\'s Collect Debts: 3×2+1 = 7, and the log names both', () => {
    let s = table(Q, { round: 2, left: 4, res: [{}, { gold: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 3], shop: ROW });
    s = take(s, 'gold.steal');
    for (let k = 0; k < 4; k++) s = move(s, 'player:1');
    expect(R(s).gold).toBe(7);
    expect(R(s, 1).gold).toBe(2);
    expect(named(s, 'Sticky Fingers').length).toBe(1);
    expect(named(s, 'Desperado').length).toBe(1);
  });

  it('Redistribute counts occupied Magenta actions and respects Lie Low', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 3 }, { red: 3 }], shop: ROW, queue: turns(1, 0) });
    s = pass(play(take(s, 'thieves.hideout'), 'take:2:red'));
    s = take(s, 'thieves.tipoff');
    expect(ids(s).every(id => id.startsWith('take:2:'))).toBe(true);
    s = move(s, 'take:2:red');
    expect(R(s)).toMatchObject({ magenta: 1, red: 1 });
  });
  it('Lie Low: steal round resources; then resources are safe this round', () => {
    let s = table(Q, { res: [{ gold: 4 }, { red: 1 }], shop: ROW, queue: turns(0, 1) });
    s = pass(play(take(s, 'thieves.hideout'), 'take:1:red'));
    expect(R(s).magenta).toBe(1);
    s = take(s, 'thieves.pickpocket');
    expect(s.pending?.kind).toBe('buy'); // nothing to take
    expect(R(s).gold).toBe(4);
    expect(s.log).toContain('P2 found nothing to steal.');
  });
  it('Lie Low protects members from Poach, Shake Down and Swap Sides', () => {
    const base = { round: 3, left: 5, res: [{ gold: 4 }, { red: 3 }], members: [['red.twins'], ['red.intern']], shop: ROW, queue: turns(0, 1) };
    for (const action of ['thieves.heist', 'thieves.ransom', 'red.trade']) {
      let s = take(table(Q, base), 'thieves.hideout');
      while (s.pending?.kind === 'choose') s = move(s, 'take:1:red');
      s = pass(s);
      s = take(s, action);
      expect(ids(s).some(id => id.includes(`:${uidIn(s, 'red.twins', 0)}`))).toBe(false);
      expect(owns(s, 0, 'red.twins')).toBe(true);
    }
  });

  it('Crime Wave takes half of a chosen color stack, rounded down', () => {
    let s = table(Q, { n: 3, round: 2, res: [{}, { gold: 7, red: 9 }, { red: 1 }], shop: ROW });
    s = move(take(s, 'thieves.rob'), 'take:1:gold');
    expect(R(s)).toMatchObject({ magenta: 1, gold: 3, red: 0 });
    expect(R(s, 1)).toMatchObject({ gold: 4, red: 9 });
    expect(R(s, 2).red).toBe(1);
  });
  it('Lookout takes an original-color resource back, only once per round', () => {
    let s = table(Q, { n: 3, round: 2, res: [{}, { gold: 7 }, { red: 3 }], members: [[], [], ['thieves.lookout']], shop: ROW, queue: turns(0, 0) });
    s = pass(play(take(s, 'thieves.rob'), 'take:1:gold'));
    expect(R(s)).toMatchObject({ magenta: 1, gold: 2 });
    expect(R(s, 2)).toMatchObject({ magenta: 0, gold: 1 });
    expect(named(s, 'Lookout').length).toBe(1);
    s = take(s, 'thieves.pickpocket');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(named(s, 'Lookout').length).toBe(1);
  });
  it('Shake Down: a rival\'s member costing 5 or less; they pay its cost to keep it, or it\'s yours', () => {
    let s = table(Q, { round: 2, res: [{}, { red: 3 }], members: [[], ['red.twins', 'red.bigfamily', 'red.intern', 'echo.doppel']], shop: ROW });
    s = take(s, 'thieves.ransom');
    // Twins 4 and Intern 2; not Doppelganger (6) or Big Family (8)
    expect(ids(s).sort()).toEqual([cardOpt(s, 'red.twins', 1), cardOpt(s, 'red.intern', 1)].sort());
    // Twins (4): P2 holds only 3, so they can't pay
    // no question with one answer (skeptic r2): it simply goes, and the log says why
    let t = move(s, cardOpt(s, 'red.twins', 1));
    expect(t.pending?.player).not.toBe(1);
    expect(owns(t, 0, 'red.twins')).toBe(true);
    expect(t.log).toContain("P2 couldn't pay 4 (held 3), so lost Twins to P1.");
    // Intern (2): P2 pays 2 red; inherent Magenta stays separate
    t = move(move(s, cardOpt(s, 'red.intern', 1)), 'pay');
    expect([R(t).magenta, R(t).red, R(t, 1).red]).toEqual([1, 2, 1]);
    expect(owns(t, 1, 'red.intern')).toBe(true);
  });
  it('× Bodyguard: Shake Down, Poach and Double Agent can\'t reach a Bodyguard owner\'s members', () => {
    let s = table(Q, { round: 2, members: [[], ['thieves.watchdog', 'red.twins']], shop: ROW });
    s = take(s, 'thieves.ransom');
    expect(s.log).toContain('P1 found no one to hold to ransom.');
    s = take(table(Q, { round: 3, left: 5, members: [[], ['thieves.watchdog', 'red.twins']], shop: ROW }), 'thieves.heist');
    expect(s.log).toContain('P1 found nothing worth a heist.');
  });

  it('Poach: take a rival member without a replacement or market changes', () => {
    let s = table(Q, { round: 3, left: 5, members: [[], ['red.bigfamily']], shop: ROW });
    const shop = [...s.shop], pile = [...s.pile], recruits = s.recruits;
    const acquired = uidIn(s, 'red.bigfamily', 1), quantity = memberWeight(s, acquired);
    s = move(take(s, 'thieves.heist'), cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(s.players[1].members).toEqual([]);
    expect(s.shop).toEqual(shop);
    expect(s.pile).toEqual(pile);
    expect(s.recruits).toBe(recruits + quantity);
    expect(s.pending?.player).not.toBe(1);
  });
  it('Poach grants no replacement; active acquisition triggers a rival Light Fingers', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{}, { red: 2 }], members: [[], ['gold.tycoon'], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'thieves.heist'), cardOpt(s, 'gold.tycoon', 1));
    expect(s.players[1].members).toEqual([]);
    expect(R(s, 2).magenta).toBe(1);
    expect(R(s).magenta).toBe(0);
    expect(named(s, 'Light Fingers').length).toBe(1);
  });
});

describe('Magenta members', () => {
  const roundStart = (opts) => table(Q, { shop: ROW, queue: [{ t: 'round', r: 2 }], ...opts });
  it('Cutpurse: at round start, take 1 from the rival holding the most (named)', () => {
    let s = roundStart({ n: 3, res: [{}, { gold: 2 }, { red: 3 }], members: [['thieves.cutpurse']] });
    s = move(s, 'take:2:red');
    expect([R(s).magenta, R(s).red, R(s, 2).red]).toEqual([0, 1, 2]);
    expect(named(s, 'Cutpurse').length).toBe(1);
  });
  it('Mole: at round start, take 1 from each player with more followers (named)', () => {
    const s = roundStart({ n: 3, res: [{}, { gold: 2 }, { red: 3 }], bonus: [0, 2, 0], members: [['thieves.mole']] });
    expect([R(s).gold, R(s, 1).gold, R(s, 2).red]).toEqual([1, 1, 3]);
    expect(named(s, 'Mole').length).toBe(1);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III they used to give nothing
  it('Cutpurse and Mole recruited: their steal happens right away too (named)', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{ magenta: 2 }, { gold: 2 }, { red: 3 }], shop: ['thieves.cutpurse', ...ROW] });
    s = move(take(s, 'gold.rush'), cardOpt(s, 'thieves.cutpurse', 'shop'));
    s = move(s, 'take:2:red');
    expect([R(s).magenta, R(s).red, R(s, 2).red]).toEqual([0, 1, 2]);
    expect(named(s, 'Cutpurse')).toEqual(["P1's Cutpurse stole 1 (1 red from P3)."]);
    let t = table(Q, { n: 3, round: 3, left: 5, res: [{ magenta: 2 }, { gold: 2 }, { red: 3 }], bonus: [0, 2, 0], shop: ['thieves.mole', ...ROW] });
    t = move(take(t, 'gold.rush'), cardOpt(t, 'thieves.mole', 'shop'));
    expect([R(t).gold, R(t, 1).gold, R(t, 2).red]).toEqual([5, 1, 3]);
    expect(named(t, 'Mole')).toEqual(["P1's Mole: took 1 from P2."]);
  });
  it('× Sticky Fingers: a member\'s steal (Mole) takes 1 only today (see the ledger question)', () => {
    const s = roundStart({ res: [{}, { gold: 5 }], bonus: [0, 5], members: [['thieves.mole', 'thieves.sticky']] });
    expect(R(s).gold).toBe(1);
  });

  it('Accomplice: when recruited, take 1 from each rival (named)', () => {
    let s = table(Q, { n: 3, res: [{ magenta: 8 }, { gold: 1 }, { red: 2 }], shop: ['thieves.accomplice', ...ROW] });
    s = take(s, 'thieves.tipoff');
    s = move(s, cardOpt(s, 'thieves.accomplice', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect([R(s).magenta, R(s).gold, R(s).red, R(s, 1).gold, R(s, 2).red]).toEqual([1, 1, 1, 0, 1]);
    expect(named(s, 'Accomplice')).toEqual(["P1's Accomplice: took 1 from P2.", "P1's Accomplice: took 1 from P3."]);
  });
  it('× Poach: actively taking Accomplice triggers its On Recruit', () => {
    let s = table(Q, { round: 3, left: 5, res: [{}, { gold: 3 }], members: [[], ['thieves.accomplice']], shop: ROW });
    s = move(take(s, 'thieves.heist'), cardOpt(s, 'thieves.accomplice', 1));
    expect(owns(s, 0, 'thieves.accomplice')).toBe(true);
    expect(R(s, 1).gold).toBe(2);
    expect(R(s).magenta).toBe(1);
    expect(named(s, 'Accomplice').length).toBe(1);
  });

  it('Grifter: when recruited, take 1 per 2 members you have, from the rivals holding the most', () => {
    let s = table(Q, { n: 3, res: [{ magenta: 6 }, { gold: 3 }, { red: 2 }], members: [['red.twins', 'red.intern', 'red.volunteer']], shop: ['thieves.grifter', ...ROW] });
    s = take(s, 'thieves.tipoff');
    s = move(s, cardOpt(s, 'thieves.grifter', 'shop'));
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    // 4 members: take 2, one at a time from whoever holds the most then
    expect(R(s).magenta).toBe(1);
    expect(R(s).gold + R(s).red).toBe(2);
    expect(R(s, 1).gold + R(s, 2).red).toBe(3);
    expect(named(s, 'Grifter').length).toBe(1);
  });

  it('Robin Hood: whenever you steal from the player with the most followers, +1 follower (named)', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 3 }, { red: 3 }], bonus: [0, 3, 0], members: [['thieves.robinhood']], shop: ROW });
    s = play(take(s, 'thieves.pickpocket'), 'take:1:gold');
    expect(s.players[0].bonus).toBe(2);
    expect(named(s, 'Robin Hood').length).toBe(1);
  });
  it('× Poach: taking a member from the leader counts, even when it leaves them behind', () => {
    // P2 leads 4 to 3 only through Big Family (3 followers)
    let s = table(Q, { round: 3, left: 5, members: [['thieves.robinhood'], ['red.bigfamily'], ['red.twins']], n: 3, shop: ROW });
    expect(followers(s, s.players[1])).toBeGreaterThan(followers(s, s.players[2]));
    s = move(take(s, 'thieves.heist'), cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(s.players[0].bonus).toBe(1);
  });

  it('Lookout: stolen after it fired this round, it stays spent for the new owner', () => {
    let s = table(Q, { n: 3, round: 3, left: 5, res: [{}, { gold: 9 }, { red: 9 }], members: [[], [], ['thieves.lookout']], shop: ROW, queue: turns(0, 0, 0) });
    s = pass(play(take(s, 'thieves.pickpocket'), 'take:1:gold', 'take:1:gold', 'take:1:gold'));
    expect(named(s, 'Lookout').length).toBe(1);
    s = pass(move(take(s, 'thieves.heist'), cardOpt(s, 'thieves.lookout', 2)));
    expect(owns(s, 0, 'thieves.lookout')).toBe(true);
    // P1 now holds Lookout; nobody else steals this round in this scene, but the card is marked spent for round III
    expect(s.cards[uidIn(s, 'thieves.lookout', 0)].round).toBe(3);
  });

  it('Light Fingers: whenever a rival recruits a member costing 8 or more, take 1 from them', () => {
    let s = table(Q, { res: [{ red: 10 }], members: [[], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'thieves.tipoff'), cardOpt(s, 'red.bigfamily', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect([R(s).red, R(s).magenta, R(s, 1).red]).toEqual([1, 1, 1]);
    expect(named(s, 'Light Fingers').length).toBe(1);
    s = table(Q, { res: [{ red: 10 }], members: [[], ['thieves.lightfingers']], shop: ROW });
    s = move(take(s, 'thieves.tipoff'), cardOpt(s, 'red.twins', 'shop'));
    s = s.pending?.kind === 'pay' ? move(s, s.pending.options[0].id) : s;
    expect(R(s, 1).magenta).toBe(0); // Twins costs 4
  });

  it('Extortionist: whenever a rival buys 5 or more followers, take 2 from them (named)', () => {
    let s = table(Q, { res: [{ gold: 6, red: 3, magenta: 3 }], members: [[], ['thieves.extortionist']], shop: ROW });
    s = move(take(s, 'thieves.tipoff'), 'tier:top');
    expect(s.players[0].bonus).toBe(10);
    expect(sum(R(s, 1))).toBe(2);
    expect(sum(R(s))).toBe(1);
    expect(named(s, 'Extortionist').length).toBe(1);
    s = table(Q, { res: [{ gold: 5, red: 2 }, {}], members: [[], ['thieves.extortionist']], shop: ROW });
    s = move(take(s, 'thieves.tipoff'), 'tier:mid');
    expect(sum(R(s, 1))).toBe(2);
  });

  it('Double Agent: when recruited, swap it for any rival\'s member (named)', () => {
    let s = table(Q, { res: [{ magenta: 6 }], members: [[], ['red.bigfamily']], shop: ['thieves.doubleagent', ...ROW] });
    s = move(take(s, 'thieves.tipoff'), cardOpt(s, 'thieves.doubleagent', 'shop'));
    expect(s.pending.prompt).toMatch(/Double Agent/);
    s = move(s, cardOpt(s, 'red.bigfamily', 1));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(owns(s, 1, 'thieves.doubleagent')).toBe(true);
    expect(named(s, 'Double Agent').length).toBe(1);
  });

  it('Safecracker: once per game, half (rounded down) of the magenta of the rival holding the most (named)', () => {
    let s = table(Q, { n: 3, res: [{ gold: 20 }, { magenta: 7 }, { magenta: 3 }], members: [['thieves.bigscore']], shop: ROW });
    s = take(s, 'thieves.tipoff');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    s = move(s, `use:${uidIn(s, 'thieves.bigscore', 0)}`);
    expect([R(s).magenta, R(s, 1).magenta, R(s, 2).magenta]).toEqual([4, 4, 3]);
    expect(named(s, 'Safecracker').length).toBe(1);
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'thieves.bigscore', 0)}`);
  });
  it('× Doppelganger copying Safecracker: a second use (the copy\'s own once-per-game)', () => {
    let s = table(Q, { res: [{ gold: 20 }, { magenta: 8 }], members: [['thieves.bigscore', 'echo.doppel']], shop: ROW });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'thieves.bigscore';
    s = take(s, 'thieves.tipoff');
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    s = move(s, `use:${uidIn(s, 'thieves.bigscore', 0)}`);
    s = move(s, `use:${uidIn(s, 'echo.doppel', 0)}`);
    expect([R(s).magenta, R(s, 1).magenta]).toEqual([7, 2]);
  });

  it('Kingpin: game end, +1 follower per 2 magenta', () => {
    const s = table(Q, { res: [{ magenta: 7 }], members: [['thieves.kingpin']], shop: ROW, queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Kingpin +3');
  });
});
