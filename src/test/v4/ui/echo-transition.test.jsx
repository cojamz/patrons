// Echo's automatic answer must survive the place→choose input lock.
import { it, expect, afterEach, vi } from 'vitest';
import { render, act, cleanup, fireEvent } from '@testing-library/react';
import { applyMove } from '../../../engine/v4/index.js';
import { table } from '../../engine/v4/cards-helpers-b.js';
import { take, move } from '../../engine/v4/helpers.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import GameScreen from '../../../v4/game/GameScreen.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const wait = ms => act(() => new Promise(resolve => setTimeout(resolve, ms)));
it('automatically copies after placing on Echo, through the step input lock', async () => {
  vi.stubGlobal('matchMedia', vi.fn(q => ({ matches: q.includes('min-width: 861px'), addEventListener() {}, removeEventListener() {} })));
  let current = table(['gold', 'red', 'market', 'echo'], {
    shop: ['red.volunteer'], queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }],
  });
  current = move(take(current, 'echo.hum'), 'pass');
  expect(current.pending.kind).toBe('place');
  expect(current.pending.player).toBe(0);
  const echo = current.pending.options.find(o => o.kind === 'slot' && o.label === 'Echo');
  expect(echo).toBeTruthy();
  const listeners = createEmitter();
  const submit = vi.fn(answer => {
    current = applyMove(current, answer);
    listeners.emit(current);
    return Promise.resolve(current);
  });
  const session = {
    getState: () => current, mySeats: [0], info: { mode: 'local' }, submit,
    subscribe(fn) { const off = listeners.on(fn); fn(current); return off; },
  };
  const { container } = render(<GameScreen session={session} pace={0} />);
  await wait(20);
  fireEvent.click(container.querySelector(`[data-option="${echo.id}"]`));
  await wait(40);
  expect(current.pending.prompt).toMatch(/^Echo:/);
  const copyId = current.pending.options[0].id;
  await wait(700);
  expect(submit).toHaveBeenCalledWith({ player: 0, option: copyId });
  // Echo's inherent +1, plus the copied Chorus yield: P2's Chorus paid only its inherent +1, since it excludes its own
  // space (v0.8.2 clarification), and a copy repeats what the taker got
  expect(current.players[0].res.green).toBe(2);
  expect(current.players[1].res.green).toBe(1);
  expect(current.log.at(-1)).toMatch(/copied Chorus \(P2's\): \+1 green/);
  expect(current.pending.kind).toBe('buy');
});
