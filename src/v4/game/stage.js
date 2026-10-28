// The action stage (Cory, 2026-10-15): "as things are happening, there's a space where a card shows up showing the
// action, and resources flow to/from that action to players. same with members as they are contributing … it's almost
// as if these board elements are flying out from their usual spot to do these things in the animation."
//
// The stage is the wheel's hub. When a move plays (director.js), the space taken flies out of the wheel to the hub as a
// card, and what it gives flows from that card to the player; a member that chips in steps off its seat onto the stage
// beside it and sends its share from there. When the chain ends the stage holds a moment, then each piece flies home.
// This module is the store (ActionStage.jsx renders it) and the stage's geometry (the director aims pieces at it).
import { MO } from '../motion.js';

export const CARD = { w: 184, h: 104 };
// a member acting is a small speech bubble out of the right side of its seat (Cory, 2026-10-18: "members pop out of the
// right side of the player card when they act, maybe with a speech bubble"): its portrait, its name, its rule in one
// line and what it just did; a recruit shows the same card, bigger, at the hub on its way to its buyer
// (two lines of rule, panel Oct 26: one line cut "Whenever a rival recruits more tha…")
// (Cory, live, Oct 27: "whenever a member moves or is triggered, it should be clearer what they do"): the rule at the
// sentence size, three lines, and the bubble stays a beat after its chain (stageRelease) without holding the next move
export const MEMBER = { w: 280, h: 96 };
// a recruit is revealed as its own card at the hub, big enough to read whole (Cory, live, Oct 27: "the card should fly
// up, show what it does, then the member should fly down to the player card", Hearthstone's reveal)
export const HUB_MEMBER = { w: 220, h: 248 };

let items = [];
let ver = 0;
const subs = new Set();
const emit = () => { ver++; items = items.slice(); for (const fn of subs) fn(); };
export const subscribeStage = fn => { subs.add(fn); return () => subs.delete(fn); };
export const stageItems = () => items;
/** Includes the readable hold and the actual return flight, until ActionStage removes each item. */
export const stageBusy = () => items.some(it => !it.lingering);
export const stageVersion = () => ver;

/** The stage's centre on screen: the wheel's hub (null off the board). */
export function stageCenter() {
  if (typeof document === 'undefined') return null;
  const st = document.querySelector('.lt-wheel .stage');
  if (!st) return null;
  const r = st.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 };
}

// where each slot actually stands this chain (a space's card beside its space, a member's bubble beside its seat)
const placed = new Map();
/** Where a slot on the stage sits: 'card' / 'card2' (the action, and the space a copy runs), a member's spot (0, 1,
 *  2…), or 'hub' (the wheel's middle: a recruit on its way, members changing hands). A DOMRect-like box. */
export function stageRect(slot) {
  if (placed.has(slot)) return placed.get(slot);
  if (slot === 'hub') return hubRect(CARD);
  const c = stageCenter();
  if (!c) return null;
  if (slot === 'card') return box(c.x - CARD.w / 2, c.y - CARD.h / 2 - 50, CARD.w, CARD.h);
  if (slot === 'card2') return box(c.x - CARD.w / 2 + 22, c.y - CARD.h / 2 - 14, CARD.w, CARD.h);
  return box(c.x - MEMBER.w / 2, c.y + 10 + (slot % 4) * (MEMBER.h + 6), MEMBER.w, MEMBER.h);
}
/** A box of `size` centred on the hub. */
export function hubRect(size = CARD) {
  const c = stageCenter();
  return c ? box(c.x - size.w / 2, c.y - size.h / 2, size.w, size.h) : null;
}
/** Remember where a slot stands (the director places it when it plays). */
export const stagePlace = (slot, rect) => { if (rect) placed.set(slot, rect); return rect; };

/**
 * A space's card stands beside its space (Cory, 2026-10-18: "while an action plays, show its effect next to the
 * action, not in the middle"): just inside it, toward the hub, so the space itself still shows; a copy's second card
 * fans down and right off the first.
 */
