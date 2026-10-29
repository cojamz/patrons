// @vitest-environment node
import { expect, it } from 'vitest';
import { contextFor, resume } from '../../../engine/v4/core.js';
import { table, uidIn } from './cards-helpers-b.js';
import { move, take } from './helpers.js';

const reload = s => resume(JSON.parse(JSON.stringify(s)));

it.each(['echo.impostor', 'echo.doppel'])('%s copies Panel; only Doppelganger does its Recruit ability (Cory, 2026-10-28)', id => {
  let s = table(['red', 'echo', 'gold', 'thieves'], { members: id.endsWith('doppel') ? [['red.panel']] : [[], ['red.panel']], shop: [id, 'red.mentor'] });
  s.queue = []; s.pending = null; s.pile = [];
  const copier = uidIn(s, id, 'shop'), panel = uidIn(s, 'red.panel', id.endsWith('doppel') ? 0 : 1);
  contextFor(s).recruit(s.players[0], copier, { free: true });
  s = reload(s);
  s = reload(move(s, `card:${panel}`));
  expect(s.cards[copier].copy).toBe('red.panel');
  if (id.endsWith('doppel')) { expect(s.pending.prompt).toBe('Panel: Promote or Demote?'); return; }
  expect(s.pending).toBe(null);
  expect(s.shop.map(u => s.cards[u].def)).toEqual(['red.mentor']);
});

it('Panel cannot promote itself into Stunt Double and restart the current Promote', () => {
  let s = table(['red', 'echo', 'gold', 'thieves'], { round: 2, members: [['echo.hourglass']], shop: ['red.panel'] });
  s.pile = [];
  const stunt = uidIn(s, 'echo.hourglass', 0), panel = uidIn(s, 'red.panel', 'shop');
  s = reload(take(s, 'red.hireup'));
  // The wheel can still promote Stunt into Panel at the exact +2 boundary.
  s = reload(move(s, `trade:${stunt}:${panel}`));
  expect(s.players[0].members).toEqual([panel]);
  expect(s.shop).toEqual([stunt]);
  // Only Panel could swap into Stunt here, and its own ability now excludes it.
  expect(s.pending?.kind).toBe('buy');
  expect(s.pending.options.some(o => o.id === 'promote' || o.id === `trade:${panel}:${stunt}`)).toBe(false);
  expect(s.players[0].res.red).toBe(2);
});
