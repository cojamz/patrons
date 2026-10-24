// Cory, 2026-10-20: "the member shop should refresh each round, and you should see it happen as an animation". The
// table holds the scored board while the round card is up, so the new round arrives at the closing move's own number;
// the old row must still be read as leaving for the deck (shopOuts), and the new one deals only after it (rowOutMs).
import { expect, it } from 'vitest';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { shopOuts, rowOutMs, dealAfter } from '../../../v4/game/director.js';
import { scoringSnapshot } from '../../../v4/format.js';
import { MO, setMotionSpeed } from '../../../v4/motion.js';

const SEATS = [{ name: 'P1', kind: 'bot' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];

function closing(seed) {
  let s = createGame({ seats: SEATS, seed });
  const rand = seededRandom(seed);
  for (let n = 0; n < 3000 && !s.over; n++) {
    const next = applyMove(s, chooseBotMove(s, rand), { effects: true });
    if (next.round > s.round && s.round >= 1) return { prev: s, next };
    s = next;
  }
  return null;
}

it('reads a new round\'s fresh row as the old cards leaving for the deck, from the scored board', () => {
  let checked = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const c = closing(seed);
    if (!c) continue;
    const board = scoringSnapshot(c.prev, c.next);
    if (!board) continue;
    expect(board.round).toBe(c.prev.round);
    expect(c.next.moves).toBe(board.moves);
    const outs = shopOuts(board, c.next);
    // every card of the old row that isn't in the new one leaves, in the old row's order
    expect(outs).toEqual(board.shop.filter(u => !c.next.shop.includes(u)));
    expect(outs.length).toBeGreaterThan(0);
    // the same board twice, or a step inside the round, sends nothing
    expect(shopOuts(board, board)).toEqual([]);
    checked++;
  }
  expect(checked).toBeGreaterThan(2);
});

it('a sweep inside a round reads its shop-out effects; anything else sends nothing', () => {
  const before = { moves: 4, round: 1, shop: [1, 2, 3] };
  const swept = { moves: 5, round: 1, shop: [4, 5, 6], effects: [{ type: 'shop-out', what: { uid: 1 } }, { type: 'shop-out', what: { uid: 2 } }, { type: 'refill', what: { uid: 4 } }] };
  expect(shopOuts(before, swept)).toEqual([1, 2]);
  expect(shopOuts(before, { moves: 5, round: 1, shop: [1, 2, 3], effects: [] })).toEqual([]);
  // a new game (round 0 → I) deals its first row with nothing to send back
  expect(shopOuts({ moves: 0, round: 0, shop: [1] }, { moves: 0, round: 1, shop: [2] })).toEqual([]);
});

it('the new row deals once the old one is halfway to the deck, within the motion budget', () => {
  setMotionSpeed('steady');
  expect(rowOutMs(0)).toBe(0);
  expect(rowOutMs(1)).toBe(Math.round(MO.shopSlide / 2));
  expect(rowOutMs(7)).toBe(Math.round(MO.shopSlide / 2 + 6 * MO.rowOutStagger));
  // the whole refresh (seven out, seven in) is brief: under a second at Quick, a second and a half at Steady (it runs
  // beside the minions going home and never holds the chain: planChain has no shop atom)
  const whole = () => rowOutMs(7) + 6 * MO.dealStagger + MO.deal;
  expect(whole()).toBeLessThan(1500);
  setMotionSpeed('quick');
  expect(whole()).toBeLessThan(1000);
  setMotionSpeed('steady');
  expect(dealAfter({ effects: Array.from({ length: 3 }, (_, k) => ({ type: 'shop-out', what: { uid: k } })) })).toBe(rowOutMs(3));
});
