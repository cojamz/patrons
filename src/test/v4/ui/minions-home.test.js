// Round-end smoothing (2026-10-21, frame by frame at Steady): when a new round sends the wheel's minions home, each
// seat's column filled at once while its minions still stood on the wheel, so every minion showed twice. A column now
// fills as its minions land: each standing minion waits unseen until one of its own lands.
import { afterEach, expect, it, vi } from 'vitest';
import { flyMinionsHome } from '../../../v4/game/flight.js';
import { MO, setMotionSpeed } from '../../../v4/motion.js';

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });

it('a seat\'s column of minions shows each one only as a minion lands there', () => {
  setMotionSpeed('steady');
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 10, width: 20, height: 20, right: 30, bottom: 30 });
  const calls = [];
  HTMLElement.prototype.animate = function (frames, opts) { calls.push({ el: this, frames, opts }); return { finished: Promise.resolve(), onfinish: null, oncancel: null, addEventListener() {}, removeEventListener() {}, cancel() {}, finish() {} }; };
  const root = document.createElement('div');
  root.innerHTML = '<div class="lt-cult-seat" data-seat="0"><div class="cs-minions"><i data-minion="0"></i><i data-minion="1"></i><i data-minion="2"></i></div></div>';
  document.body.appendChild(root);
  const rect = { left: 300, top: 300, width: 20, height: 20 };
  const n = flyMinionsHome(root, [{ pid: 0, html: '<i></i>', rect }, { pid: 0, html: '<i></i>', rect }]);
  expect(n).toBe(2);
  const col = [...root.querySelectorAll('[data-minion]')];
  const hides = col.map(el => calls.find(c => c.el === el));
  expect(hides.every(Boolean)).toBe(true);
  // unseen from the start, seen at the end
  for (const h of hides) { expect(h.frames[0].opacity).toBe(0); expect(h.frames[h.frames.length - 1].opacity).toBe(1); }
  // the first shows as the first minion lands, the second as the second does; the extra one with the last
  const first = MO.minionsHome, second = MO.minionsHomeStagger + MO.minionsHome;
  expect(hides[0].opts.duration * 0.9).toBeGreaterThanOrEqual(first * 0.9);
  expect(hides[0].opts.duration).toBeLessThan(hides[1].opts.duration);
  expect(hides[1].opts.duration * 0.9).toBeGreaterThanOrEqual(second * 0.9);
  expect(hides[2].opts.duration).toBe(hides[1].opts.duration);
  delete HTMLElement.prototype.animate;
});
