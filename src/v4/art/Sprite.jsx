// <Sprite id sphere size>: a 24×24 pixel icon (or a 32×32 portrait) as a crisp SVG image, recolored for a sphere. Shown at 24/48/96px (or any
// multiple of 12) so pixels stay square. id may list candidates ([engine id, kebab name]); an id that isn't drawn
// yet shows the member or action template.
import { memo } from 'react';
import { iconFor, rectsFor } from './index.js';

// id is often a fresh [engine id, kebab name] array each render: compare it by content, so an unchanged figure never
// re-renders (a seat or the shop re-rendering redrew every sprite in it)
const sameId = (a, b) => a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, k) => x === b[k]));
const same = (a, b) => sameId(a.id, b.id) && a.sphere === b.sphere && a.size === b.size && a.kind === b.kind && a.title === b.title && a.className === b.className && a.look === b.look;

// one <img> per figure (lag pass, Oct 27: "the game gets super laggy towards the end"): an inline SVG cost a dozen
// paths per figure, and a late game's seats, shop and pickers drew a thousand-odd of them, each styled and laid out
// again on every change. The picture is the same SVG, made once per icon and sphere and reused as an image.
const urls = new Map();
// look: a seat figure's light drawn into its picture, so a figure that bobs never redraws a CSS filter chain on every step
// of its idle loop (Firefox draws filters on the CPU; smoothness panel, Oct 28). The picture grows by its margin on each
// side (HALO, in pixels of the 24) and the img sits that far out, so the figure itself stays where it was.
//   loaded: a 1px warm outline (was four chained drop-shadows) · ready: a touch brighter with a soft shadow below
export const HALO = { loaded: 1, ready: 3 };
function spriteUrl(icon, sphere, rects, look) {
  const k = `${icon.id}|${sphere}|${look || ''}`;
  let u = urls.get(k);
  if (u) return u;
  const by = new Map();
  let all = '';
  for (const r of rects) if (r.fill != null) { const d = `M${r.x} ${r.y}h${r.w}v1h${-r.w}z`; by.set(r.fill, (by.get(r.fill) || '') + d); all += d; }
  const paths = [...by].map(([f, d]) => `<path fill="${f}" d="${d}"/>`).join('');
  const n = icon.px.length, m = HALO[look] || 0, box = `${-m} ${-m} ${n + 2 * m} ${n + 2 * m}`;
  const body = look === 'loaded'
    ? `<g fill="rgb(255,243,212)" opacity=".38">${[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="${all}"/>`).join('')}</g>${paths}`
    : look === 'ready'
      ? `<filter id="r" x="-20%" y="-20%" width="140%" height="150%"><feComponentTransfer><feFuncR type="linear" slope="1.08"/><feFuncG type="linear" slope="1.08"/><feFuncB type="linear" slope="1.08"/></feComponentTransfer><feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000" flood-opacity=".45"/></filter><g filter="url(#r)">${paths}</g>`
      : paths;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" shape-rendering="crispEdges">${body}</svg>`;
  u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  urls.set(k, u);
  return u;
}

export const Sprite = memo(function Sprite({ id, sphere = 'colorless', size = 48, kind = 'member', title = null, className = '', look = null }) {
  const { icon, drawn } = iconFor(id, kind);
  const src = spriteUrl(icon, sphere, rectsFor(icon, sphere), look);
  // a portrait is 32 pixels: drawn a third bigger than the 24-pixel size asked for, whole pixels at 32/64/96
  // a scene is 64 pixels: whole pixels only at 32/64/128
  if (icon.scene) size = size <= 40 ? 32 : size <= 72 ? 64 : 128;
  else if (icon.portrait) size = size <= 40 ? 32 : size <= 72 ? 64 : 96;
  const m = HALO[look] ? (HALO[look] * size) / icon.px.length : 0;
  return (
    <img className={`sprite${drawn ? '' : ' template'}${m ? ` halo-${look}` : ''}${className ? ` ${className}` : ''}`} src={src} width={size + 2 * m} height={size + 2 * m} draggable={false}
      style={m ? { margin: `${-m}px` } : undefined}
      alt={title || ''} title={title || undefined} aria-hidden={title ? undefined : 'true'} data-sprite={drawn ? icon.id : `template:${kind}`} decoding="sync" />
  );
}, same);
export default Sprite;
