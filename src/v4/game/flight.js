// Things that move between places on the table: a recruited card flies from the shop to its new owner, a minion
// travels from its leader to the space it took, and at round end the minions fly home. All use fixed-position
// ghosts + Web Animations.
import { reducedMotion } from './Tick.jsx';
import { MO } from '../motion.js';

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

export function ghostFly(html, className, a, b, { duration, scaleTo, fadeTo = 0, arc = 0, hold = false }) {
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
  const anim = ghost.animate(frames, { duration, easing: 'cubic-bezier(.25,.6,.3,1)', fill: 'forwards' }); // quick off the mark, soft landing
  const done = () => ghost.remove();
  anim.onfinish = done;
  anim.oncancel = done;
  setTimeout(done, duration + 400);
  if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
  live.add(anim);
  anim.addEventListener('finish', () => live.delete(anim));
  anim.addEventListener('cancel', () => live.delete(anim));
  return anim;
}
// every flight in the air, so a skip (a click or Space during a chain) can land them all at once
const live = new Set();
export const track = anim => { if (anim) { live.add(anim); anim.addEventListener('finish', () => live.delete(anim)); anim.addEventListener('cancel', () => live.delete(anim)); } return anim; };
export function landAll() { for (const a of [...live]) { try { a.finish(); } catch { try { a.cancel(); } catch { /* gone */ } } } live.clear(); }

export function flyCards(root, snap, moves) {
  if (!root || !motionOK()) return;
  const cells = [...root.querySelectorAll(SHOP_CARDS)];
  for (const { uid, to } of moves) {
    const s = snap.get(uid);
    const cell = s && (s.rect ? true : (cells[s.index] || cells[cells.length - 1]));
    const target = playerAnchor(root, to, '.chips');
    if (!s || !cell || !target) continue;
    const a0 = s.rect || cell.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a0.width || !b.width) continue;
    // where the card was, kept on screen: a dialog can scroll the page (or a phone's row its cards) away from it
    // between the click and the move, and a flight that starts off screen is never seen
    const a = { width: a0.width, height: a0.height, left: Math.max(0, Math.min(innerWidth - a0.width, a0.left)), top: Math.max(0, Math.min(innerHeight - a0.height, a0.top)) };
    // the card lifts off the shop, holds a beat so you see which one, then travels to its new owner
    // land on the new member's own chip (or the "+N more" pill holding it) and make that chip glow
    const chip = root.querySelector(`.lt-seat[data-pid="${to}"] [data-uids~="${uid}"]`) || root.querySelector(`.lt-seat[data-pid="${to}"] [data-uid="${uid}"]`);
    const land = chip && visibleEl(chip) ? chip : target;
    const lb = land.getBoundingClientRect();
    ghostFly(s.html, 'flight', a, lb.width ? lb : b, { duration: MO.cardFly, scaleTo: 0.28, hold: true });
    if (chip && chip.animate) {
      chip.animate([
        { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' },
        { boxShadow: '0 0 0 4px rgba(236,230,214,.55), 0 0 14px rgba(236,230,214,.5)', transform: 'scale(1.08)' },
        { boxShadow: '0 0 0 0 rgba(236,230,214,0)', transform: 'scale(1)' },
      ], { duration: MO.chipGlow, delay: Math.round(MO.cardFly * 0.85), easing: 'ease-out' });
    }
  }
}

/**
 * A minion leaves its leader and lands on the space (Cory: "placing a minion animates it from the leader to the wheel
 * space"). The ghost is the minion's own sprite; the minion on the space shows once it has landed.
 */
export function flyWorker(root, pid, slotKey, color, { fromRect = null, duration = MO.minionFly } = {}) {
  if (!root || !motionOK()) return false;
  // from its own slot in the chair's column of minions still to place (where it stood before it left: the director
  // keeps that rect), else the column's foot, else the leader
  const col = root.querySelector(`.lt-seat[data-pid="${pid}"] .cs-minions`);
  const from = (fromRect && fromRect.width ? { getBoundingClientRect: () => fromRect } : null) || (col && visible(col) && (col.lastElementChild || col)) || playerAnchor(root, pid, '.workers');
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
  // the minion leaves its slot at once (your click's first answer) and travels; it shows on the space as it lands
  ghostFly(html, 'worker-flight minion-flight', a, b, { duration, scaleTo: 1, fadeTo: 1, arc: 46 });
  if (landed && landed.animate) track(landed.animate([{ opacity: 0 }, { opacity: 0, offset: 0.97 }, { opacity: 1 }], { duration: duration + 30 }));
  return true;
}

