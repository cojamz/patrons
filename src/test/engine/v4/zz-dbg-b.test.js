import { it } from 'vitest';
import { take, move, pinCosts } from './helpers.js';
import { table, uidIn } from './cards-helpers-b.js';
it('dbg', () => {
  let s = table(['gold', 'red', 'trading', 'thieves'], { members: [['trading.lender', 'red.twins']], shop: ['red.doppel', 'red.intern'], res: [{ red: 4, gold: 2 }] });
  s.cards[uidIn(s, 'trading.lender', 0)].loanPaid = true;
  s = move(take(s, 'Haggle'), `card:${uidIn(s, 'red.doppel', 'shop')}`);
  console.log(s.pending, s.log);
});
