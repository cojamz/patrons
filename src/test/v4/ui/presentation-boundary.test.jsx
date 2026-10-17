import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import GameScreen from '../../../v4/game/GameScreen.jsx';
import { applyMove } from '../../../engine/v4/index.js';
import { sceneQ, spaceOf } from '../../engine/v4/cards-helpers.js';
const motion = vi.hoisted(() => ({ running: false, listeners: new Set() }));
vi.mock('../../../v4/game/flight.js', async original => ({ ...await original(), motionOK: () => true }));
vi.mock('../../../v4/game/director.js', async original => {
  const real = await original();
  return { ...real, chainRunning: () => motion.running,
    playChain: (_root, before, after) => { const plan = real.planChain(before, after); motion.running = plan.total > 0; return plan; },
    onChainEnd: fn => { motion.listeners.add(fn); return () => motion.listeners.delete(fn); },
  };
});
afterEach(() => { cleanup(); motion.listeners.clear(); motion.running = false; vi.useRealTimers(); vi.unstubAllGlobals(); });
it('keeps old phase/lights through a flight but refuses clicks from that obsolete displayed turn', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('min-width: 861px'), addEventListener() {}, removeEventListener() {} }));
  let current = sceneQ({ quadrants: ['gold', 'red'], res: [{ gold: 5 }, {}] });
  current.players[0].kind = 'human';
  const initial = current;
  const listeners = new Set();
  const session = { info: { mode: 'online' }, mySeats: [0], getState: () => current,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, submit: vi.fn(), canUndo: () => false };
  const view = render(<GameScreen session={session} />);
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  const key = spaceOf(initial, 'Golden Years');
  const after = applyMove(initial, { player: 0, option: `slot:${key}` }, { effects: true });
  expect(after.pending.kind).toBe('buy');
  await act(async () => { current = after; for (const fn of listeners) fn(after); });
  const app = () => view.container.querySelector('.app.game');
  expect(app().dataset.phase).toBe('place');
  expect(app().dataset.presentationMoves).toBe(String(initial.moves));
  const stillLit = view.container.querySelector('.slot.can');
  expect(stillLit).toBeTruthy();
  await act(async () => fireEvent.click(stillLit));
  expect(session.submit).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
  expect(app().dataset.phase).toBe('place');
  await act(async () => { motion.running = false; for (const fn of [...motion.listeners]) fn(); });
  expect(app().dataset.phase).toBe('buy');
  expect(app().dataset.presentationMoves).toBe(String(after.moves));
  expect(view.container.querySelector('.slot.can')).toBeNull();
});