/** A small token (e.g. "+2" followers) arcs from one element to another. */
export function flyToken(fromEl, toEl, html, { tag = '', duration = MO.reckonToken } = {}) {
  if (!motionOK() || !fromEl || !toEl) return false;
  const f = fromEl.getBoundingClientRect(), t = toEl.getBoundingClientRect();
  if (!f.width || !t.width) return false;
  const size = 34;
  const a = { left: f.left + f.width / 2 - size / 2, top: f.top + f.height / 2 - size / 2, width: size, height: size };
  const b = { left: t.left + t.width / 2 - size / 2, top: t.top + t.height / 2 - size / 2, width: size, height: size };
  const anim = ghostFly(html, `token-flight ${tag}`.trim(), a, b, { duration, scaleTo: 0.9, fadeTo: 0.15, arc: 70 });
  return anim || true;
}

/** Every member chip in the cults as it stands: uid → { html (its portrait), rect } (a released one flies from here). */
export function snapshotChips(root) {
  const out = new Map();
  if (!root) return out;
  root.querySelectorAll('.cs-member[data-uids]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const fig = el.querySelector('.fig svg, .fig img, svg');
    const html = fig ? fig.outerHTML : '';
    for (const u of el.dataset.uids.split(' ')) out.set(Number(u), { html, rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  });
  return out;
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
    // home is the seat's column of minions still to place (where the next placement leaves from), else the leader
    const col = root.querySelector(`.lt-cult-seat[data-seat="${m.pid}"] .cs-minions`);
    const home = (col && visible(col) && col) || playerAnchor(root, m.pid);
    if (!home) return;
    const h = home.getBoundingClientRect();
    if (!h.width) return;
    const b = { left: h.left + h.width / 2 - m.rect.width / 2, top: h.top + h.height / 2 - m.rect.height / 2, width: m.rect.width, height: m.rect.height };
    setTimeout(() => ghostFly(m.html, 'worker-flight minion-flight home', m.rect, b, { duration: MO.minionsHome, scaleTo: 0.8, fadeTo: 0.2, arc: 40 }), k * MO.minionsHomeStagger);
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
    // a card staying in its row slides along it; one that changes rows fades in at its new cell (never crossing the grid)
    if (Math.abs(dy) > 4) { el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.33 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' }); return; }
    el.animate([{ transform: `translate(${dx}px,0)` }, { transform: 'none' }], { duration: MO.shopSlide, easing: 'cubic-bezier(.3,.7,.4,1)' });
  });
}

// ---------- pieces: every gain and payment travels from where it came from to where it lands ----------
// (Cory, 2026-10-15: "animations for actions and follower gain, member gain, etc, should all go clearly directly to
// their source on the screen. There should be a super tactile feel.") gains.js says what moved and from where (engine
// state diffs + log); this finds those places on screen and flies one piece per unit, MO.pieceStagger apart, so a +6
// reads as six. The destination counts each piece as it lands, never before (a held number on a stack, Tick's arrival
// on a follower count). Decoration only: nothing waits on a piece, and input is never blocked.

const arrivals = new WeakMap(); // destination element → { at, span }: when its first piece lands and how long the rest take
/** Pieces will land on `el` from `at` (performance.now ms) for `span` ms: its number counts as they arrive (Tick).
 *  `landed`: they already have (the number rolls the moment it changes). */
export function expectArrival(el, at, span, landed = false) { if (el && el.nodeType === 1) arrivals.set(el, { at, span, landed }); }
export function clearArrivals(els) { for (const el of els) arrivals.delete(el); }
/** When pieces are flying to `el` (or an ancestor of it): { delay, span } in ms from now, else null. Tick reads it. */
export function arrivalFor(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const a = arrivals.get(e);
    if (a) { const now = performance.now(); return a.at + a.span + 1500 > now ? { delay: Math.max(0, a.at - now), span: a.span, el: e, landed: !!a.landed } : null; }
  }
  return null;
}

