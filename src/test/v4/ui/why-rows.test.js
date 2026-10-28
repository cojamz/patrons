// The hover's "Why" and "You'd get" rows tell the real payout (blind testers B and C):
// - Grand Host's doubling is named, the biggest part of a Silver space's payout (Toast, Good Deed);
// - a member that fires more than once in one branch says its sum (Greatest Hits: Impressionist +1 per copy);
// - Out of Style's gain is flat (Oct 27), whichever color you send.
import { describe, it, expect } from 'vitest';
import { previewSpace } from '../../../engine/v4/index.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';
import { take, move } from '../../engine/v4/helpers.js';
import { youdWords } from '../../../v4/game/Info.jsx';

const pv = (s, name) => { const [q, i] = spaceOf(s, name).split('-').map(Number); return previewSpace(s, s.pending.player, q, i); };

describe('Why rows', () => {
  it('Toast with Grand Host: the Why names the doubling', () => {
    const s = sceneQ({ quadrants: ['silver', 'gold', 'red', 'market'], round: 3, members: [['silver.grandhost', 'silver.caterer']] });
    const p = pv(s, 'silver.toast');
    expect(p.reasons).toContain('Grand Host: silver gain 9 → 18');
  });
  it('Greatest Hits: Impressionist fired once per copy says its sum', () => {
    let s = sceneQ({ quadrants: ['gold', 'echo', 'red', 'market'], round: 3, left: 5, members: [['echo.tuningfork']],
      queue: [0, 1, 0, 1, 0].map(p => ({ t: 'turn', p })) });
    s = take(s, 'gold.rush'); while (s.pending?.kind === 'buy') s = move(s, 'pass');
    s = take(s, 'red.turnout'); while (s.pending?.kind === 'buy') s = move(s, 'pass');
    s = take(s, 'gold.windfall'); while (s.pending?.kind === 'buy') s = move(s, 'pass');
    s = take(s, 'market.clearance'); while (s.pending?.kind === 'buy') s = move(s, 'pass');
    const p = pv(s, 'echo.eternity');
    const line = p.reasons.find(l => l.startsWith('Impressionist'));
    expect(line).toBe('Impressionist: +2 gold');
  });
});

describe("You'd get", () => {
  it('Out of Style says its flat +2, whichever color you send', () => {
    // 3 red and 2 gold face up: sending red is the best case
    const s = sceneQ({ quadrants: ['market', 'silver', 'gold', 'red'], shop: ['red.intern', 'red.twins', 'red.volunteer', 'gold.banker', 'gold.taxman'] });
    s.shop = s.shop.slice(0, 5);
    const y = youdWords(pv(s, 'market.restock'), s, 'blue');
    expect(y.text).toBe('+2 blue');
  });
  it('Walk-In says its +2 red and the member it brings', () => {
    const s = sceneQ({ quadrants: ['red', 'silver', 'gold', 'market'] });
    const y = youdWords(pv(s, 'red.hire'), s, 'red');
    expect(y.text).toMatch(/^\+2 red/);
    expect(y.text).toMatch(/\+1 member/);
  });
});
