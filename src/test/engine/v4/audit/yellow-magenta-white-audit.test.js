// @vitest-environment node
// Card-vs-text audit (2026-10-15): Yellow, Magenta, White, the guest members and the shared base rules.
import { describe, it, expect } from 'vitest';
import { followers, followerChoices, TIERS } from '../../../../engine/v4/core.js';
import { take, move, play, ids } from '../helpers.js';
import { table, uidIn } from '../cards-helpers-b.js';

const R = (s, i = 0) => s.players[i].res;
const turns = (...p) => p.map(id => ({ t: 'turn', p: id }));
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const ROW = ['gold.taxman', 'red.twins'];

describe('base rules', () => {
  it('5 for 5: one player can buy repeatedly without a stock limit', () => {
    const Q = ['gold', 'red', 'yellow', 'trading'];
    let s = table(Q, { n: 4, res: [{ gold: 30 }], shop: ROW, queue: turns(0, 0, 0) });
    for (const sp of ['yellow.harvest', 'yellow.bloom', 'trading.stipend']) {
      s = take(s, sp);
      expect(ids(s)).toContain('tier:mid');
      s = move(s, 'tier:mid');
    }
    expect(s.players[0].bonus).toBe(16); // three buys by the same player, and Allowance's +1 follower
    expect(s.stock).toEqual({});
  });
});

describe('Yellow', () => {
  it('Late Bloomers on recruit: excludes itself when checking tied for fewest', () => {
    const Q = ['gold', 'red', 'yellow', 'trading'];
    let s = table(Q, { res: [{ yellow: 4 }], shop: ['yellow.latebloomer', ...ROW] });
    s = take(s, 'yellow.harvest');
    expect(followers(s, s.players[0])).toBe(followers(s, s.players[1])); // 1 v 1: tied for fewest
    s = move(s, `card:${uidIn(s, 'yellow.latebloomer', 'shop')}`);
    expect(s.players[0].members.length).toBe(1);
    // The two followers from the card do not stop the recruit income.
    expect(R(s)).toEqual({ gold: 1, red: 1, yellow: 2, white: 1 });
  });

  it('Potluck and Go-Between: a guest member whose color is not on the table brings nothing', () => {
    const Q = ['gold', 'red', 'yellow', 'trading']; // no purple: Front-runner leans purple
    let s = table(Q, { round: 2, members: [['benders.frontrunner', 'yellow.gobetween']], shop: ROW });
    s = take(s, 'yellow.gather');
    // Go-Between is yellow: +1 yellow; Front-runner: nothing
    expect(R(s)).toEqual({ gold: 0, red: 0, yellow: 1, white: 0 });
  });
});

describe('Magenta', () => {
  it('Robin Hood: two rivals tied for most followers, both robbed in one Help Yourself; the first payout un-leads the second', () => {
    const Q = ['gold', 'red', 'thieves', 'trading'];
    let s = table(Q, { n: 4, round: 2, res: [{}, { gold: 2 }, { gold: 2 }, { gold: 2 }], bonus: [3, 3, 3, 0], members: [['thieves.robinhood']], shop: ROW });
    // P1 4+1(Robin Hood)=5 followers? Robin Hood is worth 1: P1 = 1+3+1 = 5. Make P2, P3 equal at 5.
    s.players[1].bonus = 4; s.players[2].bonus = 4;
    expect([0, 1, 2].map(i => followers(s, s.players[i]))).toEqual([5, 5, 5]);
    // Help Yourself in round II steals 2, split among rivals (Lie Low no longer steals, 2026-10-22)
    s = take(s, 'thieves.pickpocket');
    s = play(s, 'take:1:gold', 'take:2:gold');
    expect(s.pending?.kind).not.toBe('choose');
    // P2 and P3 both had the most followers when the steal began: the card says +1 each time
    expect(s.players[0].bonus - 3 - 2).toBe(2); // Help Yourself's own +2 followers, then Robin Hood +1 twice
  });
});

describe('Robin Hood through Gold’s Collect Debts', () => {
  it('two tied leaders robbed in one Collect Debts: +1 each', () => {
    const Q = ['gold', 'red', 'thieves', 'trading'];
    let s = table(Q, { n: 4, round: 2, res: [{}, { gold: 2 }, { gold: 2 }, { gold: 2 }], bonus: [3, 4, 4, 0], members: [['thieves.robinhood']], shop: ROW });
    s = take(s, 'gold.steal');
    s = play(s, 'player:1', 'player:2', 'player:2');
    expect(s.players[0].bonus - 3).toBe(2);
  });
});

describe('White', () => {
  it('Raider: steals 4 followers from the leader and pays them 2 white (Cory, 2026-10-22)', () => {
    const Q = ['gold', 'red', 'trading', 'thieves'];
    let s = table(Q, { res: [{ white: 5 }], bonus: [0, 6], members: [['trading.raider']], shop: ROW });
    s = move(s, `use:${uidIn(s, 'trading.raider', 0)}`);
    expect([R(s).white, s.players[0].bonus, s.players[1].bonus, R(s, 1).white]).toEqual([3, 4, 2, 2]);
  });
});
