import { afterEach, expect, it, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import CultSeat from '../../../v4/game/CultSeat.jsx';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
afterEach(cleanup);
it('shows a release entry only when legal and opens the existing member list without releasing', () => {
  const state = sceneQ({ quadrants: ['gold', 'red', 'market', 'echo'], members: [['red.twins']], queue: [{ t: 'buy', p: 0 }] });
  const hover = { onSeatHover: vi.fn() }, onPick = vi.fn();
  const optionFor = id => state.pending.options.find(o => o.id === id);
  const { getByRole, rerender, queryByRole } = render(<CultSeat state={state} pid={0} me={0} mine hover={hover} optionFor={optionFor} onPick={onPick} />);
  const button = getByRole('button', { name: 'Choose a member to release' });
  fireEvent.click(button);
  expect(hover.onSeatHover).toHaveBeenCalledWith(0, button, { pinned: true });
  expect(onPick).not.toHaveBeenCalled();
  rerender(<CultSeat state={state} pid={0} me={0} mine hover={hover} optionFor={() => null} />);
  expect(queryByRole('button', { name: 'Choose a member to release' })).toBeNull();
});
