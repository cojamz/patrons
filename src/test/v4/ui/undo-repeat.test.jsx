// Undo makes taking the same space again a deliberate new choice, even inside the double-click window.
import { it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
for (const succeeds of [true, false]) it(`${succeeds ? 'successful' : 'failed'} undo ${succeeds ? 'allows' : 'still guards'} an immediate repeat of the same space`, async () => {
  vi.stubGlobal('matchMedia', vi.fn(q => ({ matches: q.includes('min-width: 861px'), addEventListener() {}, removeEventListener() {} })));
  let state = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Bot', kind: 'bot' }], seed: 11 });
  for (let n = 0; n < 100 && state.pending.kind !== 'place'; n++) state = applyMove(state, chooseBotMove(state, () => 0.3));
  const me = state.pending.player;
  let now = 10_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  const session = { getState: () => state, subscribe: () => () => {}, mySeats: [me], info: { mode: 'local' },
    submit: vi.fn(() => Promise.resolve(state)), canUndo: () => true, undo: vi.fn(() => succeeds), undoSeat: me, undoKind: 'place' };
  const { container } = render(<GameScreen session={session} />);
  const first = state.pending.options[0];
  const space = () => container.querySelector(`[data-slot="${first.q}-${first.i}"]`);
  await act(async () => fireEvent.click(space()));
  expect(session.submit).toHaveBeenCalledTimes(1);
  now += 10;
  fireEvent.click(container.querySelector('button.undo'));
  expect(session.undo).toHaveBeenCalledTimes(1);
  now += 10;
  await act(async () => fireEvent.click(space()));
  expect(session.submit).toHaveBeenCalledTimes(succeeds ? 2 : 1);
  now += 10;
  await act(async () => fireEvent.click(space()));
  expect(session.submit).toHaveBeenCalledTimes(succeeds ? 2 : 1); // ordinary double-click protection resumes
});
