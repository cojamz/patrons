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
