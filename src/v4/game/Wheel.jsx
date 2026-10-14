// The board: a printed paper wheel of 4 quadrants (the Lamplit Table). Outer ring = round I, middle = round II,
// inner = round III. It still spins (drag, arrow keys, a sideways swipe), but everything on it stays upright and
// nothing else on screen changes with its orientation. Two looks for the spaces (Cory picks; `?spaces=engraved`):
//  - sockets (default): each space is a cream socket with its picture, name and yield;
//  - engraved (design/prototypes/actions option 3): each space is a cell of its ring printed into the paper, washed
//    in the quadrant's ink, with a one-ink stamp of its picture, its name in small capitals and its yield beneath.
// In both, a space has three states you can read at a glance: lit (yours to take: a lamp-lit edge, full strength),
// taken (dimmed to ~40% with the owner's minion standing in it), and not open yet (hatched / hollow). A rival's
// fresh move wears a dotted ring in that player's color, never the lamp's. A click on a space you can't take
// shakes it and says why at the pointer ("Taken by P3", "Opens in round II"), never silence.
// Each quadrant's contest is engraved on its rim (rule, prize, tiebreak, leaders), with the standings on hover/tap.
// Hover or focus (mouse) or a first tap (touch) shows a space's card; on touch, placing takes a second tap.
import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, roman, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, standings, seatEmoji, shortLabel } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { emojiArt } from '../art/emojis.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId, iconFor, withOutline } from '../art/index.js';
import { sheetMode } from './parts.jsx';
import { realHover } from '../hover.js';
import { Rich } from './Rich.jsx';
import { shortEffect } from '../shorts.js';

// sockets: discs toward the outer edge of their ring, so a name never runs into a neighbour at any board size
const RING_S = { 1: { r0: 128, r1: 180, r: 151, n: 3, span: 66 }, 2: { r0: 82, r1: 128, r: 104, n: 2, span: 40 }, 3: { r0: 36, r1: 82, r: 58, n: 1, span: 0 } };
// engraved: the cells tile each quadrant (ring I: three 30° cells, ring II: two 45° cells, ring III: one 90° cell)
// (the hub shrinks so the one wide ring-III cell can hold its name, stamp and yield at 12px or more)
const RING_E = { 1: { r0: 126, r1: 180, r: 153, n: 3, span: 60 }, 2: { r0: 78, r1: 126, r: 102, n: 2, span: 45 }, 3: { r0: 22, r1: 78, r: 51, n: 1, span: 0 } };
const ringsOf = look => (look === 'engraved' ? RING_E : RING_S);
const RIM = { r0: 180, r1: 200, r: 190 }; // the rim band: each quadrant's rule, engraved
const CX = 200, CY = 200, VB0 = -26, VBS = 452;
const BOX = 40; // engraved: the space's own box (its click and hover target, in board units); the cell takes the rest
const qCenter = q => 180 + q * 90;
const norm = a => ((a % 360) + 540) % 360 - 180;
function polar(a, r) { const t = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
function arc(a0, a1, r0, r1) {
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
}
/** A ring cell inset by `pad` board units on every side (the same width at the inner and the outer edge). */
function cellPath(a0, a1, r0, r1, pad = 0) {
  const ro = r1 - pad, ri = Math.max(1, r0 + pad);
  const dO = (pad / ro) * 180 / Math.PI, dI = (pad / ri) * 180 / Math.PI;
  const [x0, y0] = polar(a0 + dO, ro), [x1, y1] = polar(a1 - dO, ro), [x2, y2] = polar(a1 - dI, ri), [x3, y3] = polar(a0 + dI, ri);
  const f = n => n.toFixed(2);
  return `M${f(x0)},${f(y0)} A${ro},${ro} 0 0 1 ${f(x1)},${f(y1)} L${f(x2)},${f(y2)} A${ri},${ri} 0 0 0 ${f(x3)},${f(y3)}Z`;
}

/** An arc for text that reads upright wherever it sits once the wheel is turned by `rot`. */
function textArc(center, half, r, rot) {
  const top = Math.abs(norm(center + rot)) < 90;
  const [ax, ay] = polar(top ? center - half : center + half, r);
  const [bx, by] = polar(top ? center + half : center - half, r);
  return `M${ax},${ay} A${r},${r} 0 0 ${top ? 1 : 0} ${bx},${by}`;
}

export const facingOf = (rot, count) => {
  let best = 0, bd = 1e9;
  for (let q = 0; q < count; q++) { const d = Math.abs(norm(qCenter(q) + rot - 180)); if (d < bd) { bd = d; best = q; } }
  return best;
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Which look the spaces wear: 'engraved' behind `?spaces=engraved` (until Cory picks), else 'sockets'. */
export function spacesLook() {
  try { return new URLSearchParams(globalThis.location?.search || '').get('spaces') === 'engraved' ? 'engraved' : 'sockets'; } catch { return 'sockets'; }
}

/** Where each space sits on the (unturned) wheel: its angle, the half-width of its cell, and its centre. */
export function spaceGeometry(state, look = 'sockets') {
  const rings = ringsOf(look);
  const out = [];
  state.quadrants.forEach((qid, q) => {
    const Q = quadrant(qid);
    Q.actions.forEach((a, i) => {
      const t = a.ring, R = rings[t];
      const idx = Q.actions.filter((x, j) => x.ring === t && j < i).length;
      const c = qCenter(q);
      const ang = R.n === 1 ? c : (c + R.span / 2) - idx * (R.span / (R.n - 1));
      out.push({ key: `${q}-${i}`, q, i, qid, a, ring: t, ang, half: 45 / R.n, xy: polar(ang, R.r) });
    });
  });
  return out;
}

// ---------- the engraved stamp: today's 24×24 action icon printed in one ink (dark, the ink, a light tint) ----------
const STAMP_TONE = { k: 'd', d: 'd', 1: 'd', 2: 'm', m: 'm', 3: 'l', l: 'l', o: 'l' };
const stampCache = new Map();
function stampRects(id) {
  const { icon } = iconFor(id, 'action');
  if (stampCache.has(icon.id)) return stampCache.get(icon.id);
  const out = [];
  withOutline(icon.px).forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      const ch = r[x];
      let w = 1;
      while (r[x + w] === ch) w++;
      if (ch !== '.') out.push({ x, y, w, t: STAMP_TONE[ch] || 'm' });
      x += w;
    }
  });
  stampCache.set(icon.id, out);
  return out;
}
const Stamp = memo(function Stamp({ id, size = 24 }) {
  return (
    <svg className="stamp" viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {stampRects(id).map((r, k) => <rect key={k} className={r.t} x={r.x} y={r.y} width={r.w} height="1" />)}
    </svg>
  );
});

