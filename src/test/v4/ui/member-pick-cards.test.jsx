import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createGame, cardDef } from '../../../engine/v4/index.js';
import ShopCards, { SORT_KEY, VIEW_KEY } from '../../../v4/game/ShopCards.jsx';

afterEach(() => { cleanup(); localStorage.removeItem(SORT_KEY); localStorage.removeItem(VIEW_KEY); });
const seats = [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }];
const table = () => createGame({ seats, seed: 31 });

describe('member choice readability', () => {
  it('puts the full ability on each card during a member choice and keeps the engine option clickable', () => {
    const base = table();
    const options = base.shop.slice(0, 3).map(uid => ({ id: `take:${uid}`, kind: 'card', value: uid, target: { uid } }));
    const state = { ...base, pending: { kind: 'choose', player: 0, prompt: 'Hand-pick: take a member', options } };
    const onPick = vi.fn();
    const optionFor = key => options.find(o => key === `card:${o.value}`);
    const { container, rerender } = render(<ShopCards state={state} me={0} mySeats={[0]} optionFor={optionFor} onPick={onPick} />);
    expect(container.querySelector('[data-member-pick]')).not.toBeNull();
    expect(container.querySelectorAll('.lt-pick-ability')).toHaveLength(state.shop.length);
    for (const uid of state.shop) {
      const el = container.querySelector(`[data-uid="${uid}"]`);
      expect(el.querySelector('.lt-pick-ability').textContent.length).toBeGreaterThan(0);
      expect(el.getAttribute('data-hint')).toContain(cardDef(state, uid).text);
    }
    fireEvent.click(container.querySelector(`[data-option="${options[0].id}"]`));
    expect(onPick).toHaveBeenCalledWith(options[0].id);
    rerender(<ShopCards state={{ ...state, pending: { ...state.pending, kind: 'buy' } }} me={0} mySeats={[0]} optionFor={optionFor} onPick={onPick} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
    expect(container.querySelector('.lt-pick-ability')).toBeNull();
  });

  it('does not expand the shop for a choice elsewhere on the board or another player', () => {
    const base = table();
    const state = { ...base, pending: { kind: 'choose', player: 0, options: [{ id: 'color:red', kind: 'resource', value: 'red' }] } };
    const { container, rerender } = render(<ShopCards state={state} me={0} mySeats={[0]} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
    rerender(<ShopCards state={state} me={1} mySeats={[1]} optionFor={() => ({ id: 'irrelevant' })} />);
    expect(container.querySelector('[data-member-pick]')).toBeNull();
  });
});


describe('shop reading controls', () => {
  it('switches sort order with either half of one click target and remembers detailed cards', () => {
    const base = table();
    const props = { state: base, me: 0, mySeats: [0] };
    const { container, getByRole, unmount } = render(<ShopCards {...props} />);
    const sort = getByRole('switch', { name: 'Group members by color' });
    expect(sort.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sort.querySelector('span'));
    expect(sort.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sort.querySelector('span:last-child'));
    expect(sort.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(getByRole('button', { name: 'Show member abilities' }));
    expect(container.querySelectorAll('.lt-pick-ability')).toHaveLength(base.shop.length);
    expect(localStorage.getItem(VIEW_KEY)).toBe('details');
    unmount();
    const again = render(<ShopCards {...props} />);
    expect(again.container.querySelector('[data-view="details"]')).not.toBeNull();
  });

  it('does not repeat an expanded ability in a mouse hover and still recruits on a deliberate click', () => {
    localStorage.setItem(VIEW_KEY, 'details');
    const base = table();
    const onCardHover = vi.fn(), onPick = vi.fn();
    const options = base.shop.map(uid => ({ id: `card:${uid}`, kind: 'card', uid }));
    const state = { ...base, pending: { kind: 'buy', player: 0, options } };
    const { container } = render(<ShopCards state={state} me={0} mySeats={[0]} optionFor={key => options.find(o => o.id === key)} onPick={onPick} hover={{ onCardHover, subscribe: () => () => {}, space: null }} />);
    const card = container.querySelector('.lt-card');
    fireEvent.pointerEnter(card, { pointerType: 'mouse' });
    expect(onCardHover).not.toHaveBeenCalled();
    fireEvent.click(card);
    expect(onPick).toHaveBeenCalledWith(card.dataset.option);
  });
});
