import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Rich, CostPips } from '../../../v4/game/Rich.jsx';

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