/** A place on screen for a gains.js source or target, under `root`; `snap` is the shop as it was (snapshotShop). */
export function placeOf(root, where, snap = null) {
  if (!root || !where) return null;
  const seat = pid => root.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const shown = el => (el && visibleEl(el) ? el : null);
  switch (where.kind) {
    case 'slot': return shown(root.querySelector(`[data-slot="${where.key}"] .base`)) || shown(root.querySelector(`[data-slot="${where.key}"]`));
    case 'stack': { const s = seat(where.pid); return s && shown(s.querySelector(`.cs-stack[data-res="${where.r}"]`)); }
    case 'total': { const s = seat(where.pid); return s && shown(s.querySelector('.cs-total')); }
    case 'crowd': { const s = seat(where.pid); return s && (shown(s.querySelector('.cs-crowd .cs-member')) || shown(s.querySelector('.cs-head'))); }
    case 'member': { const s = seat(where.pid); return s && (shown(s.querySelector(`.cs-member[data-member="${where.def}"]`)) || shown(s.querySelector('.cs-crowd'))); }
    case 'rate': return shown(root.querySelector(`.lt-rate[aria-label*="+${where.n} follower"]`)) || shown(root.querySelector('.lt-rates'));
    case 'card': {
      const s = snap && snap.get(where.uid);
      if (s && s.rect) return { getBoundingClientRect: () => s.rect, rectOnly: true };
      return shown(root.querySelector(`.lt-shop .card[data-uid="${where.uid}"]`));
    }
    case 'hub': return shown(root.querySelector('.stage .hub-label'));
    default: return null;
  }
}

/** The picture a piece wears: the stack's own glyph, the follower mark, else a dot. */
export function pieceHtml(root, m) {
  const to = m.pay ? m.from : m.to;
  const seat = root.querySelector(`.lt-cult-seat[data-seat="${to.pid}"]`);
  const g = m.what === 'res' ? seat && seat.querySelector(`.cs-stack[data-res="${m.r}"] svg`) : seat && seat.querySelector('.cs-total svg');
  return g ? g.outerHTML : `<i class="piece-dot" style="background:var(--${m.r || 'lamp-ink'})"></i>`;
}

/** A stack's number shows what has landed so far (data-hold), and settles to the real number with the last piece. */
export function holdStack(stackEl, from) {
  const b = stackEl && stackEl.querySelector('b.num');
  if (!b) return null;
  // v: where the number is going (what has landed); cur: what it shows. A roll moves cur toward v; an arrival mid-roll
  // retargets it (never a jump); done() while rolling lets go only when the roll has finished
  let v = from, cur = from, raf = 0, dead = false, rolling = false, ending = false, rate = 0;
  // a held number never shows below 0, whatever arrives out of order
  const show = x => { b.dataset.hold = String(Math.max(0, Math.round(x))); };
  const end = () => { dead = true; cancelAnimationFrame(raf); delete b.dataset.hold; };
  show(cur);
  let last = 0;
  const tick = now => {
    const dt = last ? Math.min(34, Math.max(0, now - last)) : 16;
    last = now;
    const d = v - cur;
    cur = Math.abs(d) <= rate * dt ? v : cur + Math.sign(d) * rate * dt;
    show(cur);
    if (cur !== v) { raf = requestAnimationFrame(tick); return; }
    rolling = false; last = 0;
    if (ending) end();
  };
  return {
    step(by) { if (dead) return; v += by; if (!rolling) { cur = v; show(cur); } },
    /** a bundle lands: the number rolls to v + by over ms (steps per ms), retargeted by whatever lands meanwhile */
    roll(by, ms) {
      if (dead) return;
      v += by;
      rate = Math.max(rate, Math.abs(v - cur) / Math.max(1, ms));
      if (!rolling) { rolling = true; last = 0; raf = requestAnimationFrame(tick); }
    },
    /** let go (after a roll in progress has finished; `now`: at once, the real number shows, as a skip wants) */
    done(now = false) { if (dead) return; if (rolling && !now) ending = true; else end(); },
  };
}
export const bump = (el, down = false) => {
  if (!el || !el.animate || el.rectOnly) return;
  el.animate(down
    ? [{ transform: 'scale(1)' }, { transform: 'scale(.86)' }, { transform: 'scale(1)' }]
    : [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: MO.pieceBump, easing: 'cubic-bezier(.3,1.45,.5,1)' });
};

/**
 * Fly every move gains.js found (one call per state change). Pieces leave a stack at once (its number drops as each
 * goes), and arrive at a stack or follower count one by one (its number climbs as each lands). Returns pieces flown.
 */
