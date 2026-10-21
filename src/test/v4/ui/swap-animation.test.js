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

// the animation audit (Red's Promote, Demote, Even Swap with the shop): the member going back to the shop and the one
// coming off it cross at once; the card going back waits unseen in the shop until it lands, and the one coming off it
// flies as its portrait, never a blank square
it('a swap with the shop crosses both members at once, the incoming one as its portrait', async () => {
  const { planChain } = await import('../../../v4/game/director.js');
  const before = sceneQ({ quadrants: ['gold', 'red'] });
  const cause = { kind: 'move', pid: 0 };
  const after = { ...before, moves: before.moves + 1, effects: [
    { type: 'recruit', cause, from: { kind: 'shop', index: 2, uid: 7 }, to: { kind: 'crowd', pid: 0 }, what: { uid: 7, worth: 1 } },
    { type: 'release', cause, from: { kind: 'crowd', pid: 0 }, to: { kind: 'shop', index: 2, uid: 5 }, what: { uid: 5, worth: 1 } },
  ] };
  const chips = planChain(before, after, { mine: [0] }).atoms.filter(a => a.op === 'chip');
  expect(chips).toHaveLength(2);
  expect(chips[0].at).toBe(chips[1].at);
  const out = chips.find(a => a.uid === 5), inn = chips.find(a => a.uid === 7);
  expect(out.to.kind).toBe('shop');
  expect(out.hide).toBe(true);
  expect(inn.from.kind).toBe('shop');
  expect(inn.path).toBe('cross');

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 10, width: 52, height: 52, right: 62, bottom: 62 });
  const root = document.createElement('div');
  root.innerHTML = '<div class="lt-cult-seat" data-seat="0"><div class="cs-crowd"><div class="cs-member" data-uids="7"></div></div></div><div class="lt-shop"><div class="card" data-uid="5"></div></div>';
  document.body.appendChild(root);
  const snap = new Map([[7, { html: '<div class="card"><span class="art"><svg data-who="seven"></svg></span></div>', rect: { left: 500, top: 300, width: 80, height: 110 } }]]);
  vi.mocked(flyPath).mockClear();
  vi.useFakeTimers();
  playChain(root, before, after, { snap, chips: new Map([[5, { html: '<svg data-who="five"></svg>', rect: { left: 10, top: 10, width: 30, height: 30 } }]]) });
  await vi.advanceTimersByTimeAsync(5000);
  const pics = vi.mocked(flyPath).mock.calls.map(c => c[0]);
  expect(pics.some(h => h.includes('data-who="seven"'))).toBe(true);
  expect(pics.some(h => h.includes('piece-dot member'))).toBe(false);
});
