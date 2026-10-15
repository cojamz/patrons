// QA, wave 2: a member's card closed as the pointer crossed its seat toward "Use", and the seat card did the same,
// because whatever the pointer crossed opened its own card over it. hoverIntent.js keeps the card the pointer is
// heading for (the menu-aim triangle from its last spot inside what it left), and lets go once it heads elsewhere.
import { describe, it, expect, beforeEach } from 'vitest';
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
  beforeEach(() => { arrived(); document.body.innerHTML = ''; });
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
    expect(heading({ x: 100, y: 40 })).toBe(false); // up to the next seat, away from the card
    expect(aimedAt()).toBe(c); // the aim stays until it ends; only the step is off course
    arrived(c);
    expect(heading({ x: 400, y: 250 })).toBe(false);
    const d = card(-9999, 0, 280, 300); // the hover layer parked off screen: nothing to head for
    aimAt(d, { x: 100, y: 150 });
    expect(heading({ x: 50, y: 150 })).toBe(false);
  });
  it('a card with no buttons holds nothing up: what it covers stays easy to point at', () => {
    const c = card(360, 100, 280, 300, false);
    move(100, 150); move(110, 152);
    aimAt(c);
    expect(heading({ x: 200, y: 200 })).toBe(false);
    expect(heading({ x: 400, y: 250 })).toBe(false);
  });
});
