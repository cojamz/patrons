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
// a staged member is a caption card: its portrait, its name, its rule and what it just did (Cory, 22:48: "it's not
// clear why without hover"); they stack under the space's card in the order they acted
export const MEMBER = { w: 248, h: 62 };

let items = [];
let ver = 0;
const subs = new Set();
const emit = () => { ver++; items = items.slice(); for (const fn of subs) fn(); };
export const subscribeStage = fn => { subs.add(fn); return () => subs.delete(fn); };
export const stageItems = () => items;
/** Includes the readable hold and the actual return flight, until ActionStage removes each item. */
export const stageBusy = () => items.length > 0;
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

/** Where a slot on the stage sits: 'card' (the action) or a member's spot (0, 1, 2…). A DOMRect-like box. */
export function stageRect(slot) {
  const c = stageCenter();
  if (!c) return null;
  if (slot === 'card') return box(c.x - CARD.w / 2, c.y - CARD.h / 2 - 50, CARD.w, CARD.h);
  // the space a copy runs lands on the first card, fanned down and right, so the first card's top line still shows
  if (slot === 'card2') return box(c.x - CARD.w / 2 + 22, c.y - CARD.h / 2 - 14, CARD.w, CARD.h);
  return box(c.x - MEMBER.w / 2, c.y + 10 + (slot % 4) * (MEMBER.h + 6), MEMBER.w, MEMBER.h);
}
const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

/**
 * Put something on the stage. item: { id, chain, kind: 'space'|'member', slot, from (a rect, where it flew out of),
 * home (an element to fly back to), dur, … what it shows }. Anything from an earlier chain leaves first.
 */
export function stageShow(item) {
  for (const it of items) if (it.chain !== item.chain && !it.leaving) { it.leaving = true; it.out = Math.round(MO.stageOut * 0.7); }
  const had = items.find(it => it.id === item.id && !it.leaving);
  if (had) { had.again = (had.again || 0) + 1; emit(); return; }
  items.push({ ...item, born: Date.now() });
  emit();
}
let holdT = 0;
const releaseTimers = new Set();
/** The chain has played out: the stage holds a moment, then everything flies home. */
export function stageRelease(hold = MO.stageHold, chain = null) {
  const these = items.filter(it => !it.leaving && (chain == null || it.chain === chain));
  if (!these.length) return;
  if (chain == null) clearTimeout(holdT);
  const t = setTimeout(() => { releaseTimers.delete(t); for (const it of these) if (!it.leaving) { it.leaving = true; it.out = MO.stageOut; } emit(); }, hold);
  releaseTimers.add(t);
  if (chain == null) holdT = t;
}
/** Everything off the stage at once (a skip, a new round, the game leaving the screen). */
export function stageClear() {
  clearTimeout(holdT);
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
  if (items.length !== n) { ver++; for (const fn of subs) fn(); }
}
