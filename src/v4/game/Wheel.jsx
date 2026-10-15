// The board: a printed paper wheel of 4 quadrants (the Lamplit Table). Outer ring = round I, middle = round II,
// inner = round III. It still spins (drag, arrow keys, a sideways swipe), but everything on it stays upright and
// nothing else on screen changes with its orientation. The looks for the spaces (`?spaces=<look>`):
//  - panels (default; the visual language, plate 1b, design/prototypes/language/): a dark board where each ring's
//    spaces tile their quadrant as flat paper wedges, each with the action's small picture above its effect (the
//    number first and biggest) and one line of small print where the big line can't say it all. No names. Taken: the
//    panel dims and the minion stands where the picture was. Locked: faint on the board, its round where the picture
//    was. The small print shows only where every panel of a quadrant's ring has room for it; it's always in the hover.
//  - sockets (`?spaces=sockets`, the old look until Cory has played the new one): a cream socket per space;
//  - any face in ./faces/ (`?spaces=<name>`, lab: `?lab=faces&face=<name>`): the face draws inside each space's box;
//    the Wheel keeps positions, rotation, hover, clicks, aria, shake and notes. Contract: top of ./faces/index.js.
// In each look, a space has three states you can read at a glance: lit (yours to take: a lamp-lit edge, full strength),
// taken (dimmed to ~40% with the owner's minion standing in it), and not open yet (hatched / hollow). A rival's
// fresh move wears a dotted ring in that player's color, never the lamp's. A click on a space you can't take
// shakes it and says why at the pointer ("Taken by P3", "Opens in round II"), never silence.
// Each quadrant's contest is engraved on its rim (rule, prize, tiebreak, leaders), with the standings on hover/tap.
// Hover or focus (mouse) or a first tap (touch) shows a space's card; on touch, placing takes a second tap.
import { memo, useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, roman, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, standings, seatEmoji, shortLabel } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { emojiArt } from '../art/emojis.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { sheetMode } from './parts.jsx';
import { realHover } from '../hover.js';
import { Rich } from './Rich.jsx';
import { shortEffect, pipEffect } from '../shorts.js';
import { Follower } from '../art/Follower.jsx';
import { lookFromUrl, useFace, boxOf, faceStatus, FaceBox, BUILT_IN } from './faces/index.js';
import { panelText, fineText } from './panelText.js';
import { Mark, Op, ResourceGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { MO, spinEase } from '../motion.js';

// sockets: discs toward the outer edge of their ring, so a name never runs into a neighbour at any board size
const RING_S = { 1: { r0: 128, r1: 180, r: 151, n: 3, span: 66 }, 2: { r0: 82, r1: 128, r: 104, n: 2, span: 40 }, 3: { r0: 36, r1: 82, r: 58, n: 1, span: 0 } };
// panels: the cells tile each quadrant (ring I: three 30° cells, ring II: two 45°, ring III: one 90°) on a dark
// board with gutters between them; the hub is small so the rings get the room; r is where each
// panel's print is centred (ring III's a little out from the middle of its wedge, where the wedge is wide)
const RING_P = { 1: { r0: 123, r1: 179, r: 151, n: 3, span: 60 }, 2: { r0: 65, r1: 120, r: 92, n: 2, span: 45 }, 3: { r0: 21, r1: 62, r: 42, n: 1, span: 0 } };
const ringsOf = look => (look === 'panels' ? RING_P : RING_S);
const RIM = { r0: 180, r1: 200, r: 190 }; // the rim band: each quadrant's rule, engraved
// the rim's hover/tap target: from just outside ring I's sockets to well past the paper's edge (it wins over any space)
const RIM_HIT = { r0: 181, r1: 216 };
const CX = 200, CY = 200, VB0 = -26, VBS = 452;
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

/** Which look the spaces wear: `?spaces=sockets` (the old look), `?spaces=<a face in ./faces/>`, else 'panels'. */
export function spacesLook() {
  return lookFromUrl();
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
      out.push({ key: `${q}-${i}`, q, i, idx, qid, a, ring: t, ang, half: 45 / R.n, xy: polar(ang, R.r) });
    });
  });
  return out;
}

// ---------- the rim's text: its width from the font itself (a canvas measure, cached), never from the page ----------
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

/** Text with resource pips and the plate's marks (Rich): @m member, @r rival, @f follower, @n minion, @t extra turn,
 *  → ⇄ ↻ × and a joined "/" (per). Every mark is drawn once, in Glyphs.jsx, and shared with every other text. */
export function Marked({ text }) {
  return <Rich text={String(text || '')} />;
}

