import { describe, it, expect } from 'vitest';
import { QUICK_LINES } from '../../../v4/session/talk.js';
import { emoteArt } from '../../../v4/art/emotes.js';

describe('table talk drawings', () => {
  it('every quick line has its little drawing, inside the 16×16 with room for the outline', () => {
    for (const l of QUICK_LINES) {
      const a = emoteArt(l);
      expect(a, l).toBeTruthy();
      expect(a.rects.length, l).toBeGreaterThan(10);
      for (const r of a.rects) expect(r.x >= 0 && r.x + r.w <= 16 && r.y >= 0 && r.y < 16, l).toBe(true);
    }
  });
  it('words typed in get no drawing', () => {
    expect(emoteArt('gg no re')).toBeNull();
  });
});
