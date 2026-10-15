// Hover cards for the Lamplit table: a pointer resting on a space, a rim plaque, a seat or a shop card shows what it
// is and what it would do; a tap (touch) pins the same card as a sheet. Every number comes from the engine:
// YOU GET from the dry run (previewSpace), standings from contestTable, pay from paymentPlan.
// UI-A's wheel calls onSpaceHover(key, el|null, { pinned }), plaques onPlaqueHover(qid, el|null); seats and shop
// cards are mine. GameScreen mounts <HoverCardLayer> once.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, roman, spaceOpen, contestTable, cardDef, botLevel, BOT_LEVEL_INFO } from '../../engine/v4/index.js';
import { playerColor, standings } from '../format.js';
import { Popover } from './parts.jsx';
import { CardText, ContestStandings, MemberCard, CardName, YoudGet, usePreview, requestPreviews } from './Info.jsx';
import { SeatFigure } from './Glyphs.jsx';
import { Rich } from './Rich.jsx';
import { unlockedBy, surely } from './cards.js';
import { memberCopyTargets } from './cards.js';
import { DeckCard } from './MemberDeck.jsx';
import { SeatMembers, FollowersCard, SpendingLine } from './MemberUse.jsx';
import { safeThisRound } from './memberUse.js';
import './lamp-b.css';
import { MO } from '../motion.js';
import { HOVER_DELAY_MS } from './hoverDelay.js';
import { aimAt, arrived, heading, aimedAt, over, overControls, busyWith, claim, unclaim, stillOn } from './hoverIntent.js';

const RINGS = ['outer ring', 'middle ring', 'inner ring'];
const sphereOf = qid => quadrant(qid).resource;

/**
 * The hover/pin state: one card at a time. Opens once the pointer has rested on its target HOVER_DELAY_MS (Cory,
 * 2026-10-15: a mouse sweeping across the board shouldn't fire hovers nonstop), drawn hidden meanwhile so it shows
 * whole in one frame; with a card already up, moving to a neighbour swaps it in place at once; leaving closes it 150ms
 * later (unless the pointer arrives somewhere else first). A tap pins it at once (a sheet on phones).
 */
export const CLOSE_MS = MO.hoverClose; // src/v4/motion.js (opening: hoverDelay.js)
/** Between two spaces: a pointer crossing the wheel's gutters keeps the card this long before it closes. */
export const GRACE_MS = 450;
const onWheel = from => {
  // the wheel the space being left belongs to (never some other box that happens to be called a stage)
  const st = lastPt && from && from.el && from.el.closest ? from.el.closest('.stage') : null;
  if (!st) return false;
  const b = st.getBoundingClientRect();
  return lastPt.x >= b.left && lastPt.x <= b.right && lastPt.y >= b.top && lastPt.y <= b.bottom;
};
/**
 * The hover state lives outside React's render path: the object is stable, `card` and `space` are getters, and only
 * the layer (useHoverCard) and the shop's tick (useHoverSpace) subscribe, so a hover never re-renders the table.
 */
export function useHoverCards() {
  const api = useRef(null);
  if (!api.current) api.current = createHover();
  useEffect(() => () => api.current.dispose(), []);
  return api.current;
}
const LAYER = Symbol('hover layer');
// the same target (a seat or its follower total: any part of that seat)
const sameTarget = (a, b) => !!a && !!b && a.kind === b.kind && ((b.kind === 'seat' || b.kind === 'followers') ? a.pid === b.pid
  : a.el === b.el && a.pid === b.pid && a.key === b.key && a.uid === b.uid && a.qid === b.qid);
