// Default payment never spends a color whose contest you lead or tie, when another way exists (tester Q's scene).
import { it, expect } from 'vitest';
import { createGame, paymentChoices, followerChoices, TIERS } from '../../../engine/v4/index.js';
import { resume } from '../../../engine/v4/core.js';

// Q's scene: 1 green, leading green alone (and then tied); a buy that could spend green or something else.
function scene(resP0, resP1) {
  const s = createGame({ seats: [{ name: 'Q' }, { name: 'B' }], seed: 3, quadrants: ['gold', 'red', 'blue', 'green'] });
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

// Tester U: gold is wild and scores the gold contest, so the suggestion spends the least gold it can.
it('+1 follower (2 of anything) with gold, blue and red: pays without gold', () => {
  const s = scene({ gold: 1, red: 1, blue: 1, green: 0 }, { gold: 3, red: 3, blue: 3, green: 0 });
  const w = followerChoices(s, s.players[0], TIERS[0]);
  expect(w[0].gold || 0).toBe(0);
});
it('5 followers with gold 2, red 2, blue 3: spends red and blue before gold', () => {
  const s = scene({ gold: 2, red: 2, blue: 3, green: 0 }, { gold: 5, red: 5, blue: 5, green: 0 });
  const w = followerChoices(s, s.players[0], TIERS[1]);
  expect(w[0]).toMatchObject({ gold: 0, red: 2, blue: 3 });
});

// Wave-2 testers A#4, B#2: a single way to pay that spent a lead was paid at once, with no step to see or cancel it.
// The engine marks such a way (breaks: the colors whose lead or tie it gives up), so the screen asks before paying it.
it('a way to pay that gives up a lead says which colors (breaks); one that keeps them all says nothing', () => {
  const s = scene({ gold: 3, red: 2, blue: 0, green: 0 }, { gold: 1, red: 0, blue: 0, green: 0 });
  // a 5-any follower buy with 3 gold and 2 red: one way, and it spends the gold that leads Most gold
  s.queue.unshift({ t: 'pay', p: 0, tier: 'mid' });
  resume(s);
  const ways = s.pending.options.filter(o => o.kind === 'pay');
  expect(ways).toHaveLength(1);
  expect(ways[0].breaks).toEqual(['gold']);
  // with red to spend instead, the default way keeps the lead and carries no mark; the gold-heavy way still does
  s.players[0].res.red = 5;
  s.queue.unshift({ t: 'pay', p: 0, tier: 'mid' });
  resume(s);
  const more = s.pending.options.filter(o => o.kind === 'pay');
  expect(more.find(o => o.default).breaks).toBeUndefined();
  expect(more.find(o => o.spend.gold === 3).breaks).toEqual(['gold']);
});
