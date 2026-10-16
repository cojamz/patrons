// Player emojis (Cory, 2026-10-14): each player picks one. Their minions ARE that emoji (16×16), and their leader
// wears it as an 8×8 emblem. Drawings: design/prototypes/pixel-art/emojis.js → scripts/v4-art-import.mjs →
// ./icons/emojis.js. An emoji not drawn yet falls back to the hooded minion and the seat's sigil.
import SETS from './icons/index.js';
import { withOutline, NEUTRALS, pixelPaths } from './index.js';

const EMOJIS = SETS.filter(i => i.kind === 'emoji');
/** The emoji ids drawn so far, in the order a picker should offer them. */
export const emojiIds = () => EMOJIS.map(e => e.id);
/** { id, name, emoji } for an id, or null. */
export const emojiInfo = id => { const e = EMOJIS.find(x => x.id === id); return e ? { id: e.id, name: e.name, emoji: e.emoji } : null; };
// A seat that hasn't picked one wears a default, so seats are always told apart by shape.
const DEFAULTS = ['cat', 'robot', 'frog', 'ghost'];
export const defaultEmoji = seat => { const ids = emojiIds(); const d = DEFAULTS[seat % DEFAULTS.length]; return ids.includes(d) ? d : ids[seat % Math.max(1, ids.length)] || null; };

const runs = (px, pal, outline) => {
  const out = [];
  (outline ? withOutline(px) : px).forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.' && ch !== ' ' && pal[ch]) out.push({ x, y, w, fill: pal[ch] }); x += w; } });
  return out;
};
const cache = new Map();
const art = (id, which) => {
  const k = `${id}|${which}`;
  if (cache.has(k)) return cache.get(k);
  const e = EMOJIS.find(x => x.id === id);
  const grid = e && (which === 'em' ? e.em : e.px);
  const rects = grid && runs(grid, { ...NEUTRALS, ...e.palette }, which !== 'em');
  // paths: the runs as cached <path> elements, one per colour (pixelPaths): what every drawing of it renders
  const out = grid ? { size: grid.length, rects, paths: pixelPaths(rects) } : null;
  cache.set(k, out);
  return out;
};
/** The 8×8 emblem for a leader's medallion: { size, rects, paths } or null. */
export const emojiArt = id => (id ? art(id, 'em') : null);
/** The 16×16 minion: { size, rects, paths } or null. */
export const minionArt = id => (id ? art(id, 'px') : null);
