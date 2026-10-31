import { describe, expect, it } from 'vitest';
import { clickOrder, dragOrder, peekMove } from '../../../v4/game/ShopCards.jsx';

// Peek's row (Cory, Oct 29): a click numbers a card next, a second click takes its number back, a drag sets the order
describe('Peek ordering', () => {
  const start = { order: [1, 2, 3, 4], fixed: 0 };
  it('a click numbers the card next', () => {
    const a = clickOrder(start, 3);
    expect(a).toEqual({ order: [3, 1, 2, 4], fixed: 1 });
    expect(clickOrder(a, 4)).toEqual({ order: [3, 4, 1, 2], fixed: 2 });
  });
  it('a click on a numbered card takes its number back; later numbers move up', () => {
    const a = clickOrder(clickOrder(start, 3), 4);
    expect(clickOrder(a, 3)).toEqual({ order: [4, 3, 1, 2], fixed: 1 });
  });
  it('a drag sets the order as it lies, every card numbered', () => {
    expect(dragOrder(start, 3, 0)).toEqual({ order: [4, 1, 2, 3], fixed: 4 });
    expect(dragOrder(start, 0, 2)).toEqual({ order: [2, 3, 1, 4], fixed: 4 });
  });
  it('Done sends the next card, then the rest as they lie', () => {
    expect(peekMove([4, 1, 2, 3], { placed: [], left: [1, 2, 3, 4] })).toBe('card:4');
    expect(peekMove([4, 1, 2, 3], { placed: [4], left: [1, 2, 3] })).toBe('keep');
    expect(peekMove([1, 2, 3, 4], { placed: [], left: [1, 2, 3, 4] })).toBe('keep');
  });
});