export function flyGains(root, moves, { snap = null, before = null } = {}) {
  if (!root || !moves || !moves.length) return 0;
  const ok = motionOK();
  let flown = 0, t = 0;
  const holds = new Map(); // stack element → hold (one per stack, shared by every move touching it)
  const held = (el, start) => { if (!holds.has(el)) holds.set(el, { h: start == null ? null : holdStack(el, start), left: 0 }); return holds.get(el); };
  for (const m of moves) {
    const a = placeOf(root, m.from, snap), b = placeOf(root, m.to, snap);
    if (!ok || !a || !b) continue;
    const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (!ar.width || !br.width) continue;
    const n = Math.min(m.n, MO.pieceMax), per = m.n / n;
    const html = pieceHtml(root, m);
    // stacks show what they held before this move, then count each piece out (a payment) or in (a gain)
    const fromStack = m.from.kind === 'stack' ? a : null, toStack = m.to.kind === 'stack' ? b : null;
    const startOf = where => { const p = before && before.players[where.pid]; return p ? (p.res[where.r] || 0) : null; };
    const out = fromStack ? held(fromStack, startOf(m.from)) : null;
    const into = toStack ? held(toStack, startOf(m.to)) : null;
    if (out) out.left += n;
    if (into) into.left += n;
    if (m.to.kind === 'total') arrivals.set(b, { at: performance.now() + t + MO.pieceFly, span: (n - 1) * MO.pieceStagger });
    const size = m.what === 'fol' ? 20 : 18;
    for (let k = 0; k < n; k++) {
      const share = Math.round(per * (k + 1)) - Math.round(per * k);
      const at = t + k * MO.pieceStagger;
      const go = () => {
        const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
        const jitter = (k % 3 - 1) * 4;
        const ra = { left: A.left + A.width / 2 - size / 2 + jitter, top: A.top + A.height / 2 - size / 2, width: size, height: size };
        const rb = { left: B.left + B.width / 2 - size / 2, top: B.top + B.height / 2 - size / 2, width: size, height: size };
        ghostFly(html, `piece-flight piece-${m.what}${m.pay ? ' pay' : ''}`, ra, rb, { duration: MO.pieceFly, scaleTo: m.pay ? 0.7 : 1, fadeTo: m.pay ? 0.1 : 1, arc: 26 + (k % 2) * 10 });
        if (out && out.h) { out.h.step(-share); out.left--; bump(fromStack, true); if (!out.left) out.h.done(); }
      };
      const land = () => {
        if (into && into.h) { into.h.step(share); into.left--; if (!into.left) into.h.done(); }
        bump(b);
      };
      if (at) setTimeout(go, at); else go();
      setTimeout(land, at + MO.pieceFly);
      flown++;
    }
    t += Math.min(n, 3) * MO.pieceStagger; // the next move starts while this one is still flying
  }
  // a safety net: whatever happens, every held number lets go after the last piece could have landed
  if (holds.size) setTimeout(() => holds.forEach(x => x.h && x.h.done()), t + MO.pieceMax * MO.pieceStagger + MO.pieceFly + 200);
  if (flown && typeof window !== 'undefined') window.__patronsPieces = (window.__patronsPieces || 0) + flown;
  return flown;
}

