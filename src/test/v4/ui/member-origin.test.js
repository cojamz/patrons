import { it, expect } from 'vitest';
import { applyMove } from '../../../engine/v4/index.js';
import { planChain } from '../../../v4/game/director.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';

it('keeps the producing member as the source when its resources fly from the stage', () => {
  const before = sceneQ({ quadrants: ['silver', 'gold'], members: [['silver.majordomo']] });
  const uid = before.players[0].members[0];
  const after = applyMove(before, { player: 0, option: `slot:${spaceOf(before, 'Toast')}` }, { effects: true });
  const plan = planChain(before, after, { mine: [0] });
  const produced = plan.atoms.filter(a => a.op === 'piece' && a.r === 'silver' && a.from.kind === 'stage' && a.from.uid === uid);
  expect(produced.reduce((n, a) => n + a.n, 0)).toBe(2);
  expect(produced.every(a => a.to.pid === 0)).toBe(true);
});
