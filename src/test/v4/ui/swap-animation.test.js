import { afterEach, expect, it, vi } from 'vitest';
import { sceneQ } from '../../engine/v4/cards-helpers.js';
import { chainRunning, playChain, skipChain } from '../../../v4/game/director.js';
import { flyPath } from '../../../v4/game/flight.js';

vi.mock('../../../v4/game/flight.js', async original => ({
  ...await original(),
  motionOK: () => true,
  flyPath: vi.fn(() => ({ finished: Promise.resolve() })),
  track: a => a,
  settle: vi.fn(),
}));
vi.mock('../../../v4/game/stage.js', async original => ({
  ...await original(),
  stageRect: () => ({ left: 400, top: 200, width: 184, height: 104 }),
}));

afterEach(() => { skipChain(); vi.restoreAllMocks(); vi.useRealTimers(); document.body.innerHTML = ''; });

it('finishes both staged swap flights and leaves no running animation chain', async () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 10, width: 52, height: 52, right: 62, bottom: 62 });
  const root = document.createElement('div');
  root.innerHTML = '<div class="lt-cult-seat" data-seat="0"><div class="cs-crowd"><div class="cs-member" data-uids="102"></div></div></div><div class="lt-cult-seat" data-seat="1"><div class="cs-crowd"><div class="cs-member" data-uids="101"></div></div></div>';
  document.body.appendChild(root);
  const before = sceneQ({ quadrants: ['gold', 'silver'] });
  const cause = { kind: 'move', pid: 0 };
  const move = (uid, from, to) => ({ type: 'member-move', cause,
    from: { kind: 'crowd', pid: from }, to: { kind: 'crowd', pid: to }, what: { uid, worth: 1 } });
  const after = { ...before, moves: before.moves + 1, effects: [move(101, 0, 1), move(102, 1, 0)] };
  playChain(root, before, after);
  await vi.advanceTimersByTimeAsync(5000);
  const flights = vi.mocked(flyPath).mock.calls;
  expect(flights).toHaveLength(4); // one incoming and outgoing leg per member
  const centers = flights.slice(0, 2).map(call => call[3]);
  expect(centers[0].top).toBe(centers[1].top);
  expect(centers[1].left - centers[0].left).toBe(68);
  expect(chainRunning()).toBe(false);
  expect(root.dataset.chain).toBeUndefined();
});