// ---------- the rim's engraved text: its width from the font itself (a canvas measure, cached), never from the page ----------
const collapse = t => String(t).replace(/\s+/g, ' ');
const rimWidths = new Map();
let rimCtx, rimEarly = false; // rimEarly: something was measured before the web font arrived
/** Width of `text` in the rim's face (Alegreya Sans at `weight`, letter-spacing `ls` em), per pixel of font size. */
export function rimWidth(text, weight = 700, ls = 0) {
  const t = collapse(text);
  const k = `${weight}|${ls}|${t}`;
  if (rimWidths.has(k)) return rimWidths.get(k);
  let w = null;
  try {
    if (rimCtx === undefined) rimCtx = typeof document !== 'undefined' && !/jsdom/i.test(globalThis.navigator?.userAgent || '') ? document.createElement('canvas').getContext('2d') : null;
    if (rimCtx) {
      rimCtx.font = `${weight} 100px "Alegreya Sans", system-ui, sans-serif`;
      w = rimCtx.measureText(t).width / 100;
      if (document.fonts && document.fonts.status !== 'loaded') rimEarly = true;
    }
  } catch { rimCtx = null; }
  if (!(w > 0)) w = t.length * 0.62; // no canvas (tests): an Alegreya Sans capital's average
  w = Math.round((w + ls * t.length) * 1000) / 1000;
  rimWidths.set(k, w);
  return w;
}

/** A yield in short clauses, one a line in a narrow cell: "+2 green +1 blue" → ["+2 green", "+1 blue"],
 *  "+1 gold/member" → ["+1 gold", "/member"]. */
export const clauses = text => String(text || '').split(/ · |, (?=\S)| (?=[+−-]\d)|(?=\/[a-z]{4,})/).filter(Boolean);

/** Why a space can't be taken, in a few words at the pointer (null when it's open: the turn itself explains). */
export function deniedText(state, key, meId = null) {
  const owner = state.slots[key];
  if (owner !== undefined) return `Taken by ${owner === meId ? 'you' : state.players[owner].name}`;
  const [q, i] = key.split('-').map(Number);
  const a = quadrant(state.quadrants[q]).actions[i];
  if (a && a.ring > Math.max(1, state.round)) return `Opens in round ${roman(a.ring)}`;
  return null;
}

/**
 * @param {{ state:any, legal:Map<string,string>, onPick:(id:string)=>void, onDenied?:(info:object, el:Element)=>void,
 *   flash:Set<string>, late?:boolean, facing:number, onFacing:(q:number)=>void, look?:'sockets'|'engraved' }} props
 */
