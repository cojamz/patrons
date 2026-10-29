// The board: a printed paper wheel of one quadrant per sphere (2 to 4: one per player, Cory 2026-10-15; each takes
// 360/n degrees, its rings tiled the same way) (the Lamplit Table). Outer ring = round I, middle = round II,
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
import { memo, startTransition, useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { quadrant, roman, spaceOpen, RING_VALUE } from '../../engine/v4/index.js';
import { playerColor, standings, seatEmoji, shortLabel } from '../format.js';
import { Minion } from '../art/Leader.jsx';
import { emojiArt } from '../art/emojis.js';
import { Sprite } from '../art/Sprite.jsx';
import { spriteId } from '../art/index.js';
import { sheetMode } from './parts.jsx';
import { realHover } from '../hover.js';
import { Rich } from './Rich.jsx';
import { shortEffect, pipEffect, ruleWords } from '../shorts.js';
import { Follower } from '../art/Follower.jsx';
import { lookFromUrl, useFace, boxOf, faceStatus, FaceBox, BUILT_IN } from './faces/index.js';
import { panelText, lineText } from './panelText.js';
import { ResourceGlyph } from './Glyphs.jsx';
import { Pip } from './Rich.jsx';
import { MO, spinEase } from '../motion.js';

// One space on the board, drawn once per change of what it shows (perf, 2026-10-15): the wheel keeps each space's
// element while its picture is the same, so a rival's step redraws only the spaces that changed, not all 24
const Space = memo(function WheelSpace({ el }) { return el; });
// A space's handlers, made here and not in the wheel's render: a space's element is kept across renders (built, Space),
// and a handler made inside one held that render's whole game state, one per space (leak pass, 2026-10-28). They read
// the wheel's latest through its live ref.
const placeFn = (live, key, opt) => () => live.current.place(key, opt);
function slotHandlers(live, touchTapped, s, key, opt, panels) {
  const hot = (e, on) => { if (!panels) return; const c = e.currentTarget.parentNode.querySelector(`[data-cell="${key}"]`); if (c) c.classList.toggle('hot', on); };
  return {
    onClick: e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, e.currentTarget, { x: e.clientX, y: e.clientY }); },
    onKeyDown: e => { if (opt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); live.current.place(key, opt); } },
    onPointerEnter: e => { const h = live.current.hover; hot(e, true); if (h && realHover(e)) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); },
    onPointerLeave: e => { const h = live.current.hover; hot(e, false); if (h && e.pointerType === 'mouse') h.onSpaceHover(key, null); },
    onFocus: e => { const h = live.current.hover; if (h && keyboardLed() && e.currentTarget.matches(':focus-visible')) h.onSpaceHover(key, live.current.anchorOf(key, e.currentTarget)); },
    onBlur: () => { const h = live.current.hover; if (h) h.onSpaceHover(key, null); },
  };
}

