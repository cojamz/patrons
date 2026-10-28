// <Sprite id sphere size>: a 24×24 pixel icon as a crisp SVG image, recolored for a sphere. Shown at 24/48/96px (or any
// multiple of 12) so pixels stay square. id may list candidates ([engine id, kebab name]); an id that isn't drawn
// yet shows the member or action template.
import { memo } from 'react';
import { iconFor, rectsFor } from './index.js';

// id is often a fresh [engine id, kebab name] array each render: compare it by content, so an unchanged figure never
// re-renders (a seat or the shop re-rendering redrew every sprite in it)
const sameId = (a, b) => a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, k) => x === b[k]));
const same = (a, b) => sameId(a.id, b.id) && a.sphere === b.sphere && a.size === b.size && a.kind === b.kind && a.title === b.title && a.className === b.className;

// one <img> per figure (lag pass, Oct 27: "the game gets super laggy towards the end"): an inline SVG cost a dozen
// paths per figure, and a late game's seats, shop and pickers drew a thousand-odd of them, each styled and laid out
// again on every change. The picture is the same SVG, made once per icon and sphere and reused as an image.
const urls = new Map();
function spriteUrl(icon, sphere, rects) {
  const k = `${icon.id}|${sphere}`;
  let u = urls.get(k);
  if (u) return u;
  const by = new Map();
  for (const r of rects) if (r.fill != null) by.set(r.fill, (by.get(r.fill) || '') + `M${r.x} ${r.y}h${r.w}v1h${-r.w}z`);
  const n = icon.px.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${[...by].map(([f, d]) => `<path fill="${f}" d="${d}"/>`).join('')}</svg>`;
  u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  urls.set(k, u);
  return u;
}

export const Sprite = memo(function Sprite({ id, sphere = 'colorless', size = 48, kind = 'member', title = null, className = '' }) {
  const { icon, drawn } = iconFor(id, kind);
  const src = spriteUrl(icon, sphere, rectsFor(icon, sphere));
  // a portrait is 32 pixels: drawn a third bigger than the 24-pixel size asked for, whole pixels at 32/64/96
  if (icon.portrait) size = size <= 40 ? 32 : size <= 72 ? 64 : 96;
  return (
    <img className={`sprite${drawn ? '' : ' template'}${className ? ` ${className}` : ''}`} src={src} width={size} height={size} draggable={false}
      alt={title || ''} title={title || undefined} aria-hidden={title ? undefined : 'true'} data-sprite={drawn ? icon.id : `template:${kind}`} decoding="sync" />
  );
}, same);
export default Sprite;
