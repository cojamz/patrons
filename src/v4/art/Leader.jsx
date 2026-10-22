// A player's cult leader (32px): the robed, hooded figure from leaders.js, a gold medallion on the chest carrying the
// player's emoji emblem (8×8, drawn 1:1 at x 12–19, y 19–26; never a shrunk minion). Every leader wears the same robe
// (Cory, 2026-10-14: "brown or gray; the emojis are what set them apart"), so the seat color never reaches it. And a
// minion (16px): the player's emoji itself. Size order: leader 32 > member 24 > minion 16 > follower 10.
// Until the drawings are imported (scripts/v4-art-import.mjs), figures.js templates and the seat's sigil stand in.
import { memo } from 'react';
import SETS from './icons/index.js';
import { palette, withOutline, pixelPaths } from './index.js';
import { LEADER, LEADER_PANEL, MINION } from './figures.js';
import { emojiArt, minionArt } from './emojis.js';

const DRAWN = SETS.find(i => i.kind === 'leader') || null;
const runs = (px, pal) => {
  const out = [];
  withOutline(px).forEach((r, y) => {
    let x = 0;
    while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.' && pal[ch]) out.push({ x, y, w, fill: pal[ch] }); x += w; }
  });
  return out;
};
const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
/** The one robe every leader wears: a warm gray that stays clear of the walnut table at 32px. */
export const ROBE = '#857c72';
// the drawing's own palette rule (leaders.js accentPalette): shade toward the walnut, highlight toward cream; h/H: hands
const ROBE_PAL = { ...(DRAWN ? DRAWN.base : {}), 1: mix(ROBE, '#1d1611', 0.45), 2: ROBE, 3: mix(ROBE, '#f6eedb', 0.38), h: '#dcc49a', H: '#9c8058' };
const cache = new Map();
const cached = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };

// ---------- poses: a few frames of pixel animation over the drawing (the intro's scheming laugh, a beckon) ----------
// Each is an overlay on leaders.js's 32×32 grid: rows of keys placed at a column, ' ' keeps the drawing's pixel.
const at = (x, s) => ' '.repeat(x) + s;
const over = (px, rows) => px.map((r, y) => { const o = rows[y]; return o ? [...r].map((ch, x) => (o[x] && o[x] !== ' ' ? o[x] : ch)).join('') : r; });
// the forearms come up from the elbows to the chest (left side; the right side mirrors it, shading swapped)
const ARMS = { 15: at(11, 'g'), 16: at(9, '3221'), 17: at(8, '32221'), 18: at(7, '32221'), 19: at(7, '3221') };
const mirror = rows => Object.fromEntries(Object.entries(rows).map(([y, s]) => {
  const a = s.padEnd(32, ' ').split('');
  for (let x = 0; x < 16; x++) if (a[x] !== ' ' && a[31 - x] === ' ') a[31 - x] = { 3: '1', 1: '3' }[a[x]] || a[x];
  return [y, a.join('')];
}));
const BOTH_ARMS = mirror(ARMS);
const HANDS = {
  steeple: { 12: at(15, 'hh'), 13: at(14, 'hhhh'), 14: at(12, 'ghhHHhhg'), 15: at(12, 'ghhHHhhg') }, // fingertips together
  rubA: { 13: at(13, 'hhh'), 14: at(12, 'ghhhHhhg'), 15: at(12, 'g hhHhhg') }, // rubbing: one hand up…
  rubB: { 13: at(16, 'hhh'), 14: at(12, 'ghhHhhhg'), 15: at(12, 'ghhHhh g') }, // …then the other
};
// the viewer's-right arm raised beside the hood, the hand open, then curled (come here)
const BECKON = {
  beckonA: { 9: at(28, 'hh'), 10: at(27, 'hhhh'), 11: at(27, 'Hhhh'), 12: at(27, 'gggg'), 13: at(27, '3221'), 14: at(26, '32221'), 15: at(26, '2221') },
  beckonB: { 10: at(27, ' Hhh'), 11: at(27, 'hhhh'), 12: at(27, 'gggg'), 13: at(27, '3221'), 14: at(26, '32221'), 15: at(26, '2221') },
};
const FACES = {
  scheme: { 7: at(13, 'o    o'), 10: at(15, 'ooo') }, // brows down over the eyes, a sly grin
  laugh: { 7: at(12, 'doddddod'), 8: at(12, 'ododdodo'), 10: at(12, 'doddddod'), 11: at(14, 'oooo') }, // eyes squeezed shut, mouth open
};
const shiftDown = px => px.map((r, y) => (y >= 1 && y <= 16 ? px[y - 1] : r)); // head and shoulders drop a pixel
/** Pose names → [hands, face, shoulders down]. idle is the drawing itself. */
const POSES = {
  steeple: ['steeple'], scheme: ['steeple', 'scheme'], rubA: ['rubA', 'scheme'], rubB: ['rubB', 'scheme'],
  laughA: ['rubA', 'laugh'], laughB: ['rubB', 'laugh', true], beckonA: ['beckonA', 'scheme'], beckonB: ['beckonB', 'scheme'],
};
export const LEADER_POSES = Object.keys(POSES);
function posed(pose) {
  const [hands, face, down] = POSES[pose];
  let px = DRAWN.px;
  if (HANDS[hands]) px = over(over(px, BOTH_ARMS), HANDS[hands]);
  if (BECKON[hands]) px = over(px, BECKON[hands]);
  if (face) px = over(px, FACES[face]);
  return down ? shiftDown(px) : px;
}