export function createHover() {
  let card = null, openT = null, closeT = null, want = null, heldBack = null, retryT = null;
  // prep: the card waiting out the hover delay, drawn hidden in the meantime (the layer renders it off screen), so when
  // the delay ends only its place and its paint are left (speed squad 2026-10-15: testers saw cards fill in late)
  let prep = null;
  const subs = new Set();
  const notify = () => { for (const fn of subs) fn(); };
  const unprep = () => { want = null; if (prep) { prep = null; notify(); } };
  const set = next => {
    if (next === card) return;
    // a seat card that closes or gives way ends any crossing toward it (the layer itself stays mounted, off screen)
    if (card && card.kind === 'seat' && typeof document !== 'undefined') arrived(document.querySelector('[data-hover-layer]'));
    card = next;
    // one card on screen at a time (w3a A30): the layer's card closes any Tip that was up, and gives way to one
    if (card) claim(LAYER, () => { clearTimeout(openT); clearTimeout(closeT); want = null; prep = null; if (card) { card = null; notify(); } });
    else unclaim(LAYER);
    notify();
  };
  // after the rest: the prepared card becomes the card (one notice: the layer reads the same object, already drawn)
  const later = (next, draw) => {
    want = next;
    if (draw) { prep = next; notify(); }
    openT = setTimeout(() => {
      want = null;
      if (card && card.pinned) { unprep(); return; }
      prep = null;
      set(next);
    }, HOVER_DELAY_MS);
  };
  // a seat's card has buttons and a list to scroll: it stays while the pointer is on it or on its way to it, and what
  // the pointer crosses on the way (the seat's own members, the next seat) doesn't take its place (hoverIntent.js)
  const liveBox = () => (typeof document !== 'undefined' ? document.querySelector('[data-hover-layer][data-live="1"]') : null);
  const closeSoon = ms => {
    clearTimeout(closeT);
    const wait = () => { if (heading() || over(liveBox())) { closeT = setTimeout(wait, 80); return; } if (card && !card.pinned) set(null); };
    closeT = setTimeout(wait, ms);
  };
  // a hover held back while the pointer crossed toward an open card opens as soon as that's over, if the pointer still
  // rests on it (w4b #2: a seat hovered with a single move opened nothing: nothing moved again to retry it)
  const holdBack = next => {
    heldBack = next;
    clearTimeout(retryT);
    const again = () => {
      if (heldBack !== next) return;
      if (!stillOn(next.el)) { heldBack = null; return; }
      if (blocks(next)) { retryT = setTimeout(again, 60); return; }
      heldBack = null;
      show(next);
    };
    retryT = setTimeout(again, 60);
  };
  const blocks = next => !next.pinned && ((card && !card.pinned && card.kind === 'seat' && ((heading() && aimedAt() === liveBox()) || overControls(liveBox())))
    || (() => { const b = busyWith(); return !!b && b !== liveBox(); })());
  const show = next => {
    if (heldBack && heldBack !== next) { heldBack = null; clearTimeout(retryT); }
    // crossing toward the open seat card: nothing on the way opens over it, and its close isn't cancelled
    // (its surface is see-through to clicks, so "on it" is measured: the pointer over its box)
    if (next.el && !next.pinned && card && !card.pinned && card.kind === 'seat' && ((heading() && aimedAt() === liveBox()) || overControls(liveBox()))) { holdBack(next); return; }
    clearTimeout(closeT);
    if (!next.el) {
      clearTimeout(openT); unprep();
      if (card && !card.pinned && card.kind === 'seat' && liveBox()) { aimAt(liveBox()); closeSoon(CLOSE_MS); return; }
      // leaving a space for the wheel's gutter keeps the card a moment longer, so sweeping across the spaces hands it
      // from one to the next without a close/open flicker; leaving the wheel closes it at the usual pace
      const wait = next.kind === 'space' && card && card.kind === 'space' && onWheel(card) ? GRACE_MS : CLOSE_MS;
      closeT = setTimeout(() => { if (card && !card.pinned) set(null); }, wait);
      return;
    }
    // crossing toward your member's open card (a Use button on it): the seat card doesn't open over it
    if (!next.pinned) { const b = busyWith(); if (b && b !== liveBox()) { holdBack(next); return; } }
    // the same card again (the pointer moving on its target, or on another part of the same seat): it stays where it
    // opened, and a close on its way is called off
    if (card && !card.pinned && !next.pinned && sameTarget(card, next)) { clearTimeout(openT); unprep(); return; }
    // a card already on its way to open for this same target: let it come (the rest isn't restarted)
    if (!next.pinned && want && sameTarget(want, next)) return;
    clearTimeout(openT); unprep();
    if (next.pinned) { set(next); return; } // a click or a tap: at once
    if (card && card.pinned) return; // a pinned card stays until it's closed
    // a seat's card is a big one you can use: with another card up it still waits out the rest (a seat only passed over
    // on the way somewhere never pops a card over that place); the card that's up stays meanwhile
    if (card && (next.kind === 'seat' || next.kind === 'followers')) { later(next, false); return; }
    if (card) { set(next); return; } // a card is up: swap its content in place, no delay, no flicker
    later(next, true); // nothing up: it opens after the rest, drawn hidden meanwhile
  };
  return {
    get card() { return card; },
    /** the card waiting out the hover delay (drawn hidden), or null */
    get prep() { return prep; },
    /** the space under the pointer (the shop ticks "✓ after X" for it) */
    get space() { return card && card.kind === 'space' && !card.past ? card.key : null; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    close() { clearTimeout(openT); clearTimeout(closeT); clearTimeout(retryT); heldBack = null; unprep(); set(null); },
    /** the pointer is on a card you can use (a seat's members: its Use button, its list scrolled): it stays */
    hold() { clearTimeout(closeT); arrived(); },
    /** the pointer left that card: it closes as if it had left the target */
    letGo() { closeSoon(CLOSE_MS); },
    onSpaceHover: (key, el, o = {}) => show({ kind: 'space', key, el, pinned: !!o.pinned, past: !!o.past }),
    onPlaqueHover: (qid, el, o = {}) => show({ kind: 'plaque', qid, el, pinned: !!o.pinned }),
    onSeatHover: (pid, el, o = {}) => show({ kind: 'seat', pid, el, pinned: !!o.pinned }),
    /** a seat's follower total: where its followers came from (w3b #39) */
    onFollowersHover: (pid, el, o = {}) => show({ kind: 'followers', pid, el, pinned: !!o.pinned }),
    onCardHover: (uid, el, o = {}) => show({ kind: 'card', uid, el, pinned: !!o.pinned }),
    onDeckHover: (el, o = {}) => show({ kind: 'deck', el, pinned: !!o.pinned }),
    dispose() { clearTimeout(openT); clearTimeout(closeT); clearTimeout(retryT); subs.clear(); },
  };
}
const NONE = () => () => {};
/** The card on screen (re-renders only the subscriber). */
export const useHoverCard = hover => useSyncExternalStore(hover ? hover.subscribe : NONE, () => (hover ? hover.card : null));
/** The card waiting out the hover delay, drawn hidden (re-renders only the layer). */
const useHoverPrep = hover => useSyncExternalStore(hover ? hover.subscribe : NONE, () => (hover ? hover.prep : null));
/** The space under the pointer, or null (re-renders only when it changes). */
export const useHoverSpace = hover => useSyncExternalStore(hover ? hover.subscribe : NONE, () => (hover ? hover.space : null));

/**
 * Warms the dry runs off the hover path: after each new state, every space the viewer could point at and read a "You'd
 * get" on (every open space this round, and every space they may take or join) is worked out in the background (a
 * worker in the browser), so a hover finds it ready. On the viewer's own move at once; on a rival's step a moment after
 * the table settles (bots step every second or so: a state that's gone before then isn't worth the copy).
 */
export function usePreviewWarmup(state, pid) {
  useEffect(() => {
    if (pid == null || state.over || !state.players[pid]) return undefined;
    const round = Math.max(1, state.round || 0);
    const keys = new Set();
    state.quadrants.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => { if (spaceOpen(a, round) && state.slots[`${q}-${i}`] === undefined) keys.add(`${q}-${i}`); }));
    const mine = state.pending && state.pending.player === pid;
    if (mine && state.pending.options) for (const o of state.pending.options) if (o.q != null && o.i != null) keys.add(`${o.q}-${o.i}`);
    if (!keys.size) return undefined;
    // your move: the spaces you can take first (the ones you'll point at), then the rest
    const list = [...keys];
    if (mine && state.pending.kind === 'place') { requestPreviews(state, pid, list); return undefined; }
    const t = setTimeout(() => requestPreviews(state, pid, list), 250);
    return () => clearTimeout(t);
  }, [state, pid]);
}

