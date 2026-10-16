// Live panel round 1 (cf23306), lane G1: a space's hover says what the space will really do, and why.
import { describe, it, expect } from 'vitest';
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
    expect(y.text).toBe('+8 magenta');
    expect(whyLine(pv.reasons)).toBe('Desperado: steal doubled (4 → 8)');
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
    expect(y.text).toMatch(/^\+2 blue, or \+1 member \(.+\), \+\d+ followers? for \d+$/);
    expect(y.text).not.toMatch(/−/);
  });

  it('Bandwagon: the Why says how many were recruited, so its number never reads as missing a base', () => {
    const s0 = sceneQ({ quadrants: T, round: 1, n: 3 });
    expect(whyLine(words(s0, 'Bandwagon').pv.reasons)).toBe('Bandwagon: no one has recruited this round yet');
    const s = { ...s0, recruits: 3 };
    const { pv, y } = words(s, 'Bandwagon');
    expect(y.text).toBe('+3 red');
    expect(whyLine(pv.reasons)).toBe('Bandwagon: 3 members recruited this round, 1 red each');
  });

  it('Redistribute in round III with Desperado takes 2 from each richer rival, and the Why says Desperado doubled it', () => {
    const s = sceneQ({ quadrants: T, round: 3, n: 3, res: [{}, { gold: 5 }, { red: 4 }], bonus: [0, 3, 3], members: [['thieves.desperado'], [], []] });
    const { pv, y } = words(s, 'Redistribute');
    expect(y.text).toBe('+4 magenta');
    expect(whyLine(pv.reasons)).toBe('Desperado: steal doubled (2 → 4)');
  });

  it('Redistribute when you hold the most: the hover says nothing, and taking it really gives nothing', () => {
    const s = sceneQ({ quadrants: T, round: 1, n: 3, res: [{ gold: 5 }, { gold: 1 }, { red: 1 }], bonus: [5, 0, 0] });
    expect(words(s, 'Redistribute').y.text).toBe('nothing right now');
    const t = take(s, 'thieves.tipoff');
    expect(t.players.map(p => p.res)).toEqual(s.players.map(p => p.res));
    expect(t.log).toContain('P1 found nothing to steal.');
  });
});