// ---------- panels (the default look): the visual language's flat wedges, plate 1b ----------
const PANEL_GUT = 4, PANEL_RC = 4; // the gutter between neighbouring panels and their corner, in board units
/** A ring cell as the plate draws it: straight, parallel gutters (`gut` wide) and rounded corners (`rc`). */
function panelPath(a0, a1, r0, r1, gut = PANEL_GUT, rc = PANEL_RC) {
  const h = gut / 2, deg = x => (x * 180) / Math.PI;
  const s0 = r => a0 + deg(Math.asin(h / r)), s1 = r => a1 - deg(Math.asin(h / r));
  const O0 = polar(s0(r1), r1), O1 = polar(s1(r1), r1), I1 = polar(s1(r0), r0), I0 = polar(s0(r0), r0);
  const along = (A, B, d) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]); return [A[0] + ((B[0] - A[0]) * d) / L, A[1] + ((B[1] - A[1]) * d) / L]; };
  const f = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  return ['M', f(along(I0, O0, rc)), 'L', f(along(O0, I0, rc)),
    'Q', f(O0), f(polar(s0(r1) + deg(rc / r1), r1)),
    'A', r1, r1, 0, 0, 1, f(polar(s1(r1) - deg(rc / r1), r1)),
    'Q', f(O1), f(along(O1, I1, rc)),
    'L', f(along(I1, O1, rc)),
    'Q', f(I1), f(polar(s1(r0) - deg(rc / r0), r0)),
    'A', r0, r0, 0, 0, 0, f(polar(s0(r0) + deg(rc / r0), r0)),
    'Q', f(I0), f(along(I0, O0, rc)), 'Z'].join(' ');
}
/** The widest upright box of height h centred at (cx, cy) that stays `pad` clear of a panel's edges (radii r0..r1,
 *  angles a0..a1 in degrees, 0 = top, clockwise, as it sits on screen). Board units; the half-width comes back. */
export function fitHalfWidth(cx, cy, h, r0, r1, a0, a1, pad, side = pad) {
  const t0 = ((a0 - 90) * Math.PI) / 180, t1 = ((a1 - 90) * Math.PI) / 180;
  const u0 = [Math.cos(t0), Math.sin(t0)], u1 = [Math.cos(t1), Math.sin(t1)];
  const ok = (x, y) => {
    const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy);
    if (r < r0 + pad || r > r1 - pad) return false;
    return u0[0] * dy - u0[1] * dx >= side && u1[0] * dy - u1[1] * dx <= -side;
  };
  const fits = w => {
    for (let k = 0; k <= 6; k++) {
      const x = cx - w + (2 * w * k) / 6, y = cy - h / 2 + (h * k) / 6;
      if (!ok(x, cy - h / 2) || !ok(x, cy + h / 2) || !ok(cx - w, y) || !ok(cx + w, y)) return false;
    }
    return true;
  };
  if (!fits(0.5)) return 0;
  let lo = 0.5, hi = 110;
  for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return lo;
}

