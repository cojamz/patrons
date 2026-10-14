// Pixel art: 24×24 icons as palette-key grids (see design/prototypes/pixel-art/style.md). Each icon recolors by
// sphere: digits 1/2/3 are the sphere's shade/base/highlight, letters are shared neutrals. Icons come from the
// drawing batches (scripts/v4-art-import.mjs → ./icons/); anything not drawn yet falls back to a template.
import SETS from './icons/index.js';

const TABLE = '#101817';
export const NEUTRALS = { k: '#0a0f0e', d: '#3c4946', m: '#8e9b96', l: '#ece6d6' };
// Sphere base colors by resource (the rules-text pips use the same names).
export const SPHERES = {
  gold: '#e3b23c', red: '#e0645a', magenta: '#d4508f', green: '#5fb37c', silver: '#a3b3c2',
  white: '#eef3f8', purple: '#9a62e6', yellow: '#dcd94e', blue: '#6aa6dc', colorless: '#8d9693',
};
const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
/** The 7-color palette for one sphere (a resource name or a #hex). */
export function palette(sphere) {
  const base = SPHERES[sphere] || (/^#[0-9a-f]{6}$/i.test(sphere || '') ? sphere : SPHERES.colorless);
  return { ...NEUTRALS, 1: mix(base, TABLE, 0.48), 2: base, 3: mix(base, '#fff8ec', 0.5) };
}
/** Adds the 1px outer outline: an empty cell beside (not diagonal to) a filled one becomes ink. */
export function withOutline(px) {
  const H = px.length, W = px[0].length;
  const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && px[y][x] !== '.' && px[y][x] !== 'k';
  return px.map((row, y) => [...row].map((ch, x) => (ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'k' : ch)).join(''));
}

// ---------- templates for anything not drawn yet ----------
// A hooded acolyte (members) and a token (actions), built row by row so they stay symmetric.
function row(w, fill, edgeL = '3', edgeR = '1') {
  if (w <= 0) return '.'.repeat(24);
  const inner = typeof fill === 'function' ? fill(w) : fill.repeat(Math.max(0, w - 2));
  const s = (w === 1 ? fill[0] : edgeL + inner.slice(0, w - 2) + edgeR);
  const left = Math.floor((24 - s.length) / 2);
  return '.'.repeat(left) + s + '.'.repeat(24 - left - s.length);
}
const HOOD = (() => {
  const W = [0, 4, 8, 10, 12, 12, 14, 14, 14, 14, 16, 18, 18, 18, 20, 20, 20, 20, 22, 22, 22, 22, 22, 0];
  return W.map((w, y) => {
    if (y >= 5 && y <= 9) { // the face in the hood's shadow, two glints for eyes
      const face = w - 6;
      const mid = y === 7 ? 'l'.padStart(Math.ceil(face / 2) - 1, 'd').padEnd(face - (Math.ceil(face / 2) - 1), 'd').replace(/d$/, 'l').split('') : Array(face).fill('d');
      if (y === 7) { mid.fill('d'); mid[1] = 'l'; mid[face - 2] = 'l'; }
      return row(w, () => `22${mid.join('')}22`);
    }
    if (y >= 13 && y <= 22) return row(w, n => { const a = '2'.repeat(n); const c = Math.floor(n / 2); return a.slice(0, c - 1) + 'k' + a.slice(c); });
    return row(w, '2');
  });
})();
const TOKEN = (() => {
  const W = [0, 0, 0, 8, 12, 14, 16, 18, 18, 20, 20, 20, 20, 20, 20, 18, 18, 16, 14, 12, 8, 0, 0, 0];
  return W.map(w => row(w, '2'));
})();
const TEMPLATES = { member: { id: '_member', name: 'Member', kind: 'member', px: HOOD }, action: { id: '_action', name: 'Action', kind: 'action', px: TOKEN } };

const BY_ID = new Map(SETS.map(i => [i.id, i]));
/** An icon id from a card or space name: "Mentor & Protégé" → "mentor-protege". */
export const spriteId = name => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** The icon for an id, or the template for its kind. `drawn` says whether it's a real drawing. */
export function iconFor(id, kind = 'member') {
  const hit = BY_ID.get(id);
  return hit ? { icon: hit, drawn: true } : { icon: TEMPLATES[kind] || TEMPLATES.member, drawn: false };
}
export const drawnIds = () => [...BY_ID.keys()];

const rectCache = new Map();
/** One <rect> per horizontal run of one color: [{ x, y, w, fill }]. */
export function rectsFor(icon, sphere) {
  const k = `${icon.id}|${sphere}`;
  if (rectCache.has(k)) return rectCache.get(k);
  const pal = palette(sphere);
  const out = [];
  withOutline(icon.px).forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      const ch = r[x];
      let w = 1;
      while (r[x + w] === ch) w++;
      if (ch !== '.') out.push({ x, y, w, fill: pal[ch] });
      x += w;
    }
  });
  rectCache.set(k, out);
  return out;
}
