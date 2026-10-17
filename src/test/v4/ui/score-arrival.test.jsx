import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import GameScreen from '../../../v4/game/GameScreen.jsx';
import { followers } from '../../../engine/v4/index.js';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
const test = vi.hoisted(() => ({ running: false, ends: new Set(), board: null, reckoning: null, animation: null }));
vi.mock('../../../v4/format.js', async original => ({ ...await original(),
  isRoundEnd: line => line === 'ROUND SCORED',
  parseRoundEnd: () => ({ round: 'I', rows: [{ qid: 'gold', winners: [0], v: 2 }] }),
  scoringSnapshot: () => test.board,
  scoredStandings: () => [{ qid: 'gold', rule: 'Most gold', prize: 2, rows: [{ id: 0, shown: 1 }, { id: 1, shown: 0 }], leaders: [0] }],
}));
vi.mock('../../../v4/game/flight.js', async original => ({ ...await original(), motionOK: () => true }));
vi.mock('../../../v4/game/director.js', async original => { const real = await original(); return {
  ...real, chainRunning: () => test.running,
  onChainEnd: fn => { test.ends.add(fn); return () => test.ends.delete(fn); },
  playChain: (_root, before, after) => { test.animation = real.planChain(before, after); test.running = true; return test.animation; },
}; });
vi.mock('../../../v4/game/Reckoning.jsx', async original => ({ ...await original(),
  default: props => { test.reckoning = props; return null; },
}));
afterEach(() => { cleanup(); test.ends.clear(); test.running = false; test.board = null; test.reckoning = null; test.animation = null; vi.useRealTimers(); vi.unstubAllGlobals(); });
it('withholds contest followers and +tags before scoring is visible, then credits only on prize landing', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', q => ({ matches: q.includes('min-width: 861px'), addEventListener() {}, removeEventListener() {} }));
  const before = sceneQ({ quadrants: ['gold', 'red'] });
  before.players[0].kind = 'human';
  let current = before;
  const listeners = new Set();
  const session = { info: { mode: 'online' }, mySeats: [0], getState: () => current,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, submit: vi.fn(), canUndo: () => false };
  const view = render(<GameScreen session={session} />);
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  const start = followers(before, before.players[0]);
  const scored = { ...before, moves: before.moves + 1,
    players: before.players.map(p => ({ ...p, res: { ...p.res } })),
    log: [...before.log, 'ROUND SCORED'], pending: null, queue: [] };
  scored.players[0].res.gold += 1; // ordinary closing action, still in flight
  scored.players[0].bonus += 2; scored.players[0].contest += 2;
  test.board = scored;
  const after = { ...scored, round: 2 };
  await act(async () => { current = after; for (const fn of listeners) fn(after); });
  const score = () => view.container.querySelector('.lt-cult-seat[data-seat="0"] .cs-total');
  expect(score().dataset.followers).toBe(String(start));
  expect(score().querySelector('.floater')).toBeNull();
  expect(view.container.querySelector('.seat-delta')).toBeNull();
  expect(test.reckoning).toBeNull(); // the closing action still owns the screen
  expect(test.animation.atoms.filter(a => a.op === 'piece' && a.fol)).toEqual([]);
  expect(test.animation.atoms.filter(a => a.op === 'piece' && a.r === 'gold')).toHaveLength(1);
  await act(async () => vi.advanceTimersByTimeAsync(60000));
  expect(score().dataset.followers).toBe(String(start));
  await act(async () => { test.running = false; for (const fn of [...test.ends]) fn(); });
  expect(test.reckoning).toBeTruthy();
  expect(score().dataset.followers).toBe(String(start));
  expect(score().querySelector('.floater')).toBeNull();
  await act(async () => test.reckoning.onPaid(1));
  expect(score().dataset.followers).toBe(String(start + 2));
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(score().querySelector('.tv').textContent).toBe(String(start + 2));
});