export function spaceRect(spaceRect0, slot = 'card') {
  const c = stageCenter();
  if (slot === 'card2' && placed.has('card')) { const a = placed.get('card'); return box(a.left + 22, a.top + 36, CARD.w, CARD.h); }
  if (!c || !spaceRect0) return stageRect(slot);
  const sx = spaceRect0.left + spaceRect0.width / 2, sy = spaceRect0.top + spaceRect0.height / 2;
  const dx = c.x - sx, dy = c.y - sy, d = Math.hypot(dx, dy) || 1;
  // the card's centre moves in from the space by about its own half-depth, never past the hub
  const k = Math.min(d, 112) / d;
  return clampView(box(sx + dx * k - CARD.w / 2, sy + dy * k - CARD.h / 2, CARD.w, CARD.h));
}
/** A member's bubble out of the right side of its seat, level with its own chip; a second one from the same seat
 *  stands under the first. */
export function bubbleRect(seatRect, chipRect, k = 0) {
  if (!seatRect) return null;
  const y = chipRect ? chipRect.top + chipRect.height / 2 : seatRect.top + seatRect.height / 2;
  return clampView(box(seatRect.right + 10, y - MEMBER.h / 2 + k * (MEMBER.h + 4), MEMBER.w, MEMBER.h));
}
function clampView(b) {
  if (typeof window === 'undefined' || !window.innerWidth) return b;
  const left = Math.max(4, Math.min(b.left, window.innerWidth - b.width - 4)), top = Math.max(4, Math.min(b.top, window.innerHeight - b.height - 4));
  return box(left, top, b.width, b.height);
}
const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

/**
 * Put something on the stage. item: { id, chain, kind: 'space'|'member', slot, from (a rect, where it flew out of),
 * home (an element to fly back to), dur, … what it shows }. Anything from an earlier chain leaves first.
 */
export function stageShow(item) {
  // the last chain's pieces go home; a lingering bubble stays to be read unless this one takes its seat's spot
  for (const it of items) if (it.chain !== item.chain && !it.leaving && (!it.lingering || (item.kind === 'member' && !item.recruit && item.pid === it.pid))) { it.leaving = true; it.out = Math.round(MO.stageOut * 0.7); }
  const had = items.find(it => it.id === item.id && !it.leaving);
  if (had) { had.again = (had.again || 0) + 1; emit(); return; }
  items.push({ ...item, born: Date.now() });
  emit();
}
/** Send one item home now (a recruit leaving the hub for its buyer's crowd), taking `out` ms. */
export function stageLeave(id, out = MO.stageOut) {
  const it = items.find(x => x.id === id && !x.leaving);
  if (!it) return;
  it.leaving = true; it.out = out;
  emit();
}
let holdT = 0;
const releaseTimers = new Set();
/** The chain has played out: the stage holds a moment, then everything flies home. */
export function stageRelease(hold = MO.stageHold, chain = null) {
  const these = items.filter(it => !it.leaving && (chain == null || it.chain === chain));
  if (!these.length) return;
  if (chain == null) clearTimeout(holdT);
  // a member's bubble lingers to be read; it no longer counts as busy, so the next move doesn't wait on it
  const bubbles = these.filter(it => it.kind === 'member' && !it.recruit);
  const rest = these.filter(it => !bubbles.includes(it));
  const t = setTimeout(() => {
    releaseTimers.delete(t);
    for (const it of rest) if (!it.leaving) { it.leaving = true; it.out = MO.stageOut; }
    for (const it of bubbles) if (!it.leaving) it.lingering = true;
    emit();
    if (bubbles.length) {
      const t2 = setTimeout(() => { releaseTimers.delete(t2); for (const it of bubbles) if (!it.leaving) { it.leaving = true; it.out = MO.stageOut; } emit(); }, MO.memberLinger);
      releaseTimers.add(t2);
    }
  }, hold);
  releaseTimers.add(t);
  if (chain == null) holdT = t;
}
/** Everything off the stage at once (a skip, a new round, the game leaving the screen). */
export function stageClear() {
  clearTimeout(holdT);
  placed.clear();
  for (const t of releaseTimers) clearTimeout(t);
  releaseTimers.clear();
  if (!items.length) return;
  items = [];
  ver++;
  for (const fn of subs) fn();
}
/** A piece has finished leaving (ActionStage calls this when its flight home ends). */
export function stageGone(id) {
  const n = items.length;
  items = items.filter(it => !(it.id === id && it.leaving));
  if (!items.length) placed.clear();
  if (items.length !== n) { ver++; for (const fn of subs) fn(); }
}
