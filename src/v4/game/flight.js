// Things that move between places on the table: a recruited card flies from the shop to its new owner,
// and a worker travels from its owner to the space it took. Both use fixed-position ghosts + Web Animations.
import { reducedMotion } from './Tick.jsx';

export const motionOK = () => !reducedMotion() && typeof document !== 'undefined' && !!document.body.animate;

const visibleEl = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
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

function ghostFly(html, className, a, b, { duration, scaleTo, fadeTo = 0, arc = 0, hold = false }) {
  const ghost = document.createElement('div');
  ghost.className = className;
  ghost.innerHTML = html;
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const frames = hold ? [
    { transform: 'translate(0,0) scale(1)', opacity: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
    { transform: 'translate(0,-10px) scale(1.06)', opacity: 1, offset: 0.25 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 30}px) scale(${(1 + scaleTo) / 2})`, opacity: 1, offset: 0.62 },
    { transform: `translate(${dx}px,${dy}px) scale(${scaleTo})`, opacity: fadeTo },
  ] : [
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - arc}px) scale(${(1 + scaleTo) / 2})`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px,${dy}px) scale(${scaleTo})`, opacity: fadeTo },
  ];
  const anim = ghost.animate(frames, { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
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
    // the card lifts off the shop, holds a beat so you see which one, then travels to its new owner
    // land on the new member's own chip (or the "+N more" pill holding it) and make that chip glow
    const chip = root.querySelector(`.pl[data-pid="${to}"] .chip[data-uids~="${uid}"]`);
    const land = chip && visibleEl(chip) ? chip : target;
    const lb = land.getBoundingClientRect();
    ghostFly(s.html, 'flight', a, lb.width ? lb : b, { duration: 760, scaleTo: 0.28, hold: true });
    if (chip && chip.animate) {
      chip.animate([
        { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' },
        { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.08)' },
        { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' },
      ], { duration: 900, delay: 620, easing: 'ease-out' });
    }
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
  ghostFly(`<i style="background:${color}"></i>`, 'worker-flight', a, b, { duration: 260, scaleTo: 1, fadeTo: 1, arc: 30 });
  return true;
}