const PANEL_RES = new Set(['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white', 'any']);
const PANEL_MARK = { '@m': 'member', '@r': 'rival', '@n': 'minion', '@t': 'turn' };
const PANEL_TOK = /@[mrfnt]|[+−-]?\d+|×(?:\d+|½)|½|≤\d+|[/→⇄·]|[A-Za-z’'?;,.!-]+|\s+|./g;
const tokKind = t => (/^\s+$/.test(t) ? 'sp' : /^(?:[+−-]?\d+|×(?:\d+|½)|½|≤\d+)$/.test(t) ? 'n' : t === '/' || t === '·' ? 'op'
  : t === '→' || t === '⇄' || PANEL_MARK[t] || t === '@f' || PANEL_RES.has(t) ? 'g' : 'w');
const panelToks = text => [...String(text || '').matchAll(PANEL_TOK)].map(m => m[0]);
/** One line of a panel in the grammar's form: numbers heavy, resources as dots, @m/@r/@n/@t/@f as marks, / and ×
 *  typed quietly; a number sits right against the glyph it counts ("+3●"). */
export function Said({ text }) {
  const toks = panelToks(text);
  const out = [];
  toks.forEach((t, k) => {
    const kind = tokKind(t);
    if (kind === 'sp') {
      const pk = k ? tokKind(toks[k - 1]) : null, nk = k + 1 < toks.length ? tokKind(toks[k + 1]) : null;
      if (pk && nk && pk !== 'op' && nk !== 'op' && !(pk === 'n' && nk === 'g')) out.push(' ');
      return;
    }
    if (kind === 'n') out.push(<b key={k} className="n">{t}</b>);
    else if (kind === 'op') out.push(<Op key={k} t={t} />);
    else if (t === '→') out.push(<Mark key={k} k="arrow" />);
    else if (t === '⇄') out.push(<Mark key={k} k="swap" />);
    else if (PANEL_MARK[t]) out.push(<Mark key={k} k={PANEL_MARK[t]} />);
    else if (t === '@f') out.push(<Follower key={k} size={12} title="follower" />);
    else if (PANEL_RES.has(t)) out.push(<Pip key={k} color={t} />);
    else out.push(t);
  });
  return <>{out}</>;
}
/** A line's width in ems of its own type (the font measured once per word, a glyph .9em, a gap .25em). */
function saidEm(text, weight = 700) {
  let w = 0;
  const toks = panelToks(text);
  toks.forEach((t, k) => {
    const kind = tokKind(t);
    if (kind === 'sp') w += 0.25;
    else if (kind === 'g') w += 0.92;
    else if (kind === 'op') w += 0.55;
    else w += rimWidth(t, kind === 'n' ? 800 : weight, 0);
    if (kind === 'sp' && k && tokKind(toks[k - 1]) === 'n' && k + 1 < toks.length && tokKind(toks[k + 1]) === 'g') w -= 0.25;
  });
  return w;
}
// the type and the picture on a panel, in screen pixels (the number at least 16, the small print at least 12)
const PANEL_PX = { pic: 18, big: 18, bigMin: 16, fine: 12, fineLine: 13, gap: 1 };
/**
 * How a panel's print lays out in the room it has: the big line on one line or a clause a line, the small print on
 * one or two lines or not at all (it's always in the hover). Returns { bigLines, fineLines, big (px), w (board
 * units: the box's width) }. `k` is screen pixels per board unit.
 */
function panelLayout({ s, R, rot, k, big, fine }) {
  const a0 = s.ang - s.half + rot, a1 = s.ang + s.half + rot;
  // the print may sit a little in from the middle of its band, where an upright box has more room
  const at = rc => polar(s.ang + rot, rc);
  const centres = R.n === 1 ? [R.r - 6, R.r - 3, R.r, R.r + 3, R.r + 6] : [R.r - 4, R.r - 2, R.r, R.r + 2];
  let rc = R.r;
  const room = hPx => {
    let best = 0;
    for (const c of centres) {
      const [cx, cy] = at(c);
      const w = 2 * fitHalfWidth(cx, cy, hPx / k, R.r0, R.r1, a0, a1, 1.2, PANEL_GUT / 2 + 1.2);
      if (w > best + 0.01) { best = w; rc = c; }
    }
    return best;
  };
  const clauseList = clauses(big);
  const bigEm = saidEm(big, 500), clauseEm = Math.max(...clauseList.map(c => saidEm(c, 500)));
  const fineEm = fine ? saidEm(fine, 700) : 0;
  const longestWord = fine ? Math.max(...String(fine).split(/\s+/).map(t => saidEm(t, 700))) : 0;
  const { pic, gap, fineLine } = PANEL_PX;
  const tries = [];
  for (const bp of [PANEL_PX.big, 18, PANEL_PX.bigMin]) {
    for (const bl of clauseList.length > 1 ? [1, 2] : [1]) {
      for (const fl of fine ? [1, 2, 0] : [0]) tries.push({ bp, bl, fl });
    }
  }
  // prefer the biggest number, then the small print shown, then fewer lines
  tries.sort((a, b) => b.bp - a.bp || (b.fl > 0) - (a.fl > 0) || a.bl - b.bl || a.fl - b.fl);
  for (const t of tries) {
    const h = pic + gap + t.bl * t.bp + (t.fl ? gap + t.fl * fineLine : 0);
    const needBig = (t.bl === 1 ? bigEm : clauseEm) * t.bp;
    const needFine = t.fl === 0 ? 0 : t.fl === 1 ? fineEm * PANEL_PX.fine : Math.max(longestWord, fineEm * 0.62) * PANEL_PX.fine;
    const w = room(h) * k;
    if (w >= Math.max(needBig, needFine, pic) + 2) return { bigLines: t.bl, fineLines: t.fl, big: t.bp, w: w / k, rc };
  }
  const bl = clauseList.length > 1 ? 2 : 1;
  const w = room(pic + gap + bl * PANEL_PX.bigMin);
  return { bigLines: bl, fineLines: 0, big: PANEL_PX.bigMin, w: Math.max(w, 24 / k), rc: w ? rc : R.r };
}

// Is the person driving with the keyboard? Focus moved to a space on its own (your turn begins) opens its card only
// then: for a mouse player it was a card nobody pointed at (Cory, 2026-10-15: hovers appear right where you point)
let viaKeys = false;
if (typeof addEventListener === 'function') {
  addEventListener('keydown', () => { viaKeys = true; }, true);
  addEventListener('pointerdown', () => { viaKeys = false; }, true);
}
const keyboardLed = () => viaKeys;

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
 *   flash:Set<string>, late?:boolean, facing:number, onFacing:(q:number)=>void, look?:string }} props
 *   (look: 'panels' | 'sockets' | the name of a face in ./faces/, whose contract is at the top of faces/index.js)
 */
