// Every cult leader wears the same robe (Cory, 2026-10-14: "brown or gray; the emojis are what set them apart"):
// the seat's color never reaches the leader drawing, only the emoji on the medallion differs.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Leader, ROBE, LEADER_POSES } from '../../../v4/art/Leader.jsx';
import { playerColor } from '../../../v4/format.js';

afterEach(cleanup);
// the drawing is one <path> per colour (art/index.js pixelPaths): its pixels and their fills
const fills = el => [...el.querySelectorAll('svg > path')].map(r => `${r.getAttribute('d')}:${r.getAttribute('fill')}`).join('|');

describe('Leader', () => {
  it('renders the same robe for every seat, whatever color it is given', () => {
    const seats = [0, 1, 2, 3].map(id => playerColor(id));
    expect(new Set(seats).size).toBeGreaterThan(1); // the seats do have different accents
    const drawn = [...seats, '#ff0000', undefined].map(color => { const { container } = render(<Leader color={color} emoji="cat" />); const f = fills(container); cleanup(); return f; });
    expect(new Set(drawn).size).toBe(1);
    expect(drawn[0]).toContain(`:${ROBE}`); // the robe's base tone is there
  });

  it('only the emoji tells two leaders apart', () => {
    const a = render(<Leader color="#ff0000" emoji="cat" />).container.querySelector('svg');
    const b = render(<Leader color="#00ff00" emoji="frog" />).container.querySelector('svg');
    expect(a.dataset.emoji).toBe('cat');
    expect(b.dataset.emoji).toBe('frog');
    const body = el => [...el.children].filter(n => n.tagName === 'path').map(r => `${r.getAttribute('d')}:${r.getAttribute('fill')}`).join();
    expect(body(a)).toBe(body(b));
  });

  it('has the intro poses as frames of the same robe', () => {
    expect(LEADER_POSES).toEqual(expect.arrayContaining(['steeple', 'scheme', 'rubA', 'rubB', 'laughA', 'laughB', 'beckonA', 'beckonB']));
    for (const pose of LEADER_POSES) {
      const { container } = render(<Leader emoji="cat" pose={pose} />);
      const svg = container.querySelector('svg');
      expect(svg.dataset.pose).toBe(pose);
      expect(fills(container)).toContain(`:${ROBE}`);
      cleanup();
    }
  });
});
