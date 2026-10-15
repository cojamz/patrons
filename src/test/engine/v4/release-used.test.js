// Cory (2026-10-15): "if you activate a member, you can no longer sell them for money". A member whose once-per-game
// use is spent can't be released for its refund; an unused one still can.
import { describe, it, expect } from 'vitest';
import { createGame, canRelease } from '../../../engine/v4/core.js';

describe('Release and used members', () => {
  it('a spent once-per-game member is not releasable; an unspent one is', () => {
    const s = createGame({ seats: [{ name: 'A' }, { name: 'B' }], seed: 11 });
    const p = s.players[0];
    const uid = Object.keys(s.cards).find(u => !p.members.includes(u));
    p.members.push(uid);
    Object.assign(s.cards[uid], { recruitedRound: -1, recruitedBy: p.id });
    expect(canRelease(s, p, uid)).toBe(true);
    s.cards[uid].used = true;
    expect(canRelease(s, p, uid)).toBe(false);
  });
});
