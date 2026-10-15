// ============================================================================================================
// THE FACE CONTRACT: how an action space looks on the wheel. Designers: read this, then add ONE file.
// ============================================================================================================
//
// 1. Make `src/v4/game/faces/<name>.jsx` with a default export:
//
//      export default function Face({ q, action, ring, round, status, minions, size, name, effect, onPick, px })
//
//    It's registered by its file name (no edits to this file): `?spaces=<name>` in the game, and
//    `?lab=faces&face=<name>` for the lab (every action in lit / taken / locked, plus the live wheel in round III).
//    Shots: `node scripts/v4-faces.mjs <name> <outDir>` (dev server on port 5350). Files named `kit.jsx`,
//    `index.js` or starting with `_` are not faces. A face file loads as its own chunk, only when asked for:
//    the default game never runs it.
//
// 2. Props (all read-only):
//    q        quadrant (sphere) id, e.g. 'gold', 'echo'. Its ink is the CSS var `var(--<q>)` (also `color`).
//    action   the engine's action def: { key, name, text, ring, ... } (src/engine/v4/content/<sphere>.js)
//    ring     1 | 2 | 3  (outer = round I, middle = II, centre = III)
//    round    the current round, 1–3 (yields that grow by round are already worked out in `effect`)
//    status   'lit'    open and legal for you now (it may already hold minions: a space you can join)
//             'open'   open, but not yours to take right now (not your turn, or not legal)
//             'taken'  someone's minion stands on it
//             'fresh'  taken, and a rival took it since your last turn (the mover is the minion with fresh: true)
//             'locked' its ring isn't open yet ("Opens in round II")
//    minions  [{ emoji, pid, fresh, color, name }] standing on it (owner first, then anyone who joined). Draw them
//             with <FaceMinion> from './kit.jsx' (the pixel minion, the same art as everywhere else).
//    size     { w, h }: the space's box in BOARD UNITS (see 3). Defaults: ring I 60×60, ring II 46×46, ring III
//             50×50 (today's sockets). Override per face with a static: `Face.box = { 1: [w, h], 2: [w, h], 3: [w, h] }`.
//    name     the action's name ('Rush')
//    effect   the yield in its shortest form: pipEffect(q, action, round) from src/v4/shorts.js, e.g. '+6 gold',
//             '@r → 3 gold'. Resource words become pips and @m / @r / @f become the member / rival / follower marks
//             when drawn with <FaceText> from './kit.jsx' (or <Marked> inside your own <FaceHtml>).
//    onPick   the pick for this space when it's legal, else null. Never bind it: the Wheel owns click, tap and keys.
//             It's here so a face can tell "pickable" without reading status.
//    px       board units per screen pixel at the current zoom: `fontSize={12 * px}` is 12px on screen. Every word
//             on the wheel must be at least 12px (gate s7), so size text with px, never in bare board units.
//    also:    color (= 'var(--<q>)'), angle (where the space sits on screen: degrees clockwise from the top, so a
//             face may lean things toward the rim), flash (true for a moment after a minion lands), selected (its
//             card is pinned open on touch).
//
// 3. Units and rendering. The board is the Wheel's SVG: the paper wheel is 400 board units across (radius 200,
//    centre 200,200, viewBox "-26 -26 452 452"). Each space is an upright HTML box positioned by the Wheel, and
//    inside it the Wheel draws an upright <svg viewBox="-w/2 -h/2 w h" overflow="visible">. Your component returns
//    SVG CHILDREN (a <g>, shapes, <text>, nested <svg>) drawn CENTRED ON 0,0, y down, 1 unit = 1 board unit, the
//    same scale as the wheel. Need HTML (wrapping text, pips)? Use <FaceHtml w h> from './kit.jsx' (a
//    foreignObject). Ink may spill outside the box (overflow is visible), but only the box is the click target.
//    Where boxes sit: ring I centres at radius 151 (its band runs 128–180), ring II at 104 (82–128), ring III at 58
//    (36–82), the rim 180–200. At 1270×700 the wheel is about 1.3 screen px per board unit (px ≈ 0.77).
//    The box is a budget, not a fence: neighbouring boxes overlap at their corners (ring I and ring II centres are
//    only 47 units apart along a radius; ring I neighbours across a seam, 63). Ink inside a circle of diameter
//    min(w, h) never collides; anything wider is your call (check it on the lab's live wheels).
//    Gotcha: the game's CSS sizes every <svg> on the stage to width/height 100%. A nested <svg> (a sprite, a mark)
//    needs an inline style={{ width, height }} in board units, as <FaceMinion> does; inside <FaceHtml>, svgs are 1em.
//
// 4. What the face must NOT do (the Wheel keeps all of it, so every face gets it free and the gates stay true):
//    positioning, rotation (the box is always upright, whichever way the wheel is turned), hover cards, clicks,
//    taps, keyboard, aria-label, the shake and the "Taken by …" note. The face <svg> has pointer-events: none.
//    The box (the `.slot` element) keeps its classes: lit, can, open, locked, taken, fresh, newest, flash, sel,
//    r1/r2/r3, and the wrapper carries data-spaces="<name>" and data-face. A face may style with CSS scoped to
//    `[data-spaces="<name>"]` (import './<name>.css' from the face file).
//
// 5. Optional statics on the component:
//    Face.box   = { 1: [w, h], 2: [w, h], 3: [w, h] }  the box per ring, in board units (also the click target)
//    Face.bands = false                                 drop the washed ring bands printed under the spaces
//    Face.Cell  = function Cell({ q, action, ring, round, status, d, inset, a0, a1, r0, r1, ang })
//                 printed INTO the turning paper under the faces, once per space. a0..a1 × r0..r1 is the space's
//                 cell: the cells tile each quadrant's ring (ring I three 30° cells, ring II two 45°, ring III one
//                 90°); ang is where the space's box sits (ring I boxes sit at ±33° from the quadrant's centre, so a
//                 little off their cell's middle). d is the cell's SVG path, inset the same 2.6 units in. Angles in
//                 degrees (0 = top, clockwise), radii from the wheel's centre (200,200), in WHEEL coordinates, not
//                 the box's, unturned (the wheel turns it). For cells, cups, washes, hatching. No text: it turns.
//
// Built-in looks, drawn by the Wheel itself: 'panels' (the default since 2026-10-15: plate 1b's flat wedge panels),
// 'sockets' (the old look, kept until Cory has played the new one) and 'engraved'.
// ============================================================================================================

