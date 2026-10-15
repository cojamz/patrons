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
export const MEMBER = { w: 64, h: 76 };
// where staged members stand, by arrival: under the card, centre first, then out to each side
const SPOTS = [0, -1, 1, -2, 2];

let items = [];
let ver = 0;
const subs = new Set();
const emit = () => { ver++; items = items.slice(); for (const fn of subs) fn(); };
export const subscribeStage = fn => { subs.add(fn); return () => subs.delete(fn); };
export const stageItems = () => items;
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
  if (slot === 'card') return box(c.x - CARD.w / 2, c.y - CARD.h / 2 - 30, CARD.w, CARD.h);
  const k = SPOTS[slot % SPOTS.length] ?? 0;
  return box(c.x - MEMBER.w / 2 + k * (MEMBER.w + 8), c.y + 30, MEMBER.w, MEMBER.h);
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
/** The chain has played out: the stage holds a moment, then everything flies home. */
export function stageRelease(hold = MO.stageHold) {
  if (!items.some(it => !it.leaving)) return;
  clearTimeout(holdT);
  const these = items.filter(it => !it.leaving);
  holdT = setTimeout(() => { for (const it of these) if (!it.leaving) { it.leaving = true; it.out = MO.stageOut; } emit(); }, hold);
}
/** Everything off the stage at once (a skip, a new round, the game leaving the screen). */
export function stageClear() {
  clearTimeout(holdT);
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
