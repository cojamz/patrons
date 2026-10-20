// Live panel round 1 (cf23306), lane G1: a space's hover says what the space will really do, and why.
import { describe, it, expect } from 'vitest';
import { applyMove } from '../../../engine/v4/index.js';
import { previewSpace } from '../../../engine/v4/preview.js';
import { youdWords, cachedPreview } from '../../../v4/game/Info.jsx';
import { raceAfter, whyLine } from '../../../v4/game/HoverCards.jsx';
import { quadrant } from '../../../engine/v4/content/index.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';
import { take } from '../../engine/v4/helpers.js';

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
    expect(y.text).toBe('+1 magenta, +3 followers; steal 6 in colors you pick');
    expect(whyLine(pv.reasons)).toBe('Desperado: steal doubled (3 → 6)');
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

  it('Snap Up: the recruit is said by its price after the +2 blue, never as a net loss', () => {
    const s = sceneQ({ quadrants: T, round: 1, n: 3, res: [{ gold: 9, red: 3 }], shop: ['red.bigfamily'] });
    const { y } = words(s, 'Snap Up');
    expect(y.text).toBe('+2 blue, or +3 members (Big Family), +3 followers for 4');
    expect(y.text).not.toMatch(/−/);
  });

  it('Gather shows the round gain regardless of recruitment around the table', () => {
    for (const round of [1, 2, 3]) {
      const s = sceneQ({ quadrants: T, round, n: 3 });
      s.recruits = 9;
      expect(words(s, 'Gather').y.text).toBe(`+${round + 1} red`);
    }
  });

  it('Redistribute doubles its occupied-action total once, with fresh rival choices', () => {
    const s = sceneQ({ quadrants: T, round: 3, n: 3, res: [{}, { gold: 5 }, { red: 4 }], bonus: [0, 3, 3], members: [['thieves.desperado'], [], []] });
    s.slots['2-0'] = 1; s.slots['2-2'] = 2;
    const { pv, y } = words(s, 'Redistribute');
    expect(y.text).toBe('+1 magenta; steal 4 in colors you pick');
    expect(whyLine(pv.reasons)).toBe('Desperado: steal doubled (2 → 4)');
  });

  it('Redistribute can choose poorer rivals for its occupied-action total', () => {
    const s = sceneQ({ quadrants: T, round: 1, n: 3, res: [{ gold: 5 }, { gold: 1 }, { red: 1 }], bonus: [5, 0, 0] });
    s.slots['2-0'] = 1; s.slots['2-2'] = 2;
    expect(words(s, 'Redistribute').y.text).toBe('+1 gold, +1 red, +1 magenta');
    let t = take(s, 'thieves.tipoff');
    for (let k = 0; k < 8 && t.pending?.kind === 'choose'; k++) {
      const option = t.pending.options.find(o => o.kind === 'take');
      if (!option) break;
      t = applyMove(t, { player: t.pending.player, option: option.id });
    }
    expect(t.players[0].res.magenta - s.players[0].res.magenta).toBe(1);
    expect(t.players[1].res.gold).toBe(0);
    expect(t.players[2].res.red).toBe(0);
  });
});
