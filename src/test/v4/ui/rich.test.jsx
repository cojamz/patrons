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
  it('"2 any" and "in any colors" become the wild symbol; "any face-up member" keeps its word', () => {
    const { container } = render(<Rich text="Pay 2 any, take it in any colors, or recruit any face-up member." />);
    expect(pips(container)).toEqual(['any resources', 'any resources']);
    expect(container.textContent).toContain('any face-up member');
  });
  it('costs render as number + symbol, each symbol says what it is', () => {
    const { container } = render(<CostPips parts={[{ color: 'magenta', n: 4 }, { color: 'any', n: 2 }]} />);
    expect(pips(container)).toEqual(['4 magenta', '2 any resources']);
    expect(container.querySelectorAll('.pip[title]').length).toBe(2);
  });
});

describe('the plate\'s marks in text (visual language, 2026-10-15)', () => {
  const marks = c => [...c.querySelectorAll('[data-mark], [data-op], .follower-mark')].map(e => e.dataset.mark || e.dataset.op || 'follower');
  it('draws @m @r @f @n @t, → ⇄ ↻ and ×, and a joined / as per', () => {
    const { container } = render(<Rich text="+1 gold/@m · @m ⇄ @r · 8 purple → @t@t · ×2 gold · +1 purple/@n · silver → @f" />);
    expect(marks(container)).toEqual(['/', 'member', 'member', 'swap', 'rival', 'arrow', 'turn', 'turn', '×', '/', 'minion', 'arrow', 'follower']);
    for (const e of container.querySelectorAll('[data-mark]')) expect(e.querySelector('title').textContent).toBeTruthy();
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
