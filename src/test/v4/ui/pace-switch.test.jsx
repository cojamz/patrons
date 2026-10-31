// Changing speed while bot steps are queued must not strand the displayed table.
import { it, expect, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';
afterEach(cleanup);
const wait = ms => act(() => new Promise(resolve => setTimeout(resolve, ms)));
it('drains already queued bot states when the viewing pace changes', async () => {
  let current = createGame({ seats: [{ name: 'You', kind: 'human' }, { name: 'Bot', kind: 'bot' }], seed: 3 });
  for (let n = 0; n < 100 && !(current.round === 1 && current.pending?.player === 1 && current.pending.kind === 'place'); n++) current = applyMove(current, chooseBotMove(current, () => 0.3));
  expect(current.pending.player).toBe(1);
  const listeners = createEmitter();
  const session = { getState: () => current, mySeats: [0], info: { mode: 'local' }, submit: vi.fn(), subscribe(fn) { const off = listeners.on(fn); fn(current); return off; } };
  const { container, rerender } = render(<GameScreen session={session} pace={1000} />);
  await wait(20);
  act(() => {
    for (let n = 0; n < 3; n++) { current = applyMove(current, chooseBotMove(current, () => 0.3)); listeners.emit(current); }
  });
  rerender(<GameScreen session={session} pace={100} />);
  await wait(1000);
  expect(Number(container.querySelector('.lt').dataset.moves)).toBe(current.moves);
});
