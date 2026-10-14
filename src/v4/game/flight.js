// Things that move between places on the table: a recruited card flies from the shop to its new owner, a minion
// travels from its leader to the space it took, and at round end the minions fly home. All use fixed-position
// ghosts + Web Animations.
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

/** Where a player's things land: their chair at the table (their leader, if it's drawn), else the older anchors. */
export function playerAnchor(root, pid, part = '') {
  const seat = root.querySelector(`.lt-seat[data-pid="${pid}"]`);
  if (seat) {
    const lead = seat.querySelector(`[data-leader="${pid}"]`);
    if (lead && visible(lead)) return lead;
    if (visible(seat)) return seat;
  }
  const header = root.querySelector('header.bar');
  const you = root.querySelector(`.you-strip[data-pid="${pid}"]`);
  if (you && visible(you)) return you;
  const card = root.querySelector(`.pl[data-pid="${pid}"] ${part}`.trim()) || root.querySelector(`.pl[data-pid="${pid}"]`);
  if (card && visible(card) && below(card, header)) return card;
  return seat || root.querySelector('.ticker') || header;
}
const SHOP_CARDS = '.lt-shop .card[data-uid], .shop .card[data-uid]';

// the flying copy is a picture of the card, not a control: no button, no option id, not focusable
const inert = html => html.replace(/^<button/, '<div').replace(/<\/button>$/, '</div>').replace(/ data-option="[^"]*"/g, '').replace(/ type="button"/g, '').replace(/ tabindex="[^"]*"/g, '') ;

export function snapshotShop(root) {
  const snap = new Map();
  if (!root) return snap;
  // the visible copy of each card wins (the compact row hides under the buy view)
  root.querySelectorAll(SHOP_CARDS).forEach((el, index) => {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest('[aria-hidden="true"]')) return;
    // the card's own styles hang off its shop panel (compact or full): keep that context, so the flying copy
    // is the same picture at the same size, never reflowed text
    const panel = el.closest('.shop-panel');
    const ctx = panel ? panel.className.replace(/[^\w\s-]/g, '') : 'shop-panel';
    const html = `<div class="${ctx} ghost-ctx"><div class="shop ghost-ctx">${inert(el.outerHTML)}</div></div>`;
    snap.set(Number(el.dataset.uid), { html, index, full: !!el.closest('.buy-view'), rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  });
  return snap;
}

function ghostFly(html, className, a, b, { duration, scaleTo, fadeTo = 0, arc = 0, hold = false }) {
  const ghost = document.createElement('div');
  ghost.className = className + ' ghost-layer';
  ghost.dataset.born = String(Date.now());
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
  const cells = [...root.querySelectorAll(SHOP_CARDS)];
  for (const { uid, to } of moves) {
    const s = snap.get(uid);
    const cell = s && (s.rect ? true : (cells[s.index] || cells[cells.length - 1]));
    const target = playerAnchor(root, to, '.chips');
    if (!s || !cell || !target) continue;
    const a = s.rect || cell.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width || !b.width) continue;
    // the card lifts off the shop, holds a beat so you see which one, then travels to its new owner
    // land on the new member's own chip (or the "+N more" pill holding it) and make that chip glow
    const chip = root.querySelector(`.lt-seat[data-pid="${to}"] [data-uids~="${uid}"]`) || root.querySelector(`.lt-seat[data-pid="${to}"] [data-uid="${uid}"]`);
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

/**
 * A minion leaves its leader and lands on the space (Cory: "placing a minion animates it from the leader to the wheel
 * space"). The ghost is the minion's own sprite; the minion on the space shows once it has landed.
 */
export function flyWorker(root, pid, slotKey, color) {
  if (!root || !motionOK()) return false;
  const from = playerAnchor(root, pid, '.workers');
  const slot = root.querySelector(`[data-slot="${slotKey}"]`);
  const landed = slot && (slot.querySelector(`.worker[data-seat="${pid}"]`) || slot.querySelector('.worker'));
  const to = landed || (slot && slot.querySelector('.base'));
  if (!from || !to) return false;
  const f = from.getBoundingClientRect(), t = to.getBoundingClientRect();
  if (!t.width) return false;
  const size = Math.max(16, landed ? t.width : t.width * 0.6);
  const a = { left: f.left + f.width / 2 - size / 2, top: f.top + f.height / 2 - size / 2, width: size, height: size };
  const b = { left: t.left + t.width / 2 - size / 2, top: t.top + t.height / 2 - size / 2, width: size, height: size };
  const html = landed ? landed.innerHTML : `<i style="background:${color}"></i>`;
  const duration = 480;
  ghostFly(html, 'worker-flight minion-flight', a, b, { duration, scaleTo: 1, fadeTo: 1, arc: 46 });
  if (landed && landed.animate) landed.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: duration + 30 });
  return true;
}

