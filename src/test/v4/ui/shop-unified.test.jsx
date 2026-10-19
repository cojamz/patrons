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
