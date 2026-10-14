// Things that move between places on the table: a recruited card flies from the shop to its new owner,
// and a worker travels from its owner to the space it took. Both use fixed-position ghosts + Web Animations.
import { reducedMotion } from './Tick.jsx';

export const motionOK = () => !reducedMotion() && typeof document !== 'undefined' && !!document.body.animate;

const visible = el => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
};
const below = (el, header) => {
  if (!header) return true;
  const h = header.getBoundingClientRect();
  return el.getBoundingClientRect().top >= h.bottom - 4;
};

/** Where a player's things land: the "you" strip in the header for you, else their card if it's in view. */
export function playerAnchor(root, pid, part = '') {
  const header = root.querySelector('header.bar');
  const you = root.querySelector(`.you-strip[data-pid="${pid}"]`);
  if (you && visible(you)) return you;
  const card = root.querySelector(`.pl[data-pid="${pid}"] ${part}`.trim()) || root.querySelector(`.pl[data-pid="${pid}"]`);
  if (card && visible(card) && below(card, header)) return card;
  return root.querySelector('.ticker') || header;
}

export function snapshotShop(root) {
  const snap = new Map();
  if (!root) return snap;
  root.querySelectorAll('.shop .card[data-uid]').forEach((el, index) => snap.set(Number(el.dataset.uid), { html: el.outerHTML, index }));
  return snap;
}

function ghostFly(html, className, a, b, { duration, scaleTo, fadeTo = 0, arc = 0 }) {
  const ghost = document.createElement('div');
  ghost.className = className;
  ghost.innerHTML = html;
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - arc}px) scale(${(1 + scaleTo) / 2})`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px,${dy}px) scale(${scaleTo})`, opacity: fadeTo },
  ], { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  const done = () => ghost.remove();
  anim.onfinish = done;
  anim.oncancel = done;
  setTimeout(done, duration + 400);
  if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
}

export function flyCards(root, snap, moves) {
  if (!root || !motionOK()) return;
  const cells = [...root.querySelectorAll('.shop .card[data-uid]')];
  for (const { uid, to } of moves) {
    const s = snap.get(uid);
    const cell = s && (cells[s.index] || cells[cells.length - 1]);
    const target = playerAnchor(root, to, '.chips');
    if (!s || !cell || !target) continue;
    const a = cell.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width || !b.width) continue;
    ghostFly(s.html, 'flight', a, b, { duration: 460, scaleTo: 0.25 });
  }
}

/** A worker token travels from its owner to the space. `color` is the player's color. */
export function flyWorker(root, pid, slotKey, color) {
  if (!root || !motionOK()) return false;
  const from = playerAnchor(root, pid, '.workers');
  const to = root.querySelector(`[data-slot="${slotKey}"] .base`);
  if (!from || !to) return false;
  const f = from.getBoundingClientRect(), t = to.getBoundingClientRect();
  if (!t.width) return false;
  const size = Math.max(14, t.width * 0.72);
  const a = { left: f.left + f.width / 2 - size / 2, top: f.top + f.height / 2 - size / 2, width: size, height: size };
  const b = { left: t.left + t.width / 2 - size / 2, top: t.top + t.height / 2 - size / 2, width: size, height: size };
  ghostFly(`<i style="background:${color}"></i>`, 'worker-flight', a, b, { duration: 280, scaleTo: 1, fadeTo: 1, arc: 30 });
  return true;
}
