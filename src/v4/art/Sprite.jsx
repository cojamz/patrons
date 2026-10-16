// <Sprite id sphere size>: a 24×24 pixel icon as crisp SVG, recolored for a sphere. Shown at 24/48/96px (or any
// multiple of 12) so pixels stay square. id may list candidates ([engine id, kebab name]); an id that isn't drawn
// yet shows the member or action template.
import { memo } from 'react';
import { iconFor, rectsFor, pixelPaths } from './index.js';

// id is often a fresh [engine id, kebab name] array each render: compare it by content, so an unchanged figure never
// re-renders (a seat or the shop re-rendering redrew every sprite in it)
const sameId = (a, b) => a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, k) => x === b[k]));
const same = (a, b) => sameId(a.id, b.id) && a.sphere === b.sphere && a.size === b.size && a.kind === b.kind && a.title === b.title && a.className === b.className;

export const Sprite = memo(function Sprite({ id, sphere = 'colorless', size = 48, kind = 'member', title = null, className = '' }) {
  const { icon, drawn } = iconFor(id, kind);
  const rects = rectsFor(icon, sphere);
  return (
    <svg className={`sprite${drawn ? '' : ' template'}${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" width={size} height={size}
      shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : 'true'} data-sprite={drawn ? icon.id : `template:${kind}`}>
      {title ? <title>{title}</title> : null}
      {pixelPaths(rects)}
    </svg>
  );
}, same);
export default Sprite;
