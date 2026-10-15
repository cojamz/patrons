// Hover intent (QA, wave 2: a member's card closed as the pointer crossed its seat toward "Use", and the seat card did
// the same): while the pointer travels from what it pointed at to that thing's open card (a card with a button on it:
// your member's Use, a seat's list), whatever it crosses on the way doesn't open its own card over it, and the card it
// is heading for stays. "Heading for" means inside the triangle from where the pointer left to the card's near edge
// (or on the card), for a short while: the menu-aim rule. One aim at a time; nothing else in the app is touched.
let aim = null; // { el, x, y, until }
let pt = null;
if (typeof addEventListener === 'function') addEventListener('pointermove', e => { pt = { x: e.clientX, y: e.clientY }; }, { passive: true, capture: true });

export const AIM_MS = 700; // the longest a crossing may take before the card lets go
const PAD = 12;

/** The pointer just left toward `el` (the open card), from `from` (where it left; default: where it is now). */
export function aimAt(el, from = pt) {
  if (el && from) aim = { el, x: from.x, y: from.y, until: (typeof performance !== 'undefined' ? performance.now() : Date.now()) + AIM_MS };
}
/** The pointer reached the card (or the card closed): the crossing is over. */
export function arrived(el = null) { if (!el || (aim && aim.el === el)) aim = null; }
/** The card being aimed at, or null. */
export const aimedAt = () => (aim && aim.el && aim.el.isConnected ? aim.el : null);

const side = (p, a, b) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
function inTriangle(p, a, b, c) {
  const d1 = side(p, a, b), d2 = side(p, b, c), d3 = side(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/** Is the pointer (at p, default: where it is) on its way to the aimed card, or on it? */
export function heading(p = pt) {
  if (!aim || !p) return false;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!aim.el.isConnected || now > aim.until) { aim = null; return false; }
  const r = aim.el.getBoundingClientRect();
  if (p.x >= r.left - PAD && p.x <= r.right + PAD && p.y >= r.top - PAD && p.y <= r.bottom + PAD) return true;
  if (Math.hypot(p.x - aim.x, p.y - aim.y) <= PAD) return true; // still where it left
  // the card's near edge, as seen from where the pointer left (widened a little)
  const from = { x: aim.x, y: aim.y };
  let a, b;
  if (from.x <= r.left) { a = { x: r.left, y: r.top - PAD }; b = { x: r.left, y: r.bottom + PAD }; }
  else if (from.x >= r.right) { a = { x: r.right, y: r.top - PAD }; b = { x: r.right, y: r.bottom + PAD }; }
  else if (from.y <= r.top) { a = { x: r.left - PAD, y: r.top }; b = { x: r.right + PAD, y: r.top }; }
  else { a = { x: r.left - PAD, y: r.bottom }; b = { x: r.right + PAD, y: r.bottom }; }
  // a few px of slack behind the start, so a slightly backward first step still counts
  const back = { x: from.x - Math.sign(a.x + b.x - 2 * from.x) * PAD, y: from.y - Math.sign(a.y + b.y - 2 * from.y) * PAD };
  return inTriangle(p, back, a, b);
}
