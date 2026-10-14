// A player's cult leader (32px): the robed, hooded figure from leaders.js in the seat's accent color, a gold
// medallion on the chest carrying the player's emoji emblem (8×8, drawn 1:1 at x 12–19, y 19–26; never a shrunk
// minion). And a minion (16px): the player's emoji itself. Size order: leader 32 > member 24 > minion 16 > follower 10.
// Until the drawings are imported (scripts/v4-art-import.mjs), figures.js templates and the seat's sigil stand in.
import { memo } from 'react';
import SETS from './icons/index.js';
import { palette, withOutline } from './index.js';
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
// the drawing's own palette rule (leaders.js accentPalette): shade toward the walnut, highlight toward cream
const accentPal = color => ({ ...DRAWN.base, 1: mix(color, '#1d1611', 0.45), 2: color, 3: mix(color, '#f6eedb', 0.38) });
const cache = new Map();
const cached = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };

/** Sigil shapes (12-unit box): the stand-in emblem while there's no drawn emoji. */
const SIGILS = {
  circle: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9Z',
  triangle: 'M6 1.5L10.8 10.3H1.2Z',
  square: 'M2 2H10V10H2Z',
  star: 'M6 .8L7.4 4.6L11.2 6L7.4 7.4L6 11.2L4.6 7.4L.8 6L4.6 4.6Z',
};

/** <Leader color emoji sigil size>: color is the seat accent (#hex); emoji an emoji id; sigil the stand-in shape. */
export const Leader = memo(function Leader({ color, emoji = null, sigil = 'circle', size = 32, title = null, dim = false }) {
  const art = emoji ? emojiArt(emoji) : null;
  const body = DRAWN ? cached(`D|${color}`, () => runs(DRAWN.px, accentPal(color))) : cached(`L|${color}`, () => runs(LEADER, palette(color)));
  const E = DRAWN ? DRAWN.emblem : { x: LEADER_PANEL.x + 2, y: LEADER_PANEL.y + 2 };
  // eyes: the drawing's glow (row 8, x 13–14 and 17–18) or the template's glints (row 7, x 13 and 18)
  const eyes = DRAWN ? [[13, 8, 2], [17, 8, 2]] : [[13, 7, 1], [18, 7, 1]];
  const lid = DRAWN ? DRAWN.base.d : palette(color).d;
  return (
    <svg className={`leader${dim ? ' dim' : ''}`} viewBox="0 0 32 32" width={size} height={size} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-emoji={art ? emoji : undefined}>
      {title ? <title>{title}</title> : null}
      {body.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
      <g className="blink">{eyes.map(([x, y, w]) => <rect key={x} x={x} y={y} width={w} height="1" fill={lid} />)}</g>
      {art
        ? <g transform={`translate(${E.x} ${E.y})`}>{!DRAWN && <rect x="0" y="0" width="8" height="8" fill="#20160f" />}{art.rects.map((r, k) => <rect key={`e${k}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}</g>
        : <path transform={`translate(${E.x - 2} ${E.y - 2})`} d={SIGILS[sigil] || SIGILS.circle} fill={DRAWN ? DRAWN.base.y : palette(color)[1]} />}
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
      {body.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
    </svg>
  );
});
