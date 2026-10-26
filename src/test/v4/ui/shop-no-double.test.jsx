import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { createGame } from '../../../engine/v4/index.js';
import { resume } from '../../../engine/v4/core.js';
afterEach(() => { cleanup(); localStorage.clear(); });

// Cory's playtest, 2026-10-26: two Couriers in a shop of 8 (9 cards shown). Mid-animation the table shows the newer
// shop while the buy step still offers an older one's pile cards: a pile card dealt into the shop since then was drawn
// twice, under one key, and React kept the copy after the step moved on.
it('a pile card the buy step still offers, now dealt into the shop, shows once', () => {
  let s = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Bo', kind: 'human' }], quadrants: ['gold', 'red', 'purple', 'echo'], seed: 51 });
  s.pending = null; s.queue = [{ t: 'buy', p: 0 }];
  s.players[0].res = Object.fromEntries(s.resources.map(r => [r, 6]));
  s = resume(s);
  const dealt = s.shop[0];
  const stale = { ...s.pending, options: [...s.pending.options, { id: `card:${dealt}`, kind: 'card', uid: dealt, fromPile: true, label: 'x' }] };
  const shown = { ...s, pending: stale };
  const optionFor = id => stale.options.find(o => o.id === id);
  const { container, rerender } = render(<ShopCards state={shown} me={0} mySeats={[0]} optionFor={optionFor} onPick={() => {}} phase="buy" />);
  const uids = () => [...container.querySelectorAll('.lt-cards .lt-card[data-uid]')].map(c => c.dataset.uid);
  expect(uids().filter(u => u === String(dealt))).toHaveLength(1);
  // and once the step moves on, the row is exactly the shop
  const placing = { ...s, pending: null, queue: [] };
  rerender(<ShopCards state={placing} me={0} mySeats={[0]} optionFor={() => null} onPick={() => {}} phase="place" />);
  expect(uids().sort()).toEqual(s.shop.map(String).sort());
});
