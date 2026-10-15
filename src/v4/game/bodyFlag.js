// A data attribute on an element while something is mounted, standing in for a `:has()` on a page-level element
// (perf, 2026-10-15: `body:has(...)` and `.app.game.lt:has(> .turn-card)` made the browser re-style the whole page,
// about 5,000 elements, on DOM changes all over the table; design/eval/perf/turn-wait.md). Counted, so two holders
// of the same flag on the same element keep it until both let go.
const counts = new WeakMap();
/** Sets data-<name> on el until the returned function is called. */
export function holdFlag(el, name) {
  if (!el || !el.dataset) return () => {};
  let m = counts.get(el);
  if (!m) { m = new Map(); counts.set(el, m); }
  m.set(name, (m.get(name) || 0) + 1);
  el.dataset[name] = '1';
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const n = (m.get(name) || 1) - 1;
    m.set(name, n);
    if (n <= 0) delete el.dataset[name];
  };
}
