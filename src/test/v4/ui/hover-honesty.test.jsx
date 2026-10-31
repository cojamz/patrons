// Live panel round 1 (cf23306), lane G1: a space's hover says what the space will really do, and why.
import { describe, it, expect } from 'vitest';
import { previewSpace } from '../../../engine/v4/preview.js';
import { youdWords, cachedPreview } from '../../../v4/game/Info.jsx';
import { raceAfter, whyLine } from '../../../v4/game/HoverCards.jsx';
import { quadrant, defById } from '../../../engine/v4/content/index.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';

const T = ['gold', 'red', 'thieves', 'market'];
const at = (s, name) => spaceOf(s, name).split('-').map(Number);
const words = (s, name) => {
  const [q, i] = at(s, name);
  const pv = previewSpace(s, 0, q, i);
  return { pv, y: youdWords(pv, s, quadrant(s.quadrants[q]).resource) };
};

describe('hover honesty (live panel r1)', () => {
  it('Help Yourself doubled by Desperado: the Why names Desperado', () => {
    const s = sceneQ({ quadrants: T, round: 3, n: 3, res: [{}, { gold: 5, red: 4 }, { blue: 3 }], bonus: [0, 3, 3], members: [['thieves.desperado'], [], []] });
    const { pv, y } = words(s, 'Help Yourself');
    // round III steals 5, doubled to 10: what the rivals hold reads as the gain, the rest as your pick
    expect(y.text).toBe('+3 gold, +2 red, +1 blue; steal 4 in colors you pick');
    expect(whyLine(pv.reasons)).toBe('Desperado: steal doubled (5 → 10)');
  });

  it('Collect Debts with Sticky Fingers: the Why names it, and a rival it can rob reads now and after, never a gift', () => {
    const s = sceneQ({ quadrants: T, round: 2, n: 3, res: [{}, { gold: 3 }, { gold: 3 }], members: [['thieves.sticky'], [], []] });
    const { pv, y } = words(s, 'Collect Debts');
    expect(y.text).toBe('+4 gold');
    expect(whyLine(pv.reasons)).toBe('Sticky Fingers: +1 to steal (3 → 4)');
    const [q, i] = at(s, 'Collect Debts');
    const r = raceAfter(s, cachedPreview(s, 0, q, i).race, 'gold', 0, true);
    expect(r.tail).toBe('');
    for (const t of r.them) expect(t.text).toMatch(/^P[23] has 3 now, \d( or \d| to \d)? after$/);
  });

  it('Bury: says the most it can give, as your pick (1 + half the priciest face-up cost), never a loss', () => {
    const s = sceneQ({ quadrants: T, round: 2, n: 3, res: [{ gold: 9, red: 3 }], shop: ['red.bigfamily', 'gold.tycoon', 'red.intern', 'gold.taxman', 'red.twins', 'red.volunteer'] });
    const most = Math.max(...s.shop.map(u => { const d = defById(s.cards[u].def); return d.s + d.w; }));
    const { y } = words(s, 'Bury');
    expect(y.text).toBe(`up to +${1 + Math.floor(most / 2)} blue`);
    expect(y.note).toBe('your pick');
    expect(y.text).not.toMatch(/−/);
  });

  it('Gather shows the round gain regardless of recruitment around the table', () => {
    for (const round of [1, 2, 3]) {
      const s = sceneQ({ quadrants: T, round, n: 3 });
      s.recruits = 9;
      expect(words(s, 'Gather').y.text).toMatch(new RegExp(`^\\+${round + 1} red`));
    }
  });

  it('Stash says its round gain', () => {
    for (const round of [1, 2, 3]) expect(words(sceneQ({ quadrants: T, round, n: 3 }), 'Stash').y.text).toBe(`+${round + 2} magenta`);
  });
});
