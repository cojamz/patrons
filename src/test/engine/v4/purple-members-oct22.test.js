// @vitest-environment node
// Cory's Purple members (2026-10-22), through real moves: Early Bird, Bouncer, Gossip, Extra Shift, Closer, Hot Streak.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, buy, linesNaming, passBuys } from './cards-helpers.js';

const Q = ['gold', 'red', 'purple', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
const rich = { gold: 30, red: 30, purple: 30, green: 30 };
const upcoming = s => s.queue.filter(t => t.t === 'turn').map(t => t.p);

describe('Purple members, Oct 22', () => {
  it('Early Bird: your turns can’t be skipped; Sleep In still gives its +4', () => {
    const s = take(sc({ round: 2, members: [['purple.earlybird']], queue: turns(0, 1, 0, 1) }), 'purple.skip');
    expect(s.players[0].res.purple).toBe(4);
    expect(upcoming(s)).toEqual([1, 0, 1]);
    expect(s.log).toContain("P1's Early Bird: P1's turn can't be skipped.");
  });
  it('Early Bird: Last Call still pays its followers, and you keep your turns', () => {
    const s = take(sc({ round: 2, left: 3, members: [['purple.earlybird']], queue: turns(0, 1, 0, 1, 0) }), 'purple.lastcall');
    expect(s.players[0].bonus).toBe(4);
    expect(upcoming(s)).toEqual([1, 0, 1, 0]);
  });
  it('Bouncer: when recruited, the next two rivals’ turns are skipped; your own between them still happens', () => {
    let s = sc({ n: 3, round: 2, res: [rich], shop: ['purple.bouncer'], queue: turns(0, 1, 0, 2, 1, 2) });
    s = take(s, 'gold.rush'); s = buy(s, 'purple.bouncer');
    expect(linesNaming(s.log, 'Bouncer')).toEqual(["P1's Bouncer: P2 skips their next turn.", "P1's Bouncer: P3 skips their next turn."]);
    expect(s.pending.player).toBe(0); // P1's own turn comes next, then the rest
    expect(upcoming(s)).toEqual([1, 2, 1, 2]);
  });
  it('Gossip: +1 follower whenever anyone’s turn is skipped, when play reaches the skipped turn', () => {
    let s = take(sc({ round: 2, members: [[], ['purple.gossip']], queue: turns(0, 1, 0, 1) }), 'purple.skip');
    expect(s.players[1].bonus).toBe(0);
    s = passBuys(take(passBuys(s), 'gold.rush'));
    expect(s.log).toContain("P1's turn is skipped (Sleep In).");
    expect(s.players[1].bonus).toBe(1);
    expect(linesNaming(s.log, 'Gossip')).toEqual(["P2's Gossip: +1 follower."]);
  });
  it('Extra Shift: when recruited in round II, one more minion, placed after everyone else; none in round I', () => {
    let s = sc({ round: 2, res: [rich], shop: ['purple.extrashift'], queue: [...turns(0, 1), { t: 'allPlaced' }] });
    const left = s.players[0].left;
    s = take(s, 'gold.rush'); s = buy(s, 'purple.extrashift');
    expect(s.players[0].left).toBe(left - 1 + 1);
    expect(s.pending.player).toBe(1); // P2's turn, then P1's extra minion
    expect(upcoming(s)).toEqual([0]);
    let t = sc({ round: 1, res: [rich], shop: ['purple.extrashift'], queue: turns(0, 1) });
    t = take(t, 'gold.rush'); t = buy(t, 'purple.extrashift');
    expect(t.log).toContain('No extra minions in round I: P1 gets no extra minion from Extra Shift.');
  });
  it('Closer: +4 purple when you place the last minion of the round (Cory, Oct 23), not just your own last', () => {
    const last = sc({ round: 2, left: 1, members: [['purple.closer']], queue: turns(0) });
    last.players.forEach((o, i) => { if (i) o.left = 0; });
    const s = take(last, 'gold.rush');
    expect(s.players[0].res.purple).toBe(4);
    expect(linesNaming(s.log, 'Closer')).toHaveLength(1);
    // your own last minion while a rival still has one to place: nothing
    const t = take(sc({ round: 2, left: 1, members: [['purple.closer']], queue: turns(0, 1) }), 'gold.rush');
    expect(t.players[0].res.purple || 0).toBe(0);
  });
  it('Hot Streak: +2 followers per turn in a row just before this one; nothing to use with none', () => {
    let s = sc({ round: 2, members: [['purple.streak']], queue: turns(0, 0, 0, 1) });
    s.turns = [0, 0];
    s.current = 0;
    s = move(s, `use:${uidOf(s, 'purple.streak', 0)}`);
    expect(s.players[0].bonus).toBe(2);
    expect(followers(s, s.players[0])).toBe(1 + 1 + 2);
    let t = sc({ round: 2, members: [['purple.streak']], queue: turns(0, 1) });
    t = move(t, `use:${uidOf(t, 'purple.streak', 0)}`);
    expect(t.players[0].bonus).toBe(0);
    expect(t.log).toContain("P1's Hot Streak: no turns in a row just before this one yet.");
  });
});
