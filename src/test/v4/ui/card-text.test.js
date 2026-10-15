// Every member's shop card lines fit (plate 1b, Cory 2026-10-15): the when-line in at most two lines and the effect
// in its slot, at the card's narrowest width, measured with Alegreya Sans's own advance widths (src/v4/cardText.js).
// A line that doesn't fit gets a shorter wording in cardText.js's SHORT map, never a cut.
import { describe, it, expect } from 'vitest';
import { allQuadrantIds, quadrant } from '../../../engine/v4/index.js';
import { guestMembers } from '../../../engine/v4/content/index.js';
import { cardLines, effSize, linesAt, lineWords, longName, CARD_INNER, SHORT } from '../../../v4/cardText.js';

const members = [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()];

describe('shop card text (cardText.js)', () => {
  it('covers every member', () => {
    expect(members.length).toBeGreaterThan(150);
    for (const id of Object.keys(SHORT)) expect(members.some(m => m.id === id), `SHORT has ${id}, which no member is`).toBe(true);
  });

  it('every when-line fits two lines and every effect fits its slot', () => {
    const bad = [];
    for (const d of members) {
      const { when, eff } = cardLines(d);
      if (when) {
        const w = linesAt(when, 10.5, CARD_INNER);
        if (w.lines > 2 || w.widest > CARD_INNER) bad.push(`${d.id} when "${when}": ${w.lines} lines`);
      }
      const size = effSize(eff);
      const e = size === 'l' ? linesAt(eff, 19, CARD_INNER) : size === 'm' ? linesAt(eff, 15, CARD_INNER) : linesAt(eff, 11, CARD_INNER);
      if (e.lines > (size === 's' ? 2 : 1) || e.widest > CARD_INNER) bad.push(`${d.id} effect "${eff}" (${size}): ${e.lines} lines`);
      // the name, in tracked small caps, on one line
      const [px, track] = longName(d.name) ? [8.5, 0.02] : [9.5, 0.07];
      const name = lineWords(d.name.toUpperCase(), 700).reduce((t, w) => t + w, 0) * px + d.name.length * track * px + (d.name.split(' ').length - 1) * 0.2 * px;
      if (name > CARD_INNER + 4) bad.push(`${d.id} name "${d.name}": ${Math.round(name)}px`);
    }
    expect(bad).toEqual([]);
  });

  it('splits the plate\'s examples the plate\'s way', () => {
    const byId = id => members.find(m => m.id === id);
    expect(cardLines(byId('gold.prospector'))).toEqual({ when: 'When an action gains you gold', eff: '+1 gold' });
    expect(cardLines(byId('red.recruiter'))).toEqual({ when: 'When you recruit', eff: '+1 red' });
    expect(cardLines(byId('gold.banker'))).toEqual({ when: 'Now + round start', eff: '+3 gold' });
    expect(cardLines(byId('blue.pillar'))).toEqual({ when: '', eff: '5 @f' });
  });
});
