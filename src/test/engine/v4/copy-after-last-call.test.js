// @vitest-environment node
// What you just did happens now, even past a skip you already have (Cory, 2026-10-29: a copied "Take another turn
// right after this one" after Last Call gave him two turns in a row at the round's end instead; "what would be
// intuitive?"). Sleep In already worked that way; Last Call pushed the moved-up turn back to the end.
import { describe, it, expect } from 'vitest';
import { take, move } from './helpers.js';
import { sceneQ, settle, passBuys } from './cards-helpers.js';

const rich = { purple: 9, green: 9, gold: 9, red: 9 };
const uidOf = (s, def, i) => s.players[i].members.find(u => s.cards[u].def === def);
const plain = s => {
  const o = s.pending.options.find(x => x.kind === 'slot' && ['gold', 'red'].includes(s.quadrants[x.q]))
    || s.pending.options.find(x => x.kind === 'slot');
  return passBuys(settle(move(s, o.id)));
};
const scene = () => sceneQ({ quadrants: ['purple', 'echo', 'gold', 'red'], n: 3, round: 2, res: [rich, rich, rich], members: [['echo.dejavu']],
  queue: [1, 0, 2, 2, 0, 1, 1, 0, 2].map(p => ({ t: 'turn', p })).concat({ t: 'allPlaced' }) });

describe('a turn moved up beats a skip you already have', () => {
  it('Last Call, then Tribute Band copies a rival’s Right Away: you place right away, then go last', () => {
    let s = scene();
    s = passBuys(settle(take(s, 'purple.again'))); // P2 Right Away
    s = plain(s); // P2's turn right after
    expect(s.pending.player).toBe(0);
    s = settle(take(s, 'purple.lastcall')); // P1 Last Call: goes last
    s = settle(move(s, `use:${uidOf(s, 'echo.dejavu', 0)}`)); // Tribute Band: P2's actions, Right Away among them
    expect(s.log).toContain("P1's Right Away: P1 takes their next turn now.");
    s = passBuys(s);
    expect(s.pending).toMatchObject({ kind: 'place', player: 0 });
    s = plain(s);
    // and then Last Call holds: every rival places before P1 again
    const order = [];
    while (s.pending?.kind === 'place') { order.push(s.pending.player); s = plain(s); }
    expect(order.indexOf(0)).toBe(order.length - order.filter(p => p === 0).length);
  });

  it('Sleep In, then a copied Right Away: the copy comes now and the skip passes the turn after', () => {
    let s = scene();
    s = passBuys(settle(take(s, 'purple.again'))); // P2 Right Away
    s = plain(s);
    s = settle(take(s, 'purple.skip')); // P1 Sleep In: skips their next turn
    s = settle(move(s, `use:${uidOf(s, 'echo.dejavu', 0)}`));
    s = passBuys(s);
    expect(s.pending).toMatchObject({ kind: 'place', player: 0 });
  });
});
