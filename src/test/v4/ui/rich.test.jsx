import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Rich, CostPips } from '../../../v4/game/Rich.jsx';
import { anyDotVars } from '../../../v4/game/Glyphs.jsx';

const pips = c => [...c.querySelectorAll('.pip')].map(p => p.getAttribute('aria-label'));

describe('resource symbols in text (Cory, 2026-10-14)', () => {
  it('turns resource words into labelled symbols and keeps quadrant names as words', () => {
    const { container } = render(<Rich text="Silver spaces give you twice the silver, +3 gold." />);
    expect(pips(container)).toEqual(['silver', 'gold']);
    expect(container.textContent).toContain('Silver spaces');
  });
  it('"2 any" becomes the wild symbol; "in any colors" and "any face-up member" keep their word', () => {
    const { container } = render(<Rich text="Pay 2 any, take it in any colors, or recruit any face-up member." />);
    expect(pips(container)).toEqual(['any resources']);
    expect(container.textContent).toContain('in any colors');
    expect(container.textContent).toContain('any face-up member');
  });
  it('costs render as number + symbol, each symbol says what it is', () => {
    const { container } = render(<CostPips parts={[{ color: 'magenta', n: 4 }, { color: 'any', n: 2 }]} />);
    expect(pips(container)).toEqual(['4 magenta', '2 any resources']);
    expect(container.querySelectorAll('.pip[title]').length).toBe(2);
  });
});

describe('two symbols only, words for the rest (Cory, 2026-10-15: simplify)', () => {
  it('the old marks print as plain words; only the dot and the follower are drawn', () => {
    const { container } = render(<Rich text="+1 gold/@m · swap @m with @r · 8 purple → @t · ↻ · +1 purple/@n · silver for @f" />);
    expect(container.querySelectorAll('svg:not(.res-glyph):not(.follower-mark)').length).toBe(0);
    expect(container.querySelectorAll('.follower-mark').length).toBe(1);
    expect(container.textContent.replace(/followers?/g, '')).toBe('+1 per member · swap member with rival · 8 becomes extra turn · extra turn · +1 per minion ·  for '); // resource words are dots
  });
  it('a spaced "2 / 4 / 6" (by round) stays text; numbers are heavy and sit right on their dot', () => {
    const { container } = render(<Rich text="Gain 2 / 4 / 6 gold, or 3 followers." />);
    expect(container.querySelectorAll('[data-op]').length).toBe(0);
    expect([...container.querySelectorAll('.rich-n')].map(e => e.textContent)).toEqual(['2', '4', '6', '3']);
    expect(container.textContent).toContain('6, or 3followers.'); // the mark's own title, right after its number
  });
  it('the "any" dot puts each table color where its quadrant sits (q0 bottom, q1 left, q2 top, q3 right)', () => {
    expect(anyDotVars(['gold', 'red', 'blue', 'green'])).toEqual({ '--any-top': 'var(--blue)', '--any-right': 'var(--green)', '--any-bottom': 'var(--gold)', '--any-left': 'var(--red)' });
  });
});