// ---------- paths (design/prototypes/motion/grammar.md §2): the shape of a flight says what kind of move it is ----------
// arc: gains, gifts, a card to its crowd, followers scored (a true parabola: an outer layer travels the straight line,
//      an inner one rises and falls) · line: a take (a steal), straight, a snatch · drop: a payment, lifts 6px then falls
//      into what it pays, shrinking and fading (it's spent) · cross: a swap, the arc bowing the other way.
// `turnTo`: a piece that changes color on its way (a steal that arrives as magenta) turns at its midpoint.
export function flyPath(html, className, a, b, { path = 'arc', duration = 320, label = '', trail = 0, trailGap = 30, turnTo = null, fade = false } = {}) {
  if (typeof document === 'undefined' || !document.body.animate) return null;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const dist = Math.hypot(dx, dy);
  const h = path === 'arc' || path === 'cross' ? Math.max(16, Math.min(70, dist * 0.18)) * (path === 'cross' ? -1 : 1) : 0;
  const one = (k, scale, opacity, delay) => {
    const outer = document.createElement('div');
    outer.className = `${className} ghost-layer path-${path}`;
    outer.dataset.born = String(Date.now());
    Object.assign(outer.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    const inner = document.createElement('div');
    inner.className = 'path-inner';
    inner.innerHTML = html + (k === 0 && label ? `<b class="bundle-n">${label}</b>` : '');
    if (k > 0) Object.assign(inner.style, { transform: `scale(${scale})`, opacity: String(opacity) });
    outer.appendChild(inner);
    document.body.appendChild(outer);
    const travel = path === 'line' ? 'cubic-bezier(.55,0,.1,1)' : path === 'drop' ? 'cubic-bezier(.5,0,.75,0)' : 'cubic-bezier(.45,0,.2,1)';
    const frames = path === 'drop'
      ? [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(0,-6px) scale(1)', opacity: 1, offset: 0.2, easing: travel },
        { transform: `translate(${dx * 0.85}px,${dy * 0.85}px) scale(.85)`, opacity: 1, offset: 0.85 }, { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }]
      : [{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px,${dy}px)` }];
    const anim = outer.animate(frames, { duration, delay, easing: path === 'drop' ? 'linear' : travel, fill: 'both' });
    track(anim);
    // it fades onto what it lands on in its last 15% (a payment fades in its own frames)
    if (fade && path !== 'drop') track(outer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration, delay, fill: 'both' }));
    if (h) track(inner.animate([{ translate: '0 0' }, { translate: `0 ${-h}px`, offset: 0.5, easing: 'ease-in' }, { translate: '0 0' }], { duration, delay, easing: 'ease-out', fill: 'both' }));
    if (k === 0 && label) { const n = inner.querySelector('.bundle-n'); if (n) track(n.animate([{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration, delay, fill: 'both' })); }
    if (turnTo && k === 0) {
      const tint = document.createElement('div');
      tint.className = 'path-turn';
      tint.innerHTML = turnTo;
      inner.appendChild(tint);
      // the turn is a crossfade at the midpoint as long as the grammar's colour turn (80ms at Steady), however short the
      // flight: a 10% window was 26ms on a short take, and the colour seemed to change in the stack (motion gaps A10)
      const half = Math.min(0.3, MO.colorTurn / 2 / Math.max(1, duration));
      track(tint.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 - half }, { opacity: 1, offset: 0.5 + half }, { opacity: 1 }], { duration, delay, fill: 'both' }));
    }
    const done = () => outer.remove();
    anim.addEventListener('finish', done);
    anim.addEventListener('cancel', done);
    setTimeout(done, duration + delay + 500);
    return anim;
  };
  const lead = one(0, 1, 1, 0);
  for (let k = 1; k <= trail; k++) one(k, 0.7, k === 1 ? 0.6 : 0.3, k * trailGap);
  if (typeof window !== 'undefined') window.__patronsFlights = (window.__patronsFlights || 0) + 1;
  return lead;
}

/** A place pulses (a source about to give: a space, a rim, a rate) or presses (a payment taken in). */
export function pulse(el, ms, { press = false } = {}) {
  if (!el || !el.animate || el.rectOnly) return;
  track(el.animate(press
    ? [{ transform: 'scale(1)' }, { transform: 'scale(.96)', offset: 0.5 }, { transform: 'scale(1)' }]
    : [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(1.04)', filter: 'brightness(1.25)', offset: 0.45 }, { transform: 'scale(1)', filter: 'brightness(1)' }],
  { duration: ms, easing: 'cubic-bezier(.3,1.4,.5,1)' }));
}
/** A stack being taken from shifts toward the taker and back, once. */
export function tug(el, toward, ms) {
  if (!el || !el.animate || !toward) return;
  const a = el.getBoundingClientRect(), b = toward.getBoundingClientRect();
  const dx = b.left - a.left, dy = b.top - a.top, d = Math.hypot(dx, dy) || 1;
  track(el.animate([{ translate: '0 0' }, { translate: `${(3 * dx / d).toFixed(1)}px ${(3 * dy / d).toFixed(1)}px`, offset: 0.4 }, { translate: '0 0' }], { duration: ms, easing: 'ease-out' }));
}
/** The destination settles as a piece lands (lighter between two rivals, fuller for a bundle). */
export function settle(el, ms, k = 1.18) {
  if (!el || !el.animate || el.rectOnly) return;
  track(el.animate([{ transform: 'scale(1)' }, { transform: `scale(${k})`, offset: 0.35 }, { transform: 'scale(1)' }], { duration: ms, easing: 'cubic-bezier(.3,1.5,.5,1)' }));
}