/** A small token (e.g. "+2" followers) arcs from one element to another. */
export function flyToken(fromEl, toEl, html, { tag = '', duration = 640 } = {}) {
  if (!motionOK() || !fromEl || !toEl) return false;
  const f = fromEl.getBoundingClientRect(), t = toEl.getBoundingClientRect();
  if (!f.width || !t.width) return false;
  const size = 34;
  const a = { left: f.left + f.width / 2 - size / 2, top: f.top + f.height / 2 - size / 2, width: size, height: size };
  const b = { left: t.left + t.width / 2 - size / 2, top: t.top + t.height / 2 - size / 2, width: size, height: size };
  ghostFly(html, `token-flight ${tag}`.trim(), a, b, { duration, scaleTo: 0.9, fadeTo: 0.15, arc: 70 });
  if (toEl.animate) toEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 420, delay: duration - 80, easing: 'ease-out' });
  return true;
}

/** Where every placed minion is right now (to send them home when the round clears the wheel). */
export function snapshotMinions(root) {
  const snap = [];
  if (!root) return snap;
  root.querySelectorAll('.lt-wheel [data-slot] .worker[data-seat]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width) snap.push({ pid: Number(el.dataset.seat), html: el.innerHTML, rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  });
  return snap;
}
/** At round end the wheel's minions fly home to their leaders, one after another. */
export function flyMinionsHome(root, snap) {
  if (!root || !motionOK() || !snap || !snap.length) return 0;
  let n = 0;
  snap.forEach((m, k) => {
    const home = playerAnchor(root, m.pid);
    if (!home) return;
    const h = home.getBoundingClientRect();
    if (!h.width) return;
    const b = { left: h.left + h.width / 2 - m.rect.width / 2, top: h.top + h.height / 2 - m.rect.height / 2, width: m.rect.width, height: m.rect.height };
    setTimeout(() => ghostFly(m.html, 'worker-flight minion-flight home', m.rect, b, { duration: 520, scaleTo: 0.8, fadeTo: 0.2, arc: 40 }), k * 45);
    n++;
  });
  return n;
}

/** Remove flying ghosts: all of them (a modal opened), or those older than maxAge ms (they should be gone). */
export function clearFlights(maxAge = 0) {
  if (typeof document === 'undefined') return;
  const now = Date.now();
  document.querySelectorAll('.ghost-layer').forEach(g => { if (!maxAge || now - Number(g.dataset.born || 0) > maxAge) g.remove(); });
}

/** The cards still in the shop slide from where they were to where they are now (no one-frame reflow). */
export function slideShop(root, snap) {
  if (!root || !motionOK()) return;
  root.querySelectorAll(SHOP_CARDS).forEach(el => {
    const s = snap.get(Number(el.dataset.uid));
    if (!s || !s.rect || el.closest('[aria-hidden="true"]') || s.full !== !!el.closest('.buy-view')) return;
    const r = el.getBoundingClientRect();
    const dx = s.rect.left - r.left, dy = s.rect.top - r.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.3,.7,.4,1)' });
  });
}
