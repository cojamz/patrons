// @vitest-environment node
// Card-by-card: the guest members (rule-benders), through real moves, against the printed text, with a log line
// naming the card whenever it bends a number (a worker, a buy, a cost, the turn order). Plus a cross-sphere case each.
import { describe, it, expect } from 'vitest';
import { resume } from '../../../engine/v4/core.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const named = (s, name) => linesNaming(s.log, name);
const rich = { gold: 30, red: 30, blue: 30, green: 30 };

describe('Guest members (rule-benders)', () => {
  it('Squatter: once per round, join a rival’s taken space and do it; named', () => {
    let s = sceneQ({ members: [['benders.squatter']], slots: { '0-1': 1 } });
    expect(s.pending.options.map(o => o.id)).toContain('squat:0-1');
    s = move(s, 'squat:0-1');
    expect(s.players[0].res.gold).toBe(2);
    expect(named(s, 'Squatter')).toHaveLength(1);
  });
  it('Squatter × Hustler: a joined space of the Hustler’s color pays Hustler too', () => {
    let s = sceneQ({ round: 2, members: [['benders.squatter', 'gold.hustler']], slots: { '0-1': 1 } });
    s.cards[uidOf(s, 'gold.hustler', 0)].color = 'gold';
    s = move(s, 'squat:0-1');
    expect(s.players[0].res.gold).toBe(4 + 2);
    expect(named(s, 'Hustler')).toHaveLength(1);
  });

  it('Big Spender: a second buy after a real first one, once per round; named', () => {
    let s = sceneQ({ res: [rich], members: [['benders.bigspender']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:small');
    expect(s.pending.extra).toBe(true);
    s = move(s, 'tier:small');
    expect(s.players[0].bonus).toBe(2);
    expect(named(s, 'Big Spender')).toHaveLength(1);
  });
  it('Big Spender × Crowd-Pleaser: two follower buys, two payouts', () => {
    let s = sceneQ({ res: [rich], members: [['benders.bigspender', 'red.crowd']] });
    s = move(move(take(s, 'gold.rush'), 'tier:small'), 'tier:small');
    expect(named(s, 'Crowd-Pleaser')).toHaveLength(2);
  });

  it('Freelancer: a member’s colored part paid in other colors, and the recruit line names Freelancer', () => {
    const restore = pinCosts({ 'gold.banker': [2, 0] });
    try {
      let s = sceneQ({ res: [{ red: 4 }], members: [['benders.freelancer']], shop: ['gold.banker'] });
      s = take(s, 'red.turnout'); // current Gather adds2 red in roundI
      s = buy(s, 'gold.banker');
      expect(s.players[0].res.red).toBe(5);
      expect(named(s, 'Freelancer')).toHaveLength(1);
    } finally { restore(); }
  });
  it('Freelancer is not named when the colored part was paid in its own color', () => {
    const restore = pinCosts({ 'gold.prospector': [2, 0] });
    try {
      let s = sceneQ({ res: [{ gold: 2 }], members: [['benders.freelancer']], shop: ['gold.prospector'] });
      s = buy(move(take(s, 'gold.jv'), 'player:1'), 'gold.prospector');
      expect(s.players[0].res.gold).toBe(3);
      expect(named(s, 'Freelancer')).toHaveLength(0);
    } finally { restore(); }
  });

  it('Insider: recruit from the top 3 of the pile; the recruit line names Insider', () => {
    let s = sceneQ({ res: [rich], members: [['benders.insider']] });
    const top = s.pile[0];
    s = take(s, 'gold.rush');
    s = move(s, `card:${top}`);
    expect(s.players[0].members).toContain(top);
    expect(named(s, 'Insider')[0]).toMatch(/from the pile with P1's Insider/);
  });

  it('Extra Hand: +1 worker in round III, named in the round’s opening line; a Doppelganger copy adds another', () => {
    let s = sceneQ({ members: [['benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    expect(s.players[0].left).toBe(6);
    expect(named(s, 'Extra Hand')[0]).toMatch(/P1's Extra Hand: \+1 minion/);
    s = sceneQ({ members: [['benders.extrahand', 'echo.doppel']], queue: [] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'benders.extrahand';
    s.queue = [{ t: 'round', r: 3 }]; s = resume(s);
    expect(s.players[0].left).toBe(7);
    expect(named(s, 'Extra Hand')[0]).toMatch(/\+2 minions/);
    s = sceneQ({ members: [['benders.extrahand']], queue: [{ t: 'round', r: 2 }] });
    expect(named(s, 'Extra Hand')).toHaveLength(0);
  });

  it('Front-runner: picks first even when ahead; the round’s opening line names it', () => {
    const s = sceneQ({ bonus: [9, 0], members: [['benders.frontrunner']], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.player).toBe(0);
    expect(named(s, 'Front-runner')[0]).toMatch(/P1's Front-runner: always picks first/);
  });

  it('Straggler: after the last placement, your last minion moves to an unused space and does it; named', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'to:0-1');
    expect(s.players[0].res.gold).toBe(4);
    expect(s.slots['0-0']).toBeUndefined();
    expect(named(s, 'Straggler')).toHaveLength(1);
  });

  it('Straggler asks only where to go: the minion is the last one you placed (Cory, 2026-10-15)', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0, '1-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s.queue = [{ t: 'allPlaced' }]; s.pending = null; s.players[0].lastSlot = { key: '0-0', joined: false };
    s = resume(s);
    expect(s.pending.options.every(o => o.id.startsWith('to:') || o.id === 'no')).toBe(true);
    expect(s.pending.prompt).toMatch(/your last minion/);
    s = move(s, 'to:0-1');
    expect(s.slots['0-0']).toBeUndefined(); // the last-placed minion moved (not just the last in board order)
    expect(s.slots['1-0']).toBe(0); // the other one stayed
    expect(s.slots['0-1']).toBe(0);
    expect(s.players[0].lastSlot).toEqual({ key: '0-1', joined: false });
  });

  it('Straggler: Stay put leaves the board as it was', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'no');
    expect(s.slots['0-0']).toBe(0);
    expect(Object.values(s.slots).filter(o => o === 0)).toHaveLength(1);
  });
});