import { createElement, useEffect, useState } from 'react';

/** The looks the Wheel draws itself. */
export const BUILT_IN = ['sockets', 'engraved', 'panels'];
/** The look a table wears when `?spaces=` names none. */
export const DEFAULT_LOOK = 'panels';

/** The default box per ring, in board units (today's socket sizes). */
export const DEFAULT_BOX = { 1: [60, 60], 2: [46, 46], 3: [50, 50] };

// every face file in this folder, loaded lazily (its own chunk, only when asked for)
const files = import.meta.glob(['./*.jsx', '!./kit.jsx', '!./_*.jsx']);
const loaders = Object.fromEntries(Object.entries(files).map(([path, load]) => [path.replace(/^\.\/|\.jsx$/g, ''), load]));

/** The registry: face name → loader (the built-ins aren't in it). */
export const FACES = loaders;
/** Every name `?spaces=` accepts. */
export const faceNames = () => [...BUILT_IN, ...Object.keys(loaders).sort()];
export const isFace = name => !!name && Object.prototype.hasOwnProperty.call(loaders, name);

/** Which look the spaces wear: `?spaces=<name>` when it names a built-in or a face file, else the default (panels). */
export function lookFromUrl() {
  try {
    const v = new URLSearchParams(globalThis.location?.search || '').get('spaces');
    return v && (BUILT_IN.includes(v) || isFace(v)) ? v : DEFAULT_LOOK;
  } catch { return DEFAULT_LOOK; }
}

const loaded = new Map();
/** The face component for `name` (null for a built-in, and while it loads). */
export function useFace(name) {
  const [, setN] = useState(0);
  const has = isFace(name);
  useEffect(() => {
    if (!has || loaded.has(name)) return undefined;
    let on = true;
    loaders[name]().then(m => { loaded.set(name, m.default); if (on) setN(n => n + 1); }, err => { console.error(`face ${name} failed to load`, err); }); // eslint-disable-line no-console
    return () => { on = false; };
  }, [name, has]);
  return has ? loaded.get(name) || null : null;
}

/** A face's box for a ring: [w, h] in board units. */
export const boxOf = (Face, ring) => (Face && Face.box && Face.box[ring]) || DEFAULT_BOX[ring];

/** The status word a face gets. */
export function faceStatus({ legal, owner, open, fresh }) {
  if (legal) return 'lit';
  if (owner !== undefined && owner !== null) return fresh ? 'fresh' : 'taken';
  return open ? 'open' : 'locked';
}

/** The upright <svg> a face draws in: the box w×h board units, centred on 0,0. (Used by the Wheel and the lab.) */
export function FaceBox({ Face, ring, ...props }) {
  const [w, h] = boxOf(Face, ring);
  return createElement('svg', { className: 'face-svg', viewBox: `${-w / 2} ${-h / 2} ${w} ${h}`, overflow: 'visible', 'aria-hidden': 'true' },
    createElement(Face, { ...props, ring, size: { w, h } }));
}