/**
 * The one hover card on screen. Hovering: a single persistent layer right next to what it explains (Cory, 2026-10-15:
 * never a docked spot elsewhere), pointer-transparent, so moving through it changes nothing. It sits beside its target,
 * or above it for the strips along the bottom (the shop, your chair), flipping to the other side and sliding along to
 * stay whole on screen, drawn at the page's top level above every strip. Its side is chosen once per target, so content
 * filling in never makes it jump sideways. Pinned (a tap): a sheet on phones, a card beside the target elsewhere.
 */
export function HoverCardLayer({ hover, state, me, optionFor = () => null, onPick }) {
  const c = useHoverCard(hover);
  // the card waiting out the hover delay is drawn now, hidden; when it opens, the same body (memoized below) is shown
  const prep = useHoverPrep(hover);
  useCopyTargets(c, state, me);
  const box = useRef(null);
  const [pos, setPos] = useState(null);
  const side = useRef(null); // { el, side } the side chosen for the current target
  useEffect(() => { if (c && !c.pinned) hover.close(); }, [state.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  // the element the card explains; a target re-drawn under the pointer (a refilled shop card, a chair) is found again
  // a seat's card is one you can use (Cory, 2026-10-15: its Use buttons, a long list scrolls): the pointer may move onto it
  const live = !!(c && !c.pinned && c.kind === 'seat');
  const inside = useRef(false);
  const el = c ? anchorFor(c, live && inside.current) : null;
  // what's drawn: the card that's up, else the one waiting out the delay (off screen until it opens)
  const drawn = c || (prep && !prep.pinned && prep.el && prep.el.isConnected ? prep : null);
  const drawEl = c ? el : drawn ? drawn.el : null;
  // a pinned card whose target is gone for good closes, so it can't hold the layer shut against every later hover
  useEffect(() => { if (c && c.pinned && !el) hover.close(); });
  const placed = useRef(null); // { el, at, h }: what the last placement measured (opening a prepared card re-measures only if it moved)
  const place = (force = true) => {
    const c = drawn, el = drawEl; // eslint-disable-line no-shadow
    if (!c || c.pinned || !el || !box.current) { placed.current = null; setPos(null); return; }
    const r0 = el.getBoundingClientRect(), at = `${r0.left},${r0.top},${r0.width},${r0.height}`, h0 = box.current.offsetHeight;
    if (!force && placed.current && placed.current.el === el && placed.current.at === at && placed.current.h === h0) return;
    placed.current = { el, at, h: h0 };
    // a seat's card opens right next to the part of the seat pointed at (w3a A8, Cory: "hovers open right next to what
    // you point at"; beside the whole seat it sat 136–488px from the pointer), level with it; so does everything else
    const seatBox = null;
    // a name inside a card (a pinned strip card, the turn card, the log): its card opens beside that whole card, level
    // with the name, never stacked on top of the card it was read in (motion engineer's info.mjs run)
    // (the log is a wide panel, not a card: a name in it opens its card right next to the name, w3 quiet t8-log)
    const holder = !seatBox && el.closest ? el.closest('.popover:not([data-hover-layer]), .turn-card') : null;
    let a = c.kind === 'space' ? spaceRect(el, c.key) : (seatBox || el).getBoundingClientRect();
    if (holder) {
      const hb = holder.getBoundingClientRect(), nb = el.getBoundingClientRect();
      a = { left: hb.left, right: hb.right, width: hb.width, top: nb.top, bottom: nb.bottom, height: nb.height };
    }
    const w = cardWidth(c.kind);
    const h = box.current.offsetHeight || 160;
    const p = (holder && besideSeat({ ...a, top: a.top - 12 }, w, h)) || ((c.kind === 'seat' || c.kind === 'followers') && besideSeat({ ...a, top: a.top - 12 }, w, h)) || placeBeside(a, w, h, side.current && side.current.el === el ? side.current.side : null);
    // the nub points at the middle of what the card explains (for a seat, the part pointed at), clear of the corners
    const t = seatBox || holder ? el.getBoundingClientRect() : a;
    const across = p.side === 'right' || p.side === 'left';
    p.nub = Math.round(Math.max(16, Math.min((across ? h : w) - 16, across ? t.top + t.height / 2 - p.top : t.left + t.width / 2 - p.left)));
    side.current = { el, side: p.side };
    setPos(old => (old && old.left === p.left && old.top === p.top && old.width === p.width && old.nub === p.nub ? old : p));
  };
  // placed while it's drawn hidden; when it opens, only checked again (the target may have moved in the meantime)
  const shown = !!c;
  const prevDrawn = useRef(null);
  useLayoutEffect(() => { const again = prevDrawn.current === drawn; prevDrawn.current = drawn; place(!again); }, [drawn, drawEl, shown]); // eslint-disable-line react-hooks/exhaustive-deps
  // content that fills in a moment later (the dry run's "You'd get") re-fits the card on screen
  const placeNow = useRef(place);
  placeNow.current = place;
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => placeNow.current(true));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  // a click always acts on what's under the pointer (Cory, via the detail designer: a first click was eaten while a
  // seat card stood over the wheel): the card's surface is see-through to clicks, only its controls take them, and a
  // press anywhere else closes it at once while the click goes on to what it was meant for
  useEffect(() => {
    if (!live) return undefined;
    const down = e => { if (box.current && e.target instanceof Node && box.current.contains(e.target)) return; hover.close(); };
    // its long list still scrolls under the wheel, though the pointer events go through the card
    const wheel = e => {
      const list = box.current && box.current.querySelector('.mu-list');
      if (!list || list.scrollHeight <= list.clientHeight || !over(list, { x: e.clientX, y: e.clientY })) return;
      e.preventDefault();
      list.scrollTop += e.deltaY;
    };
    addEventListener('pointerdown', down, true);
    addEventListener('wheel', wheel, { capture: true, passive: false });
    return () => { removeEventListener('pointerdown', down, true); removeEventListener('wheel', wheel, { capture: true }); };
  }, [live, hover]);
  useEffect(() => {
    if (!c || c.pinned) return undefined;
    const off = e => { if (box.current && e.target instanceof Node && box.current.contains(e.target)) return; hover.close(); };
    const key = e => { if (e.key === 'Escape') hover.close(); };
    addEventListener('scroll', off, true);
    addEventListener('keydown', key);
    return () => { removeEventListener('scroll', off, true); removeEventListener('keydown', key); };
  }, [c, hover]);
  const onPickNow = useRef(onPick);
  onPickNow.current = onPick;
  const pickHere = useCallback(id => { hover.close(); onPickNow.current(id); }, [hover]);
  // the same element while nothing it reads has changed: opening a prepared card re-renders the layer, not the card
  const drawnBody = useMemo(() => (drawn && drawEl ? cardBody(drawn, state, me, optionFor, pickHere) : null), [drawn, drawEl, state, me, optionFor, pickHere]);
  const body = c && el ? drawnBody : null;
  if (c && c.pinned && body) {
    return <Popover anchor={el} onClose={hover.close}><div className="lt-note pinned" data-hover-card={c.kind}>{body}</div></Popover>;
  }
  // always mounted: content swaps in place; hidden (not unmounted) between cards
  const layer = (
    <div ref={box} className={`lt-hover popover${body ? ' on' : ''}`} data-hover-layer="" data-open={body ? '1' : '0'} data-prep={!body && drawnBody ? '' : undefined} data-side={body && pos ? pos.side : undefined} aria-hidden={!body}
      data-live={body && live ? '1' : undefined}
      onPointerEnter={() => { if (!live) return; inside.current = true; hover.hold(); }}
      onPointerLeave={e => { inside.current = false; if (live && e.pointerType === 'mouse') hover.letGo(); }}
      style={body && pos ? { left: pos.left, top: pos.top, width: pos.width } : { left: -9999, top: 0, width: pos ? pos.width : drawn ? cardWidth(drawn.kind) : 280 }}>
      {body && pos ? <span className={`lt-nub ${pos.side}`} aria-hidden="true" style={pos.side === 'right' || pos.side === 'left' ? { top: pos.nub } : { left: pos.nub }} /> : null}
      {drawnBody && <div className="lt-note" data-hover-card={body ? c.kind : undefined} role={body ? 'tooltip' : undefined}>{drawnBody}</div>}
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(layer, document.body) : layer;
}

const cardWidth = kind => Math.min(kind === 'seat' ? 360 : kind === 'followers' ? 260 : 280, innerWidth - 16);

// where the pointer last was: a hover card whose target was re-drawn re-links only while the pointer is still on it
let lastPt = null;
// where the pointer is: its moves, and its boundary events too. A move's pointerout/leave comes before the move itself,
// at the NEW position: read from the move alone, a jump off the wheel looked like a step into its gutter and held the
// card for the gutter's grace (the hover gate then found a card already up on most arrivals)
if (typeof addEventListener === 'function') {
  const at = e => { lastPt = { x: e.clientX, y: e.clientY }; };
  for (const t of ['pointermove', 'pointerout', 'pointerover']) addEventListener(t, at, { passive: true, capture: true });
}
/**
 * The element a hover card explains: the one it was opened on, or, when that node was re-drawn under the pointer
 * (a shop refill, a chair re-rendering: RC1 "Kingpin had no hover"), the same thing found again. A card whose pointer
 * has moved on never comes back.
 */
function anchorFor(c, held = false) {
  if (c.el && c.el.isConnected) return c.el;
  if (typeof document === 'undefined' || !c.el) return null;
  const under = b => lastPt && lastPt.x >= b.left - 4 && lastPt.x <= b.right + 4 && lastPt.y >= b.top - 4 && lastPt.y <= b.bottom + 4;
  // a name in the strip or the log re-drawn by a new move: that name again, never the wheel's space or the shop's card
  // it names (w2a #14: a pinned name's card jumped 341px away, onto the wheel)
  const named = c.el.getAttribute && c.el.getAttribute('data-name-target');
  if (named != null) {
    const again = [...document.querySelectorAll(`[data-hover-name][data-name-target="${named}"]`)];
    return again.find(e => under(e.getBoundingClientRect())) || (c.pinned || held ? again[again.length - 1] || null : null);
  }
  const sel = c.kind === 'space' ? `[data-slot="${c.key}"]` : c.kind === 'plaque' ? `[data-plaque="${c.qid}"]`
    : c.kind === 'seat' ? `[data-cult="${c.pid}"] .cs-head` : c.kind === 'followers' ? `[data-cult="${c.pid}"] .cs-total` : c.kind === 'card' ? `[data-region="shop"] [data-uid="${c.uid}"]` : c.kind === 'deck' ? '[data-deck]' : null;
  const el = sel && document.querySelector(sel);
  if (!el) return null;
  if (c.pinned || held) return el;
  return under(el.getBoundingClientRect()) ? el : null;
}

/**
 * A space's own edges: a wedge's box has empty corners, so the card is placed against the panel's filled edge on the
 * row and the column through its label (where the eye reads "the space"), not against its bounding box.
 */
function spaceRect(el, key) {
  const r = el.getBoundingClientRect();
  try {
    if (typeof SVGGeometryElement === 'undefined' || !(el instanceof SVGGeometryElement) || !el.getScreenCTM()) return r;
    const lab = document.querySelector(`[data-slot="${key}"]`);
    const l = lab ? lab.getBoundingClientRect() : r;
    const cx = Math.max(r.left, Math.min(r.right, l.left + l.width / 2)), cy = Math.max(r.top, Math.min(r.bottom, l.top + l.height / 2));
    const inv = el.getScreenCTM().inverse();
    const svg = el.ownerSVGElement;
    const inside = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return el.isPointInFill(pt.matrixTransform(inv)); };
    const scan = (from, to, at) => { const step = from < to ? 2 : -2; for (let v = from; step > 0 ? v <= to : v >= to; v += step) if (at(v)) return v; return null; };
    const right = scan(r.right, cx, x => inside(x, cy)), left = scan(r.left, cx, x => inside(x, cy));
    const bottom = scan(r.bottom, cy, y => inside(cx, y)), top = scan(r.top, cy, y => inside(cx, y));
    if ([right, left, bottom, top].some(v => v == null)) return r;
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  } catch { return r; }
}

/**
 * Where a w×h card goes next to the target rect a: beside it (right, else left) for things up on the table; above it
 * (else below) for the strips along the bottom; then slid along that edge to stay whole on screen. `keep` reuses a
 * side chosen earlier for this target when it still fits. Returns { left, top, width, side }.
 */
export function placeBeside(a, w, h, keep = null) {
  const gap = 8, m = 8, W = innerWidth, H = innerHeight;
  const fits = { right: a.right + gap + w <= W - m, left: a.left - gap - w >= m, above: a.top - gap - h >= m, below: a.bottom + gap + h <= H - m };
  const low = a.top + a.height / 2 > H * 0.7;
  const order = low ? ['above', 'right', 'left', 'below'] : ['right', 'left', 'below', 'above'];
  const side = keep && fits[keep] ? keep : order.find(k => fits[k]) || (low ? 'above' : 'right');
  const clampX = x => Math.max(m, Math.min(W - m - w, x)), clampY = y => Math.max(m, Math.min(H - m - h, y));
  if (side === 'right' || side === 'left') return { side, width: w, left: side === 'right' ? a.right + gap : a.left - gap - w, top: clampY(a.top + a.height / 2 - h / 2) };
  return { side, width: w, left: clampX(a.left + a.width / 2 - w / 2), top: clampY(side === 'above' ? a.top - gap - h : a.bottom + gap) };
}

/** A seat's card: right beside the seat (else left of it), its top level with the seat's, slid to stay on screen. */
export function besideSeat(a, w, h) {
  const gap = 8, m = 8, W = innerWidth, H = innerHeight;
  const side = a.right + gap + w <= W - m ? 'right' : a.left - gap - w >= m ? 'left' : null;
  if (!side) return null;
  return { side, width: w, left: side === 'right' ? a.right + gap : a.left - gap - w, top: Math.max(m, Math.min(H - m - h, a.top)) };
}

/**
 * While a copy space (Echo, Encore, Refrain…) or a copying member (Understudy) is under the pointer, the spaces it
 * could copy light up on the wheel ("since your turn" targets), straight from the engine. Classes are toggled on the
 * board's [data-slot] elements, so the wheel never re-renders for it.
 */
function useCopyTargets(c, state, me) {
  const viewer = me != null ? me : state.pending ? state.pending.player : null;
  const space = c && c.kind === 'space' && !c.past ? c.key.split('-').map(Number) : null;
  const pv = usePreview(state, space && viewer != null && !state.over ? viewer : null, space ? space[0] : 0, space ? space[1] : 0, { now: true });
  let keys = pv && pv.copies ? pv.copies : null;
  if (!keys && c && c.kind === 'card' && viewer != null && state.cards[c.uid]) keys = memberCopyTargets(state, viewer, cardDef(state, c.uid));
  const sig = keys ? keys.join(',') : '';
  // lit in the same frame the card opens (a layout effect), not a frame after it
  useLayoutEffect(() => {
    if (!sig) return undefined;
    const els = sig.split(',').flatMap(k => [...document.querySelectorAll(`[data-slot="${k}"]`)]);
    for (const el of els) el.classList.add('copy-target');
    return () => { for (const el of els) el.classList.remove('copy-target'); };
  }, [sig]);
}
function cardBody(c, state, me, optionFor, pick) {
  // a rival's move since your last turn: its card says so (the wheel's dotted edge was removed, art director 10:40)
  if (c.kind === 'space') {
    const fresh = typeof document !== 'undefined' && !!document.querySelector(`[data-slot="${c.key}"].fresh`);
    return <SpaceCard state={state} me={me} spaceKey={c.key} optionFor={optionFor} onPick={pick} pinned={c.pinned} past={c.past} fresh={fresh} />;
  }
  if (c.kind === 'plaque') return <StandingsCard state={state} qid={c.qid} meId={me} />;
  if (c.kind === 'seat') return <SeatCard state={state} pid={c.pid} meId={me} optionFor={optionFor} onPick={pick} />;
  if (c.kind === 'followers') return <FollowersCard state={state} pid={c.pid} meId={me} />;
  if (c.kind === 'deck') return <DeckCard state={state} />;
  if (c.kind === 'card') return state.cards[c.uid] ? <ShopCardHover state={state} me={me} uid={c.uid} optionFor={optionFor} onPick={pick} pinned={c.pinned} /> : null;
  return null;
}

// ---------- the cards ----------
function Row({ k, children }) { return <div className="lt-yd-row"><span className="k">{k}</span><span className="v">{children}</span></div>; }

/** A board space: full text, YOU GET (engine dry run), how it moves its contest, the cards it unlocks, Place here. */
// past: named in the strip or the log (a move already made): the rule and who holds it, never today's "You'd get" (w2a #26)
export function SpaceCard({ state, me, spaceKey, optionFor = () => null, onPick, pinned = false, past = false, fresh = false }) {
  const [q, i] = spaceKey.split('-').map(Number);
  const qid = state.quadrants[q];
  const Q = quadrant(qid), a = Q.actions[i];
  const owner = state.slots[spaceKey];
  const opt = optionFor(`slot:${spaceKey}`) || optionFor(`squat:${spaceKey}`);
  const round = Math.max(1, state.round);
  const open = !past && spaceOpen(a, round) && (owner === undefined || opt);
  const viewer = me != null ? me : state.pending && state.pending.player;
  // the dry run is read from the cache (warmed in idle time); if it isn't there yet it fills in a moment later
  const pv = usePreview(state, open && viewer != null && !state.over ? viewer : null, q, i, { now: !past }) || null;
  const race = pv && pv.race ? raceAfter(state, pv.race, qid, viewer, !(pv.theirAsks && pv.theirAsks.length)) : null;
  const unlocks = pv && viewer != null ? unlockedBy(state, state.players[viewer], surely(pv)) : [];
  return (
    <div className="lt-card-body" data-space-card={spaceKey} style={{ '--q': `var(--q-${sphereOf(qid)}, var(--${qid}))` }}>
      {/* plate 1b: the name, its one-sentence rule, then "You'd get" (the picture lives on the space itself) */}
      <h4 className="sc-name" title={`${Q.name} · ${RINGS[a.ring - 1]}`}>{a.name}</h4>
      <p className="sc-rule"><CardText text={a.text} /></p>
      <div className="lt-yd">
        {pv && pv.copies ? <Row k="Can copy">{pv.copies.length ? pv.copies.map(k => spaceName(state, k)).join(', ') : 'nothing yet'}</Row> : null}
        {open && viewer != null && !state.over ? <div className="lt-yd-row youd"><span className="k">You’d get</span><span className="v"><YoudGet state={state} pid={viewer} q={q} i={i} now /></span></div> : null}
        {/* why a member changed the number, or stayed off ("Underdog: no ×2 (Hustler’s +3 lands first)"), from the dry run */}
        {open && pv && pv.reasons && pv.reasons.length ? <Row k="Why"><span data-reasons><Rich text={whyLine(pv.reasons)} /></span></Row> : null}
        {race && <Row k={race.rule}><span className="lt-race" data-race={qid}>
          <span className="race-you" data-race-p={viewer}><Rich text={race.you} /></span>
          <span className="race-them">{race.them.map((t, k) => <span key={t.pid} data-race-p={t.pid}>{k ? ', ' : ''}{t.text}</span>)}{race.tail}</span>
        </span></Row>}
        {/* a few by name; the whole row is said as one (it listed all ten names, the row you can already see) */}
        {pv && pv.swept && pv.swept.length ? <Row k="Sweeps away">{pv.swept.length > 3
          ? <span data-swept={pv.swept.join(' ')}>{pv.swept.length === state.shop.length ? `the whole row (${pv.swept.length})` : `${pv.swept.length} face-up members`}</span>
          : pv.swept.map((u, k) => <span key={u} data-swept={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>)}<small className="lt-swept-note"> back under the deck</small></Row> : null}
        {/* on a desktop the shop's own cards say it ("after Kickback" on each): only a pinned sheet (touch) lists them */}
        {unlocks.length && pinned ? <Row k="Then affordable">{unlocks.map((u, k) => <span key={u}>{k ? ', ' : ''}<CardName state={state} uid={u} /></span>)}</Row> : null}
        {/* a second minion on it says why (w4 skeptic #13: two minions on one space, no reason): Squatter's join */}
        {owner !== undefined && <Row k="Taken">{owner === viewer ? 'You' : state.players[owner].name}{fresh ? ', since your last turn' : ''}{((state.squats && state.squats[spaceKey]) || []).map(j => `; ${j === viewer ? 'you' : state.players[j].name} joined (Squatter)`).join('')}{opt ? ' — you can join it' : ''}</Row>}
        {/* a value that grows by round: its run is the rule sentence's ("+2● in round I, +4 in round II…"), said once
            (w3b #12: a "By round" row beside "per round number" was two descriptions of one thing); the panel prints this
            round's number and "more each round" */}
        {a.ring > round && <Row k="Opens">round {roman(a.ring)}</Row>}
        {a.lastRound && round > a.lastRound && <Row k="Closed">after round {roman(a.lastRound)}</Row>}
      </div>
      {opt && pinned && onPick && !past && <button type="button" className="lt-btn pri" data-place={opt.id} onClick={() => onPick(opt.id)}>{opt.squat ? 'Join here' : 'Place here'}</button>}
    </div>
  );
}
/**
 * The dry run's reasons, one per member: a choice runs one branch per pick, so the same member came back once per
 * branch ("Gardener: +1●, +1● · Gardener: +1●, +1● · Gardener: …", Snap Up). A member whose part differs by pick says so.
 */
export function whyLine(reasons) {
  const by = new Map();
  for (const r of reasons) {
    const m = String(r).match(/^([^:]+):\s*(.*)$/);
    const k = m ? m[1] : String(r);
    if (!by.has(k)) by.set(k, new Set());
    by.get(k).add(m ? m[2] : '');
  }
  return [...by].map(([k, v]) => (v.size > 1 ? `${k}: depends on your pick` : [...v][0] ? `${k}: ${[...v][0]}` : k)).join(' · ');
}
/** "You 5 · Ossian 2 · Bo 1 · Kay 0 · you'd lead it (+2 followers)": the space's own contest after taking it, every player (the dry run's first branch). */
export function raceAfter(state, race, qid, pid, yours = true) {
  const c = race.find(x => x.qid === qid);
  if (!c) return null;
  // a space that doesn't move its contest says nothing about it (w3b: Intro Offer and Cheap Seats printed a "Most gold"
  // line they never touch): every branch is checked, not just the first
  let now = null;
  try { now = contestTable(state).find(x => x.qid === qid); } catch { /* say it */ }
  const scores = c.scores || Object.fromEntries(c.rows.map(r => [r.player, [r.score]]));
  const counts = c.counts || Object.fromEntries(c.rows.map(r => [r.player, [r.count]]));
  if (now && now.rows.every(r => (scores[r.player] || []).every(v => v === r.score))) return null;
  const n = (counts[pid] || [0]).length;
  const uniq = v => [...new Set(v)].sort((a, b) => a - b);
  const amount = v => { const u = uniq(v); return u.length === 1 ? `${u[0]}` : u.length === 2 ? `${u[0]} or ${u[1]}` : `${u[0]} to ${u[u.length - 1]}`; };
  // you first, as a sentence (w3a #28: "If you take it: You 2 · P2 2 · P3 1 · P4 0 · you'd lead it" took three reads);
  // the counts are after you'd take it, and say so (w2b #4: "You 2" read as now)
  const wins = (c.wins && c.wins[pid]) || [c.winners.includes(pid)];
  const sole = c.sole || [c.winners.length === 1];
  const prize = `(+${c.prize} follower${c.prize === 1 ? '' : 's'})`;
  const lead = wins.every(Boolean) ? (wins.every((w, b) => !sole[b]) ? ` and share the lead ${prize}` : ` and lead it ${prize}`)
    : wins.some(Boolean) ? `, and could lead it ${prize}` : ''; // (whose pick it is: "You'd get" says so, w4b #12)
  const you = `You’d have ${amount(counts[pid] || [0])}${lead}`;
  // every rival, never just the top three (RC1 panel: the 4th dropped off), in plain words ("P2 has 3"); a count a
  // pick decides isn't read off one branch (w3b #10): when the pick hands one of them the same amount, that's said once
  const low = r => Math.min(...counts[r]);
  // best first by what's sure (the first branch's order put whoever got the gift on top)
  const rivals = c.rows.filter(r => r.player !== pid).map(r => r.player).sort((a, b) => low(b) - low(a) || Math.max(...counts[b]) - Math.max(...counts[a]) || a - b);
  const unsure = rivals.filter(r => uniq(counts[r]).length > 1);
  let one = null;
  if (unsure.length > 1) {
    const ups = Array.from({ length: n }, (_, b) => unsure.filter(r => counts[r][b] > low(r)).map(r => counts[r][b] - low(r)));
    const k = ups.flat();
    if (ups.every(u => u.length <= 1) && k.length && k.every(x => x === k[0])) one = k[0];
  }
  const them = rivals.map(r => ({ pid: r, text: `${state.players[r].name} has ${one != null ? low(r) : amount(counts[r])}` }));
  const tail = one != null ? `, and +${one} goes to the one ${yours ? 'you pick' : 'picked'}` : '';
  return { rule: c.rule.replace(/^\w/, ch => ch.toUpperCase()), you, them, tail };
}

/** "Rush (Bo)" for a board key. */
const spaceName = (state, key) => { const [q, i] = key.split('-').map(Number); const a = quadrant(state.quadrants[q]).actions[i]; const o = state.slots[key]; return `${a.name}${o !== undefined ? ` (${state.players[o].name})` : ''}`; };

/** A rim plaque: the contest's standings, straight from the engine. */
export function StandingsCard({ state, qid, meId = null }) {
  const st = standings(state).find(x => x.qid === qid);
  if (!st) return null;
  // the rim is the contest only: a sphere's own rule ("Copies never reach the center…") read as a scoring rule there and
  // is general besides (w4b #33, w3a #29); the rulebook says it, and a copy space's "Can copy" row lists only what's legal
  // what the rim's prize pays, in words (Cory, 2026-10-15): "Round end: whoever has the most white gets 2 followers"
  return (
    <>
      <p className="lt-prize-line" data-prize-line={qid}>Round end: whoever has the {st.rule.replace(/^Most /i, 'most ')} gets {st.prize} follower{st.prize === 1 ? '' : 's'}.</p>
      <ContestStandings state={state} st={st} meId={meId} brief />
    </>
  );
}

/**
 * A seat: that player's members, clearly (Cory, 2026-10-15: "Followers and Has here can be cut, because it's obvious
 * from the cards. Instead, this should cleanly show a list of member ability/passives, if they've been activated").
 * The name on top, then one row per member (MemberUse.jsx): picture, name, the whole sentence, its state; on your own
 * seat a member you can use now carries its Use button.
 */
export function SeatCard({ state, pid, meId = null, optionFor = () => null, onPick = null }) {
  const p = state.players[pid];
  const lvl = p.kind === 'bot' ? BOT_LEVEL_INFO.find(l => l.level === botLevel(state, pid)) : null; // Easy / Normal / Hard
  return (
    <div className="lt-card-body seat-card" data-seat-card={pid} style={{ '--pc': playerColor(pid) }}>
      <div className="t"><SeatFigure id={pid} state={state} size={32} face={pid !== meId} /><h4>{pid === meId ? 'You' : p.name}{lvl ? <small><span data-bot-level={lvl.level} title={lvl.blurb}>{lvl.name} bot</span></small> : null}{safeThisRound(state, pid) ? <small className="seat-safe" data-safe="1">No one can steal resources from {pid === meId ? 'you' : p.name} this round.</small> : null}{pid !== meId ? <SpendingLine state={state} pid={pid} /> : null}</h4></div>
      <SeatMembers state={state} pid={pid} me={meId} optionFor={pid === meId ? optionFor : undefined} onPick={pid === meId ? onPick : null} />
    </div>
  );
}

/** A shop card under the pointer: the card itself (its cost, clearly), and Recruit when it's pinned on touch.
 *  Cory (2026-10-15): nothing else about payment here: no "You pay", no "Leaves", no contest lines, no click hint. */
export function ShopCardHover({ state, me = null, uid, optionFor = () => null, onPick, pinned = false }) {
  const opt = optionFor(`card:${uid}`);
  return (
    <div className="lt-card-body" data-card-hover={uid}>
      <MemberCard state={state} uid={uid} me={me} onFace={state.shop.includes(uid)} />
      {opt && onPick && pinned && <button type="button" className="lt-btn pri" data-recruit={uid} onClick={() => onPick(opt.id)}>Recruit</button>}
    </div>
  );
}
