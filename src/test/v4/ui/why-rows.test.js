// The hover's "Why" and "You'd get" rows tell the real payout (blind testers B and C):
// - Grand Host's doubling is named, the biggest part of a Silver space's payout (Toast, Good Deed);
// - a member that fires more than once in one branch says its sum (Greatest Hits: Impressionist +1 per copy);
// - Snap Up's own +2 blue is never dropped from "You'd get" when your best pick spends it.
import { describe, it, expect } from 'vitest';
import { previewSpace } from '../../../engine/v4/index.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';
import { take, move, pinCosts } from '../../engine/v4/helpers.js';
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
    s = take(s, 'market.showroom'); while (s.pending?.kind === 'buy') s = move(s, 'pass');
    const p = pv(s, 'echo.eternity');
    const line = p.reasons.find(l => l.startsWith('Impressionist'));
    expect(line).toBe('Impressionist: +2 gold');
  });
});

describe("You'd get", () => {
  it('Snap Up keeps its own +2 blue beside the best pick that spends it', () => {
    const restore = pinCosts({ 'market.stylist': [2, 3] });
    try {
      // only Stylist face up, 5 in any colors: the +2 blue and 3 silver are exactly its price
      const s = sceneQ({ quadrants: ['market', 'silver', 'gold', 'red'], res: [{ silver: 3 }, { silver: 9 }], shop: ['market.stylist'] });
      s.shop = s.shop.filter(u => s.cards[u].def === 'market.stylist');
      const y = youdWords(pv(s, 'market.bargain'), s, 'blue');
      // the recruit by its price, never a net "−3 silver" (live panel r1: Snap Up's "−4" matched nothing paid)
      expect(y.text).toMatch(/^\+2 blue, or \+1 member \(Stylist\).* for 5$/);
      expect(y.note).toBe('your pick');
    } finally { restore(); }
  });
  it('Open Door with tied cheapest members: "+1 member" once, naming each one you could get', () => {
    // plain one-member cards tied at the cheapest cost (Mob stopped being plain in the Red rebuild: it counts as 5
    // members, so a tie with it is the case below)
    const restore = pinCosts({ 'red.intern': [1, 0], 'red.volunteer': [1, 0], 'red.reserve': [1, 0], 'red.twins': [5, 5], 'red.bigfamily': [5, 5], 'red.mentor': [5, 5] });
    try {
      const s = sceneQ({ quadrants: ['red', 'silver', 'gold', 'market'], shop: ['red.intern', 'red.volunteer', 'red.reserve', 'red.twins', 'red.bigfamily', 'red.mentor'] });
      const y = youdWords(pv(s, 'red.hire'), s, 'red');
      const text = [y.text, y.likely, y.best].filter(Boolean).join(' | ');
      expect(text.match(/\+1 member/g)).toHaveLength(1);
      for (const n of ['Intern', 'Volunteer', 'Benchwarmer']) expect(text).toContain(n);
      for (const n of ['Twins', 'Big Family', 'Mentor']) expect(text).not.toContain(n);
    } finally { restore(); }
  });
  it('Open Door tied with a card that counts as several members: says the best case and names it', () => {
    const restore = pinCosts({ 'red.intern': [1, 0], 'red.mob': [1, 0], 'red.host': [1, 0], 'red.twins': [5, 5], 'red.bigfamily': [5, 5], 'red.mentor': [5, 5] });
    try {
      const s = sceneQ({ quadrants: ['red', 'silver', 'gold', 'market'], shop: ['red.intern', 'red.mob', 'red.host', 'red.twins', 'red.bigfamily', 'red.mentor'] });
      const y = youdWords(pv(s, 'red.hire'), s, 'red');
      expect(y.text).toMatch(/up to \+5 members \(Mob\)/);
      expect(y.note).toBe('your pick');
    } finally { restore(); }
  });
});
