// The follower mark (Cory, 2026-10-14: followers aren't a star). A tiny pixel person: a round head over shoulders,
// in the text's own color with an ink outline, so it reads on paper and on wood. It is never a member (those are
// hooded 24px figures in a sphere's color) and never a resource (those are colored shapes).
// <Follower /> is the mark alone; <Follower n={3} /> is "3" and the mark, labeled "3 followers" for screen readers
// and on hover. Shared by the game and the intro.
import { memo } from 'react';
import SETS from './icons/index.js';
import { withOutline } from './index.js';

// 9×9, from the vision frames' person mark: k = outline, b = body (currentColor)
const PX = [
  '...kkk...',
  '..kbbbk..',
  '..kbbbk..',
  '...kkk...',
  '..kkkkk..',
  '.kbbbbbk.',
  'kbbbbbbbk',
  'kbbbbbbbk',
  'kkkkkkkkk',
];
// the drawn mark (leaders.js FOLLOWER, 10×10 cream with its ink outline) when imported; else the 9×9 above
const DRAWN = SETS.find(i => i.kind === 'follower') || null;
const GRID = DRAWN ? withOutline(DRAWN.px) : PX;
const RUNS = (() => {
  const out = [];
  GRID.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (ch !== '.') out.push({ x, y, w, ch });
      x += w;
    }
  });
  return out;
})();
const FILL = ch => (DRAWN ? DRAWN.base[ch] || 'currentColor' : ch === 'k' ? 'var(--follower-ink, rgba(20,14,10,.85))' : 'currentColor');
const VB = GRID.length;

/** The follower mark; with n, the count before it. size: the mark's height in px (9, 18 keep pixels square). */
export const Follower = memo(function Follower({ n = null, size = 10, className = '', title = null }) {
  const label = title || (n == null ? 'followers' : `${n} follower${n === 1 ? '' : 's'}`);
  const mark = (
    <svg className="follower-mark" viewBox={`0 0 ${VB} ${VB}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={label}>
      <title>{label}</title>
      {RUNS.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={FILL(r.ch)} />)}
    </svg>
  );
  if (n == null) return mark;
  return <span className={`follower${className ? ` ${className}` : ''}`} title={label}><span className="num">{n}</span>{mark}</span>;
});
export default Follower;
