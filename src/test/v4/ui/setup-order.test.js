// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/index.js';
import { setupOrder } from '../../../v4/game/order.js';

describe('Round I draft order preview', () => {
  for (const n of [2, 3, 4]) it(`${n} players: tracks real draft tasks and matches the engine's next two placement passes`, () => {
    let state = createGame({ seed: 17, seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}` })) });
    const first = [...state.firstOrder];
    const expectedPlaces = [...first, ...[...first].reverse()];
    let drafted = 0;
    while (state.pending.kind === 'setup') {
      const cue = setupOrder(state);
      expect(cue.draft).toEqual([...first].reverse().slice(drafted));
      expect(cue.draft[0]).toBe(state.pending.player);
      expect(cue.place).toEqual(expectedPlaces);
      state = applyMove(state, { player: state.pending.player, option: state.pending.options[0].id });
      drafted++;
    }
    expect(state.round).toBe(1);
    expect(state.order.slice(0, n * 2)).toEqual(expectedPlaces);
    expect(setupOrder(state)).toBeNull();
  });
});
