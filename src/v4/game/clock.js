// One frame loop for the table's show (eng-audit S3/Q5): the chain clock (director.js), every rolling stack number
// (flight.js holdStack) and every rolling count (Tick.jsx) run off the same requestAnimationFrame, so one frame is one
// pass over everything moving. add(fn) registers a callback that gets the frame time each frame until removed; the
// loop stops by itself when nothing is registered. A callback added during a frame first runs on the next one, just
// as its own requestAnimationFrame would.

const subs = new Set();
let raf = 0, rafFn = null; // the pending frame, and which requestAnimationFrame asked for it

function frame(now) {
  raf = 0; rafFn = null;
  for (const fn of [...subs]) if (subs.has(fn)) fn(now);
  request();
}
function request() {
  if (!subs.size || typeof requestAnimationFrame !== 'function') return;
  // a frame asked of another requestAnimationFrame (a test swapped the timers) never comes: ask again
  if (raf && rafFn === requestAnimationFrame) return;
  rafFn = requestAnimationFrame;
  raf = requestAnimationFrame(frame);
}

/** Run fn(now) every frame from the next one on, until remove(fn) (or the returned function) is called. */
export function add(fn) {
  subs.add(fn);
  request();
  return () => remove(fn);
}
export function remove(fn) {
  subs.delete(fn);
  if (!subs.size && raf) {
    if (rafFn === requestAnimationFrame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0; rafFn = null;
  }
}
export const running = fn => subs.has(fn);