// sockets: discs toward the outer edge of their ring, so a name never runs into a neighbour at any board size
const RING_S = { 1: { r0: 128, r1: 176, r: 151, n: 3, span: 66 }, 2: { r0: 82, r1: 128, r: 104, n: 2, span: 40 }, 3: { r0: 36, r1: 82, r: 58, n: 1, span: 0 } };
// panels: the cells tile each quadrant (ring I: three 30° cells, ring II: two 45°, ring III: one 90°) on a dark
// board with gutters between them; the hub is small so the rings get the room; r is where each
// panel's print is centred (ring III's a little out from the middle of its wedge, where the wedge is wide)
const RING_P = { 1: { r0: 116, r1: 176, r: 146.5, n: 3, span: 60 }, 2: { r0: 63, r1: 113, r: 88.5, n: 2, span: 45 }, 3: { r0: 16, r1: 61, r: 40, n: 1, span: 0 } };
const ringsOf = look => (look === 'panels' ? RING_P : RING_S);
const RIM = { r0: 177, r1: 200, r: 188.5 }; // the rim band: each quadrant's rule, engraved (thicker, and its words a size up and in plain case: Cory, 2026-10-27, "it feels ignorable")
// the rim's hover/tap target: from just outside ring I's sockets to well past the paper's edge (it wins over any space)
const RIM_HIT = { r0: 178, r1: 216 };
// the board's square: the disc (r 200) and a thin margin for its knurled edge (w2a E9: the old 26-unit margin left dead
// wood around the wheel while the seats were cramped; the rim's leaders now sit inside the band)
const CX = 200, CY = 200, VB0 = -8, VBS = 416;
// quadrant q of n: n quadrants share the wheel (one per player), q0 at the bottom, then clockwise
const sector = n => 360 / (n || 4);
const qCenter = (q, n = 4) => 180 + q * sector(n);
const norm = a => ((a % 360) + 540) % 360 - 180;
function polar(a, r) { const t = (a - 90) * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
function arc(a0, a1, r0, r1) {
  const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r1},${r1} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${big} 0 ${x3},${y3}Z`;
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
  for (let q = 0; q < count; q++) { const d = Math.abs(norm(qCenter(q, count) + rot - 180)); if (d < bd) { bd = d; best = q; } }
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
  const nq = state.quadrants.length, k = sector(nq) / 90; // a ring's spans are drawn for a quarter; k scales them to the sector
  state.quadrants.forEach((qid, q) => {
    const Q = quadrant(qid);
    Q.actions.forEach((a, i) => {
      const t = a.ring, R = rings[t];
      const idx = Q.actions.filter((x, j) => x.ring === t && j < i).length;
      const c = qCenter(q, nq);
      const ang = R.n === 1 ? c : (c + (R.span * k) / 2) - idx * ((R.span * k) / (R.n - 1));
      out.push({ key: `${q}-${i}`, q, i, idx, qid, a, ring: t, ang, half: (45 * k) / R.n, xy: polar(ang, R.r) });
    });
  });
  return out;
}

// ---------- the rim's text: its width from the font itself (a canvas measure, cached), never from the page ----------
const collapse = t => String(t).replace(/\s+/g, ' ');
const rimWidths = new Map();
// a panel's layout for where it sits (panelLayout): pure in its inputs and the widths above, so it's kept until the
// widths are re-measured (perf, 2026-10-15: every placement re-laid all 30-odd panels, ~5s of a 4×-CPU game)
const layCache = new Map();
// Geometry depends on the wedge and text-block height, not the words. Resource gains can change
// a panel's text mid-chain; keep its fit searches reusable across those text-layout cache misses.
const roomCache = new Map();
const ROOM_SHAPES_MAX = 512;
const clearMeasures = () => { rimWidths.clear(); layCache.clear(); };
// the rim's rule and prize and a space's big numbers are in the pixel face (Cory, 2026-10-28: "slightly pixelated,
// still readable", then "number 3": the ring and the space numbers)
export const PIXEL = '"Cults Pixel"';
let rimCtx, rimEarly = false; // rimEarly: something was measured before the web font arrived
// The faces the wheel measures its print in, asked for at once (a face loads only when something first uses it, after
// the wheel had measured with the fallback: wave-4 B #32, panel text reflowed ~1s after setup loaded). Until they're in,
// the wheel's print stays hidden; then it's laid out once, in its own font.
let wheelFontsIn = typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function';
const wheelFonts = wheelFontsIn ? Promise.resolve() : Promise.all([...['500', '700', '800'].map(w => document.fonts.load(`${w} 16px "Alegreya Sans"`).catch(() => null)), document.fonts.load(`800 16px ${PIXEL}`).catch(() => null)])
  .then(() => { wheelFontsIn = true; if (rimEarly || rimWidths.size) { rimEarly = false; clearMeasures(); } });
/** Width of `text` in the rim's face (Alegreya Sans, or the pixel face, at `weight`, letter-spacing `ls` em), per pixel of font size. */
export function rimWidth(text, weight = 700, ls = 0, face = '"Alegreya Sans"') {
  const t = collapse(text);
  const k = `${face}|${weight}|${ls}|${t}`;
  if (rimWidths.has(k)) return rimWidths.get(k);
  let w = null;
  try {
    if (rimCtx === undefined) rimCtx = typeof document !== 'undefined' && !/jsdom/i.test(globalThis.navigator?.userAgent || '') ? document.createElement('canvas').getContext('2d') : null;
    if (rimCtx) {
      rimCtx.font = `${weight} 100px ${face}, system-ui, sans-serif`;
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
// a panel's outline depends only on its numbers, and the panels never move on the paper (the paper turns): drawn once
// each (lag pass 2026-10-21: every render of the wheel recomputed all of them, a few ms each commit at 4x CPU)
const panelPaths = new Map();
function panelPath(a0, a1, r0, r1, gut = PANEL_GUT, rc = PANEL_RC) {
  const k = `${a0}|${a1}|${r0}|${r1}|${gut}|${rc}`;
  let d = panelPaths.get(k);
  if (d === undefined) {
    if (panelPaths.size > 2000) panelPaths.clear();
    d = drawPanelPath(a0, a1, r0, r1, gut, rc);
    panelPaths.set(k, d);
  }
  return d;
}
function drawPanelPath(a0, a1, r0, r1, gut, rc) {
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
// a round and its value ("II\u00a0+3", panelText's schedule) is one token that never splits across a line
const PANEL_TOK = /I{1,3}\u00a0[+−-]?\d+(?:\u00a0·)?|@f|[+−-]?\d+|×\d+|½|[A-Za-z’'?;,.!-]+|\s+|./g;
const isNum = t => /^(?:[+−-]?\d+|×\d+|½)$/.test(t);
const panelToks = text => [...String(text || '').matchAll(PANEL_TOK)].map(m => m[0]);
/** One line of a panel: numbers heavy; a resource word right after a number is its dot ("+3●"), @f the follower
 *  mark; every other word stays a word (Cory, 2026-10-15: no other symbols on a panel). */
export function Said({ text }) {
  const toks = panelToks(text);
  const out = [];
  let prev = null; // the last token that wasn't a space
  toks.forEach((t, k) => {
    if (/\u00a0/.test(t)) { out.push(<span key={k} className="amt">{t}</span>); prev = t; return; }
    if (/^\s+$/.test(t)) {
      const next = toks[k + 1];
      if (!(prev && isNum(prev) && next && (PANEL_RES.has(next) || next === '@f'))) out.push(' ');
      return;
    }
    // a number and its dot (or follower) are one unit, never split across a line (span.amt, lamp.css)
    const mark = t === '@f' ? <Follower key={k} size={12} title="followers" /> : PANEL_RES.has(t) && prev && isNum(prev) ? <Pip key={k} color={t} /> : null;
    if (isNum(t)) out.push(<b key={k} className="n">{t}</b>);
    else if (mark && prev && isNum(prev) && out.length && out[out.length - 1] && out[out.length - 1].type === 'b') out.push(<span key={`a${k}`} className="amt">{out.pop()}{mark}</span>);
    else if (mark) out.push(mark);
    else out.push(t);
    prev = t;
  });
  return <>{out}</>;
}
/** A line's width in ems of its own type (the font measured once per word; a dot or a mark .9em; a space .25em). */
function saidEm(text, weight = 700) {
  let w = 0, prev = null;
  for (const t of panelToks(text)) {
    if (/^\s+$/.test(t)) { w += 0.25; continue; }
    if (t === '@f' || (PANEL_RES.has(t) && prev && isNum(prev))) w += 0.92 - (prev && isNum(prev) ? 0.25 : 0);
    else w += rimWidth(t, isNum(t) ? 800 : weight, 0);
    prev = t;
  }
  return w;
}
// the three lines, in screen pixels: line 1 (a gain's number at least 16; a verb may step down to 14), line 2, line 3
const PANEL_PX = { main: 18, mainMin: 16, verbMin: 12, second: 14, small: 12, note: 12, minion: 21, gap: 2 };
const lineH = px => px + 1;
/**
 * How a panel's lines lay out in the room it has where it sits now. Line 1 (the gain, or the verb) and line 2 always
 * show: line 1 on one line or two, line 2 on up to three lines (four at the small size), each stepping a size down
 * before it wraps further; line 3 only with room (it's in the hover anyway). Returns { one, oneLines, two, twoLines,
 * noteLines, w (board units: the box's width), rc (where it's centred) }. `k`: screen pixels per board unit. `taken`:
 * the minion stands under line 1, in place of the lines below it.
 */
function panelLayout(o) {
  const { s, R, rot, k, said, taken, need = {} } = o;
  // where it sits on screen is all that matters (the panel at 90° looks the same whichever quadrant put it there)
  const at = ((((s.ang + rot) % 360) + 360) % 360).toFixed(3);
  const key = [at, s.half, R.r0, R.r1, R.r, R.n, k, taken ? 1 : 0, JSON.stringify(said), JSON.stringify(need)].join('|');
  const had = layCache.get(key);
  if (had) return had;
  if (layCache.size > 4000) layCache.clear();
  const lay = layPanel(s, R, rot, k, said, taken, need);
  layCache.set(key, lay);
  return lay;
}
function layPanel(s, R, rot, k, said, taken, need) {
  const a0 = s.ang - s.half + rot, a1 = s.ang + s.half + rot;
  // the print may sit a little in from the middle of its band, where an upright box has more room
  const centres = R.n === 1 ? [R.r - 8, R.r - 6, R.r - 4, R.r - 2, R.r, R.r + 2, R.r + 4, R.r + 6] : [R.r - 6, R.r - 4, R.r - 2, R.r, R.r + 2, R.r + 4];
  let rc = R.r;
  // Different wrapping candidates often have the same total height. Solve their geometry once,
  // including its chosen centre: restoring only the width would leave text on another candidate's centre.
  const geometryKey = [((s.ang + rot) % 360 + 360) % 360, s.half, R.r0, R.r1, R.r, R.n, k].join('|');
  let rooms = roomCache.get(geometryKey);
  if (!rooms) {
    rooms = new Map();
    roomCache.set(geometryKey, rooms);
    if (roomCache.size > ROOM_SHAPES_MAX) roomCache.delete(roomCache.keys().next().value);
  }
  const room = hPx => {
    const cached = rooms.get(hPx);
    if (cached) {
      if (cached.w > 0) rc = cached.rc;
      return cached.w;
    }
    let best = 0;
    for (const c of centres) {
      const [cx, cy] = polar(s.ang + rot, c);
      // the hub's print keeps clear of the round's medallion as well as of the panel's edge ("Any member, free" ran
      // into it at 1100px: the hub panels' inner edge is the medallion's own ring)
      const w = 2 * fitHalfWidth(cx, cy, hPx / k, R.n === 1 ? R.r0 + 3 : R.r0, R.r1, a0, a1, 1.2, PANEL_GUT / 2 + 1.2);
      if (w > best + 0.01) { best = w; rc = c; }
    }
    // With no fitting centre the original search leaves rc alone; a cached zero must do the same.
    rooms.set(hPx, { w: best, rc });
    return best;
  };
  const X = PANEL_PX;
  const one = said.main || said.verb, isGain = !!said.main;
  const two = taken ? null : said.second, note = taken ? null : lineText(said.note) || null;
  const words = t => Math.max(...String(t).split(/\s+/).map(x => saidEm(x, 800)));
  const oneClauses = isGain ? clauses(one) : null;
  const oneEm = one ? saidEm(one, 800) : 0, twoEm = two ? saidEm(two, 700) : 0, noteEm = note ? saidEm(note, 500) : 0;
  // how wide a line set on n lines needs to be: a gain breaks between clauses, words wrap between words
  const needOne = (px, n) => (!one ? 0 : n === 1 ? oneEm * px : isGain ? Math.max(...oneClauses.map(c => saidEm(c, 800))) * px : Math.max(words(one), (oneEm / n) * 1.15) * px);
  const needTwo = (px, n) => (!two ? 0 : n === 1 ? twoEm * px : Math.max(words(two) * (700 / 800), (twoEm / n) * 1.15) * px);
  // a verb heads its panel a size under a gain (w3b #59, w3a A51: "Trade for followers" and "Save 4" set huge beside
  // "Ransom a member" and "Sell followers" tiny; the gain is the panel's hero): verbs 16, 14 or 12, gains 18 or 16
  const oneSizes = !one ? [0] : isGain ? [X.main, X.mainMin] : [X.mainMin, 14, X.verbMin];
  const oneLines = !one ? [0] : isGain ? (oneClauses.length > 1 ? [1, 2] : [1]) : [1, 2, 3];
  const tries = [];
  // line 2 never sets larger than line 1 (a verb at 14 over a 14 detail lost its lead)
  for (const op of oneSizes) for (const ol of oneLines) for (const tp of two ? [X.second, X.small].filter(x => x < op || x === X.small) : [0])
    for (const tl of two ? (tp === X.small ? [1, 2, 3, 4] : [1, 2, 3]) : [0]) for (const nl of note && !need.noNote ? [1, 0] : [0]) tries.push({ op, ol, tp, tl, nl });
  // prefer: line 1 bigger and whole, line 2 on at most two lines at its own size, then line 3 shown, then fewer lines
  tries.sort((x, y) => y.op - x.op || (y.tl <= 2) - (x.tl <= 2) || y.tp - x.tp || x.ol - y.ol || (y.nl > 0) - (x.nl > 0) || x.tl - y.tl);
  for (const t of tries) {
    const parts = [t.ol * lineH(t.op), taken ? X.minion : 0, t.tl * lineH(t.tp), t.nl * lineH(X.note)].filter(Boolean);
    const h = parts.reduce((x, y) => x + y, 0) + X.gap * (parts.length - 1);
    const needW = Math.max(needOne(t.op, t.ol), needTwo(t.tp, t.tl), t.nl ? noteEm * X.note : 0, taken ? 24 : 0);
    const w = room(h) * k;
    if (w >= needW + 2) return { one: t.op, oneLines: t.ol, two: t.tp, twoLines: t.tl, noteLines: t.nl, w: w / k, rc };
  }
  // nothing fits: line 1 alone at its smallest (line 2 and 3 are in the hover); a taken panel shows just its minion
  const ol = taken || !one ? 0 : isGain ? Math.min(2, oneClauses.length) : 3;
  // a small wheel (under its 416-unit board, a phone): line 1 sets as large as fits its panel, down to 9px, rather than
  // running word by word into its neighbours (the center ring's verbs overlapped on an iPhone 13); a laptop keeps 12px
  const extra = taken ? X.minion + X.gap : 0;
  let px = isGain ? X.mainMin : X.verbMin;
  while (k < 1 && ol && px > 9 && room(ol * lineH(px) + extra) * k < needOne(px, ol) + 2) px--;
  const w = room(ol * lineH(px) + extra);
  return { one: px, oneLines: ol, two: X.small, twoLines: 0, noteLines: 0, w: Math.max(w, 24 / k), rc: w ? rc : R.r, tight: true };
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
  if (a && a.lastRound && state.round > a.lastRound) return `Closed after round ${roman(a.lastRound)}`;
  return null;
}

/**
 * @param {{ state:any, legal:Map<string,string>, onPick:(id:string)=>void, onDenied?:(info:object, el:Element)=>void,
 *   flash:Set<string>, late?:boolean, facing:number, onFacing:(q:number)=>void, look?:string }} props
 *   (look: 'panels' | 'sockets' | the name of a face in ./faces/, whose contract is at the top of faces/index.js)
 */
function Wheel({ state, interactionState = state, legal, idle = null, pickNotes = null, onPick, onDenied, onTouched, confirmPlace = false, flash, late = false, caption = null, lastMove = null, recentMoves = [], spacePeek = null, onSpacePeek, meId = null, facing, onFacing, hover = null, lampQid = null, look: lookProp = null }) {
  const look = useMemo(() => lookProp || spacesLook(), [lookProp]);
  const panels = look === 'panels';
  // a face from ./faces/ (null for the built-in looks, and for a moment while its chunk loads)
  const custom = !BUILT_IN.includes(look);
  const Face = useFace(custom ? look : null);
  const rings = ringsOf(look);
  const nq = state.quadrants.length;
  const SEC = sector(nq); // one quadrant's angle: 90 at four players, 120 at three, 180 at two
  const [rot, setRot] = useState(() => -SEC * facing);
  const [peek, setPeek] = useState(null); // { key, pinned }
  const [deny, setDeny] = useState(null); // { text, x, y, n }: the note at the pointer after a click on a space you can't take
  // online: the space just picked, lit as chosen while its move crosses to the host and back (until the table moves on),
  // so the click answers at once; locally the move lands in the same frame
  const [sent, setSent] = useState(null);
  // locally, the placement you just made, drawn at once (lag pass 2026-10-21: at 4x CPU your minion stood on the space only
  // once the whole table's update had rendered, 300-500ms after the click): only a placement the table took (onPick
  // answered true), and only against the state it was made on; the table's own state replaces it in its next commit,
  // the same picture
  const [ghost, setGhost] = useState(null); // { key, pid, squat, state }
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
  // On-screen scale of the board, so text is sized in real pixels.
  const stageSize = useRef(null); // [clientWidth, clientHeight], from the ResizeObserver
  const [scale, setScale] = useState(1);
  // measured before the first paint (wave-4 B #32: measured after it, the first frame laid the panels out for a 416px
  // board and they reflowed bigger a frame later); one layout read at mount, then the ResizeObserver
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    // (the stage's inner size is kept too: a spin reads its spaces' places from it, never forcing a layout in the key's frame)
    const measure = () => { const w = el.getBoundingClientRect().width; stageSize.current = [el.clientWidth, el.clientHeight]; if (w) setScale(w / VBS); };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boardPx = scale * VBS;

  // React takes a landed angle as a transition: the board already shows it (paintRot), and the re-lay of every space that
  // follows (~200ms at 4× CPU) can't hold up the next press, key or hover. Until it commits, any other render draws the
  // old angle, which the painted transforms still correct.
  const applyRot = useCallback(r => {
    rotRef.current = r;
    startTransition(() => {
      setRot(r);
      onFacing(facingOf(r, nq));
    });
  }, [nq, onFacing]);
  // ...and only once the board is still: React's re-lay of the landed angle (every space's words fitted to where it now
  // sits, the rim's words turned upright) costs a frame of ~100ms in Firefox at a laptop's size, and committed at each
  // landing it fell between the spins of anyone turning the board round and round, so the next key or drag waited on it
  // (Cory, Oct 28: the spin "megga draggy"). A new spin or drag puts it off again; the painted board is right meanwhile.
  const QUIET_MS = 350;
  const commitT = useRef(0);
  const commitWhenStill = useCallback(r => {
    rotRef.current = r;
    clearTimeout(commitT.current);
    commitT.current = setTimeout(() => {
      if (spin.current || drag.current) return; // the next landing asks again
      applyRot(rotRef.current);
    }, QUIET_MS);
  }, [applyRot]);
  useEffect(() => () => clearTimeout(commitT.current), []);

  // A spin or a drag paints straight onto the board, with no render per frame (a whole-wheel render each frame cost
  // whole frames under load, and the spin read as slow): the paper and the rim turn by their transform, each space
  // slides round by `translate`. React takes the angle once, when it lands, and the layout effect below hands the board
  // back to React's own positions (motion budget: MO.spin, src/v4/motion.js).
  const drawn = useRef(rot); // the angle React last drew
  const painted = useRef(rot); // the angle the board's groups carry now (React's, or a spin frame's)
  const geo = useRef(null); // the stage's size and each space's place, read once per turn (no layout read per frame)
  // Spin and drag share the compositor path. Rewriting SVG group transforms every frame re-rasterized
  // the paper, panel glows and lettering; rotate their already-painted layers until the landing commit.
  const readGeo = root => {
    if (geo.current) return;
    const [w, h] = stageSize.current && stageSize.current[0] ? stageSize.current : [root.clientWidth, root.clientHeight];
    geo.current = [...root.querySelectorAll(':scope > [data-slot]')].map(el => [el, (parseFloat(el.style.left) / 100 - 0.5) * w, (parseFloat(el.style.top) / 100 - 0.5) * h]);
  };
  const paintRot = r => {
    rotRef.current = r;
    const root = stage.current;
    if (!root) return;
    readGeo(root);
    // Read slot geometry above before writing transforms: the first frame must not force a layout.
    const dr = r - painted.current;
    for (const sv of root.querySelectorAll(':scope > .turn-layer')) sv.style.transform = Math.abs(dr) > 0.001 ? `rotate(${dr.toFixed(2)}deg)` : '';
    const d = ((r - drawn.current) * Math.PI) / 180, c = Math.cos(d), s = Math.sin(d);
    for (const [el, x, y] of geo.current) el.style.translate = Number.isFinite(x + y) ? `${(x * c - y * s - x).toFixed(1)}px ${(x * s + y * c - y).toFixed(1)}px` : '';
  };
  useLayoutEffect(() => {
    drawn.current = rot;
    painted.current = rot;
    geo.current = null;
    const root = stage.current;
    if (!root) return;
    root.classList.remove('turning');
    for (const sv of root.querySelectorAll(':scope > .turn-layer')) if (sv.style.transform) sv.style.transform = '';
    for (const g of root.querySelectorAll(':scope > .turn-layer > svg > g[transform]')) g.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`);
    for (const el of root.querySelectorAll(':scope > [data-slot]')) if (el.style.translate) el.style.translate = '';
    // a spin still turning when an earlier landing commits (its re-lay runs as a transition): its frames were drawn from
    // the old angle, so they're drawn again from this one, on the same clock
    if (spin.current) { root.classList.add('turning'); spinAnims(spin.current); }
  }, [rot]);
  // A spin (arrow keys, the settle after a drag, a facing change) runs on the compositor (lag pass 2026-10-21: at 4× CPU a
  // rAF spin got 4 frames in ~800ms while a rival's move rendered): the board's layers turn by a CSS transform and each
  // space slides round by `translate`, as Web Animations sampled from the spin's own easing, so a busy main thread can't
  // stall it. The main thread only starts it and, when it ends, writes the landed angle in (paintRot) and drops them.
  const spin = useRef(null); // { from, to, t0, dur, anims }
  // where a spin is now, by its animations' own clock
  const spinAt = sp => {
    const ct = sp.anims.length && sp.anims[0].currentTime != null ? Number(sp.anims[0].currentTime) : performance.now() - sp.t0;
    return sp.from + (sp.to - sp.from) * spinEase(Math.min(1, Math.max(0, ct / sp.dur)));
  };
  // keyframes even in angle (one per ~9°: a chord strays under a pixel from the circle), each at the moment the easing
  // reaches it, linear between; relative to the angle React drew (drawn) and the layers' base (painted)
  const SPIN_DEG = 9;
  const DRAG_GRAB = 5; // degrees a drag follows the hand before it becomes a spin
  const spinAnims = sp => {
    const root = stage.current;
    for (const a of sp.anims) a.cancel();
    sp.anims = [];
    if (!root) return;
    readGeo(root); // (the spaces' places, read once)
    const { from, to, dur } = sp;
    const n = Math.max(2, Math.min(40, Math.ceil(Math.abs(to - from) / SPIN_DEG)));
    // the moment the easing (motion.js spinEase, rising) reaches fraction f, found by halving
    const when = f => { let lo = 0, hi = 1; for (let j = 0; j < 20; j++) { const m = (lo + hi) / 2; if (spinEase(m) < f) lo = m; else hi = m; } return hi; };
    const ks = Array.from({ length: n + 1 }, (_, i) => [from + ((to - from) * i) / n, i === 0 ? 0 : i === n ? 1 : when(i / n)]);
    const opts = { duration: dur, easing: 'linear', fill: 'forwards' };
    for (const sv of root.querySelectorAll(':scope > .turn-layer')) sp.anims.push(sv.animate(ks.map(([r, offset]) => ({ offset, transform: `rotate(${(r - painted.current).toFixed(2)}deg)` })), opts));
    for (const [el, x, y] of geo.current || []) {
      if (!Number.isFinite(x + y)) continue;
      sp.anims.push(el.animate(ks.map(([r, offset]) => {
        const d = ((r - drawn.current) * Math.PI) / 180, c = Math.cos(d), s = Math.sin(d);
        return { offset, translate: `${(x * c - y * s - x).toFixed(1)}px ${(x * s + y * c - y).toFixed(1)}px` };
      }), opts));
    }
    // started on the spin's own clock, not pending until the compositor picks them up (a frame or two later on a loaded
    // box): the first frame after the key already shows the turn under way
    const tl = document.timeline && document.timeline.currentTime;
    if (sp.start == null) sp.start = tl;
    if (sp.start != null) for (const an of sp.anims) an.startTime = sp.start;
    if (sp.anims.length) sp.anims[0].onfinish = () => sp.land();
  };
  const stop = () => {
    if (anim.current) cancelAnimationFrame(anim.current);
    anim.current = null;
    const sp = spin.current;
    if (!sp) return;
    spin.current = null;
    // a spin cut short (a key, a drag) holds where it was
    const at = spinAt(sp);
    for (const a of sp.anims) a.cancel();
    paintRot(at);
  };
  const animateTo = useCallback(to => {
    stop();
    clearTimeout(commitT.current);
    const from = rotRef.current, dur = reduced() ? 1 : MO.spin;
    geo.current = null;
    const root = stage.current;
    root?.classList.add('turning');
    setPeek(p => (p && !p.pinned ? null : p)); // a hover card doesn't ride along on a turning board
    if (hoverRef.current && hoverRef.current.card && !hoverRef.current.card.pinned) hoverRef.current.close();
    const sp = { from, to, t0: performance.now(), dur, anims: [], start: null };
    sp.land = () => {
      if (spin.current !== sp) return;
      spin.current = null;
      // land on the exact angle (the spin ends at MO.spin); React's commit of it follows and changes nothing on screen
      // (snappy gate s1: waiting on the commit read as a ~500ms spin)
      paintRot(to);
      for (const a of sp.anims) a.cancel();
      // A return to the same React angle has no commit to clean up its promoted layers.
      if (to === drawn.current && stage.current) stage.current.classList.remove('turning'); // (a drag that came back where it started commits nothing)
      commitWhenStill(to);
    };
    spin.current = sp;
    if (!root || dur <= 1 || typeof root.animate !== 'function' || Math.abs(to - from) < 0.01) { sp.land(); return; }
    paintRot(from); // the layers carry the start (a drag ends with a turn on them), and the spaces' places are read
    rotRef.current = to;
    spinAnims(sp);
    if (!sp.anims.length) sp.land();
  }, [commitWhenStill]); // eslint-disable-line react-hooks/exhaustive-deps
  const touched = useRef(onTouched);
  touched.current = onTouched;
  const nudge = useCallback(deg => { if (touched.current) touched.current(); animateTo(Math.round((rotRef.current + deg) / SEC) * SEC); }, [animateTo, SEC]);

  // Parent asked to face a quadrant (a tab, or a rival's move): spin there the short way.
  useEffect(() => {
    if (spin.current || drag.current) return;
    if (facingOf(rotRef.current, nq) !== facing) animateTo(rotRef.current + norm(-SEC * facing - rotRef.current));
  }, [facing, nq, SEC, animateTo]);

  useEffect(() => {
    const onKey = e => {
      const t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable],[role="tablist"],[role="dialog"]')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-SEC); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(SEC); }
      if (e.key === 'Escape') setPeek(null);
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); stop(); };
  }, [nudge, SEC]);

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
  // A ghost whose state has gone is dropped too: Undo hands back that very state object, which revived it (steal.mjs e1:
  // after Escape on Kickback your minion still stood there, unlit, though the engine had taken the placement back)
  useEffect(() => { setPeek(null); setDeny(null); setSent(null); setGhost(g => (g && g.state !== state ? null : g)); }, [state]);
  // a placement the table took but whose state never came (it can't happen locally; belt and braces): gone after 2s.
  // A ghost the new state has replaced is simply ignored (no render to clear it)
  const stateNow = useRef(state);
  stateNow.current = state;
  useEffect(() => {
    if (!ghost) return undefined;
    const t = setTimeout(() => { if (stateNow.current === ghost.state) setGhost(g => (g === ghost ? null : g)); }, 2000);
    return () => clearTimeout(t);
  }, [ghost]);
  const ghostNow = ghost && ghost.state === state ? ghost : null;
  // the board as drawn: the state, with the placement on its way (if any) standing on its space and no longer lit
  const withGhost = slots => (ghostNow && !ghostNow.squat ? { ...slots, [ghostNow.key]: ghostNow.pid } : slots);
  const slotsV = withGhost(state.slots), shadeV = withGhost(interactionState.slots);
  const squatsV = ghostNow && ghostNow.squat ? { ...state.squats, [ghostNow.key]: [...((state.squats && state.squats[ghostNow.key]) || []), ghostNow.pid] } : state.squats;
  const legalV = ghostNow ? new Map([...legal].filter(([k]) => k !== ghostNow.key)) : legal;
  // its landing starts at the press too (the table's commit then keeps the same flash, so it doesn't land twice)
  const flashV = ghostNow ? new Set([ghostNow.key]) : flash;
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
    drag.current = { a: p.a, x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch', start: rotRef.current, home: Math.round(rotRef.current / SEC) * SEC, acc: 0, goal: null, t: performance.now(), v: 0 };
    geo.current = null;
    moved.current = false;
  };
  const onMove = e => {
    const dr = drag.current;
    if (!dr) return;
    // a mouse with no button down isn't dragging: a click whose release never reached the board (the space it took
    // re-rendered under it) left a drag behind, and the next pointer move turned the board by itself
    if (e.pointerType === 'mouse' && !(e.buttons & 1) && !moved.current) { drag.current = null; return; }
    if (!moved.current) {
      const dx = Math.abs(e.clientX - dr.x), dy = Math.abs(e.clientY - dr.y);
      if (Math.max(dx, dy) < 6) return;
      // on touch, a mostly-vertical swipe is a page scroll, not a spin; a sideways swipe turns one notch on release
      if (dr.touch && dy > dx) { drag.current = null; return; }
      moved.current = true;
      // a drag turns the board: no hover card rides along (tester B #42)
      if (hoverRef.current && hoverRef.current.card && !hoverRef.current.card.pinned) hoverRef.current.close();
      if (dr.touch) { dr.swipe = true; dr.lastX = e.clientX; return; }
      try { stage.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      stage.current.classList.add('turning');
    }
    if (dr.swipe) { dr.lastX = e.clientX; return; }
    const a = local(e).a;
    const d = norm(a - dr.a);
    dr.a = a;
    // angular speed (deg/ms), smoothed, so a quick flick can carry the wheel on to the next quadrant
    const now = performance.now(), dt = Math.max(1, now - dr.t);
    dr.v = 0.6 * (d / dt) + 0.4 * dr.v; dr.t = now;
    // The board follows the hand only for its first few degrees; then the turn is handed to the compositor as a spin to
    // the next quarter that way, so it lands in the spin's own time however busy the page is (Cory, 2026-10-25: "I want
    // a super snappy spinning wheel even if other things are going on"; a drag painted from each pointer move froze
    // whenever a rival's move held the main thread). Dragging on another quarter's worth turns on another quarter;
    // dragging back turns back.
    dr.acc += d;
    const n = Math.abs(dr.acc) < DRAG_GRAB ? 0 : Math.sign(dr.acc) * (1 + Math.floor((Math.abs(dr.acc) - DRAG_GRAB) / SEC));
    if (n === 0 && dr.goal == null) { paintRot(rotRef.current + d); return; }
    const goal = dr.home + n * SEC;
    if (goal !== dr.goal) { dr.goal = goal; animateTo(goal); }
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
    if (dr.swipe) { const dx = (e && e.type !== 'pointercancel' && e.clientX != null ? e.clientX : dr.lastX ?? dr.x) - dr.x; if (Math.abs(dx) > 24) nudge(dx > 0 ? -SEC : SEC); setTimeout(() => { moved.current = false; }, 0); return; }
    // a drag past the grab is already spinning to its quarter
    if (dr.goal != null) { if (!spin.current) commitWhenStill(rotRef.current); setTimeout(() => { moved.current = false; }, 0); return; }
    // a fling (fast and recent) steps one quadrant in its direction; a slow drag settles on the nearest
    const home = Math.round(dr.start / SEC) * SEC;
    let target = Math.round(rotRef.current / SEC) * SEC;
    if (Math.abs(dr.v) > 0.18 && performance.now() - dr.t < 120 && target === home) target = home + Math.sign(dr.v) * SEC;
    // a deliberate drag never springs back home (the skeptic, w4 #19: "it won't stay where I put it"): past 12° it turns
    // on to the next quarter its way, where the rims read upright
    else if (target === home && Math.abs(rotRef.current - home) > 12) target = home + Math.sign(rotRef.current - home) * SEC;
    animateTo(target);
    setTimeout(() => { moved.current = false; }, 0);
  };

  const round = Math.max(1, interactionState.round);
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
  // pick a space's option; a placement taken locally stands its minion there in this same frame
  const place = (key, opt) => {
    const ok = onPick(opt);
    if (ok === true && !confirmPlace && /^(slot|squat):/.test(opt) && state.pending && state.pending.player != null) {
      setGhost({ key, pid: state.pending.player, squat: opt.startsWith('squat:'), state });
    }
  };
  const tap = (s, el, pt = null) => {
    if (moved.current) return;
    if (ghostNow) return; // a placement is on its way: the board answers it, not a second click
    const opt = legalV.get(s.key);
    // online, a placement asks to confirm on its card ("Place here": no Undo online). A choice answered on a space (a
    // copy's target, boardPick.js) has no confirm on that card, so it picks at once, as it does locally: pinning it
    // left the click doing nothing, and the online e2e circled the lit spaces forever (2026-10-15)
    const confirmHere = confirmPlace && (!opt || /^(slot|squat|to):/.test(opt));
    const touch = confirmHere || lastPointer.current === 'touch';
    // A copy target is already the answer to a choice. Its read-only touch card has no
    // confirmation button, so choose it on the first tap, just as with a mouse.
    if (opt && (!touch || !/^(slot|squat|to):/.test(opt))) { setPeek(null); setDeny(null); if (confirmPlace) setSent(s.key); place(s.key, opt); return; }
    if (opt && touch) {
      if (peek && peek.key === s.key && peek.pinned) { setPeek(null); if (confirmPlace) setSent(s.key); place(s.key, opt); return; }
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
  // the arc, a long line first tightens its letter-spacing, then steps its size down (the tiebreak keeps
  // its words: one word, "ties: red", read as the red player). The full tiebreak sentence is in the rim's title and hover card.
  const RIM_PX = 15;
  const rimFont = Math.min(20, Math.max(13, RIM_PX / (scale || 1)));
  const arcHalf = 44; // the path the text runs on (wider than any label)
  const RIM_MARK = 1.25; // the follower mark's room after the prize, per unit of font size
  // a leader's emoji on the rim: its 8×8 pixel art at a whole number of screen pixels per art pixel, small and well
  // inside the band (Cory, 2026-10-15: "the emojis on the wheel are too big and out of line": at 24px they filled the
  // 28px band and stuck out past it): two per art pixel on a laptop (16px), one on a phone, never more than 62% of the
  // band's height, centred in it. Its room on the line (units) is taken off the room the words have
  const EMOJI_U = (8 * Math.max(1, Math.min(2, Math.floor((0.62 * (RIM.r1 - RIM.r0) * (scale || 1)) / 8)))) / (scale || 1);
  const EMOJI_ROOM = EMOJI_U + 2;
  // the tiebreak's words on the rim name a count, never a lone color: "ties: red" was read as the red player (blind
  // testers, 2026-10-15), so it's "ties: red members" or "ties: most yellow", never cut to one word
  // the prize comes every round, not once at the game's end (Cory, 2026-10-15: "each round: most gold +4")
  const EACH = 'Each round: ';
  const tieWords = tb => (!tb ? null : / /.test(tb.unit) ? tb.unit : `most ${tb.unit}`);
  const rimLabel = (qid, q, leaders) => {
    const st = stdById[qid];
    const sc = quadrant(qid).scoring;
    // the prize ends the line with the follower mark after it (Cory, 2026-10-15: "+2" alone didn't say followers; he
    // asked for the symbol), then whoever leads: "MOST BLUE · ties: red · +2 👤 🐱"
    const rule = `${EACH}${ruleWords(qid, st ? st.rule : shortLabel(sc.label))}`.toUpperCase();
    const prize = `  ·  +${RING_VALUE[paying - 1]}`;
    const tb = (st && st.tiebreak) || sc.tiebreak || null;
    const top = Math.abs(norm(qCenter(q, nq) + rot)) < 90;
    const rr = top ? RIM.r - 3.6 : RIM.r + 3.6;
    // the arc, less air at each end (clear of the dividers, w2a #52) and the leaders' emojis
    const room = (2 * arcHalf * Math.PI / 180) * rr - 26 - leaders.length * EMOJI_ROOM;
    // the follower mark, and the space before the emojis, per unit of font size
    const tailK = RIM_MARK + (leaders.length ? 0.45 : 0);
    const head = `${rule}${prize}`;
    const base = rimWidth(head, 700, 0), n = collapse(head).length;
    const tieW = t => (t ? rimWidth(`  ·  ties: ${t}`, 600, 0.04) : 0);
    // letter-spacing (em) that makes the line fit at size f, between .03 and .11
    const spacing = (t, f) => Math.max(0.03, Math.min(0.11, (room / f - tailK - tieW(t) - base) / n));
    const width = (t, f, ls) => f * (base + ls * n + tieW(t) + tailK);
    const tie = tieWords(tb);
    const ls = spacing(tie, rimFont);
    const font = Math.max(9, Math.min(rimFont, room / (base + ls * n + tieW(tie) + tailK)));
    return { rule, prize, tie, tieText: tb ? tb.text : null, top, rr, font, ls, textW: font * (base + ls * n + tieW(tie)) };
  };
  // panels: the rim says its rule in words (Cory, 2026-10-15: "a dot is no substitute for the word"), then the prize
  // a size up, the follower mark and whoever leads: "MOST BLUE · +2 👤 🐸", "MOST MEMBERS · ties: red · +2 👤". Each
  // run's width comes from the font (rimWidth), never from the page.
  const RIM_LS = 0.02;
  const rimRuns = (qid, q, leaders) => {
    const st = stdById[qid];
    const sc = quadrant(qid).scoring;
    const tb = (st && st.tiebreak) || sc.tiebreak || null;
    const tie = tieWords(tb);
    const runs = [{ kind: 'text', text: `${EACH}${ruleWords(qid, st ? st.rule : shortLabel(sc.label)).replace(/^Most /, 'most ')}`, tie }, { kind: 'text', text: '·' }, { kind: 'prize', text: `+${RING_VALUE[paying - 1]}` }];
    // widths per unit of font size, and the gaps before each run
    for (const [k, r] of runs.entries()) {
      r.w = r.kind === 'dot' ? 1.1 : r.kind === 'prize' ? 1.3 * rimWidth(r.text, 800, 0, PIXEL) : rimWidth(r.text, 800, 0, PIXEL) + RIM_LS * r.text.length + (r.tie ? rimWidth(`  ·  ties: ${r.tie}`, 600, 0.04) : 0);
      r.gap = !k ? 0 : 0.45;
    }
    const top = Math.abs(norm(qCenter(q, nq) + rot)) < 90;
    const rr = top ? RIM.r - 1.6 : RIM.r + 1.6;
    const room = (2 * arcHalf * Math.PI / 180) * rr - 26 - leaders.length * EMOJI_ROOM;
    const lineK = runs.reduce((a, r) => a + r.gap + r.w, 0);
    const tailK = RIM_MARK + (leaders.length ? 0.45 : 0);
    const font = Math.max(9, Math.min(rimFont, room / (lineK + tailK)));
    let at = 0;
    for (const r of runs) { at += r.gap * font; r.s = at; at += r.w * font; }
    return { runs, tie, tieText: tb ? tb.text : null, top, rr, font, ls: RIM_LS, textW: lineK * font };
  };
  const rimAnchor = qid => stage.current && stage.current.querySelector(`[data-plaque="${qid}"]`);
  // once the web font has loaded, its widths replace the fallback's: one more render, once. Until then the wheel's print
  // stays hidden (wave-4 B #32: about 1s after setup loaded, panel text laid out in the fallback font reflowed bigger):
  // it appears once, laid out in its own font
  const [fontsIn, setFontsIn] = useState(() => (wheelFontsIn ? 1 : 0));
  useEffect(() => {
    let on = true;
    if (!wheelFontsIn) wheelFonts.then(() => { if (on) setFontsIn(1); });
    // a face that still arrives later (another weight) re-measures once, as before
    const f = typeof document !== 'undefined' && document.fonts;
    if (f && f.ready) f.ready.then(() => { if (on && rimEarly) { rimEarly = false; clearMeasures(); setFontsIn(n => n + 1); } }, () => {});
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
    const c = qCenter(q, nq), a0 = c - SEC / 2, a1 = c + SEC / 2;
    const col = `var(--${qid})`;
    if (!panels && !(Face && Face.bands === false)) {
      [1, 2, 3].forEach(t => {
        const R = rings[t], open = t <= round;
        paper.push(<path key={`b${q}${t}`} className={`band${open ? ' open' : ''}${t === paying ? ' pays' : ''}`} d={arc(a0, a1, R.r0, R.r1)} fill={col} fillOpacity={open ? (t === 1 ? 0.26 : 0.2) : 0.05} />);
      });
    }
    // panels: the rim is the quadrant's color, deep, on the dark board (plate 1b), with a fine light line at its foot
    // white and silver read as themselves (w3a A4: both rims were grey): white is a light band with dark letters, silver a
    // steel band; every other color is its own deep tone
    const res = quadrant(qid).resource;
    const deep = res === 'white' ? `color-mix(in srgb, ${col} 86%, #1a120c)` : res === 'silver' ? `color-mix(in srgb, ${col} 72%, #1a120c)` : `color-mix(in srgb, ${col} 72%, #1a120c)`;
    paper.push(<path key={`rim${q}`} className={`rim${lampQid === qid ? ' lit' : lampQid ? ' wait' : ''}`} data-rim-res={res} d={arc(a0, a1, RIM.r0, RIM.r1)} fill={panels ? deep : col} fillOpacity={panels ? 1 : 0.88} />);
    if (panels) paper.push(<path key={`rimfoot${q}`} className="rim-foot" d={arc(a0 + 0.3, a1 - 0.3, RIM.r0, RIM.r0 + 0.8)} fill={`color-mix(in srgb, ${col} 80%, #fff)`} opacity=".35" />);
  });
  // a face's own print in the paper (Face.Cell, optional): one per space, tiling its quadrant's ring, turning with it
  if (Face && Face.Cell) {
    const Cell = Face.Cell;
    for (const s of spaces) {
      const R = rings[s.ring], c = qCenter(s.q, nq), w = SEC / R.n;
      const a1 = c + SEC / 2 - s.idx * w, a0 = a1 - w;
      const owner = shadeV[s.key], fresh = freshOf(s.key);
      const status = faceStatus({ legal: legalV.has(s.key), owner, open: spaceOpen(s.a, round), fresh });
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
      const R = rings[s.ring], open = spaceOpen(s.a, round), owner = shadeV[s.key];
      const lit = legalV.has(s.key);
      // yours to take but worth nothing right now (its hover says so): placeable, without the lamp's glow
      const squat = String(legalV.get(s.key) || '').startsWith('squat:');
      const quiet = lit && !squat && !!(idle && idle.has(s.key));
      const fresh = freshOf(s.key);
      const a0 = s.ang - s.half, a1 = s.ang + s.half;
      const d = panelPath(a0, a1, R.r0, R.r1);
      const cls = ['pcell', open ? 'open' : 'locked', lit ? 'lit' : '', squat ? 'squat' : '', quiet ? 'idle' : '', owner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', (peek && peek.pinned && peek.key === s.key) || sent === s.key ? 'sel' : ''].filter(Boolean).join(' ');
      paper.push(
        <g key={`pc${s.key}`} className={cls} data-cell={s.key} style={{ '--c': `var(--${s.qid})` }}
          onClick={e => { if (Date.now() - touchTapped.current > 500) live.current.tap(s, stage.current && stage.current.querySelector(`[data-slot="${s.key}"]`), { x: e.clientX, y: e.clientY }); }}
          onPointerEnter={e => { const h = live.current.hover; e.currentTarget.classList.add('hot'); if (h && realHover(e)) h.onSpaceHover(s.key, e.currentTarget.querySelector('.wash')); }}
          onPointerLeave={e => { const h = live.current.hover; e.currentTarget.classList.remove('hot'); if (h && e.pointerType === 'mouse') h.onSpaceHover(s.key, null); }}>
          {/* the lamp's glow as three soft strokes, not a blur filter: Firefox draws SVG filters on the CPU, and a lit panel
              is on every space you can take while you turn the board (Cory, Oct 28: the spin "megga draggy") */}
          {lit && !quiet && <g className="glow" aria-hidden="true"><path className="g3" d={d} /><path className="g2" d={d} /><path className="g1" d={d} /></g>}
          {lit && <path className="lift" d={d} aria-hidden="true" />}
          <path className="wash" d={d} />
          <path className="slice-outline" d={d} aria-hidden="true" />
          {lit && <path className="edge-lit" d={d} />}
          {fresh && <path className={`fresh${fresh.newest ? ' newest' : ''}`} d={panelPath(a0, a1, R.r0 + 2.2, R.r1 - 2.2, PANEL_GUT + 4.4, PANEL_RC - 1)} style={{ stroke: playerColor(fresh.pid) }}><title>{`${state.players[fresh.pid].name} took ${fresh.action}`}</title></path>}
        </g>,
      );
    }
  }
  const rimHits = [];
  state.quadrants.forEach((qid, q) => {
    const c = qCenter(q, nq), a0 = c - SEC / 2, a1 = c + SEC / 2;
    // the quadrant's rule, engraved along its rim, upright wherever the wheel is turned, with whoever leads it as
    // their pixel emoji inline at the end of the line, on the same arc and baseline: "MOST BLUE · +2 · 🐱"
    const st = stdById[qid];
    const leaders = st && st.leaders.length ? st.leaders : [];
    const lab = panels ? rimRuns(qid, q, leaders) : rimLabel(qid, q, leaders);
    const rr = lab.rr, F = lab.font, textW = lab.textW;
    const arcLen = (2 * arcHalf * Math.PI / 180) * rr;
    const EM = EMOJI_ROOM; // one emoji's room on the line
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
        <text key={`rt${q}`} className={`rim-rule${lit}`} fontSize={F.toFixed(2)} style={{ letterSpacing: `${lab.ls.toFixed(3)}em` }} data-plaque={qid} data-rim-text={q} data-rim-res={quadrant(qid).resource}>
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
    // the follower mark right after the prize, on the same arc, upright like the letters, centred on the line (the
    // text's dominant-baseline is central, so the line's middle is rr itself)
    {
      const sAt = startS + textW + (F * RIM_MARK) / 2;
      const deg = (sAt / rr) * 180 / Math.PI;
      const a = lab.top ? c - arcHalf + deg : c + arcHalf - deg;
      const [mx, my] = polar(a, rr);
      const cap = F * 0.95;
      paper.push(
        <g key={`rf${q}`} className={`rim-mark${lit}`} data-rim-prize={qid} data-rim-res={quadrant(qid).resource} transform={`translate(${mx.toFixed(2)} ${my.toFixed(2)}) rotate(${(lab.top ? a : a + 180).toFixed(2)}) translate(${(-cap / 2).toFixed(2)} ${(-cap / 2).toFixed(2)})`}>
          <circle className="rim-halo" cx={(cap / 2).toFixed(2)} cy={(cap / 2).toFixed(2)} r={(cap * 0.66).toFixed(2)} fill="url(#ltHalo)" aria-hidden="true" />
          <Follower size={cap} title={`${RING_VALUE[paying - 1]} followers`} />
        </g>,
      );
    }
    // each leader's emoji, along the same arc right after the text, in the middle of the band and upright on the screen
    // (a face, not a letter: tilted with the arc it read as out of line, Cory 2026-10-15), so the wheel's turn is undone
    leaders.forEach((id, k) => {
      const art = emojiArt(seatEmoji(state, id));
      if (!art) return;
      const sAt = startS + textW + F * RIM_MARK + F * 0.45 + k * EM + EM / 2;
      const deg = (sAt / rr) * 180 / Math.PI;
      const a = lab.top ? c - arcHalf + deg : c + arcHalf - deg;
      // centred on the text line (Cory: the followers mark and emoji centred on the text), which runs 3.6 units off the
      // band's middle; at most 62% of the band tall, it stays inside the band (w2a #52: past it, it rose onto the divider)
      // (an upright square's corners reach (cap/2)(|cos|+|sin|) along the radius, so near the diagonals it gives up
      // just enough of the offset to stay inside)
      const cap = EMOJI_U;
      const t = (a + rot - 90) * Math.PI / 180;
      const room = Math.max(0, (RIM.r1 - RIM.r0) / 2 - (cap / 2) * (Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))) - 0.3);
      const [ex, ey] = polar(a, RIM.r + Math.max(-room, Math.min(room, rr - RIM.r)));
      paper.push(
        <g key={`re${q}-${id}`} className={`rim-emoji${lit}`} data-rim-leader={id} shapeRendering="crispEdges" transform={`translate(${ex.toFixed(2)} ${ey.toFixed(2)}) rotate(${(-rot).toFixed(2)}) translate(${(-cap / 2).toFixed(2)} ${(-cap / 2).toFixed(2)}) scale(${(cap / art.size).toFixed(4)})`}>
          <title>{`${state.players[id].name} leads`}</title>
          {art.paths}
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
        aria-label={`Each round: ${ruleWords(qid, shortLabel(label)).replace(/^Most /, 'most ')}, +${RING_VALUE[paying - 1]} followers at this round's end.${tieLine}${leaders.length ? ` ${leaders.map(id => (id === meId ? 'You' : state.players[id].name)).join(' & ')} ${leaders.length > 1 || leaders[0] === meId ? 'lead' : 'leads'}.` : ' No one leads yet.'}${ruleLine} Show the standings.`}
        onPointerEnter={e => { if (hover && realHover(e)) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget); }}
        onPointerLeave={e => { if (hover && e.pointerType === 'mouse') hover.onPlaqueHover(qid, null); }}
        onClick={e => { e.stopPropagation(); if (moved.current) return; if (hover) hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); }}
        onKeyDown={e => { if (hover && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hover.onPlaqueHover(qid, rimAnchor(qid) || e.currentTarget, { pinned: true }); } }}>
      </path>,
    );
  });
  const hubR = panels ? rings[3].r0 - 3 : rings[3].r0;
  if (!panels) for (const r of [RIM.r0, rings[1].r0, rings[2].r0, hubR]) paper.push(<circle key={`c${r}`} cx={CX} cy={CY} r={r} fill="none" className="ring-line" />);
  state.quadrants.forEach((qid, q) => {
    const [x0, y0] = polar(qCenter(q, nq) - SEC / 2, panels ? RIM.r0 : hubR), [x1, y1] = polar(qCenter(q, nq) - SEC / 2, panels ? 202 : 200);
    paper.push(<line key={`seam${q}`} x1={x0} y1={y0} x2={x1} y2={y1} className="seam" />);
  });

  // spaces: one per space, upright wherever the wheel is turned, with its effect printed on it
  // Sockets are memoized: hovering never re-renders the wheel (the hover card lives in UI-B's layer, told directly on
  // pointerenter, no timers here). Handlers reach the latest closures through refs.
  // panels: each one's print laid out for where it sits now. A panel shows its small print (line 3) whenever it has room
  // for it (the plain-words pass, 2026-10-15: all-or-nothing per ring kept "more each round" off the board at 1270×700
  // on Toast, Help Yourself, Cheap Seats and Your Call); every number on the wheel is one size, the smallest any panel
  // needs
  const shopSig = (state.shop || []).join(',');
  // live faces (this turn's gain): the memo turns over when one of their numbers does
  const liveSig = panels ? spaces.filter(s => s.ring <= Math.max(1, round)).map(s => { try { return panelText(s.qid, s.a, round, state, meId).main || ''; } catch { return ''; } }).join(',') : '';
  const panelLays = useMemo(() => {
    if (!panels) return null;
    const k = scale || 1;
    // a taken panel keeps its lines (faded) and its minion stands over them, so taking a space never reflows the wheel
    // a live face (Name Drop: what it pays this turn) reads the state; the memo turns over when the shop does (shopSig)
    const said = s => panelText(s.qid, s.a, round, state, meId);
    const lay = (s, need) => panelLayout({ s, R: rings[s.ring], rot, k, said: said(s), taken: false, need });
    const out = new Map();
    for (const s of spaces) out.set(s.key, { said: said(s), lay: lay(s) });
    // every gain on the wheel is one size, and every verb in a ring: the smallest any of those panels needs
    const sizeTo = all => { const px = Math.min(...all.map(v => v.lay.one)); for (const v of all) v.lay = { ...v.lay, one: px }; };
    sizeTo([...out.values()].filter(v => v.said.main));
    for (const t of [1, 2, 3]) sizeTo(spaces.filter(x => x.ring === t).map(x => out.get(x.key)).filter(v => v.said.verb));
    return out;
  }, [panels, state.quadrants, round, rot, scale, fontsIn, shopSig, liveSig]); // eslint-disable-line react-hooks/exhaustive-deps
  // the panels' layouts for the neighbouring turns, worked out in idle time: a spin's landing then finds them laid out
  // (lag pass 2026-10-21: laying out every panel for an angle not seen yet was ~90ms of the landing's ~120ms render at 4×
  // CPU). The same pure function and cache (panelLayout): nothing on screen changes.
  useEffect(() => {
    if (!panelLays || typeof requestIdleCallback !== 'function') return undefined;
    const k = scale || 1;
    const said = new Map();
    const todo = [];
    for (const d of [SEC, -SEC, 2 * SEC]) for (const s of spaces) todo.push([s, rot + d]);
    let i = 0, h = null;
    const run = deadline => {
      while (i < todo.length && deadline.timeRemaining() > 2) {
        const [s, r] = todo[i++];
        try {
          if (!said.has(s.key)) said.set(s.key, panelText(s.qid, s.a, round, state, meId));
          panelLayout({ s, R: rings[s.ring], rot: r, k, said: said.get(s.key), taken: false });
        } catch { /* only a warm-up */ }
      }
      h = i < todo.length ? requestIdleCallback(run, { timeout: 2000 }) : null;
    };
    h = requestIdleCallback(run, { timeout: 2000 });
    return () => { if (h != null) cancelIdleCallback(h); };
  }, [panelLays]); // eslint-disable-line react-hooks/exhaustive-deps
  live.current = { tap, place, onPick, hover, anchorOf };
  const pinnedKey = peek && peek.pinned ? peek.key : null;
  const recentKey = recentMoves.map(m => `${m.key}:${m.pid}:${m.mine ? 1 : 0}`).join('|');
  const flashKey = [...flashV].join('|');
  const legalKey = [...legalV.entries()].map(([k, v]) => `${k}=${v}`).join('|');
  const ghostKey = ghostNow ? `${ghostNow.key}:${ghostNow.pid}:${ghostNow.squat ? 1 : 0}` : '';
  const idleKey = idle ? [...idle].join('|') : '';
  const built = useRef(new Map()); // key → { sig, el }: each space's last element and what it showed
  const sockets = useMemo(() => spaces.map(s => {
    const { key, q, a, ring: t, qid } = s;
    const [X, Y] = turned(s.xy[0], s.xy[1]);
    const owner = slotsV[key];
    const shadeOwner = shadeV[key];
    const joiners = (squatsV && squatsV[key]) || [];
    const open = t <= round;
    const opt = legalV.get(key);
    const squat = String(opt || '').startsWith('squat:');
    const quiet = !!(opt && !squat && idle && idle.has(key));
    const selected = pinnedKey === key || sent === key;
    const fresh = freshOf(key);
    // panels: the gain, the effect, the clarification, laid out in the room this panel has where it sits now
    const pl = panels ? panelLays.get(key) : null;
    const said = pl && pl.said, lay = pl && pl.lay;
    // everything this space shows, as one string: the same string, the same element (Space skips it)
    const crewIds = owner !== undefined ? [owner, ...joiners] : [];
    const sig = [X.toFixed(2), Y.toFixed(2), owner ?? '', shadeOwner ?? '', joiners.join(','), open ? 1 : 0, opt || '', quiet ? 1 : 0, selected ? 1 : 0, fresh ? `${fresh.pid}:${fresh.newest ? 1 : 0}:${fresh.action}` : '',
      flashV.has(key) ? 1 : 0, lay ? JSON.stringify(lay) : '', said ? `${said.main || said.verb}/${said.second || ''}` : '', (opt && pickNotes && pickNotes.get(key)) || '', crewIds.map(id => `${state.players[id].name}:${seatEmoji(state, id)}`).join(','),
      fresh ? state.players[fresh.pid].name : '', meId ?? '', round, look, custom ? `${Face ? 1 : 0}:${scale}:${rot}` : '', panels ? `${scale}:${fontsIn}` : ''].join('|');
    const had = built.current.get(key);
    if (had && had.sig === sig) return <Space key={key} el={had.el} />;
    const cls = ['slot', `r${t}`, opt ? 'can lit' : '', squat ? 'squat' : '', quiet ? 'idle' : '', flashV.has(key) ? 'flash' : '', selected ? 'sel' : '', open ? 'open' : 'locked', shadeOwner !== undefined ? 'taken' : '', fresh ? 'fresh' : '', fresh && fresh.newest ? 'newest' : '', lay && said.verb ? 'verb' : '', lay && lay.oneLines > 1 ? 'wrap1' : '', lay && lay.twoLines > 1 ? 'wrap' : '', lay && lay.tight ? 'tight' : '', lay && lay.two === PANEL_PX.small ? 'small' : ''].filter(Boolean).join(' ');
    const status = owner !== undefined ? `Taken by ${owner === meId ? 'you' : state.players[owner].name}${joiners.length ? ` and ${joiners.map(id => state.players[id].name).join(', ')}` : ''}${opt && String(opt).startsWith('squat:') ? ' (you can join it)' : ''}` : open ? (opt ? 'Open: you can take it' : 'Open') : `Opens in round ${roman(t)}`;
    const minion = id => (
      <span key={id} className="worker" data-seat={id}>
        <Minion color={playerColor(id)} emoji={seatEmoji(state, id)} size={16} title={`${state.players[id].name}’s minion`} />
      </span>
    );
    const minions = owner !== undefined ? <span className="worker-fig" data-seat={owner}>{[owner, ...joiners].map(minion)}</span> : null;
    let style = { ...at(X, Y), '--c': `var(--${qid})` };
    if (panels) style = { ...style, ...at(...turned(...polar(s.ang, lay.rc))), width: `${((lay.w / VBS) * 100).toFixed(2)}%`, '--one': `${lay.one || PANEL_PX.main}px` };
    // a face from ./faces/: the box is the face's own size (board units), and the face draws everything inside it
    let face = null;
    if (custom) {
      const [bw, bh] = boxOf(Face, t);
      style = { ...style, width: `${((bw / VBS) * 100).toFixed(3)}%`, aspectRatio: `${bw} / ${bh}` };
      if (Face) {
        const crew = owner !== undefined ? [owner, ...joiners].map(id => ({ emoji: seatEmoji(state, id), pid: id, fresh: !!(fresh && fresh.pid === id), color: playerColor(id), name: state.players[id].name })) : [];
        face = (
          <FaceBox Face={Face} q={qid} action={a} ring={t} round={round} name={a.name} effect={pipEffect(qid, a, round)}
            status={faceStatus({ legal: !!opt, owner: shadeOwner, open, fresh })} minions={crew} onPick={opt ? placeFn(live, key, opt) : null}
            px={1 / (scale || 1)} color={`var(--${qid})`} angle={(norm(s.ang + rot) + 360) % 360} flash={flashV.has(key)} selected={selected} />
        );
      }
    }
    const el = (
      <div
        key={key} className={cls} data-slot={key} data-option={opt || undefined} data-pick-note={(opt && pickNotes && pickNotes.get(key)) || undefined} style={style}
        data-panel={lay ? `${lay.oneLines}.${lay.twoLines}.${lay.noteLines}${lay.tight ? ' tight' : ''}` : undefined}
        role="button" tabIndex={opt ? 0 : -1} aria-label={`${a.name}, ${quadrant(qid).name} round ${roman(t)}: ${a.text} ${status}.`}
        {...slotHandlers(live, touchTapped, s, key, opt, panels)}
      >
        <span className="hit" aria-hidden="true" />
        <span className="base" aria-hidden="true" />
        {custom ? face : panels ? (
          // three lines at most, no picture (Cory, 2026-10-15): the gain, the effect in words, a quiet clarification.
          // Taken: the lines fade and the minion stands over them (Cory: "over line 2")
          <span className="face" aria-hidden="true">
            {lay.oneLines > 0 && (
              <span className={`yl main${said.verb ? ' verb' : ''}`} data-yield>
                {said.main && lay.oneLines > 1 ? clauses(said.main).map((c, k) => <span key={k} className="cl"><Said text={c} /></span>) : <Said text={said.main || said.verb} />}
              </span>
            )}
            {lay.twoLines > 0 && <span className="yl second" data-second><Said text={said.second} /></span>}
            {lay.noteLines > 0 && (
              <span className="note" data-note>
                {typeof said.note === 'object'
                  ? <>{said.note.byRound.map((v, k) => <span key={k}>{k ? ' · ' : ''}<b className={k + 1 === round ? 'now' : 'dim'}>{v}</b></span>)} by round</>
                  : <Said text={said.note} />}
              </span>
            )}
            {minions}
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
    built.current.set(key, { sig, el });
    return <Space key={key} el={el} />;
  }), [state, interactionState, rot, legalKey, ghostKey, idleKey, flashKey, recentKey, pinnedKey, sent, round, look, Face, custom || panels ? scale : 0, fontsIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="wheel-wrap" data-spaces={look} data-face={custom ? look : undefined}>
      <div className={`stage${fontsIn ? '' : ' fonts-wait'}`} ref={stage} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ '--wheel-px': `${Math.round(boardPx)}px`, '--px': (1 / (scale || 1)).toFixed(4) }}>
        {/* each drawing turns inside a plain layer of its own: a turn written on the <svg> itself redrew the whole board
            every frame of a drag (and of a spin), where turning a layer around it redraws nothing (2026-10-23) */}
        <div className="turn-layer paper-layer"><svg viewBox={`${VB0} ${VB0} ${VBS} ${VBS}`} role="group" aria-label="Board" className={`wheel-paper${late ? ' late' : ''}`}>
          <defs>
            <radialGradient id="ltPaper" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="var(--paper)" /><stop offset=".8" stopColor="var(--paper-2)" /><stop offset="1" stopColor="var(--paper-3)" /></radialGradient>
            <filter id="ltGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
            {/* the contest rim's follower mark: a pearly sheen and a soft halo, so it reads as followers and not as one
                more cream resource mark on the band (Claude, under Cory's go-with-your-gut, 2026-10-21) */}
            <linearGradient id="ltSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".42" stopColor="#fff4dc" /><stop offset=".55" stopColor="#ffffff" /><stop offset=".72" stopColor="#ffe9bd" /><stop offset="1" stopColor="#e9c88a" /></linearGradient>
            <radialGradient id="ltHalo"><stop offset=".45" stopColor="#fff6e0" stopOpacity=".7" /><stop offset="1" stopColor="#fff6e0" stopOpacity="0" /></radialGradient>
            <pattern id="ltHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="5" stroke="rgba(42,31,23,.2)" strokeWidth="1" /></pattern>
          </defs>
          <circle cx={CX} cy={CY} r="200" fill="url(#ltPaper)" className="disk" />
          {/* a knurled edge, like a dial's: fine ticks just outside the rim that turn with the board, so it reads as
              something you can turn (w2a #42: "nothing says the wheel can spin") */}
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="knurl" aria-hidden="true"><circle cx={CX} cy={CY} r="203" fill="none" /></g>
          <g transform={`rotate(${rot} ${CX} ${CY})`} className="wheel">{paper}</g>
          <circle cx={CX} cy={CY} r="199.5" fill="none" className="edge" />
          <circle cx={CX} cy={CY} r={hubR} className="hub" />
        </svg></div>
        <div className="hub-label" aria-label={`Round ${roman(round)}`}>
          <small>Round</small><b>{state.round ? roman(state.round) : '·'}</b>
          <span className="pips" aria-hidden="true">{[1, 2, 3].map(i => <i key={i} className={i <= state.round ? 'on' : ''} />)}</span>
        </div>
        {sockets}
        <div className="turn-layer rim-turn"><svg viewBox={`${VB0} ${VB0} ${VBS} ${VBS}`} className="rim-layer" role="group" aria-label="Contest standings">
          <g transform={`rotate(${rot} ${CX} ${CY})`}>{rimHits}</g>
        </svg></div>
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
