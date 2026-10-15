// QA, wave 2: a member's card closed as the pointer crossed its seat toward "Use", and the seat card did the same,
// because whatever the pointer crossed opened its own card over it. hoverIntent.js keeps the card the pointer is
// heading for (the menu-aim triangle from its last spot inside what it left), and lets go once it heads elsewhere.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aimAt, arrived, heading, aimedAt } from '../../../v4/game/hoverIntent.js';

const rect = (left, top, width, height) => () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
// a card, with a button filling it (what the pointer heads for is a card's buttons; a card with none holds nothing)
const card = (left, top, width, height, buttons = true) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  el.getBoundingClientRect = rect(left, top, width, height);
  if (buttons) { const b = document.createElement('button'); b.getBoundingClientRect = rect(left + 10, top + 10, width - 20, height - 20); el.appendChild(b); }
  return el;
};
const move = (x, y) => window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }));

describe('hover intent', () => {
  let now = 1000;
  beforeEach(() => { arrived(); document.body.innerHTML = ''; now = 1000; vi.spyOn(performance, 'now').mockImplementation(() => now); });
  afterEach(() => vi.restoreAllMocks());
  it('keeps the card while the pointer crosses toward it, from its last spot inside what it left', () => {
    const c = card(360, 100, 280, 300);
    move(100, 150); move(110, 152); // inside the seat, then the step that leaves it
    aimAt(c);
    expect(aimedAt()).toBe(c);
    expect(heading({ x: 200, y: 200 })).toBe(true); // on the way, toward the card's near edge
    expect(heading({ x: 400, y: 250 })).toBe(true); // on the card
  });
  it('lets go when the pointer heads elsewhere, or the card is gone', () => {
    const c = card(360, 100, 280, 300);
    move(100, 150); move(101, 150);
    aimAt(c);
    expect(heading({ x: 100, y: 170 })).toBe(true); // right after leaving, a detour near where it left still holds it (w3b #47)
    expect(heading({ x: 100, y: 40 })).toBe(false); // but a pointer gone well away, the other way, is going elsewhere (w4b #2)
    now += 350;
    expect(heading({ x: 90, y: 0 })).toBe(false); // and later, too
    expect(aimedAt()).toBe(c); // the aim stays until it ends; only the step is off course
    arrived(c);
    expect(heading({ x: 400, y: 250 })).toBe(false);
    const d = card(-9999, 0, 280, 300); // the hover layer parked off screen: nothing to head for
    aimAt(d, { x: 100, y: 150 });
    expect(heading({ x: 50, y: 150 })).toBe(false);
  });
  it('a wandering route (down out of the member first, then over to its card) still finds it', () => {
    const c = card(360, 100, 280, 300);
    move(100, 150); move(100, 170);
    aimAt(c);
    expect(heading({ x: 100, y: 190 })).toBe(true); // down first, within the grace
    now += 350;
    expect(heading({ x: 200, y: 220 })).toBe(true); // then on toward the card, measured from where it got to
  });
  it('a card with no buttons holds nothing up: what it covers stays easy to point at', () => {
    const c = card(360, 100, 280, 300, false);
    move(100, 150); move(110, 152);
    aimAt(c);
    expect(heading({ x: 200, y: 200 })).toBe(false);
    expect(heading({ x: 400, y: 250 })).toBe(false);
  });
});
