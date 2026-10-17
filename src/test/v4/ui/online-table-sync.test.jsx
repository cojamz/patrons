import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/index.js';
import { createEmitter } from '../../../v4/session/emitter.js';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { useTable } from '../../../v4/game/GameScreen.jsx';

const animation = vi.hoisted(() => ({ enabled: true, running: false, restored: null, listeners: new Set() }));
vi.mock('../../../v4/game/flight.js', async original => ({ ...await original(), motionOK: () => animation.enabled }));
vi.mock('../../../v4/game/director.js', async original => ({ ...await original(),
  chainRunning: () => animation.running,
  onChainEnd: fn => { animation.listeners.add(fn); return () => animation.listeners.delete(fn); },
}));
vi.mock('../../../v4/session/moment.js', async original => ({ ...await original(),
  restoredMoment: () => animation.restored,
}));
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
const finish = async () => act(async () => { animation.running = false; for (const fn of [...animation.listeners]) fn(); });
afterEach(() => { cleanup(); animation.listeners.clear(); animation.running = false; animation.restored = null; animation.enabled = true; vi.useRealTimers(); });

describe('one presentation boundary for local and online tables', () => {
  for (const mode of ['local', 'online']) it(`${mode}: holds ownership/options until actual completion, even after estimated time passes`, async () => {
    vi.useFakeTimers();
    const initial = createGame({ seats, seed: 21 });
    const session = sessionAt(initial, mode);
    const beforeShow = { current: vi.fn() };
    const { result } = renderHook(() => useTable(session, 1000, beforeShow));
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    const first = next(initial), second = next(first);
    animation.running = true;
    await act(async () => session.publish(first));
    expect(result.current[0]).toBe(first); // physical targets exist while pieces travel
    expect(result.current[5]).toBe(initial); // interaction is one settled snapshot
    await act(async () => session.publish(second));
    expect(session.getState()).toBe(second); // transport is always current
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(result.current[0]).toBe(first);
    expect(result.current[5].pending).toBe(initial.pending);
    await finish();
    expect(result.current[0]).toBe(second);
    expect(result.current[5]).toBe(first);
    animation.running = true;
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(result.current[5]).toBe(first);
    await finish();
    expect(result.current[5]).toBe(second);
    expect(beforeShow.current.mock.calls).toEqual([[initial, first], [first, second]]);
  });

  it('reduced motion settles without waiting for an animation event that cannot exist', async () => {
    vi.useFakeTimers(); animation.enabled = false;
    const initial = createGame({ seats, seed: 21 });
    const session = sessionAt(initial, 'online');
    const { result } = renderHook(() => useTable(session, 1000));
    const first = next(initial), second = next(first);
    await act(async () => { session.publish(first); session.publish(second); });
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(result.current[0]).toBe(second);
    expect(result.current[5]).toBe(second);
  });

  it('holds the opening round through minion return and income after the scoring card is dismissed', async () => {
    vi.useFakeTimers();
    const board = sceneQ({ quadrants: ['gold', 'silver'], members: [['gold.banker']] });
    const after = { ...board, round: board.round + 1, players: board.players.map(p => ({ ...p, res: { ...p.res } })),
      log: [...board.log, "P1's Banker: +3 gold."] };
    after.players[0].res.gold += 3;
    animation.restored = { board, after, result: { round: 'I' } };
    const session = sessionAt(after, 'local');
    const { result } = renderHook(() => useTable(session, 1000));
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    animation.running = true;
    await act(async () => result.current[2]());
    expect(result.current[1]).toBeNull();
    expect(result.current[6]).toBe(after);
    expect(result.current[5]).toBe(board);
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(result.current[5]).toBe(board);
    await finish();
    expect(result.current[5]).toBe(after);
  });

});
