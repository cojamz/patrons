import { afterEach, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
afterEach(cleanup);
it('never offers release controls, including when resuming a game with legacy release options', () => {
  const state = sceneQ({ quadrants: ['gold', 'red', 'market', 'echo'], members: [['red.twins']], queue: [{ t: 'buy', p: 0 }] });
  const hover = { onSeatHover: vi.fn() }, onPick = vi.fn();
  const uid = state.players[0].members[0];
  state.pending = { kind: 'buy', player: 0, options: [{ id: `release:${uid}`, kind: 'release', uid }] };
  const optionFor = id => state.pending.options.find(o => o.id === id);
  const { container, queryByRole } = render(<CultSeat state={state} pid={0} me={0} mine hover={hover} optionFor={optionFor} onPick={onPick} />);
  expect(queryByRole('button', { name: 'Choose a member to release' })).toBeNull();
  expect(container.querySelector('[data-release], .cs-release')).toBeNull();
  expect(onPick).not.toHaveBeenCalled();
});
