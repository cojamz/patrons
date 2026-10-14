// <Sprite id sphere size>: a 24×24 pixel icon as crisp SVG, recolored for a sphere. Shown at 24/48/96px (or any
// multiple of 12) so pixels stay square. id may list candidates ([engine id, kebab name]); an id that isn't drawn
// yet shows the member or action template.
import { memo } from 'react';
import { iconFor, rectsFor } from './index.js';

export const Sprite = memo(function Sprite({ id, sphere = 'colorless', size = 48, kind = 'member', title = null, className = '' }) {
  const { icon, drawn } = iconFor(id, kind);
  const rects = rectsFor(icon, sphere);
  return (
    <svg className={`sprite${drawn ? '' : ' template'}${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" width={size} height={size}
      shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-sprite={drawn ? icon.id : `template:${kind}`}>
      {title ? <title>{title}</title> : null}
      {rects.map((r, k) => <rect key={k} x={r.x} y={r.y} width={r.w} height="1" fill={r.fill} />)}
    </svg>
  );
});
export default Sprite;
