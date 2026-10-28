// A card in the pile or the shop belongs to nobody and carries nothing (fuzz: "in the pile/shop still has …").
// Tryout (round I rework, 2026-10-27) runs a shop member's On Recruit in place, and the member stays in the shop:
// whatever that effect writes on the card must not stay on it.
import { it, expect } from 'vitest';
import { sceneQ } from './cards-helpers.js';
import { take, move } from './helpers.js';

const clean = (s, uid) => expect(s.cards[uid]).toEqual({ uid, def: s.cards[uid].def });
const shopCard = (s, def) => s.shop.find(u => s.cards[u].def === def);

it('Tryout on Hustler: the color you pick is not left on the shop card', () => {
  let s = sceneQ({ quadrants: ['red', 'gold', 'purple', 'echo'], shop: ['gold.hustler'] });
  const uid = shopCard(s, 'gold.hustler');
  s = take(s, 'red.evenswap');
  s = move(s, `card:${uid}`);
  s = move(s, 'color:gold');
  expect(s.shop).toContain(uid);
  clean(s, uid);
});

it('Tryout on Night Owl with your last minion placed: the shop card keeps no round mark', () => {
  const before = sceneQ({ quadrants: ['red', 'gold', 'purple', 'echo'], shop: ['purple.nightowl'] });
  before.players[0].left = 1;
  const uid = shopCard(before, 'purple.nightowl');
  let s = take(before, 'red.evenswap');
  s = move(s, `card:${uid}`);
  expect(s.log.some(l => l.includes('Night Owl'))).toBe(true);
  expect(s.shop).toContain(uid);
  clean(s, uid);
});
