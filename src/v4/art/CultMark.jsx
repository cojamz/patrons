// The cult mark: a hooded face with two glowing eyes inside a gold medallion ring, 16×16, the back of every member
// card (the deck). Same rules as the other pixel art: palette keys, outline added by the renderer, shown at 1× or 2×
// so pixels stay square. Hood and eyes echo the cult leaders (leaders.js: hood shadow d, eye glow o, gold g y G).
import { memo } from 'react';
import { rectsFor } from './index.js';

const N = 16, C = 7.5;
// hood over the medallion ground (clipped to the inside of the ring): h cloth, H its highlight, d face shadow, o eyes
const HOOD = [
  '................',
  '................',
  '................',
  '................',
  '......HhhH......',
  '.....Hhhhhh.....',
  '.....hddddh.....',
  '....hddddddh....',
  '....hdoddodh....',
  '....hddddddh....',
  '....hhddddhh....',
  '...Hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '....hhhhhhhh....',
  '................',
  '................',
];
const disc = (x, y) => x >= 0 && y >= 0 && x < N && y < N && Math.hypot(x - C, y - C) <= 7.2;
const PX = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => {
  if (!disc(x, y)) return '.';
  if (!disc(x - 1, y) || !disc(x + 1, y) || !disc(x, y - 1) || !disc(x, y + 1)) { // the 1px ring, lit from the top left
    const a = Math.atan2(y - C, x - C);
    return a > -2.6 && a < -0.55 ? 'y' : a > 0.55 && a < 2.6 ? 'G' : 'g';
  }
  return HOOD[y][x] !== '.' ? HOOD[y][x] : 'm';
}).join(''));

export const CULT_MARK = {
  id: '_cultmark', name: 'Cult mark', kind: 'mark', px: PX,
  palette: { g: '#d9a63a', y: '#f6d77e', G: '#8f6516', m: '#20160f', h: '#6f4a66', H: '#93678a', d: '#1a120e', o: '#ffd978' },
};

/** The mark as crisp SVG (size 16 or 32). */
export const CultMark = memo(function CultMark({ size = 32, title = null }) {
  const rects = rectsFor(CULT_MARK, 'mark');
  return (
    <svg className="cult-mark" viewBox={`0 0 ${N} ${N}`} width={size} height={size} shapeRendering="crispEdges"
      role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'}>
      {title ? <title>{title}</title> : null}
      {rects.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
    </svg>
  );
});
export default CultMark;
