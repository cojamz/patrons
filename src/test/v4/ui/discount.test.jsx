// A discount on you shows on the shop's faces (decisions.md, 2026-10-15): the price you'd pay in its dots ("free" at
// 0), the list price small and struck beside it; the card's hover names the discount. Read off the engine's price.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createGame, cardDef, memberPrice } from '../../../engine/v4/index.js';
import { grantDiscount } from '../../../engine/v4/discount.js';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { MemberCard, paidParts } from '../../../v4/game/Info.jsx';

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
  it('the hover names the source and amount, without repeating payment instructions', () => {
    const s = createGame({ seats, seed: 4 });
    grantDiscount(s.players[0], 4, 'Intro Offer');
    const uid = s.shop[0];
    const { container } = render(<MemberCard state={s} uid={uid} me={0} />);
    expect(container.querySelector('[data-discount]').textContent).toBe('Intro Offer: next member −4.');
    // the cost and nothing else about paying (Cory, 03:40: cut "You pay")
    expect(container.textContent).not.toMatch(/You pay|Pays|Choose how to pay/);
  });

  it('legacy discounts show the amount without inventing a source', () => {
    const s = createGame({ seats, seed: 4 });
    s.players[0].discount = 4;
    const { container } = render(<MemberCard state={s} uid={s.shop[0]} me={0} />);
    expect(container.querySelector('[data-discount]').textContent).toBe('Earlier discount: next member −4.');
    expect(container.querySelector('[data-discount]').textContent).not.toContain('Intro Offer');
  });

  it('the discount is said once in the shop, not on every hover; Half Price shows half on the faces (w4 A#23, A#42)', () => {
    const s = createGame({ seats, seed: 4 });
    s.players[0].discount = 4;
    const uid = s.shop[0];
    const face = render(<MemberCard state={s} uid={uid} me={0} onFace />);
    expect(face.container.querySelector('[data-discount]')).toBeNull();
    cleanup();
    const s2 = createGame({ seats, seed: 4 });
    const big = s2.shop.find(u => { const d = cardDef(s2, u); return d.s + d.w >= 4; });
    s2.pending = { kind: 'choose', player: 0, prompt: 'Half Price: recruit which member?', options: [] };
    const d = cardDef(s2, big);
    const parts = paidParts(s2, s2.players[0], big, d);
    expect(parts.reduce((t, x) => t + x.n, 0)).toBe(Math.floor((d.s + d.w) / 2));
  });
});
