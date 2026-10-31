// The hover delay: one constant (hoverDelay.js). Cory, 2026-10-25: 0, hovers open the moment you point and the wait moved
// to closing (was 200ms, Cory 2026-10-15, "not nonstop hovers"). A card already up swaps at once; a click or tap pins at once.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { createGame } from '../../../engine/v4/index.js';
import { createHover, HoverCardLayer } from '../../../v4/game/HoverCards.jsx';
import { HOVER_DELAY_MS, HOVER_OPEN_MS } from '../../../v4/game/hoverDelay.js';
import { MO } from '../../../v4/motion.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const target = () => { const el = document.createElement('div'); document.body.appendChild(el); return el; };

describe('the hover delay', () => {
  // Cory, 2026-10-25: hovers open the moment you point; the wait moved to closing (MO.hoverClose)
  it('is one constant, 0ms: no wait to open', () => { expect(HOVER_DELAY_MS).toBe(0); });

  it('opens a card the moment the pointer arrives (a frame to place it), whole', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    render(<HoverCardLayer hover={hover} state={s} me={0} />);
    const layer = document.querySelector('[data-hover-layer]');
    act(() => { hover.onPlaqueHover(s.quadrants[0], target()); });
    expect(layer.hasAttribute('data-prep')).toBe(true); // drawn hidden this frame, placed
    act(() => { vi.advanceTimersByTime(HOVER_OPEN_MS); });
    expect(hover.card && hover.card.qid).toBe(s.quadrants[0]);
    expect(layer.dataset.open).toBe('1');
    expect(layer.querySelector('.lt-note').textContent).toMatch(/at this round’s end/);
    hover.dispose();
  });

  it('leaving keeps the card a beat, then closes it; coming back in time keeps it', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    const el = target();
    hover.onPlaqueHover(s.quadrants[0], el);
    vi.advanceTimersByTime(HOVER_OPEN_MS);
    hover.onPlaqueHover(s.quadrants[0], null);
    vi.advanceTimersByTime(MO.hoverClose - 1);
    expect(hover.card).not.toBeNull();
    hover.onPlaqueHover(s.quadrants[0], el);
    vi.advanceTimersByTime(MO.hoverClose * 3);
    expect(hover.card && hover.card.qid).toBe(s.quadrants[0]);
    hover.onPlaqueHover(s.quadrants[0], null);
    vi.advanceTimersByTime(MO.hoverClose);
    expect(hover.card).toBeNull();
    hover.dispose();
  });

  it('with a card up, the next one swaps in at once; a click pins at once', () => {
    vi.useFakeTimers();
    const s = createGame({ seats, seed: 7 });
    const hover = createHover();
    hover.onPlaqueHover(s.quadrants[0], target());
    vi.advanceTimersByTime(HOVER_OPEN_MS);
    expect(hover.card && hover.card.qid).toBe(s.quadrants[0]);
    hover.onPlaqueHover(s.quadrants[1], target());
    expect(hover.card.qid).toBe(s.quadrants[1]);
    hover.close();
    hover.onPlaqueHover(s.quadrants[2], target(), { pinned: true });
    expect(hover.card.pinned).toBe(true);
    hover.dispose();
  });
});


it('keeps a pinned recruit sheet when the controller rejects a fast tap', () => {
  const state = createGame({ seats, seed: 7 });
  const uid = state.shop[0], hover = createHover(), onPick = vi.fn();
  const option = { id: `card:${uid}` };
  const { getByRole } = render(<HoverCardLayer hover={hover} state={state} me={0} optionFor={id => id === option.id ? option : null} onPick={onPick} />);
  act(() => hover.onCardHover(uid, target(), { pinned: true }));
  fireEvent.click(getByRole('button', { name: 'Recruit', exact: true }));
  expect(onPick).toHaveBeenCalledWith(option.id);
  expect(hover.card?.pinned).toBe(true);
  expect(getByRole('button', { name: 'Recruit', exact: true })).toBeTruthy();
  // GameScreen owns the accepted-command close after its animation, tap and legality guards.
  onPick.mockImplementation(() => hover.close());
  fireEvent.click(getByRole('button', { name: 'Recruit', exact: true }));
  expect(hover.card).toBeNull();
  hover.dispose();
});
