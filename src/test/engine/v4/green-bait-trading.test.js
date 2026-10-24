// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contextFor, followers, resume } from '../../../engine/v4/core.js';
import { defById } from '../../../engine/v4/content/index.js';
import { sell, sellable } from '../../../engine/v4/content/trading.js';
import { table, uidIn } from './cards-helpers-b.js';
import { actionName, move, take } from './helpers.js';

const Q = ['gold', 'red', 'trading', 'echo'];
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const copyGold = s => pass(move(s, s.pending.options.find(o => o.label.startsWith(`${actionName('gold.rush')} (`)).id));

describe('Bait follower losses preserve White’s loose-follower limits', () => {
  it('a Lender reduced to zero by Bait gains no followers at game end', () => {
    let s = table(Q, { round: 2, left: 5, members: [['echo.bait'], ['trading.lender']],
      queue: [0, 1, 1, 0].map(p => ({ t: 'turn', p })) });
    s = pass(take(s, 'gold.rush'));
    s = copyGold(take(s, 'echo.echo'));
    s = copyGold(take(s, 'echo.encore'));
    expect(s.players[1].bonus).toBe(-2);
    expect(followers(s, s.players[1])).toBe(0);
    s.pending = null; s.queue = [{ t: 'finish' }];
    s = resume(s);
    expect(s.players[1].final.total).toBe(0);
    expect(s.players[1].bonus).toBe(-2);
    expect(followers(s, s.players[1])).toBe(0);
  });

  it('signed follower losses never create negative sellable counts or sale proceeds', () => {
    const s = table(Q, { bonus: [-2], queue: [] });
    const p = s.players[0];
    expect(sellable(p)).toBe(0);
    expect(sell(contextFor(s), p, 2, 3)).toBe(0);
    expect(p.res.white).toBe(0);
    expect(p.bonus).toBe(-2);
  });

  it('Raider leaves its use unspent when the leader has printed followers but no loose followers', () => {
    const s = table(Q, { bonus: [0, -1], members: [['trading.raider'], ['red.bigfamily']], res: [{ white: 3 }], queue: [] });
    const uid = uidIn(s, 'trading.raider', 0), card = contextFor(s).card(uid);
    card.used = true;
    defById('trading.raider').onActivate(contextFor(s), s.players[0], card);
    expect(card.used).toBe(false);
    expect(s.queue).toEqual([]);
    expect(s.players[0].res.white).toBe(3);
    expect(s.players[1].bonus).toBe(-1);
  });
});
