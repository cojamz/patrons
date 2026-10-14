// A player's cult leader (32px): a robe in the seat's accent color with the player's emoji on the chest. Until the
// emoji art lands (design/prototypes/pixel-art/emojis.js → src/v4/art/emojis.js), the seat's sigil stands in.
// And a minion (16px), the leader's worker. Size order everywhere: leader 32 > member 24 > minion 16 > follower.
import { memo } from 'react';
import { palette, withOutline } from './index.js';
import { LEADER, LEADER_PANEL, MINION } from './figures.js';
import { emojiArt, minionArt } from './emojis.js';

const runs = (px, pal) => {
  const out = [];
  withOutline(px).forEach((r, y) => {
    let x = 0;
    while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.') out.push({ x, y, w, fill: pal[ch] }); x += w; }
  });
  return out;
};
const cache = new Map();
const cached = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };

/** Sigil shapes (12-unit box), the stand-in emblem until a player's emoji is drawn. */
const SIGILS = {
  circle: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9Z',
  triangle: 'M6 1.5L10.8 10.3H1.2Z',
  square: 'M2 2H10V10H2Z',
  star: 'M6 .8L7.4 4.6L11.2 6L7.4 7.4L6 11.2L4.6 7.4L.8 6L4.6 4.6Z',
};

/**
 * <Leader color emoji sigil size>: color is the seat accent (#hex); emoji an emoji id; sigil the stand-in shape.
 * title names it on hover.
 */
export const Leader = memo(function Leader({ color, emoji = null, sigil = 'circle', size = 32, title = null, dim = false }) {
  const pal = palette(color);
  const body = cached(`L|${color}`, () => runs(LEADER, pal));
  const art = emoji ? emojiArt(emoji) : null;
  const P = LEADER_PANEL;
  return (
    <svg className={`leader${dim ? ' dim' : ''}`} viewBox="0 0 32 32" width={size} height={size} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-emoji={art ? emoji : undefined}>
      {title ? <title>{title}</title> : null}
      {body.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
      <g className="blink"><rect x="13" y="7" width="1" height="1" fill={pal.d} /><rect x="18" y="7" width="1" height="1" fill={pal.d} /></g>
      {art
        ? <g transform={`translate(${P.x + 2} ${P.y + 2})`}><circle cx="4" cy="4" r="4.6" fill="#2e2430" />{art.rects.map((r, k) => <rect key={`e${k}`} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}</g>
        : <path transform={`translate(${P.x} ${P.y})`} d={SIGILS[sigil] || SIGILS.circle} fill={pal[1]} />}
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
