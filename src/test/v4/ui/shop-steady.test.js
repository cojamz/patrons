// The shop row holds still within a round (wave-2 tester b #40: cards re-sorted under the pointer after every recruit):
// a refill takes the place of the card that left; the row re-sorts only at a new round or when the sort changes.
import { describe, it, expect } from 'vitest';
import { steadyOrder } from '../../../v4/game/ShopCards.jsx';

describe('steadyOrder', () => {
  it('a refill takes the slot the recruited card left; nothing else moves', () => {
    expect(steadyOrder({ key: 'cost|1', uids: [1, 2, 3, 4] }, 'cost|1', [9, 1, 3, 4])).toEqual([1, 9, 3, 4]);
  });
  it('two cards leave and two arrive: each fills a vacated slot, in sorted order', () => {
    expect(steadyOrder({ key: 'cost|2', uids: [1, 2, 3, 4] }, 'cost|2', [7, 1, 8, 4])).toEqual([1, 7, 8, 4]);
  });
  it('an empty pile shortens the row without moving the rest', () => {
    expect(steadyOrder({ key: 'cost|3', uids: [1, 2, 3, 4] }, 'cost|3', [1, 3, 4])).toEqual([1, 3, 4]);
  });
  it('a new round or a new sort takes the sorted order', () => {
    expect(steadyOrder({ key: 'cost|1', uids: [1, 2, 3, 4] }, 'cost|2', [9, 1, 3, 4])).toEqual([9, 1, 3, 4]);
    expect(steadyOrder({ key: 'cost|1', uids: [1, 2, 3, 4] }, 'color|1', [4, 3, 2, 1])).toEqual([4, 3, 2, 1]);
    expect(steadyOrder(null, 'cost|1', [2, 1])).toEqual([2, 1]);
  });
});
