// Tester panel, Oct 26 (v0.8.86): the screen bugs it found, pinned.
import { describe, expect, it } from 'vitest';
import { cardVerb } from '../../../v4/game/HoverCards.jsx';

describe('panel Oct 26', () => {
  it('the tap sheet button says what the pick does (Churn said "Recruit" and sent the card away)', () => {
    expect(cardVerb({ kind: 'choose', prompt: 'Churn: send which member to the bottom? (3 to go)' })).toBe('Send to bottom');
    expect(cardVerb({ kind: 'choose', prompt: 'Bury: send which member to the bottom?' })).toBe('Send to bottom');
    expect(cardVerb({ kind: 'choose', prompt: 'Peek: which goes on top?' })).toBe('Put on top');
    expect(cardVerb({ kind: 'buy', prompt: 'P1: recruit a member or followers, or pass' })).toBe('Recruit');
    expect(cardVerb(null)).toBe('Recruit');
  });
});

import { lossWords } from '../../../v4/game/GameScreen.jsx';
import { seatLoss } from '../../../v4/game/trail.js';

describe('your seat says what rivals took since your turn (panel Oct 26)', () => {
  const players = [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }, { name: 'P4' }];
  it('reads the states: drops only, a swap names both members', () => {
    const cards = { 1: { def: 'red.intern' }, 2: { def: 'red.twins' } };
    const at = (res, bonus, members) => ({ resources: ['red', 'green'], cards, players: [{ res, bonus, members }] });
    expect(seatLoss(at({ red: 2, green: 1 }, 1, [1]), at({ red: 2, green: 3 }, 1, [1]), 0)).toBe(null);
    const l = seatLoss(at({ red: 2, green: 1 }, 1, [1]), at({ red: 1, green: 1 }, 0, [2]), 0);
    expect(l.res).toEqual({ red: 1 });
    expect(l.f).toBe(1);
    expect(l.gone).toHaveLength(1);
    expect(l.came).toHaveLength(1);
  });
  it('one clause per rival, merged across their turns', () => {
    expect(lossWords([
      { actor: 3, lost: { res: { green: 1 }, f: 0, gone: [], came: [] } },
      { actor: 1, lost: { res: {}, f: 0, gone: ['Busker'], came: ['Doorman'] } },
      { actor: 3, lost: { res: {}, f: 1, gone: [], came: [] } },
    ], players)).toBe('P4 took 1 green 1 follower · P2 swapped your Busker for Doorman');
    expect(lossWords([{ actor: 2, lost: { res: { red: 2 }, f: 0, gone: ['Twins'], came: [] } }], players)).toBe('P3 took your Twins and 2 red');
    expect(lossWords([], players)).toBe('');
  });
});