function Wheel({ state, legal, onPick, onDenied, onTouched, confirmPlace = false, flash, late = false, caption = null, lastMove = null, recentMoves = [], spacePeek = null, onSpacePeek, meId = null, facing, onFacing, hover = null, lampQid = null, look: lookProp = null }) {
  const look = useMemo(() => lookProp || spacesLook(), [lookProp]);
  const engraved = look === 'engraved';
  const rings = ringsOf(look);
  const [rot, setRot] = useState(() => -90 * facing);
  const [peek, setPeek] = useState(null); // { key, pinned }
  const [deny, setDeny] = useState(null); // { text, x, y, n }: the note at the pointer after a click on a space you can't take
  // the space card itself is UI-B's hover layer: the wheel only says which space is under the pointer (or pinned)
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const stage = useRef(null);
  // what a space's hover card sits beside: the whole cell (engraved), or the socket
  const anchorOf = (key, el = null) => {
    const root = stage.current;
    if (engraved && root) { const c = root.querySelector(`[data-cell="${key}"] .wash`); if (c) return c; }
    return el || (root && root.querySelector(`[data-slot="${key}"]`));
  };
  useEffect(() => {
    const h = hoverRef.current;
    if (!h) return;
    if (peek) {
      const el = anchorOf(peek.key);
      if (el) h.onSpaceHover(peek.key, el, { pinned: !!peek.pinned });
    } else if (h.card && h.card.kind === 'space') {
      if (h.card.pinned) h.close(); else h.onSpaceHover(h.card.key, null);
    }
  }, [peek]); // eslint-disable-line react-hooks/exhaustive-deps
  const rotRef = useRef(rot);
  const anim = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const lastPointer = useRef('mouse');
  const nq = state.quadrants.length;
  // On-screen scale of the board, so text is sized in real pixels.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    const measure = () => { const w = el.getBoundingClientRect().width; if (w) setScale(w / VBS); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boardPx = scale * VBS;

  const applyRot = useCallback(r => {
    rotRef.current = r;
    setRot(r);
    onFacing(facingOf(r, nq));
  }, [nq, onFacing]);

  const stop = () => { if (anim.current) cancelAnimationFrame(anim.current); anim.current = null; };
  const animateTo = useCallback(to => {
    stop();
    const from = rotRef.current, t0 = performance.now(), dur = reduced() ? 1 : 420;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      applyRot(from + (to - from) * e);
      anim.current = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim.current = requestAnimationFrame(step);
  }, [applyRot]);
  const touched = useRef(onTouched);
  touched.current = onTouched;
  const nudge = useCallback(deg => { if (touched.current) touched.current(); animateTo(Math.round((rotRef.current + deg) / 90) * 90); }, [animateTo]);

  // Parent asked to face a quadrant (a tab, or a rival's move): spin there the short way.
  useEffect(() => {
    if (anim.current || drag.current) return;
    if (facingOf(rotRef.current, nq) !== facing) animateTo(rotRef.current + norm(-90 * facing - rotRef.current));
  }, [facing, nq, animateTo]);

  useEffect(() => {
    const onKey = e => {
      const t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable],[role="tablist"],[role="dialog"]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-90); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(90); }
      if (e.key === 'Escape') setPeek(null);
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); stop(); };
  }, [nudge]);

  // A pinned peek (touch) closes on any tap elsewhere.
  useEffect(() => {
    if (!peek || !peek.pinned) return undefined;
    const close = e => { if (!e.target.closest || !e.target.closest('.peek, .slot, [data-cell], [data-hover-card], .popover')) setPeek(null); };
    addEventListener('pointerdown', close);
    return () => removeEventListener('pointerdown', close);
  }, [peek]);
  // A space picked from the panel list opens here: one sheet for the same space, wherever you tapped it.
  useEffect(() => { if (spacePeek && spacePeek.key) setPeek({ key: spacePeek.key, pinned: true }); }, [spacePeek]);
  useEffect(() => {
    if (!peek || !peek.pinned || !sheetMode()) return;
    const t = setTimeout(() => {
      const el = stage.current && stage.current.querySelector(`[data-slot="${peek.key}"] .base`);
      const sheet = document.querySelector('.peek.as-sheet');
      if (!el || !sheet) return;
      const r = el.getBoundingClientRect(), top = sheet.getBoundingClientRect().top;
      if (r.bottom > top - 12) window.scrollBy({ top: r.bottom - top + 40, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [peek]);
  // turning the board hides a hover card (it no longer sits over its space)
  const rotSeen = useRef(rot);
  useEffect(() => { if (Math.abs(rot - rotSeen.current) > 2) { rotSeen.current = rot; setPeek(p => (p && !p.pinned ? null : p)); } }, [rot]);
  // A new decision clears a stale selection and any note.
  useEffect(() => { setPeek(null); setDeny(null); }, [state]);
  // the note at the pointer fades on its own
  useEffect(() => {
    if (!deny) return undefined;
    const t = setTimeout(() => setDeny(d => (d === deny ? null : d)), 1700);
    return () => clearTimeout(t);
  }, [deny]);

  const local = e => {
    const b = stage.current.getBoundingClientRect();
    const x = VB0 + (e.clientX - b.left) / b.width * VBS, y = VB0 + (e.clientY - b.top) / b.height * VBS;
    return { x, y, a: Math.atan2(y - CY, x - CX) * 180 / Math.PI, d: Math.hypot(x - CX, y - CY) };
  };
  const onDown = e => {
    lastPointer.current = e.pointerType || 'mouse';
    if (onTouched) onTouched();
    if (e.target.closest('button')) return;
    const p = local(e);
    if (p.d > 205 || p.d < 30) return; // only drags that start on the ring
    stop();
    drag.current = { a: p.a, x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch', start: rotRef.current, t: performance.now(), v: 0 };
    moved.current = false;
  };
  const onMove = e => {
    const dr = drag.current;
    if (!dr) return;
    if (!moved.current) {
      const dx = Math.abs(e.clientX - dr.x), dy = Math.abs(e.clientY - dr.y);
      if (Math.max(dx, dy) < 6) return;
      // on touch, a mostly-vertical swipe is a page scroll, not a spin; a sideways swipe turns one notch on release
      if (dr.touch && dy > dx) { drag.current = null; return; }
      moved.current = true;
      if (dr.touch) { dr.swipe = true; dr.lastX = e.clientX; return; }
      try { stage.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    if (dr.swipe) { dr.lastX = e.clientX; return; }
    const a = local(e).a;
    const d = norm(a - dr.a);
    dr.a = a;
    // angular speed (deg/ms), smoothed, so a quick flick can carry the wheel on to the next quadrant
    const now = performance.now(), dt = Math.max(1, now - dr.t);
    dr.v = 0.6 * (d / dt) + 0.4 * dr.v; dr.t = now;
    applyRot(rotRef.current + d);
  };
  const onUp = e => {
    if (e && e.pointerType === 'touch' && !moved.current && drag.current) {
      const p = local(e);
      const r = (rotRef.current * Math.PI) / 180;
      // undo the wheel's rotation, then take the nearest space within reach
      const ux = CX + (p.x - CX) * Math.cos(-r) - (p.y - CY) * Math.sin(-r);
      const uy = CY + (p.x - CX) * Math.sin(-r) + (p.y - CY) * Math.cos(-r);
      let best = null, bd = 1e9;
      for (const sp of spaceGeometry(state, look)) { const d = Math.hypot(sp.xy[0] - ux, sp.xy[1] - uy); if (d < bd) { bd = d; best = sp; } }
      drag.current = null;
      if (best && bd < 44) { e.preventDefault(); touchTapped.current = Date.now(); tap(best, stage.current.querySelector(`[data-slot="${best.key}"]`), { x: e.clientX, y: e.clientY }); }
      return;
    }
    if (!drag.current) return;
    const dr = drag.current;
    drag.current = null;
    if (!moved.current) return;
    // swipe right moves the facing quadrant right (the wheel turns counter-clockwise), and the other way round
    if (dr.swipe) { const dx = (e && e.type !== 'pointercancel' && e.clientX != null ? e.clientX : dr.lastX ?? dr.x) - dr.x; if (Math.abs(dx) > 24) nudge(dx > 0 ? -90 : 90); setTimeout(() => { moved.current = false; }, 0); return; }
    // a fling (fast and recent) steps one quadrant in its direction; a slow drag settles on the nearest
    const home = Math.round(dr.start / 90) * 90;
    let target = Math.round(rotRef.current / 90) * 90;
    if (Math.abs(dr.v) > 0.18 && performance.now() - dr.t < 120 && target === home) target = home + Math.sign(dr.v) * 90;
    animateTo(target);
    setTimeout(() => { moved.current = false; }, 0);
  };

  const round = Math.max(1, state.round);
  const spaces = spaceGeometry(state, look);

  // a small shake (the space, and its printed cell) that says "not this one"
  const shake = key => {
    const root = stage.current;
    if (!root || reduced()) return;
    for (const el of root.querySelectorAll(`[data-slot="${key}"], [data-cell="${key}"]`)) {
      el.classList.remove('shake');
      void el.getBoundingClientRect(); // restart the animation on a second click
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 380);
    }
  };
  const touchTapped = useRef(0);
  const tap = (s, el, pt = null) => {
    if (moved.current) return;
    const opt = legal.get(s.key);
    const touch = confirmPlace || lastPointer.current === 'touch';
    if (opt && !touch) { setPeek(null); setDeny(null); onPick(opt); return; }
    if (opt && touch) {
      if (peek && peek.key === s.key && peek.pinned) { setPeek(null); onPick(opt); return; }
      setPeek({ key: s.key, pinned: true });
      return;
    }
    // touch pins the card (it's how you read a space); a mouse already sees it on hover
    setPeek(touch ? { key: s.key, pinned: true } : null);
    shake(s.key);
    const text = deniedText(state, s.key, meId);
    if (text) {
      // a taken or unopened space says why, right where you clicked
      const r = el ? el.getBoundingClientRect() : null;
      const x = pt && pt.x != null ? pt.x : r ? r.left + r.width / 2 : 0, y = pt && pt.y != null ? pt.y : r ? r.top + r.height / 2 : 0;
      setDeny(d => ({ text, x, y, key: s.key, n: (d ? d.n : 0) + 1 }));
      return;
    }
    setDeny(null);
    if (onDenied) onDenied({ type: 'slot', key: s.key, q: s.q, i: s.i }, null);
  };

  const paying = Math.max(1, state.round);
  const P = 100 / VBS; // viewBox units → % of the stage
  const at = (x, y) => ({ left: `${(x - VB0) * P}%`, top: `${(y - VB0) * P}%` });
  // where a point of the (unturned) wheel sits once it's turned: spaces and plaques stay upright, only places move
  const turned = (x0, y0) => {
    const r = (rot * Math.PI) / 180;
    return [CX + (x0 - CX) * Math.cos(r) - (y0 - CY) * Math.sin(r), CY + (x0 - CX) * Math.sin(r) + (y0 - CY) * Math.cos(r)];
  };

  const stand = standings(state);
  const stdById = Object.fromEntries(stand.map(x => [x.qid, x]));
  // The engraved rule: "MOST MEMBERS · +2 · ties: red members", at least 12px on screen. Its length is worked out
  // from the font (rimWidth: a canvas measure, cached per text), never read back from the drawn page, so drawing it
  // can't feed a re-render (a measure → setState → re-measure cycle crashed frozen builds with React #185). To fit
  // the arc, a long line first tightens its letter-spacing, then drops the tiebreak to one word ("ties: red"), and
  // only then steps its size down. The full tiebreak sentence is in the rim's title and hover card.
  const RIM_PX = 12.2;
  const rimFont = Math.min(16, Math.max(11, RIM_PX / (scale || 1)));
  const arcHalf = 44; // the path the text runs on (wider than any label)
  const rimLabel = (qid, q, leaders) => {
    const st = stdById[qid];
    const sc = quadrant(qid).scoring;
    const rule = `${(st ? st.rule : shortLabel(sc.label)).toUpperCase()}  ·  +${RING_VALUE[paying - 1]}`;
    const tb = (st && st.tiebreak) || sc.tiebreak || null;
    const top = Math.abs(norm(qCenter(q) + rot)) < 90;
    const rr = top ? RIM.r - 3.6 : RIM.r + 3.6;
    const room = (2 * arcHalf * Math.PI / 180) * rr - 18; // the arc, less a little air at each end
    const tailK = leaders.length ? 0.9 + 1.55 * leaders.length : 0; // the leaders' emojis, per unit of font size
    const head = `${rule}${leaders.length ? '  ·' : ''}`;
    const base = rimWidth(head, 700, 0), n = collapse(head).length;
    const tieW = t => (t ? rimWidth(`  ·  ties: ${t}`, 600, 0.04) : 0);
    // letter-spacing (em) that makes the line fit at size f, between .03 and .11
    const spacing = (t, f) => Math.max(0.03, Math.min(0.11, (room / f - tailK - tieW(t) - base) / n));
    const width = (t, f, ls) => f * (base + ls * n + tieW(t) + tailK);
    let tie = tb ? tb.unit : null;
    if (tie && width(tie, rimFont, spacing(tie, rimFont)) > room) tie = tie.split(' ')[0];
    const ls = spacing(tie, rimFont);
    const font = Math.max(9, Math.min(rimFont, room / (base + ls * n + tieW(tie) + tailK)));
    return { rule, tie, tieText: tb ? tb.text : null, top, rr, font, ls, textW: font * (base + ls * n + tieW(tie)) };
  };
  const rimAnchor = qid => stage.current && stage.current.querySelector(`[data-plaque="${qid}"]`);
  // once the web font has loaded, its widths replace the fallback's: one more render, once
  const [, setFontsIn] = useState(0);
  useEffect(() => {
    let on = true;
    const f = typeof document !== 'undefined' && document.fonts;
    if (f && f.ready) f.ready.then(() => { if (on && rimEarly) { rimEarly = false; rimWidths.clear(); setFontsIn(1); } }, () => {});
    return () => { on = false; };
  }, []);

  // the newest rival moves since your last turn (a dotted ring in the mover's color)
  const freshOf = key => {
    const owner = state.slots[key];
    if (owner === undefined) return null;
    const fresh = recentMoves.find(m => m.key === key && !m.mine);
    if (!fresh) return null;
    const rivals = recentMoves.filter(m => !m.mine);
    return { ...fresh, newest: rivals[rivals.length - 1] === fresh };
  };

  // the printed paper wheel: quadrant inks, ring bands or cells, seams, the dark hub
  const live = useRef({});
  const paper = [];
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q), a0 = c - 45, a1 = c + 45;
    const col = `var(--${qid})`;
    if (!engraved) {
      [1, 2, 3].forEach(t => {
        const R = rings[t], open = t <= round;
        paper.push(<path key={`b${q}${t}`} className={`band${open ? ' open' : ''}${t === paying ? ' pays' : ''}`} d={arc(a0, a1, R.r0, R.r1)} fill={col} fillOpacity={open ? (t === 1 ? 0.26 : 0.2) : 0.05} />);
      });
    }
    paper.push(<path key={`rim${q}`} className={`rim${lampQid === qid ? ' lit' : lampQid ? ' wait' : ''}`} d={arc(a0, a1, RIM.r0, RIM.r1)} fill={col} fillOpacity=".88" />);
  });
  // engraved: one printed cell per space, its state in the print (wash, lamp edge, hatch, a mover's dotted ring)
  if (engraved) {
    for (const s of spaces) {
      const R = rings[s.ring], open = s.ring <= round, owner = state.slots[s.key];
      const lit = legal.has(s.key);
      const fresh = freshOf(s.key);
      const d = cellPath(s.ang - s.half, s.ang + s.half, R.r0, R.r1);
      const inset = cellPath(s.ang - s.half, s.ang + s.half, R.r0, R.r1, 2.6);
      const cls = ['cell', open ? 'open' : 'locked', lit ? 'lit' : '', owner !== undefined ? 'taken' : '', peek && peek.pinned && peek.key === s.key ? 'sel' : ''].filter(Boolean).join(' ');
      paper.push(
        <g key={`cell${s.key}`} className={cls} data-cell={s.key} style={{ '--c': `var(--${s.qid})` }}
          onClick={e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, stage.current && stage.current.querySelector(`[data-slot="${s.key}"]`), { x: e.clientX, y: e.clientY }); }}
          onPointerEnter={e => { const h = live.current.hover; e.currentTarget.classList.add('hot'); if (h && realHover(e)) h.onSpaceHover(s.key, e.currentTarget.querySelector('.wash')); }}
          onPointerLeave={e => { const h = live.current.hover; e.currentTarget.classList.remove('hot'); if (h && e.pointerType === 'mouse') h.onSpaceHover(s.key, null); }}>
          <path className="wash" d={d} />
          {!open && <path className="hatch" d={d} />}
          {lit && <path className="glow" d={inset} />}
          <path className={lit ? 'edge-lit' : 'edge-in'} d={inset} />
          {fresh && <path className={`fresh${fresh.newest ? ' newest' : ''}`} d={inset} style={{ stroke: playerColor(fresh.pid) }}><title>{`${state.players[fresh.pid].name} took ${fresh.action}`}</title></path>}
          <path className="line" d={d} />
        </g>,
      );
    }
  }
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q), a0 = c - 45, a1 = c + 45;
    // the quadrant's rule, engraved along its rim, upright wherever the wheel is turned, with whoever leads it as
    // their pixel emoji inline at the end of the line, on the same arc and baseline: "MOST BLUE · +2 · 🐱"
    const st = stdById[qid];
    const leaders = st && st.leaders.length ? st.leaders : [];
    const lab = rimLabel(qid, q, leaders);
    const rr = lab.rr, F = lab.font, textW = lab.textW;
    const arcLen = (2 * arcHalf * Math.PI / 180) * rr;
    const EM = F * 1.55; // one emoji's room on the line
    const tail = leaders.length ? F * 0.9 + leaders.length * EM : 0;
    const startS = Math.max(0, (arcLen - textW - tail) / 2);
    paper.push(<path key={`ra${q}`} id={`rim-arc-${q}`} d={textArc(c, arcHalf, rr, rot)} fill="none" />);
    const lit = lampQid === qid ? ' lit' : lampQid ? ' wait' : '';
    paper.push(
      <text key={`rt${q}`} className={`rim-rule${lit}`} fontSize={F.toFixed(2)} style={{ letterSpacing: `${lab.ls.toFixed(3)}em` }} data-plaque={qid} data-rim-text={q}>
        <textPath href={`#rim-arc-${q}`} startOffset={startS.toFixed(1)}>
          {lab.rule}
          {lab.tie ? <tspan className="rim-tie" data-rim-tie={lab.tie}>{`  ·  ties: ${lab.tie}`}</tspan> : null}
          {leaders.length ? '  ·' : ''}
        </textPath>
      </text>,
    );
    // each leader's emoji, placed along the same arc right after the text, upright like the letters
    leaders.forEach((id, k) => {
      const art = emojiArt(seatEmoji(state, id));
      if (!art) return;
      const sAt = startS + textW + F * 0.9 + k * EM + EM / 2;
      const deg = (sAt / rr) * 180 / Math.PI;
      const a = lab.top ? c - arcHalf + deg : c + arcHalf - deg;
      const [ex, ey] = polar(a, rr);
      const cap = F * 1.7; // the emoji art has a margin: this reads at cap height
      paper.push(
        <g key={`re${q}-${id}`} className={`rim-emoji${lit}`} data-rim-leader={id} transform={`translate(${ex.toFixed(2)} ${ey.toFixed(2)}) rotate(${(lab.top ? a : a + 180).toFixed(2)}) translate(${(-cap / 2).toFixed(2)} ${(-cap * 0.82).toFixed(2)}) scale(${(cap / art.size).toFixed(4)})`}>
          <title>{`${state.players[id].name} leads`}</title>
          {art.rects.map((r, j) => <rect key={j} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
        </g>,
      );
    });
    // the whole rim of a quadrant is its hover target: the standings (and the sphere's own rule, in words)
    const label = st ? st.label : quadrant(qid).scoring.label;
    const tieLine = lab.tieText ? ` ${lab.tieText[0].toUpperCase()}${lab.tieText.slice(1)}.` : '';
    const ruleLine = quadrant(qid).rule ? ` ${quadrant(qid).rule}` : '';
    paper.push(
      <path key={`rh${q}`} className="rim-hit" d={arc(a0 + 1, a1 - 1, RIM.r0 - 2, RIM.r1 + 4)} data-rim={qid}
        role="button" tabIndex={0} aria-haspopup="dialog"
        aria-label={`${shortLabel(label)}: +${RING_VALUE[paying - 1]} at round end.${tieLine}${leaders.length ? ` ${leaders.map(id => (id === meId ? 'You' : state.players[id].name)).join(' & ')} ${leaders.length > 1 || leaders[0] === meId ? 'lead' : 'leads'}.` : ' No one leads yet.'}${ruleLine} Show the standings.`}
        onPointerEnter={e => { if (hover && realHover(e)) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget); }}
        onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onPlaqueHover(qid, null); }}
        onClick={e => { e.stopPropagation(); if (hover) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); }}
        onKeyDown={e => { if (hover && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); } }}>
        <title>{`${shortLabel(label)}: +${RING_VALUE[paying - 1]} at round end.${tieLine}${ruleLine} Show the standings.`}</title>
      </path>,
    );
  });
  const hubR = rings[3].r0;
  for (const r of [RIM.r0, rings[1].r0, rings[2].r0, hubR]) paper.push(<circle key={`c${r}`} cx={CX} cy={CY} r={r} fill="none" className="ring-line" />);
  state.quadrants.forEach((qid, q) => {
    const [x0, y0] = polar(qCenter(q) - 45, hubR), [x1, y1] = polar(qCenter(q) - 45, 200);
    paper.push(<line key={`seam${q}`} x1={x0} y1={y0} x2={x1} y2={y1} className="seam" />);
  });

  // spaces: one per space, upright wherever the wheel is turned, with its effect printed on it
  // Sockets are memoized: hovering never re-renders the wheel (the hover card lives in UI-B's layer, told directly on
  // pointerenter, no timers here). Handlers reach the latest closures through refs.
  live.current = { tap, onPick, hover, anchorOf };
  const pinnedKey = peek && peek.pinned ? peek.key : null;
  const recentKey = recentMoves.map(m => `${m.key}:${m.pid}:${m.mine ? 1 : 0}`).join('|');
  const flashKey = [...flash].join('|');
  const legalKey = [...legal.entries()].map(([k, v]) => `${k}=${v}`).join('|');
  const sockets = useMemo(() => spaces.map(s => {
    const { key, q, a, ring: t, qid } = s;
    let [X, Y] = turned(s.xy[0], s.xy[1]);
    const owner = state.slots[key];
    const joiners = (state.squats && state.squats[key]) || [];
    const open = t <= round;
    const opt = legal.get(key);
    const selected = pinnedKey === key;
    const fresh = freshOf(key);
    // engraved: does the cell lie on its side once the wheel is turned (tall and narrow on screen)?
    // a flat cell in the lower half prints its name below the stamp: names always hug the rim side, where the cell is wide
    const sa = (norm(s.ang + rot) * Math.PI) / 180;
    const side = engraved && Math.abs(Math.sin(sa)) > Math.abs(Math.cos(sa));
    const low = engraved && !side && Math.cos(sa) < 0;
    // on its side, a short yield runs as one line ("+1 red · swap"); a longer one keeps a clause a line
    const flow = side && shortEffect(qid, a, round).replace(/ · /g, ' ').length <= 12;
    const cls = ['slot', `r${t}`, opt ? 'can lit' : '', flash.has(key) ? 'flash' : '', selected ? 'sel' : '', open ? 'open' : 'locked', owner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', fresh && fresh.newest ? 'newest' : '', side ? 'side' : '', low ? 'low' : '', flow ? 'flow' : ''].filter(Boolean).join(' ');
    const status = owner !== undefined ? `Taken by ${owner === meId ? 'you' : state.players[owner].name}${joiners.length ? ` and ${joiners.map(id => state.players[id].name).join(', ')}` : ''}${opt && String(opt).startsWith('squat:') ? ' (you can join it)' : ''}` : open ? (opt ? 'Open: you can take it' : 'Open') : `Opens in round ${roman(t)}`;
    const minion = id => (
      <span key={id} className="worker" data-seat={id}>
        <Minion color={playerColor(id)} emoji={seatEmoji(state, id)} size={16} title={`${state.players[id].name}’s minion`} />
      </span>
    );
    const minions = owner !== undefined ? <span className="worker-fig" data-seat={owner}>{[owner, ...joiners].map(minion)}</span> : null;
    // a tall stack on its side sits a little in from the rim (ring I), and ring II's a little in from ring I's
    if (side && t < 3) [X, Y] = turned(...polar(s.ang, rings[t].r - (t === 1 ? 5 : 3)));
    let style = { ...at(X, Y), '--c': `var(--${qid})` };
    if (engraved) {
      // the words get the cell's width on screen: its chord when it lies flat, its depth when it stands on its side
      const R = rings[t];
      const fw = side ? (R.r1 - R.r0) * 1.02 : t === 3 ? 2 * (R.r1 - 12) * Math.SQRT1_2 * 0.9 : 2 * R.r * Math.sin((s.half * Math.PI) / 180) * 0.92;
      style = { ...style, '--fw': `${((fw / BOX) * 100).toFixed(1)}%` };
    }
    return (
      <div
        key={key} className={cls} data-slot={key} data-option={opt || undefined} style={style}
        role="button" tabIndex={opt ? 0 : -1} aria-label={`${a.name}, ${quadrant(qid).name} round ${roman(t)}: ${a.text} ${status}.`}
        onClick={e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, e.currentTarget, { x: e.clientX, y: e.clientY }); }}
        onKeyDown={e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); live.current.onPick(opt); } }}
        onPointerEnter={e => { const h = live.current.hover; if (engraved) { const c = e.currentTarget.parentNode.querySelector(`[data-cell="${key}"]`); if (c) c.classList.add('hot'); } if (h && realHover(e)) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); }}
        onPointerLeave={e => { const h = live.current.hover; if (engraved) { const c = e.currentTarget.parentNode.querySelector(`[data-cell="${key}"]`); if (c) c.classList.remove('hot'); } if (h && e.pointerType === 'mouse') h.onSpaceHover(key, null); }}
        onFocus={e => { const h = live.current.hover; if (h && e.currentTarget.matches(':focus-visible')) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); }}
        onBlur={() => { const h = live.current.hover; if (h) h.onSpaceHover(key, null); }}
      >
        <span className="hit" aria-hidden="true" />
        <span className="base" aria-hidden="true" />
        {engraved ? (
          // the name; beneath it the stamp (or the minion standing on it) with the yield beside it, one clause a line
          <span className="face" aria-hidden="true">
            {open && <span className="nm">{a.name}</span>}
            <span className="row">
              {minions || <span className="ico"><Stamp id={[`${qid}.${a.key}`, spriteId(a.name)]} /></span>}
              {open && (
                <span className="yl" data-yield>
                  {clauses(shortEffect(qid, a, round)).map((c, k) => <span key={k} className="cl">{k ? <span className="sep"> </span> : null}<Rich text={c} /></span>)}
                </span>
              )}
            </span>
          </span>
        ) : (
          <>
            {open && (
              <span className="face" aria-hidden="true">
                <span className="ico"><Sprite id={[`${qid}.${a.key}`, spriteId(a.name)]} kind="action" sphere={quadrant(qid).resource} size={24} /></span>
                <span className="nm">{a.name}</span>
                <span className="yl" data-yield><Rich text={shortEffect(qid, a, round)} /></span>
              </span>
            )}
            {!open && <span className="seal" aria-hidden="true">{roman(t)}</span>}
            {/* a placed minion stands on the space, over its picture */}
            {minions}
            {fresh && <span className="fresh-ring" aria-hidden="true" style={{ '--pc': playerColor(fresh.pid) }} title={`${state.players[fresh.pid].name} took ${fresh.action}`} />}
          </>
        )}
      </div>
    );
  }), [state, rot, legalKey, flashKey, recentKey, pinnedKey, round, look]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="wheel-wrap" data-spaces={look}>
      <div className="stage" ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ '--wheel-px': `${Math.round(boardPx)}px`, '--px': (1 / (scale || 1)).toFixed(4) }}>
        <svg viewBox="-26 -26 452 452" role="group" aria-label="Board" className={`wheel-paper${late ? ' late' : ''}`}>
          <defs>
            <radialGradient id="ltPaper" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="var(--paper)" /><stop offset=".8" stopColor="var(--paper-2)" /><stop offset="1" stopColor="var(--paper-3)" /></radialGradient>
            <filter id="ltGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
            <pattern id="ltHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(42,31,23,.2)" strokeWidth="1" /></pattern>
          </defs>
          <circle cx={CX} cy={CY} r="200" fill="url(#ltPaper)" className="disk" />
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="wheel">{paper}</g>
          <circle cx={CX} cy={CY} r="199.5" fill="none" className="edge" />
          <circle cx={CX} cy={CY} r={hubR} className="hub" />
        </svg>
        <div className="hub-label" aria-label={`Round ${roman(round)}`}>
          <small>Round</small><b>{state.round ? roman(state.round) : '·'}</b>
          <span className="pips" aria-hidden="true">{[1, 2, 3].map(i => <i key={i} className={i <= state.round ? 'on' : ''} />)}</span>
        </div>
        {sockets}
        {caption && <div key={caption.n} className="caption" style={{ '--pc': playerColor(caption.pid) }} role="status"><i />{caption.text}</div>}
      </div>
      {deny && typeof document !== 'undefined' && createPortal(
        <div key={deny.n} className="deny-note" role="status" data-deny-note={deny.key} style={{ left: Math.max(8, Math.min(deny.x, (typeof innerWidth === 'number' ? innerWidth : 1e4) - 220)), top: Math.max(48, deny.y) }}>{deny.text}</div>,
        document.body,
      )}
    </div>
  );
}

// the board re-renders only when what it shows changes (online room chatter that doesn't touch the table doesn't)
export default memo(Wheel);
