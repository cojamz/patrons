// @vitest-environment node
import { expect, it } from 'vitest';
import { contextFor, resume } from '../../../engine/v4/core.js';
import { table, uidIn } from './cards-helpers-b.js';
import { move, take } from './helpers.js';

const reload = s => resume(JSON.parse(JSON.stringify(s)));

it.each(['echo.impostor', 'echo.doppel'])('%s copies Panel without firing its Recruit ability', id => {
  let s = table(['red', 'echo', 'gold', 'thieves'], { members: id.endsWith('doppel') ? [['red.panel']] : [[], ['red.panel']], shop: [id, 'red.mentor'] });
  s.queue = []; s.pending = null; s.pile = [];
  const copier = uidIn(s, id, 'shop'), panel = uidIn(s, 'red.panel', id.endsWith('doppel') ? 0 : 1);
  contextFor(s).recruit(s.players[0], copier, { free: true });
  s = reload(s);
  s = reload(move(s, `card:${panel}`));
  expect(s.cards[copier].copy).toBe('red.panel');
  expect(s.pending).toBe(null);
  expect(s.shop.map(u => s.cards[u].def)).toEqual(['red.mentor']);
});

it('reproduces two bounded Panel ↔ Stunt Double cycles by recopying the current Promote', () => {
  let s = table(['red', 'echo', 'gold', 'thieves'], { round: 2, members: [['echo.hourglass', 'red.recruiter']], shop: ['red.panel'] });
  s.pile = [];
  const stunt = uidIn(s, 'echo.hourglass', 0), panel = uidIn(s, 'red.panel', 'shop');
  s = reload(take(s, 'red.hireup'));
  s = reload(move(s, `trade:${stunt}:${panel}`));
  s = reload(move(s, 'promote'));
  s = reload(move(s, `trade:${panel}:${stunt}`));
  const before = s.players[0].res.red;
  for (let cycle = 0; cycle < 2; cycle += 1) {
    expect(s.pending.options.map(o => o.id)).toContain(`trade:${stunt}:${panel}`);
    s = reload(move(s, `trade:${stunt}:${panel}`));
    s = reload(move(s, 'promote'));
    s = reload(move(s, `trade:${panel}:${stunt}`));
    expect(s.players[0].members).toContain(stunt);
    expect(s.shop).toEqual([panel]);
  }
  expect(s.players[0].res.red - before).toBe(6); // four acquisitions plus two copied action gains
  // Diagnostic witness: no rule restriction has been invented here.
});
