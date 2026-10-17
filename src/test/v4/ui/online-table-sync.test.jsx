import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/index.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import { useTable } from '../../../v4/game/GameScreen.jsx';

const seats = ['Cory', 'Ana', 'Bo'].map(name => ({ name, kind: 'human' }));
function sessionAt(state, mode) {
  let current = state;
  const changes = createEmitter();
  return {
    info: { mode }, mySeats: [0], getState: () => current,
    subscribe(fn) { const off = changes.on(fn); fn(current); return off; },
    publish(next) { current = next; changes.emit(next); },
  };
}
const next = s => applyMove(s, { player: s.pending.player, option: s.pending.options[0].id });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('multiplayer table synchronization', () => {
  it('shows both remote updates during a paced chain without stale ownership or a frozen log', async () => {
    vi.useFakeTimers();
    const initial = createGame({ seats, seed: 21 });
    const session = sessionAt(initial, 'online');
    const beforeShow = { current: vi.fn() };
    const { result } = renderHook(() => useTable(session, 1000, beforeShow));
    const first = next(initial);
    await act(async () => session.publish(first));
    expect(result.current[0]).toBe(first);
    const second = next(first);
    await act(async () => session.publish(second));
    expect(result.current[0]).toBe(second);
    expect(result.current[0].pending.player).toBe(session.getState().pending.player);
    expect(result.current[0].log).toEqual(second.log);
    expect(result.current[0].moves).toBe(second.moves);
    expect(beforeShow.current.mock.calls).toEqual([[initial, first], [first, second]]);
  });

  it('keeps the local rival pacing queue', async () => {
    vi.useFakeTimers();
    const initial = createGame({ seats, seed: 21 });
    const session = sessionAt(initial, 'local');
    const { result } = renderHook(() => useTable(session, 1000));
    const first = next(initial), second = next(first);
    await act(async () => { session.publish(first); session.publish(second); });
    expect(result.current[0]).not.toBe(second);
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(result.current[0]).toBe(second);
  });
});
