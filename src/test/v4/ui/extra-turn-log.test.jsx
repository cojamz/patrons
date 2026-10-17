import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { take, move } from '../../engine/v4/helpers.js';
import { currentTurn, promptFor } from '../../../v4/format.js';
import Chronicle from '../../../v4/game/Chronicle.jsx';

afterEach(cleanup);
it('keeps Night Owl named in the visible log through its granted extra placement', () => {
  let state = sceneQ({ quadrants: ['gold', 'red', 'purple', 'green'], round: 2, left: 1,
    members: [['purple.nightowl']], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
  // The scene starts with P1's last planned turn followed by P2's. Extra turns
  // are inserted between them; the view must distinguish that from a snake end.
  state.order = [0, 1];
  state = take(state, 'purple.hourly');
  expect(state.log).toContain("P1's Night Owl: P1 takes an extra turn.");
  while (state.pending.kind !== 'place') state = move(state, 'pass');
  expect(state.pending.player).toBe(0);
  expect(currentTurn(state)).toMatchObject({ kind: 'extra', why: 'Night Owl' });
  expect(promptFor(state, true).lead).toContain('Night Owl');
  state = take(state, 'purple.windup');
  const { getByRole } = render(<Chronicle state={state} onClose={() => {}} />);
  expect(getByRole('dialog').textContent).toContain("P1's Night Owl: P1 takes an extra turn.");
});
