// The member deck at the head of the shop strip (Cory): its count is the engine's pile, it ticks down as the row
// refills, it warms at ≤ 10 and shows an outline "empty" at 0; it has no hover (Cory, 2026-10-15). DeckCard (what's in it
// by color) stays tested for a later pile beside it.
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove, cardDef } from '../../../engine/v4/index.js';
import ShopCards from '../../../v4/game/ShopCards.jsx';
import { MemberDeck, DeckCard, deckColors, deckEdges, DECK_LOW } from '../../../v4/game/MemberDeck.jsx';
import { createHover, HoverCardLayer } from '../../../v4/game/HoverCards.jsx';

afterEach(cleanup);
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const play = (s, until) => { let t = s; for (let k = 0; k < 600 && !until(t); k++) t = applyMove(t, chooseBotMove(t, () => 0.3)); return t; };

describe('member deck', () => {
  it('shows the pile count on the deck, with no "in the pile" text left in the header', () => {
    const s = play(createGame({ seats, seed: 31 }), t => t.pending && t.pending.kind === 'place' && t.round >= 1);
    const { container } = render(<ShopCards state={s} me={0} mySeats={[0]} />);
    const deck = container.querySelector('[data-deck]');
    expect(Number(deck.dataset.left)).toBe(s.pile.length);
    expect(deck.querySelector('.n').textContent).toBe(String(s.pile.length));
    expect(container.querySelector('.lt-shop-head').textContent).not.toMatch(/in the pile/);
    expect(container.querySelectorAll('.lt-shop-body > [data-deck] + .lt-cards .card').length).toBe(s.shop.length); // the deck comes first
  });

  it('follows the engine through recruits and refills', () => {
    let s = play(createGame({ seats, seed: 32 }), t => t.pending && t.pending.kind === 'place' && t.round >= 1);
    const { container, rerender } = render(<ShopCards state={s} me={0} mySeats={[0]} />);
    let refills = 0;
    for (let k = 0; k < 160 && !s.over; k++) {
      const before = s.shop.slice();
      s = applyMove(s, chooseBotMove(s, () => 0.4));
      act(() => { rerender(<ShopCards state={s} me={0} mySeats={[0]} />); });
      if (s.shop.some(u => !before.includes(u))) refills++;
      expect(Number(container.querySelector('[data-deck]').dataset.left)).toBe(s.pile.length);
    }
    expect(refills).toBeGreaterThan(0);
  });

  it('warms at ≤ 10, thins as it empties and shows an outline "empty" at 0', () => {
    const s = createGame({ seats, seed: 33 });
    const at = n => ({ ...s, pile: s.pile.slice(0, n) });
    const cls = n => { const { container } = render(<MemberDeck state={at(n)} />); const d = container.querySelector('[data-deck]'); const out = { c: d.className, edges: d.querySelectorAll('.edge').length, text: d.textContent }; cleanup(); return out; };
    expect(cls(40).c).not.toMatch(/low/);
    expect(cls(DECK_LOW).c).toMatch(/\blow\b/);
    expect(cls(2).c).toMatch(/\blast\b/);
    const empty = cls(0);
    expect(empty.c).toMatch(/\bempty\b/);
    expect(empty.text).toBe('empty');
    expect(cls(40).edges).toBe(deckEdges(40));
    expect(deckEdges(40)).toBeGreaterThan(deckEdges(12));
    expect(deckEdges(12)).toBeGreaterThan(deckEdges(3));
  });

  it('its hover card counts each color on the table and colorless, adding up to the pile', () => {
    const s = createGame({ seats, seed: 34, quadrants: ['gold', 'red', 'market', 'echo'] });
    const rows = deckColors(s);
    expect(rows.map(r => r.key)).toEqual([...s.quadrants, 'colorless']);
    expect(rows.reduce((t, r) => t + r.n, 0)).toBe(s.pile.length);
    const off = s.pile.filter(u => !s.quadrants.includes(cardDef(s, u).quadrant)).length;
    expect(rows.find(r => r.key === 'colorless').n).toBe(off);
    const { container } = render(<DeckCard state={s} />);
    expect(container.querySelector('[data-deck-card]').dataset.left).toBe(String(s.pile.length));
    for (const r of rows) expect(container.querySelector(`[data-color="${r.key}"]`).dataset.n).toBe(String(r.n));
    expect(container.textContent).toMatch(/Swept members go to the bottom/);
    expect(container.textContent).not.toMatch(/★/);
  });

  it('the deck stays quiet on hover and opens the member browser on click', () => {
    const s = createGame({ seats, seed: 35 });
    const hover = createHover();
    const { container } = render(<><ShopCards state={s} me={0} mySeats={[0]} hover={hover} /><HoverCardLayer hover={hover} state={s} me={0} /></>);
    const deck = container.querySelector('[data-deck]');
    act(() => { fireEvent.pointerEnter(deck, { pointerType: 'mouse' }); });
    expect(document.querySelector('[aria-label="Browse members"]')).toBeNull();
    expect(container.querySelector('[data-hover-layer] [data-hover-card="deck"]')).toBeNull();
    expect(deck.matches('button[aria-haspopup="dialog"]')).toBe(true);
    act(() => { fireEvent.click(deck); });
    expect(document.querySelector('[aria-label="Browse members"]')).toBeTruthy();
    expect(deck.querySelector('.n').textContent).toBe(String(s.pile.length));
    hover.dispose();
  });
});
