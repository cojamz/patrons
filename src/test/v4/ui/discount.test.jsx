// A discount on you shows on the shop's faces (decisions.md, 2026-10-15): the price you'd pay in its dots ("free" at
// 0), the list price small and struck beside it; the card's hover names the discount. Read off the engine's price.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, cardDef, memberPrice } from '../../../engine/v4/index.js';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { MemberCard } from '../../../v4/game/Info.jsx';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];

describe('discounts on the shop faces', () => {
  it('no discount: list prices only', () => {
    const s = createGame({ seats, seed: 4 });
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} />);
    expect(container.querySelectorAll('.lt-card .cost-was').length).toBe(0);
  });
  it('4 off: each face shows what you pay and the list struck; a card of 4 or less is free', () => {
    const s = createGame({ seats, seed: 4 });
    s.players[0].discount = 4;
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} />);
    for (const el of container.querySelectorAll('.lt-card[data-uid]')) {
      const uid = Number(el.dataset.uid), d = cardDef(s, uid), list = d.s + d.w;
      if (list === 0) continue;
      const was = el.querySelector('.cost-was');
      expect(was && Number(was.textContent)).toBe(list);
      const pays = memberPrice(s, s.players[0], uid).total;
      expect(Number(el.querySelector('.cost-now').dataset.paid)).toBe(pays);
      if (pays === 0) expect(el.querySelector('.cost-now .lt-cost.free')).not.toBeNull();
    }
  });
  it('the hover names it', () => {
    const s = createGame({ seats, seed: 4 });
    s.players[0].discount = 4;
    const uid = s.shop[0];
    const { container } = render(<MemberCard state={s} uid={uid} me={0} />);
    expect(container.querySelector('[data-discount]').textContent).toMatch(/your next member costs 4 less/);
  });
});
