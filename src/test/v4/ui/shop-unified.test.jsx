import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { createGame } from '../../../engine/v4/index.js';
import { resume } from '../../../engine/v4/core.js';
import { iconFor } from '../../../v4/art/index.js';
afterEach(() => { cleanup(); localStorage.clear(); });
it('puts follower offers in the member grid, matching art/name/cost card anatomy', () => {
  let s = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Bo', kind: 'human' }], quadrants: ['gold','red','purple','echo'], seed: 51 });
  s.pending = null; s.queue = [{ t: 'buy', p: 0 }];
  s.players[0].res = Object.fromEntries(s.resources.map(r => [r, 6]));
  s = resume(s);
  const pick = vi.fn();
  const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={id => s.pending.options.find(o => o.id === id)} onPick={pick} phase="buy" />);
  expect(container.querySelector('.lt-rates-head')).toBeNull();
  const tiers = [...container.querySelectorAll('.lt-cards .lt-rate.lt-card')];
  expect(tiers).toHaveLength(3);
  for (const [i, card] of tiers.entries()) {
    const n = [1,5,10][i];
    expect(card.querySelector('.art .get').textContent).toBe(String(n));
    expect(card.querySelector('.nm').textContent).toBe('Followers');
    expect(card.querySelector('.ft .lt-cost').getAttribute('aria-label')).toBe(`${n} any`);
    expect(card.querySelector('.ft .val')).toBeNull();
  }
  fireEvent.click(tiers[0]);
  expect(pick).toHaveBeenCalledWith('tier:small');
  expect(container.querySelector('[data-done-no-buy="on"]')).not.toBeNull();
});
it('all new Red members have distinct explicit portraits', () => {
  for (const key of ['panel','loyalists','recruitbonus','movementpenalty']) {
    const art = iconFor(`red.${key}`);
    expect(art.drawn).toBe(true);
    expect(art.icon.id).toBe(`red.${key}`);
  }
});
it('the "affordable" toggle fades the members you cannot pay for, and is remembered (Cory, 2026-10-18)', () => {
  let s = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Bo', kind: 'human' }], quadrants: ['gold','red','purple','echo'], seed: 51 });
  s.pending = null; s.queue = [{ t: 'buy', p: 0 }];
  s.players[0].res = Object.fromEntries(s.resources.map(r => [r, 2]));
  s = resume(s);
  const optionFor = id => s.pending.options.find(o => o.id === id);
  const view = () => render(<ShopCards state={s} me={0} mySeats={[0]} optionFor={optionFor} onPick={() => {}} phase="buy" />);
  let { container } = view();
  const members = () => [...container.querySelectorAll('.lt-cards .lt-card[data-uid]')];
  const btn = () => container.querySelector('button[aria-label="Fade members you can\'t afford"]');
  // off by default: nothing fades, the toggle sits with the other two
  expect(btn().getAttribute('aria-pressed')).toBe('false');
  expect(btn().parentElement.className).toBe('lt-shop-controls');
  expect(container.querySelector('.lt-shop-cards').hasAttribute('data-fade')).toBe(false);
  expect(members().some(c => c.hasAttribute('data-unaffordable'))).toBe(false);
  fireEvent.click(btn());
  expect(btn().getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.lt-shop-cards').getAttribute('data-fade')).toBe('on');
  // exactly the ones no buy option offers fade; the ones you can recruit stay bright
  const faded = members().filter(c => c.hasAttribute('data-unaffordable'));
  const bright = members().filter(c => !c.hasAttribute('data-unaffordable'));
  expect(faded.length).toBeGreaterThan(0);
  expect(bright.length).toBeGreaterThan(0);
  for (const c of faded) expect(optionFor(`card:${c.dataset.uid}`)).toBeFalsy();
  for (const c of bright) expect(optionFor(`card:${c.dataset.uid}`)).toBeTruthy();
  // remembered for this viewer: a fresh shop opens faded
  cleanup();
  ({ container } = view());
  expect(btn().getAttribute('aria-pressed')).toBe('true');
  expect(members().filter(c => c.hasAttribute('data-unaffordable'))).toHaveLength(faded.length);
  // a spectator has nothing to afford: no toggle, no fade
  cleanup();
  ({ container } = render(<ShopCards state={s} me={null} onPick={() => {}} phase="buy" />));
  expect(btn()).toBeNull();
  expect(members().some(c => c.hasAttribute('data-unaffordable'))).toBe(false);
});
