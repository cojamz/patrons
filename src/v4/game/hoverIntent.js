// Hover intent (QA, wave 2: a member's card closed as the pointer crossed its seat toward "Use", and the seat card did
// the same): while the pointer travels from what it pointed at to that thing's open card (a card with a button on it:
// your member's Use, a seat's list), whatever it crosses on the way doesn't open its own card over it, and the card it
// is heading for stays. "Heading for" means inside the triangle from where the pointer left to the card's near edge
// (or on the card), for a short while: the menu-aim rule. One aim at a time; nothing else in the app is touched.
let aim = null; // { el, x, y, until }
let pt = null, prev = null;
// where the pointer is, fresh before any enter/leave handler runs (boundary events come before the move itself), and
// where it was a step before: a leave reports the new spot (already on whatever is next), so the crossing starts from
// the last spot inside what it left
if (typeof addEventListener === 'function') {
  const at = e => { if (pt && (pt.x !== e.clientX || pt.y !== e.clientY)) prev = pt; pt = { x: e.clientX, y: e.clientY }; };
  for (const t of ['pointerover', 'pointerout', 'pointermove']) addEventListener(t, at, { passive: true, capture: true });
}

export const AIM_MS = 700; // how long the pointer may rest on the way (outside the card) before the card lets go
const PAD = 12;
// right after leaving, the way may wander (w3b #47: down out of the member first, then over to its card): for this long
// the card holds whatever route is taken, and the way is then measured from wherever the pointer has got to
const GRACE_MS = 300;

/** The pointer just left toward `el` (the open card), from `from` (default: its last spot inside what it left). */
export function aimAt(el, from = prev || pt) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (el && from) aim = { el, x: from.x, y: from.y, until: now + AIM_MS, grace: now + GRACE_MS };
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
  const box = aim.el.getBoundingClientRect();
  // a card that has gone (closed, moved off screen) is no longer anything to head for
  if (!box.width || !box.height || box.right < 0 || box.bottom < 0 || box.left > innerWidth || box.top > innerHeight) { aim = null; return false; }
  // what the pointer heads for is the card's buttons (Use, a switch): a card with none holds nothing up, so whatever
  // it happens to cover stays as easy to point at as before (w3a A8: cards open right next to what's pointed at, so
  // they often stand over a neighbour's name)
  const r = controlsRect(aim.el);
  if (!r) return false;
  if (now < aim.grace) { aim.x = p.x; aim.y = p.y; return true; }
  if (p.x >= r.left - PAD && p.x <= r.right + PAD && p.y >= r.top - PAD && p.y <= r.bottom + PAD) return true;
  if (Math.hypot(p.x - aim.x, p.y - aim.y) <= PAD) return true; // still where it left
  // the hull of where the pointer left and the buttons' box (widened a little): every straight way there, whichever
  // edge it comes in by (from above-left, a path enters the box through its top as well as its left side)
  const from = { x: aim.x, y: aim.y };
  const L = r.left - PAD, T = r.top - PAD, R = r.right + PAD, B = r.bottom + PAD;
  const corners = [{ x: L, y: T }, { x: R, y: T }, { x: R, y: B }, { x: L, y: B }];
  // a few px of slack behind the start, so a slightly backward first step still counts
  const cx = (L + R) / 2, cy = (T + B) / 2, d = Math.hypot(cx - from.x, cy - from.y) || 1;
  const back = { x: from.x - ((cx - from.x) / d) * PAD, y: from.y - ((cy - from.y) / d) * PAD };
  const on = corners.some((c, n) => inTriangle(p, back, c, corners[(n + 1) % 4]));
  // still making its way there: the clock runs from the last step, so a slow hand (or a busy machine) isn't cut off;
  // a pointer resting on the way lets go after AIM_MS
  if (on && (aim.lx !== p.x || aim.ly !== p.y)) { aim.until = now + AIM_MS; aim.lx = p.x; aim.ly = p.y; }
  return on;
}

/** The box around a card's buttons (Use, switches), or null when it has none. */
export function controlsRect(el) {
  if (!el || !el.isConnected) return null;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const c of el.querySelectorAll('button, [role="switch"]')) {
    const x = c.getBoundingClientRect();
    if (!x.width || !x.height) continue;
    l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom);
  }
  return r > l ? { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t } : null;
}
/** Is the pointer over the card's buttons (with a little slack)? */
export function overControls(el, p = pt) {
  const r = p && controlsRect(el);
  return !!r && p.x >= r.left - PAD && p.x <= r.right + PAD && p.y >= r.top - PAD && p.y <= r.bottom + PAD;
}

/** Is the pointer (at p) over el's box? A see-through card (its surface lets clicks through) is still "under" it. */
export function over(el, p = pt) {
  if (!el || !p || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

// the open card with buttons on it (your member's card), while it's up: what's under it doesn't open its own card
// (an element, or a function that finds it: a card drawn a frame later than it opened)
let held = null;
const heldEl = () => (typeof held === 'function' ? held() : held);
export const holdCard = el => { held = el || null; };
export const dropCard = el => { if (!el || held === el) held = null; };
/** The open card the pointer is on, or heading for (not `mine`): what the pointer crosses shouldn't open over it. */
export function busyWith(p = pt, mine = null) {
  const t = aimedAt();
  if (t && t !== mine && !(mine && t.contains(mine)) && heading(p)) return t;
  const h = heldEl();
  if (h && h !== mine && !(mine && h.contains(mine)) && h.isConnected && overControls(h, p)) return h;
  return null;
}

// One card at a time (w3a A30: P4's seat card stayed up while the turn-order explainer opened beside it): whoever opens
// a card claims the screen, and the card that held it closes. The hover layer and every Tip share this one claim.
let current = null; // { id, close }
export function claim(id, close) {
  if (current && current.id !== id) { const was = current; current = null; try { was.close(); } catch { /* gone */ } }
  current = { id, close };
}
export function unclaim(id) { if (current && current.id === id) current = null; }
