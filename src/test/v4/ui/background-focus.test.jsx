import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ChoicePrompt, useDialog } from '../../../v4/game/parts.jsx';

function Dialog() {
  const ref = useDialog(() => {});
  return <div ref={ref}><button>Close</button></div>;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('does not focus an incoming action prompt or dialog while the game is in the background', () => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(false);
  const focus = vi.spyOn(HTMLElement.prototype, 'focus');
  const state = { pending: { kind: 'choose', prompt: 'Collect Debts', options: [{ id: 'skip', label: 'Skip' }] }, players: [], resources: ['gold'], quadrants: ['gold'], cards: {} };
  const { rerender, unmount } = render(<ChoicePrompt state={state} onPick={() => {}} />);
  rerender(<ChoicePrompt state={{ ...state, pending: { ...state.pending } }} onPick={() => {}} />);
  expect(focus).not.toHaveBeenCalled();
  unmount();
  const modal = render(<Dialog />);
  modal.unmount();
  expect(focus).not.toHaveBeenCalled();
});
it('still focuses a dialog when the game is active', () => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  const { getByRole } = render(<Dialog />);
  expect(document.activeElement).toBe(getByRole('button'));
});
