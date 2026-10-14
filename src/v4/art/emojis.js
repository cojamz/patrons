// Player emojis (Cory, 2026-10-14): each player picks one; it's drawn on their leader's robe. The drawings land in
// design/prototypes/pixel-art/emojis.js; scripts/v4-art-import.mjs copies them to ./icons/emojis.js. Until then
// there are none, and Leader shows the seat's sigil.
import SETS from './icons/index.js';
import { withOutline, NEUTRALS } from './index.js';

const EMOJIS = SETS.filter(i => i.kind === 'emoji');
/** The emoji ids drawn so far, in the order a picker should offer them. */
export const emojiIds = () => EMOJIS.map(e => e.id);
const cache = new Map();
/** { size, rects } for an emoji id, or null when it isn't drawn. Emojis carry their own colors (px keys → pal). */
export function emojiArt(id) {
  if (cache.has(id)) return cache.get(id);
  const e = EMOJIS.find(x => x.id === id);
  let out = null;
  if (e) {
    const pal = { ...NEUTRALS, ...(e.palette || {}) };
    const rects = [];
    withOutline(e.px).forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.' && pal[ch]) rects.push({ x, y, w, fill: pal[ch] }); x += w; } });
    out = { size: e.px.length, rects };
  }
  cache.set(id, out);
  return out;
}
