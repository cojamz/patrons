// The hover delay (Cory, 2026-10-15: "hovers should have a small delay before firing, so as a mouse moves across the
// screen there's not nonstop hovers"): one constant (hoverDelay.js); a card opens only after the pointer rests that
// long, drawn hidden meanwhile so it shows whole at once; a sweep opens nothing; a card already up swaps at once; a
// click or tap pins at once.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { createGame } from '../../../engine/v4/index.js';
import { createHover, HoverCardLayer } from '../../../v4/game/HoverCards.jsx';
import { HOVER_DELAY_MS } from '../../../v4/game/hoverDelay.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const target = () => { const el = document.createElement('div'); document.body.appendChild(el); return el; };

describe('the hover delay', () => {
  it('is one constant, 200ms', () => { expect(HOVER_DELAY_MS).toBe(200); });

  it('opens a card only after the pointer rests the delay, and draws it hidden meanwhile (the same element is then shown)', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    render(<HoverCardLayer hover={hover} state={s} me={0} />);
    const layer = document.querySelector('[data-hover-layer]');
    act(() => { hover.onPlaqueHover(s.quadrants[0], target()); });
    expect(hover.card).toBeNull();
    expect(layer.dataset.open).toBe('0');
    expect(layer.hasAttribute('data-prep')).toBe(true);
    const drawn = layer.querySelector('.lt-note');
    expect(drawn).not.toBeNull();
    expect(drawn.textContent).toMatch(/Round end/);
    act(() => { vi.advanceTimersByTime(HOVER_DELAY_MS - 1); });
    expect(layer.dataset.open).toBe('0');
    act(() => { vi.advanceTimersByTime(1); });
    expect(layer.dataset.open).toBe('1');
    expect(layer.hasAttribute('data-prep')).toBe(false);
    expect(layer.querySelector('.lt-note')).toBe(drawn); // not re-drawn: shown
    hover.dispose();
  });

  it('a sweep (moving on within the delay) opens nothing; leaving cancels', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    for (const qid of s.quadrants) {
      hover.onPlaqueHover(qid, target());
      vi.advanceTimersByTime(HOVER_DELAY_MS / 4);
      hover.onPlaqueHover(qid, null);
    }
    vi.advanceTimersByTime(HOVER_DELAY_MS * 3);
    expect(hover.card).toBeNull();
    expect(hover.prep).toBeNull();
    hover.dispose();
  });

  it('with a card up, the next one swaps in at once; a click pins at once', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    hover.onPlaqueHover(s.quadrants[0], target());
    vi.advanceTimersByTime(HOVER_DELAY_MS);
    expect(hover.card && hover.card.qid).toBe(s.quadrants[0]);
    hover.onPlaqueHover(s.quadrants[1], target());
    expect(hover.card.qid).toBe(s.quadrants[1]);
    hover.close();
    hover.onPlaqueHover(s.quadrants[2], target(), { pinned: true });
    expect(hover.card.pinned).toBe(true);
    hover.dispose();
  });
});
