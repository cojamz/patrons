// Pixel art: 24×24 icons as palette-key grids (see design/prototypes/pixel-art/style.md). Each icon recolors by
// sphere: digits 1/2/3 are the sphere's shade/base/highlight, letters are shared neutrals. Icons come from the
// drawing batches (scripts/v4-art-import.mjs → ./icons/); anything not drawn yet falls back to a template.
import { createElement } from 'react';
import SETS from './icons/index.js';
import PORTRAITS from './portraits/index.js';
import { portraitRuns } from './portrait.js';
import PORTRAITS3 from './portraits3/index.js';
import { portrait3Runs } from './portrait3.js';
import PORTRAITS4 from './portraits4/index.js';

const TABLE = '#101817';
export const NEUTRALS = { k: '#0a0f0e', d: '#3c4946', m: '#8e9b96', l: '#ece6d6' };
// Sphere base colors by resource (the rules-text pips use the same names).
export const SPHERES = {
  gold: '#e2962c', red: '#e0645a', magenta: '#d4508f', green: '#5fb37c', silver: '#a3b3c2',
  white: '#eef3f8', purple: '#9a62e6', yellow: '#d3dd48', blue: '#6aa6dc', colorless: '#8d9693',
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
// People (Cory, 2026-10-15: "it will also require better visual distinction between the pixel members"): each member
// has its own skin tone, hair colour and a second cloth colour, picked from its id, so two people of one sphere never
// look alike. Drawings mark them with s (skin), h (hair or hat) and a (accent cloth: a collar, scarf, sash, apron).
// Older drawings without those keys get skin and hair from the head (the l and d in the top-left 14×14).
export const SKIN = ['#f1d3b0', '#e2b48c', '#c68c5f', '#9a6440', '#6e4428'];
export const HAIR = ['#2b1d16', '#5a3420', '#8c4a22', '#c98f3e', '#e7d29a', '#9a9a9a', '#7a2f2f', '#3a3a5a'];
export const ACCENT = ['#e8dcc0', '#b23a3a', '#2f5f8a', '#3f7a4a', '#d9a441', '#6b4a8a', '#5a3a2a', '#c8ced6'];
const hashId = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** A member's own skin, hair and accent colours (the same everywhere it's drawn). */
export function personPalette(id) {
  const h = hashId(id);
  return { s: SKIN[h % SKIN.length], h: HAIR[(h >>> 3) % HAIR.length], a: ACCENT[(h >>> 7) % ACCENT.length] };
}
const PERSON = /[sha]/;
/** An older member drawing with skin and hair marked: l and d in the head become s and h. */
export function markPerson(px) {
  if (px.some(r => PERSON.test(r))) return px;
  return px.map((r, y) => [...r].map((ch, x) => (x >= 1 && x <= 13 && y >= 1 && y <= 14 ? (ch === 'l' ? 's' : ch === 'd' ? 'h' : ch) : ch)).join(''));
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
const TEMPLATES = { member: { id: '_member', name: 'Member', kind: 'member', px: HOOD }, action: { id: '_action', name: 'Action', kind: 'action', px: TOKEN }, artifact: { id: '_artifact', name: 'Artifact', kind: 'artifact', px: TOKEN } };

// ids: engine ids for the batches ("gold.banker", "gold.rush"), kebab names for the calibration set ("banker")
const BY_ID = new Map(SETS.filter(i => i.kind === 'member' || i.kind === 'action' || i.kind === 'artifact').map(i => [i.id, i]));
// Green's new members use distinct retired Green drawings while their final names/art settle.
// New IDs preserve each member's own palette and cache entry; no live Green card shares these silhouettes.
for (const [key, name, source] of [
  ['impostor', 'Impostors', 'mirror'], ['connector', 'Connector', 'groupie'],
  ['agents', 'Agents', 'choir'], ['bait', 'Bait', 'understudy'],
  ['roadie', 'Roadie', 'translator'], // Oct 28: Green's 16th borrows the cut Translator's drawing
]) {
  const art = BY_ID.get(`echo.${source}`);
  if (art) BY_ID.set(`echo.${key}`, { ...art, id: `echo.${key}`, name });
}
// Red's redesign reuses retired portraits while names and final artwork settle.
for (const [key, name, source] of [
  ['recruitbonus', 'Recruit Bonus', 'crowd'], ['movementpenalty', 'Movement Penalty', 'drive'],
  ['panel', 'Panel', 'bigfamily'], ['loyalists', 'Loyalists', 'twins'],
]) {
  const art = BY_ID.get(`red.${source}`);
  if (art) BY_ID.set(`red.${key}`, { ...art, id: `red.${key}`, name });
}
// Purple's new members (Cory, 2026-10-22) reuse cut Purple portraits while names and artwork settle.
for (const [key, name, source] of [
  ['earlybird', 'Early Bird', 'bookkeeper'], ['bouncer', 'Bouncer', 'overseer'], ['gossip', 'Gossip', 'apprentice'],
  ['extrashift', 'Extra Shift', 'errand'], ['closer', 'Closer', 'lamplighter'], ['streak', 'Hot Streak', 'taskmaster'],
]) {
  const art = BY_ID.get(`purple.${source}`);
  if (art) BY_ID.set(`purple.${key}`, { ...art, id: `purple.${key}`, name });
}
// White's new members (Cory, 2026-10-22) reuse cut White portraits while names and artwork settle.
for (const [key, name, source] of [
  ['cashier', 'Cashier', 'dealer'], ['undertaker', 'Undertaker', 'lender'], ['appraiser', 'Appraiser', 'pawnbroker'],
  ['martyr', 'Martyr', 'safetynet'], ['hoarder', 'Hoarder', 'magnate'], ['changer', 'Money Changer', 'tipster'],
]) {
  const art = BY_ID.get(`trading.${source}`);
  if (art) BY_ID.set(`trading.${key}`, { ...art, id: `trading.${key}`, name });
}
// Member structure (Cory, 2026-10-24): the new members reuse cut portraits while names and artwork settle.
for (const [id, name, source] of [
  ['red.headhunter', 'Headhunter', 'red.sponsor'], ['thieves.fixer', 'Fixer', 'thieves.bigscore'],
  ['market.windowshopper', 'Window Shopper', 'market.curator'], ['market.restocker', 'Restocker', 'market.makeover'],
  ['purple.timekeepers', 'Timekeepers', 'purple.patience'], ['trading.oldmoney', 'Old Money', 'trading.shareholder'],
  ['trading.recluse', 'Recluse', 'market.recluse'], // Recluse moves to White (Cory, 2026-10-25)
]) {
  const art = BY_ID.get(source);
  if (art) BY_ID.set(id, { ...art, id, name });
}
// Yellow 2.0's new members (Cory, 2026-10-31) reuse cut Yellow portraits while names and artwork settle.
for (const [key, name, source] of [
  ['customs', 'Customs', 'gleaner'], ['tinker', 'Tinker', 'sower'], ['matchmaker', 'Matchmaker', 'admirer'],
  ['agitator', 'Agitator', 'farmer'], ['ringleader', 'Ringleader', 'latebloomer'], ['drifters', 'Drifters', 'weaver'],
  ['leveler', 'Leveler', 'rainmaker'], ['bigtent', 'Big Tent', 'pilgrim'], ['bookcooker', 'Book Cooker', 'peddler'],
  ['puppeteer', 'Puppeteer', 'feastmaker'], ['guestbook', 'Guest Book', 'farmer'],
]) {
  const art = BY_ID.get(`yellow.${source}`);
  if (art) BY_ID.set(`yellow.${key}`, { ...art, id: `yellow.${key}`, name });
}
// Feastmaker became Chefs (Cory, 2026-10-18): same drawing under the new id
{ const art = BY_ID.get('yellow.feastmaker'); if (art) BY_ID.set('yellow.chefs', { ...art, id: 'yellow.chefs', name: 'Chefs' }); }
/** An icon id from a card or space name: "Mentor & Protégé" → "mentor-protege". */
export const spriteId = name => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** The icon for an id (or the first of several candidate ids), or the template for its kind. */
// the portraits (Cory, 2026-10-28) win over the older 24×24 drawings wherever one is drawn
const PORTRAIT = new Map(PORTRAITS.map(i => [i.id, { ...i, portrait: true }]));
// the 48×48 portraits (Cory, 2026-10-29) win over the 32×32 ones wherever one is drawn
for (const i of PORTRAITS3) PORTRAIT.set(i.id, { ...i, portrait: true, v3: true });
// the little scenes (Cory, 2026-10-29: "definitely little scenes is the way to go") win over those: own colours, any size
for (const i of PORTRAITS4) PORTRAIT.set(i.id, { ...i, portrait: true, scene: true });
export function iconFor(id, kind = 'member') {
  const ids = Array.isArray(id) ? id : [id];
  const hit = (kind !== 'action' && ids.map(x => PORTRAIT.get(x)).find(Boolean)) || ids.map(x => BY_ID.get(x)).find(Boolean);
  return hit ? { icon: hit, drawn: true } : { icon: TEMPLATES[kind] || TEMPLATES.member, drawn: false };
}
export const drawnIds = () => [...new Set([...PORTRAIT.keys(), ...BY_ID.keys()])];

const rectCache = new Map();
const runsOf = (px, pal) => {
  const out = [];
  px.forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.') out.push({ x, y, w, fill: pal[ch] }); x += w; } });
  return out;
};
/** One <rect> per horizontal run of one color: [{ x, y, w, fill }]. */
export function rectsFor(icon, sphere) {
  const k = `${icon.id}|${sphere}`;
  if (rectCache.has(k)) return rectCache.get(k);
  if (icon.scene) { const out = runsOf(icon.px, icon.pal); rectCache.set(k, out); return out; }
  if (icon.v3) return portrait3Runs(icon, sphere);
  if (icon.portrait) return portraitRuns(icon, sphere);
  const person = icon.kind === 'member' && !icon.palette;
  const pal = icon.palette ? { ...NEUTRALS, ...icon.palette } : { ...palette(sphere), ...(person ? personPalette(icon.id) : null) };
  const out = [];
  withOutline(person ? markPerson(icon.px) : icon.px).forEach((r, y) => {
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

/**
 * Pixel runs ({ x, y, w, fill }) as <path> elements, one per colour, built once per runs array and fillOf and reused
 * on every render. A sprite drew ~140 <rect>s and the game screen ~6,000 of its ~7,100 nodes were pixel rects (speed
 * squad 2026-10-15: each one a node to create, style, lay out and paint whenever a seat or a hover card drew it).
 * The same squares, the same crisp edges: the runs never overlap, so the union of one colour's runs is the same set
 * of pixels. The elements are cached (same objects every render), so React skips them when a figure re-renders.
 */
const byFill = r => r.fill;
const pathCache = new WeakMap();
export function pixelPaths(runs, fillOf = byFill) {
  let per = pathCache.get(runs);
  if (!per) { per = new Map(); pathCache.set(runs, per); }
  let els = per.get(fillOf);
  if (els) return els;
  const m = new Map();
  for (const r of runs) {
    const f = fillOf(r);
    if (f == null) continue;
    m.set(f, (m.get(f) || '') + `M${r.x} ${r.y}h${r.w}v1h${-r.w}z`);
  }
  els = [...m].map(([fill, d], k) => createElement('path', { key: k, d, fill }));
  per.set(fillOf, els);
  return els;
}

/** How much of an icon is its sphere's color (keys 1/2/3) among its filled cells: 0..1. */
const shareCache = new Map();
export function sphereShare(id, kind = 'member') {
  const { icon } = iconFor(id, kind);
  if (shareCache.has(icon.id)) return shareCache.get(icon.id);
  let sphere = 0, filled = 0;
  for (const row of icon.px) for (const ch of row) { if (ch === '.' || ch === 'k') continue; filled++; if (ch === '1' || ch === '2' || ch === '3') sphere++; }
  const v = filled ? sphere / filled : 0;
  shareCache.set(icon.id, v);
  return v;
}