function Wheel({ state, legal, pickNotes = null, onPick, onDenied, onTouched, confirmPlace = false, flash, late = false, caption = null, lastMove = null, recentMoves = [], spacePeek = null, onSpacePeek, meId = null, facing, onFacing, hover = null, lampQid = null, look: lookProp = null }) {
  const look = useMemo(() => lookProp || spacesLook(), [lookProp]);
  const panels = look === 'panels';
  // a face from ./faces/ (null for the built-in looks, and for a moment while its chunk loads)
  const custom = !BUILT_IN.includes(look);
  const Face = useFace(custom ? look : null);
  const rings = ringsOf(look);
  const [rot, setRot] = useState(() => -90 * facing);
  const [peek, setPeek] = useState(null); // { key, pinned }
  const [deny, setDeny] = useState(null); // { text, x, y, n }: the note at the pointer after a click on a space you can't take
  // the space card itself is UI-B's hover layer: the wheel only says which space is under the pointer (or pinned)
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const stage = useRef(null);
  // what a space's hover card sits beside: the whole panel, or the socket
  const anchorOf = (key, el = null) => {
    const root = stage.current;
    if (panels && root) { const c = root.querySelector(`[data-cell="${key}"] .wash`); if (c) return c; }
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

  // A spin or a drag paints straight onto the board, with no render per frame (a whole-wheel render each frame cost
  // whole frames under load, and the spin read as slow): the paper and the rim turn by their transform, each space
  // slides round by `translate`. React takes the angle once, when it lands, and the layout effect below hands the board
  // back to React's own positions (motion budget: MO.spin, src/v4/motion.js).
  const drawn = useRef(rot); // the angle React last drew
  const paintRot = r => {
    rotRef.current = r;
    const root = stage.current;
    if (!root) return;
    for (const g of root.querySelectorAll(':scope > svg > g[transform]')) g.setAttribute('transform', `rotate(${r} ${CX} ${CY})`);
    const d = ((r - drawn.current) * Math.PI) / 180, c = Math.cos(d), s = Math.sin(d), w = root.clientWidth, h = root.clientHeight;
    for (const el of root.querySelectorAll(':scope > [data-slot]')) {
      const x = (parseFloat(el.style.left) / 100 - 0.5) * w, y = (parseFloat(el.style.top) / 100 - 0.5) * h;
      el.style.translate = Number.isFinite(x + y) ? `${(x * c - y * s - x).toFixed(1)}px ${(x * s + y * c - y).toFixed(1)}px` : '';
    }
  };
  useLayoutEffect(() => {
    drawn.current = rot;
    const root = stage.current;
    if (!root) return;
    for (const g of root.querySelectorAll(':scope > svg > g[transform]')) g.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`);
    for (const el of root.querySelectorAll(':scope > [data-slot]')) if (el.style.translate) el.style.translate = '';
  }, [rot]);
  const stop = () => { if (anim.current) cancelAnimationFrame(anim.current); anim.current = null; };
  const animateTo = useCallback(to => {
    stop();
    const from = rotRef.current, t0 = performance.now(), dur = reduced() ? 1 : MO.spin;
    setPeek(p => (p && !p.pinned ? null : p)); // a hover card doesn't ride along on a turning board
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      if (k < 1) { paintRot(from + (to - from) * spinEase(k)); anim.current = requestAnimationFrame(step); return; }
      anim.current = null;
      applyRot(to);
    };
    anim.current = requestAnimationFrame(step);
  }, [applyRot]); // eslint-disable-line react-hooks/exhaustive-deps
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
    paintRot(rotRef.current + d);
  };
  const onUp = e => {
    if (e && e.pointerType === 'touch' && !moved.current && drag.current) {
      const p = local(e);
      // a tap on the rim reads its standings (the rim's own click), never the nearest space
      if (p.d >= RIM_HIT.r0) { drag.current = null; return; }
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
  const RIM_MARK = 1.25; // the follower mark's room after the prize, per unit of font size
  const rimLabel = (qid, q, leaders) => {
    const st = stdById[qid];
    const sc = quadrant(qid).scoring;
    // the prize ends the line with the follower mark after it (Cory, 2026-10-15: "+2" alone didn't say followers; he
    // asked for the symbol), then whoever leads: "MOST BLUE · ties: red · +2 👤 🐱"
    const rule = (st ? st.rule : shortLabel(sc.label)).toUpperCase();
    const prize = `  ·  +${RING_VALUE[paying - 1]}`;
    const tb = (st && st.tiebreak) || sc.tiebreak || null;
    const top = Math.abs(norm(qCenter(q) + rot)) < 90;
    const rr = top ? RIM.r - 3.6 : RIM.r + 3.6;
    const room = (2 * arcHalf * Math.PI / 180) * rr - 18; // the arc, less a little air at each end
    // the follower mark, then the leaders' emojis, per unit of font size
    const tailK = RIM_MARK + (leaders.length ? 0.45 + 1.55 * leaders.length : 0);
    const head = `${rule}${prize}`;
    const base = rimWidth(head, 700, 0), n = collapse(head).length;
    const tieW = t => (t ? rimWidth(`  ·  ties: ${t}`, 600, 0.04) : 0);
    // letter-spacing (em) that makes the line fit at size f, between .03 and .11
    const spacing = (t, f) => Math.max(0.03, Math.min(0.11, (room / f - tailK - tieW(t) - base) / n));
    const width = (t, f, ls) => f * (base + ls * n + tieW(t) + tailK);
    let tie = tb ? tb.unit : null;
    if (tie && width(tie, rimFont, spacing(tie, rimFont)) > room) tie = tie.split(' ')[0];
    const ls = spacing(tie, rimFont);
    const font = Math.max(9, Math.min(rimFont, room / (base + ls * n + tieW(tie) + tailK)));
    return { rule, prize, tie, tieText: tb ? tb.text : null, top, rr, font, ls, textW: font * (base + ls * n + tieW(tie)) };
  };
  // panels: the plate's rim, "MOST ● +4 👤 🐸": the rule in short words with a dot for its color, the prize a size up,
  // then the follower mark and whoever leads. Each run's width comes from the font (rimWidth), never from the page.
  const RIM_LS = 0.08;
  const rimRuns = (qid, q, leaders) => {
    const st = stdById[qid];
    const sc = quadrant(qid).scoring;
    const words = (st ? st.rule : shortLabel(sc.label)).split(/\s+/);
    const runs = [];
    for (const w of words) {
      const color = w.toLowerCase();
      if (PANEL_RES.has(color) && color !== 'any') { runs.push({ kind: 'dot', color }); continue; }
      const last = runs[runs.length - 1];
      if (last && last.kind === 'text') last.text += ` ${w.toUpperCase()}`; else runs.push({ kind: 'text', text: w.toUpperCase() });
    }
    const tb = (st && st.tiebreak) || sc.tiebreak || null;
    const tie = tb ? tb.unit.split(' ')[0] : null;
    if (tie) { const last = runs[runs.length - 1]; if (last.kind === 'text') last.tie = tie; else runs.push({ kind: 'text', text: '·', tie }); }
    runs.push({ kind: 'prize', text: `+${RING_VALUE[paying - 1]}` });
    // widths per unit of font size, and the gaps before each run
    for (const [k, r] of runs.entries()) {
      r.w = r.kind === 'dot' ? 1.1 : r.kind === 'prize' ? 1.3 * rimWidth(r.text, 800, 0) : rimWidth(r.text, 700, 0) + RIM_LS * r.text.length + (r.tie ? rimWidth(`  ·  ties: ${r.tie}`, 600, 0.04) : 0);
      r.gap = !k ? 0 : r.kind === 'prize' ? 0.75 : 0.4;
    }
    const top = Math.abs(norm(qCenter(q) + rot)) < 90;
    const rr = top ? RIM.r - 3.6 : RIM.r + 3.6;
    const room = (2 * arcHalf * Math.PI / 180) * rr - 18;
    const lineK = runs.reduce((a, r) => a + r.gap + r.w, 0);
    const tailK = RIM_MARK + (leaders.length ? 0.45 + 1.55 * leaders.length : 0);
    const font = Math.max(9, Math.min(rimFont, room / (lineK + tailK)));
    let at = 0;
    for (const r of runs) { at += r.gap * font; r.s = at; at += r.w * font; }
    return { runs, tie, tieText: tb ? tb.text : null, top, rr, font, ls: RIM_LS, textW: lineK * font };
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
    if (!panels && !(Face && Face.bands === false)) {
      [1, 2, 3].forEach(t => {
        const R = rings[t], open = t <= round;
        paper.push(<path key={`b${q}${t}`} className={`band${open ? ' open' : ''}${t === paying ? ' pays' : ''}`} d={arc(a0, a1, R.r0, R.r1)} fill={col} fillOpacity={open ? (t === 1 ? 0.26 : 0.2) : 0.05} />);
      });
    }
    // panels: the rim is the quadrant's color, deep, on the dark board (plate 1b), with a fine light line at its foot
    paper.push(<path key={`rim${q}`} className={`rim${lampQid === qid ? ' lit' : lampQid ? ' wait' : ''}`} d={arc(a0, a1, RIM.r0, RIM.r1)} fill={panels ? `color-mix(in srgb, ${col} 50%, #1a120c)` : col} fillOpacity={panels ? 1 : 0.88} />);
    if (panels) paper.push(<path key={`rimfoot${q}`} className="rim-foot" d={arc(a0 + 0.3, a1 - 0.3, RIM.r0, RIM.r0 + 0.8)} fill={`color-mix(in srgb, ${col} 80%, #fff)`} opacity=".35" />);
  });
  // a face's own print in the paper (Face.Cell, optional): one per space, tiling its quadrant's ring, turning with it
  if (Face && Face.Cell) {
    const Cell = Face.Cell;
    for (const s of spaces) {
      const R = rings[s.ring], c = qCenter(s.q), w = 90 / R.n;
      const a1 = c + 45 - s.idx * w, a0 = a1 - w;
      const owner = state.slots[s.key], fresh = freshOf(s.key);
      const status = faceStatus({ legal: legal.has(s.key), owner, open: s.ring <= round, fresh });
      paper.push(
        <g key={`fc${s.key}`} className={`face-cell ${status}`} data-cell={s.key} style={{ '--c': `var(--${s.qid})`, pointerEvents: 'none' }}>
          <Cell key={s.key} q={s.qid} action={s.a} ring={s.ring} round={round} status={status} ang={s.ang} a0={a0} a1={a1} r0={R.r0} r1={R.r1}
            d={cellPath(a0, a1, R.r0, R.r1)} inset={cellPath(a0, a1, R.r0, R.r1, 2.6)} />
        </g>,
      );
    }
  }
  // panels: one flat paper wedge per space (plate 1b), its state in the paper: lit (yours to take: a warm-white edge,
  // and the full glow under your pointer), taken (dimmed), fresh (a dotted edge in the mover's color), locked (a faint
  // outline). The wedge is the space's click and hover target; its print is the upright box above it (sockets below).
  if (panels) {
    for (const s of spaces) {
      const R = rings[s.ring], open = s.ring <= round, owner = state.slots[s.key];
      const lit = legal.has(s.key);
      const fresh = freshOf(s.key);
      const a0 = s.ang - s.half, a1 = s.ang + s.half;
      const d = panelPath(a0, a1, R.r0, R.r1);
      const cls = ['pcell', open ? 'open' : 'locked', lit ? 'lit' : '', owner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', peek && peek.pinned && peek.key === s.key ? 'sel' : ''].filter(Boolean).join(' ');
      paper.push(
        <g key={`pc${s.key}`} className={cls} data-cell={s.key} style={{ '--c': `var(--${s.qid})` }}
          onClick={e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, stage.current && stage.current.querySelector(`[data-slot="${s.key}"]`), { x: e.clientX, y: e.clientY }); }}
          onPointerEnter={e => { const h = live.current.hover; e.currentTarget.classList.add('hot'); if (h && realHover(e)) h.onSpaceHover(s.key, e.currentTarget.querySelector('.wash')); }}
          onPointerLeave={e => { const h = live.current.hover; e.currentTarget.classList.remove('hot'); if (h && e.pointerType === 'mouse') h.onSpaceHover(s.key, null); }}>
          {lit && <path className="glow" d={d} />}
          <path className="wash" d={d} />
          {lit && <path className="edge-lit" d={d} />}
          {fresh && <path className={`fresh${fresh.newest ? ' newest' : ''}`} d={panelPath(a0, a1, R.r0 + 2.2, R.r1 - 2.2, PANEL_GUT + 4.4, PANEL_RC - 1)} style={{ stroke: playerColor(fresh.pid) }}><title>{`${state.players[fresh.pid].name} took ${fresh.action}`}</title></path>}
        </g>,
      );
    }
  }
  const rimHits = [];
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q), a0 = c - 45, a1 = c + 45;
    // the quadrant's rule, engraved along its rim, upright wherever the wheel is turned, with whoever leads it as
    // their pixel emoji inline at the end of the line, on the same arc and baseline: "MOST BLUE · +2 · 🐱"
    const st = stdById[qid];
    const leaders = st && st.leaders.length ? st.leaders : [];
    const lab = panels ? rimRuns(qid, q, leaders) : rimLabel(qid, q, leaders);
    const rr = lab.rr, F = lab.font, textW = lab.textW;
    const arcLen = (2 * arcHalf * Math.PI / 180) * rr;
    const EM = F * 1.55; // one emoji's room on the line
    const tail = F * RIM_MARK + (leaders.length ? F * 0.45 + leaders.length * EM : 0);
    const startS = Math.max(0, (arcLen - textW - tail) / 2);
    paper.push(<path key={`ra${q}`} id={`rim-arc-${q}`} d={textArc(c, arcHalf, rr, rot)} fill="none" />);
    const lit = lampQid === qid ? ' lit' : lampQid ? ' wait' : '';
    // a point on the line, s along it from its start: where it sits and which way is up
    const onLine = sAt => {
      const deg = (sAt / rr) * 180 / Math.PI;
      const a = lab.top ? c - arcHalf + deg : c + arcHalf - deg;
      return { xy: polar(a, rr), up: lab.top ? a : a + 180 };
    };
    if (lab.runs) {
      // panels: each run of words on its own stretch of the arc, the color as its dot between them, the prize a size up
      paper.push(
        <text key={`rt${q}`} className={`rim-rule${lit}`} fontSize={F.toFixed(2)} style={{ letterSpacing: `${lab.ls.toFixed(3)}em` }} data-plaque={qid} data-rim-text={q}>
          {lab.runs.filter(r => r.kind !== 'dot').map((r, k) => (
            <textPath key={k} href={`#rim-arc-${q}`} startOffset={(startS + r.s).toFixed(1)}>
              {r.kind === 'prize' ? <tspan className="rim-prize" fontSize={(F * 1.3).toFixed(2)} style={{ letterSpacing: 0 }}>{r.text}</tspan> : r.text}
              {r.tie ? <tspan className="rim-tie" data-rim-tie={r.tie}>{`  ·  ties: ${r.tie}`}</tspan> : null}
            </textPath>
          ))}
        </text>,
      );
      lab.runs.filter(r => r.kind === 'dot').forEach((r, k) => {
        const { xy: [x, y], up } = onLine(startS + r.s + (r.w * F) / 2);
        const D = F * 1.1;
        paper.push(
          <g key={`rd${q}-${k}`} className={`rim-dot${lit}`} data-rim-dot={r.color} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${up.toFixed(2)}) translate(${(-D / 2).toFixed(2)} ${(-D * 0.55).toFixed(2)})`}>
            <title>{r.color}</title>
            <circle cx={D / 2} cy={D / 2} r={D / 2} className="rim-dot-ring" />
            <g transform={`translate(${(D * 0.12).toFixed(2)} ${(D * 0.12).toFixed(2)}) scale(${((D * 0.76) / 16).toFixed(4)})`}><ResourceGlyph r={r.color} decorative /></g>
          </g>,
        );
      });
    } else paper.push(
      <text key={`rt${q}`} className={`rim-rule${lit}`} fontSize={F.toFixed(2)} style={{ letterSpacing: `${lab.ls.toFixed(3)}em` }} data-plaque={qid} data-rim-text={q}>
        <textPath href={`#rim-arc-${q}`} startOffset={startS.toFixed(1)}>
          {lab.rule}
          {lab.tie ? <tspan className="rim-tie" data-rim-tie={lab.tie}>{`  ·  ties: ${lab.tie}`}</tspan> : null}
          {lab.prize}
        </textPath>
      </text>,
    );
    // the follower mark right after the prize, on the same arc, upright like the letters
    {
      const sAt = startS + textW + (F * RIM_MARK) / 2;
      const deg = (sAt / rr) * 180 / Math.PI;
      const a = lab.top ? c - arcHalf + deg : c + arcHalf - deg;
      const [mx, my] = polar(a, rr);
      const cap = F * 0.95;
      paper.push(
        <g key={`rf${q}`} className={`rim-mark${lit}`} data-rim-prize={qid} transform={`translate(${mx.toFixed(2)} ${my.toFixed(2)}) rotate(${(lab.top ? a : a + 180).toFixed(2)}) translate(${(-cap / 2).toFixed(2)} ${(-cap * 0.86).toFixed(2)})`}>
          <Follower size={cap} title={`${RING_VALUE[paying - 1]} followers`} />
        </g>,
      );
    }
    // each leader's emoji, placed along the same arc right after the text, upright like the letters
    leaders.forEach((id, k) => {
      const art = emojiArt(seatEmoji(state, id));
      if (!art) return;
      const sAt = startS + textW + F * RIM_MARK + F * 0.45 + k * EM + EM / 2;
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
    // the whole rim of a quadrant is its hover target: the standings (and the sphere's own rule, in words). It lives in
    // its own layer above the spaces (rimHits) and reaches past the paper's edge, so a pointer on the rule or on a
    // leader's emoji always opens the standings, never the ring-I space whose round hit area pokes into the rim
    // (RC1 panel: three tries to reach the standings)
    const label = st ? st.label : quadrant(qid).scoring.label;
    const tieLine = lab.tieText ? ` ${lab.tieText[0].toUpperCase()}${lab.tieText.slice(1)}.` : '';
    const ruleLine = quadrant(qid).rule ? ` ${quadrant(qid).rule}` : '';
    rimHits.push(
      <path key={`rh${q}`} className="rim-hit" d={arc(a0 + 1, a1 - 1, RIM_HIT.r0, RIM_HIT.r1)} data-rim={qid}
        role="button" tabIndex={0} aria-haspopup="dialog"
        aria-label={`${shortLabel(label)}: +${RING_VALUE[paying - 1]} followers at round end.${tieLine}${leaders.length ? ` ${leaders.map(id => (id === meId ? 'You' : state.players[id].name)).join(' & ')} ${leaders.length > 1 || leaders[0] === meId ? 'lead' : 'leads'}.` : ' No one leads yet.'}${ruleLine} Show the standings.`}
        onPointerEnter={e => { if (hover && realHover(e)) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget); }}
        onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onPlaqueHover(qid, null); }}
        onClick={e => { e.stopPropagation(); if (moved.current) return; if (hover) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); }}
        onKeyDown={e => { if (hover && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); } }}>
        <title>{`${shortLabel(label)}: +${RING_VALUE[paying - 1]} followers at round end.${tieLine}${ruleLine} Show the standings.`}</title>
      </path>,
    );
  });
  const hubR = panels ? rings[3].r0 - 3 : rings[3].r0;
  if (!panels) for (const r of [RIM.r0, rings[1].r0, rings[2].r0, hubR]) paper.push(<circle key={`c${r}`} cx={CX} cy={CY} r={r} fill="none" className="ring-line" />);
  state.quadrants.forEach((qid, q) => {
    const [x0, y0] = polar(qCenter(q) - 45, panels ? RIM.r0 : hubR), [x1, y1] = polar(qCenter(q) - 45, panels ? 202 : 200);
    paper.push(<line key={`seam${q}`} x1={x0} y1={y0} x2={x1} y2={y1} className="seam" />);
  });

  // spaces: one per space, upright wherever the wheel is turned, with its effect printed on it
  // Sockets are memoized: hovering never re-renders the wheel (the hover card lives in UI-B's layer, told directly on
  // pointerenter, no timers here). Handlers reach the latest closures through refs.
  // panels: each one's print laid out for where it sits now. Rhythm (design/taste.md): a quadrant's ring shows its
  // small print only when every panel there has room for it (else it's all in the hover), and every number on the
  // wheel is one size, the smallest any panel needs
  const panelLays = useMemo(() => {
    if (!panels) return null;
    const k = scale || 1;
    const first = new Map(), ok = {};
    for (const s of spaces) {
      const said = panelText(s.qid, s.a, round);
      const fine = s.ring <= round ? fineText(said.fine) || null : null;
      const lay = panelLayout({ s, R: rings[s.ring], rot, k, big: said.big, fine });
      first.set(s.key, { said, fine, lay });
      const g = `${s.q}-${s.ring}`;
      ok[g] = ok[g] !== false && !(fine && !lay.fineLines);
    }
    const out = new Map();
    for (const s of spaces) {
      const f = first.get(s.key);
      out.set(s.key, { ...f, lay: !f.fine || ok[`${s.q}-${s.ring}`] ? f.lay : panelLayout({ s, R: rings[s.ring], rot, k, big: f.said.big, fine: null }) });
    }
    const big = Math.min(...[...out.values()].map(v => v.lay.big));
    for (const v of out.values()) v.lay = { ...v.lay, big };
    return out;
  }, [panels, state.quadrants, round, rot, scale]); // eslint-disable-line react-hooks/exhaustive-deps
  live.current = { tap, onPick, hover, anchorOf };
  const pinnedKey = peek && peek.pinned ? peek.key : null;
  const recentKey = recentMoves.map(m => `${m.key}:${m.pid}:${m.mine ? 1 : 0}`).join('|');
  const flashKey = [...flash].join('|');
  const legalKey = [...legal.entries()].map(([k, v]) => `${k}=${v}`).join('|');
  const sockets = useMemo(() => spaces.map(s => {
    const { key, q, a, ring: t, qid } = s;
    const [X, Y] = turned(s.xy[0], s.xy[1]);
    const owner = state.slots[key];
    const joiners = (state.squats && state.squats[key]) || [];
    const open = t <= round;
    const opt = legal.get(key);
    const selected = pinnedKey === key;
    const fresh = freshOf(key);
    // panels: the grammar's big line and small print, laid out in the room this panel has where it sits now
    const pl = panels ? panelLays.get(key) : null;
    const said = pl && pl.said, lay = pl && pl.lay, fineSaid = pl && open ? said.fine : null;
    const cls = ['slot', `r${t}`, opt ? 'can lit' : '', flash.has(key) ? 'flash' : '', selected ? 'sel' : '', open ? 'open' : 'locked', owner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', fresh && fresh.newest ? 'newest' : '', lay && !lay.fineLines ? 'nofine' : '', lay && lay.fineLines > 1 ? 'fine2' : '', lay && lay.bigLines > 1 ? 'big2' : ''].filter(Boolean).join(' ');
    const status = owner !== undefined ? `Taken by ${owner === meId ? 'you' : state.players[owner].name}${joiners.length ? ` and ${joiners.map(id => state.players[id].name).join(', ')}` : ''}${opt && String(opt).startsWith('squat:') ? ' (you can join it)' : ''}` : open ? (opt ? 'Open: you can take it' : 'Open') : `Opens in round ${roman(t)}`;
    const minion = id => (
      <span key={id} className="worker" data-seat={id}>
        <Minion color={playerColor(id)} emoji={seatEmoji(state, id)} size={16} title={`${state.players[id].name}’s minion`} />
      </span>
    );
    const minions = owner !== undefined ? <span className="worker-fig" data-seat={owner}>{[owner, ...joiners].map(minion)}</span> : null;
    let style = { ...at(X, Y), '--c': `var(--${qid})` };
    if (panels) style = { ...style, ...at(...turned(...polar(s.ang, lay.rc))), width: `${((lay.w / VBS) * 100).toFixed(2)}%`, '--big': `${lay.big}px` };
    // a face from ./faces/: the box is the face's own size (board units), and the face draws everything inside it
    let face = null;
    if (custom) {
      const [bw, bh] = boxOf(Face, t);
      style = { ...style, width: `${((bw / VBS) * 100).toFixed(3)}%`, aspectRatio: `${bw} / ${bh}` };
      if (Face) {
        const crew = owner !== undefined ? [owner, ...joiners].map(id => ({ emoji: seatEmoji(state, id), pid: id, fresh: !!(fresh && fresh.pid === id), color: playerColor(id), name: state.players[id].name })) : [];
        face = (
          <FaceBox Face={Face} q={qid} action={a} ring={t} round={round} name={a.name} effect={pipEffect(qid, a, round)}
            status={faceStatus({ legal: !!opt, owner, open, fresh })} minions={crew} onPick={opt ? () => live.current.onPick(opt) : null}
            px={1 / (scale || 1)} color={`var(--${qid})`} angle={(norm(s.ang + rot) + 360) % 360} flash={flash.has(key)} selected={selected} />
        );
      }
    }
    return (
      <div
        key={key} className={cls} data-slot={key} data-option={opt || undefined} data-pick-note={(opt && pickNotes && pickNotes.get(key)) || undefined} style={style}
        role="button" tabIndex={opt ? 0 : -1} aria-label={`${a.name}, ${quadrant(qid).name} round ${roman(t)}: ${a.text} ${status}.`}
        onClick={e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, e.currentTarget, { x: e.clientX, y: e.clientY }); }}
        onKeyDown={e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); live.current.onPick(opt); } }}
        onPointerEnter={e => { const h = live.current.hover; if (panels) { const c = e.currentTarget.parentNode.querySelector(`[data-cell="${key}"]`); if (c) c.classList.add('hot'); } if (h && realHover(e)) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); }}
        onPointerLeave={e => { const h = live.current.hover; if (panels) { const c = e.currentTarget.parentNode.querySelector(`[data-cell="${key}"]`); if (c) c.classList.remove('hot'); } if (h && e.pointerType === 'mouse') h.onSpaceHover(key, null); }}
        onFocus={e => { const h = live.current.hover; if (h && keyboardLed() && e.currentTarget.matches(':focus-visible')) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); }}
        onBlur={() => { const h = live.current.hover; if (h) h.onSpaceHover(key, null); }}
      >
        <span className="hit" aria-hidden="true" />
        <span className="base" aria-hidden="true" />
        {custom ? face : panels ? (
          // the picture (or the minions standing where it was), the big line, then the small print when there's room
          <span className="face" aria-hidden="true">
            {/* the picture's slot: the action's picture, the minions standing on it, or (not open yet) its round */}
            <span className="ico">{minions || (open ? <Sprite id={[`${qid}.${a.key}`, spriteId(a.name)]} kind="action" sphere={quadrant(qid).resource} size={18} /> : <span className="seal">{roman(t)}</span>)}</span>
            <span className="yl big" data-yield>
              {lay.bigLines > 1 ? clauses(said.big).map((c, k) => <span key={k} className="cl"><Said text={c} /></span>) : <Said text={said.big} />}
            </span>
            {lay.fineLines > 0 && (
              <span className="fine" data-fine>
                {fineSaid && typeof fineSaid === 'object'
                  ? <>{fineSaid.byRound.map((v, k) => <span key={k}>{k ? <Op t="·" /> : null}<b className={k + 1 === round ? 'now' : 'dim'}>{v}</b></span>)} by round</>
                  : <Said text={fineSaid} />}
              </span>
            )}
          </span>
        ) : (
          <>
            {open && (
              <span className="face" aria-hidden="true">
                <span className="ico"><Sprite id={[`${qid}.${a.key}`, spriteId(a.name)]} kind="action" sphere={quadrant(qid).resource} size={24} /></span>
                {/* no name on the space (Cory, 2026-10-15: "do away with the names of the actions for now"); it's in the hover */}
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
  }), [state, rot, legalKey, flashKey, recentKey, pinnedKey, round, look, Face, custom || panels ? scale : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="wheel-wrap" data-spaces={look} data-face={custom ? look : undefined}>
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
        <svg viewBox="-26 -26 452 452" className="rim-layer" role="group" aria-label="Contest standings">
          <g transform={`rotate(${rot} ${CX} ${CY})`}>{rimHits}</g>
        </svg>
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