/** Sigil shapes (12-unit box): the stand-in emblem while there's no drawn emoji. */
const SIGILS = {
  circle: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9Z',
  triangle: 'M6 1.5L10.8 10.3H1.2Z',
  square: 'M2 2H10V10H2Z',
  star: 'M6 .8L7.4 4.6L11.2 6L7.4 7.4L6 11.2L4.6 7.4L.8 6L4.6 4.6Z',
  diamond: 'M6 1L11 6L6 11L1 6Z',
  cross: 'M4.5 1.5H7.5V4.5H10.5V7.5H7.5V10.5H4.5V7.5H1.5V4.5H4.5Z',
};

/** tall: a player named Max (Cory's easter egg): the robe drawn 20% taller, the emblem kept square. */
const TALL = 1.2;
/**
 * <Leader emoji sigil size pose>: emoji an emoji id; sigil the stand-in shape. color (the seat accent) is accepted
 * but no longer paints anything: every robe is ROBE. pose: one of LEADER_POSES (a frame of pixel animation), else idle.
 */
export const Leader = memo(function Leader({ emoji = null, sigil = 'circle', size = 32, title = null, dim = false, pose = null, tall = false }) {
  const art = emoji ? emojiArt(emoji) : null;
  const p = DRAWN && POSES[pose] ? pose : null;
  const body = DRAWN ? cached(`D|${p || ''}`, () => runs(p ? posed(p) : DRAWN.px, ROBE_PAL)) : cached('L', () => runs(LEADER, palette(ROBE)));
  const E = DRAWN ? DRAWN.emblem : { x: LEADER_PANEL.x + 2, y: LEADER_PANEL.y + 2 };
  // eyes: the drawing's glow (row 8, x 13–14 and 17–18) or the template's glints (row 7, x 13 and 18); a pose has its own
  const eyes = p ? [] : DRAWN ? [[13, 8, 2], [17, 8, 2]] : [[13, 7, 1], [18, 7, 1]];
  const lid = DRAWN ? DRAWN.base.d : palette(ROBE).d;
  return (
    <svg className={`leader${dim ? ' dim' : ''}`} viewBox="0 0 32 32" width={size} height={tall ? Math.round(size * TALL) : size} preserveAspectRatio={tall ? 'none' : undefined} style={tall ? { marginTop: size - Math.round(size * TALL) } : undefined} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-emoji={art ? emoji : undefined} data-pose={p || undefined}>
      {title ? <title>{title}</title> : null}
      {pixelPaths(body)}
      {eyes.length > 0 && <g className="blink">{eyes.map(([x, y, w]) => <rect key={x} x={x} y={y} width={w} height="1" fill={lid} />)}</g>}
      {art
        ? <g transform={`translate(${E.x} ${E.y})${tall ? ` translate(0 4) scale(1 ${1 / TALL}) translate(0 -4)` : ''}`}>{!DRAWN && <rect x="0" y="0" width="8" height="8" fill="#20160f" />}{pixelPaths(art.rects)}</g>
        : <path transform={`translate(${E.x - 2} ${E.y - 2})${tall ? ` translate(0 6) scale(1 ${1 / TALL}) translate(0 -6)` : ''}`} d={SIGILS[sigil] || SIGILS.circle} fill={DRAWN ? DRAWN.base.y : palette(ROBE)[1]} />}
    </svg>
  );
});

/** <Minion color emoji size>: one of the player's minions: their emoji (16px), or a small hooded worker in the seat's color. */
export const Minion = memo(function Minion({ color, emoji = null, size = 16, title = null, dim = false }) {
  const art = emoji ? minionArt(emoji) : null;
  const body = art ? art.rects : cached(`M|${color}`, () => runs(MINION, palette(color)));
  return (
    <svg className={`minion${dim ? ' dim' : ''}`} viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-emoji={art ? emoji : undefined}>
      {title ? <title>{title}</title> : null}
      {pixelPaths(body)}
    </svg>
  );
});
