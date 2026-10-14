// Default payment never spends a color whose contest you lead or tie, when another way exists (tester Q's scene).
import { it, expect } from 'vitest';
import { createGame, paymentChoices, followerChoices, TIERS } from '../../../engine/v4/index.js';

// Q's scene: 1 green, leading green alone (and then tied); a buy that could spend green or something else.
function scene(resP0, resP1) {
  const s = createGame({ seats: [{ name: 'Q' }, { name: 'B' }], seed: 3 });
  s.players[0].res = { ...resP0 }; s.players[1].res = { ...resP1 };
  return s;
}
it('1-of-a-color lead: the default follower buy keeps the lone green', () => {
  const s = scene({ gold: 1, red: 2, blue: 0, green: 1 }, { gold: 0, red: 0, blue: 0, green: 0 });
  const w = followerChoices(s, s.players[0], TIERS[0]);
  expect(w[0].green || 0).toBe(0);
});
it('tie on green also protects it', () => {
  const s = scene({ gold: 1, red: 2, blue: 0, green: 1 }, { gold: 0, red: 0, blue: 0, green: 1 });
  const w = followerChoices(s, s.players[0], TIERS[0]);
  expect(w[0].green || 0).toBe(0);
});
it('member "any" part avoids the led green', () => {
  const s = scene({ gold: 0, red: 3, blue: 0, green: 1 }, { gold: 0, red: 0, blue: 0, green: 0 });
  const uid = s.shop.find(u => { const d = s.cards[u].def; return d.startsWith('red.'); });
  if (uid === undefined) return;
  const w = paymentChoices(s, s.players[0], uid);
  if (w.length > 1) expect(w[0].green || 0).toBe(0);
});
