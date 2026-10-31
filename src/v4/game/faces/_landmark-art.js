// Landmark face: the pixel places. A place is the action's own 24×24 icon set into a little building in its
// quadrant's color: ring I a market stall (striped awning, a counter), ring II a shrine (gable roof, pillars, a
// niche), ring III a temple (pediment, columns, three steps). The building grows as the rings close in, so the
// round-III burst looks it. Spaces with no drawn icon yet (the blue and green stand-ins) get a well and a tree.
// Keys are the pixel guide's (design/prototypes/pixel-art/style.md): . k d m l 1 2 3, plus n (the niche: the
// sphere's ink deep in shadow) and w (wood). The renderer adds the 1px ink outline.
import { NEUTRALS, palette, withOutline, iconFor, spriteId } from '../../art/index.js';

const W = 32;
const blank = () => Array.from({ length: W }, () => Array(W).fill('.'));
const put = (g, x, y, s) => { [...s].forEach((ch, i) => { if (ch !== ' ' && g[y] && x + i >= 0 && x + i < W) g[y][x + i] = ch; }); };
const hline = (g, x0, x1, y, ch) => { for (let x = x0; x <= x1; x++) g[y][x] = ch; };
const rect = (g, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) hline(g, x0, x1, y, ch); };

// a column with light on its left edge and shade on its right
const column = (g, x, y0, y1, w = 3) => { for (let y = y0; y <= y1; y++) { g[y][x] = '3'; for (let i = 1; i < w - 1; i++) g[y][x + i] = '2'; g[y][x + w - 1] = '1'; } };

/** Ring I: a stall. Striped awning with a scalloped hem, two posts, a counter in front. */
function stall() {
  const g = blank();
  // awning: alternating sphere / cream stripes, 4 wide, top-lit
  for (let y = 1; y <= 5; y++) {
    const inset = Math.max(0, 3 - y);
    for (let x = 1 + inset; x <= 30 - inset; x++) {
      const band = Math.floor((x - 1) / 4) % 2 === 0;
      g[y][x] = band ? (y === 1 ? '3' : y === 5 ? '1' : '2') : (y === 5 ? 'm' : 'l');
    }
  }
  // scalloped hem: every stripe ends in a little point
  for (let x = 1; x <= 30; x++) { const band = Math.floor((x - 1) / 4) % 2 === 0; const mid = ((x - 1) % 4 === 1 || (x - 1) % 4 === 2); if (mid) g[6][x] = band ? '1' : 'm'; }
  // posts
  for (let y = 7; y <= 25; y++) { g[y][2] = 'm'; g[y][3] = 'd'; g[y][28] = 'm'; g[y][29] = 'd'; }
  return g;
}
function stallFront(g) {
  // the counter: a plank top in cream, a front in the sphere's ink
  hline(g, 1, 30, 25, 'l');
  for (let y = 26; y <= 29; y++) for (let x = 1; x <= 30; x++) g[y][x] = x === 1 ? '3' : x === 30 ? '1' : (x % 7 === 0 ? 'k' : '2');
  hline(g, 1, 30, 29, '1');
  return g;
}

/** Ring II: a shrine. Gable roof, two pillars, a dark niche the icon stands in, one stone step. */
function shrine() {
  const g = blank();
  // the niche
  rect(g, 6, 7, 25, 27, 'n');
  // the roof: a gable from the ridge out to the eaves
  for (let y = 0; y <= 6; y++) {
    const half = 4 + y * 2.2;
    const x0 = Math.round(15.5 - half), x1 = Math.round(15.5 + half);
    for (let x = Math.max(0, x0); x <= Math.min(31, x1); x++) g[y][x] = y === 6 ? '1' : (x < 16 ? '3' : '2');
    if (y > 0 && y < 6) { g[y][Math.max(0, x0)] = '3'; g[y][Math.min(31, x1)] = '1'; }
  }
  rect(g, 12, 2, 19, 4, 'n'); put(g, 14, 3, 'll'); // a round window in the gable: a glint
  put(g, 15, 2, 'l'); put(g, 16, 4, 'l');
  column(g, 2, 7, 27, 4); column(g, 26, 7, 27, 4);
  return g;
}
function shrineFront(g) {
  hline(g, 1, 30, 28, 'l'); rect(g, 1, 29, 30, 30, 'm'); hline(g, 1, 30, 30, 'd');
  return g;
}

/** Ring III: a temple. A wide pediment with a ridge jewel, four columns, three steps. */
function temple() {
  const g = blank();
  rect(g, 5, 8, 26, 26, 'n');
  for (let y = 1; y <= 6; y++) {
    const half = 3 + y * 2.4;
    const x0 = Math.round(15.5 - half), x1 = Math.round(15.5 + half);
    for (let x = Math.max(0, x0); x <= Math.min(31, x1); x++) g[y][x] = x < 16 ? '3' : '2';
    g[y][Math.max(0, x0)] = '3'; g[y][Math.min(31, x1)] = '1';
  }
  put(g, 14, 0, 'll'); // the jewel on the ridge
  rect(g, 11, 3, 20, 5, '1'); put(g, 12, 4, 'llllllll'); // the frieze
  hline(g, 0, 31, 7, '1');
  column(g, 1, 8, 25, 3); column(g, 28, 8, 25, 3);
  for (let y = 8; y <= 25; y++) { g[y][4] = 'm'; g[y][27] = 'm'; } // pilasters behind the icon
  return g;
}
function templeFront(g) {
  hline(g, 2, 29, 26, 'l'); hline(g, 2, 29, 27, 'm');
  hline(g, 1, 30, 28, 'l'); hline(g, 1, 30, 29, 'm');
  hline(g, 0, 31, 30, 'l'); hline(g, 0, 31, 31, 'm');
  return g;
}

// ---------- the two places drawn new (24×24, the guide's rules): a well (blue), a tree (green) ----------
const WELL = [
  '........................',
  '..........3322..........',
  '........33222211........',
  '......332222222211......',
  '....3322222222222211....',
  '...11111111111111111....',
  '.....md...l.....md......',
  '.....md...l.....md......',
  '.....md..3221...md......',
  '.....md..2221...md......',
  '.....md..1111...md......',
  '.....md.........md......',
  '...mmmmmmmmmmmmmmmmmm...',
  '..l3333222222222222211l.',
  '..lmmmmmmmmmmmmmmmmmmml.',
  '..lllkllllkllllkllllkl..',
  '..mmmmmkmmmmkmmmmkmmmm..',
  '..lllkllllkllllkllllkl..',
  '..mmmmmkmmmmkmmmmkmmmm..',
  '..lllkllllkllllkllllkl..',
  '..mmmmmkmmmmkmmmmkmmmm..',
  '..dddddddddddddddddddd..',
  '........................',
  '........................',
].map(r => r.padEnd(24, '.').slice(0, 24));
const TREE = (() => {
  const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
  // a round crown of leaves, lit from the top left, with three clumps
  const blobs = [[11.5, 8, 7.2], [7, 10.5, 4.6], [16, 10.5, 4.6]];
  for (let y = 1; y <= 16; y++) for (let x = 1; x <= 22; x++) {
    const inside = blobs.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
    if (!inside) continue;
    const lx = x - 11.5, ly = y - 8;
    g[y][x] = (lx + ly < -7) ? '3' : (lx + ly > 7 || y >= 14) ? '1' : '2';
  }
  for (const [x, y] of [[8, 6], [13, 4], [15, 9], [9, 11], [12, 12]]) g[y][x] = '3'; // leaf glints
  for (const [x, y] of [[10, 7], [14, 7]]) g[y][x] = 'l'; // blossoms
  for (let y = 15; y <= 20; y++) { g[y][10] = 'm'; g[y][11] = 'd'; g[y][12] = 'd'; g[y][13] = 'k'; }
  g[17][9] = 'm'; g[16][14] = 'd';
  for (let x = 6; x <= 17; x++) g[20][x] = x < 9 || x > 14 ? 'm' : 'd';
  for (let x = 4; x <= 19; x++) g[21][x] = 'm';
  return g.map(r => r.join(''));
})();
const NEW_PLACES = { blue: WELL, green: TREE };

/** The 24×24 object for a space: its drawn action icon, else the new place for its sphere, else the token. */
export function objectFor(qid, action, sphere) {
  const hit = iconFor([`${qid}.${action.key}`, spriteId(action.name)], 'action');
  if (hit.drawn) return { px: hit.icon.px, pal: hit.icon.palette || null };
  if (NEW_PLACES[qid]) return { px: NEW_PLACES[qid], pal: null };
  if (NEW_PLACES[sphere]) return { px: NEW_PLACES[sphere], pal: null };
  return { px: hit.icon.px, pal: null };
}

const FRAMES = { 1: [stall, stallFront, 4, 2], 2: [shrine, shrineFront, 4, 5], 3: [temple, templeFront, 4, 4] };
const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const outlined = rows => withOutline(rows.map(r => (Array.isArray(r) ? r.join('') : r)));

const cache = new Map();
/**
 * The place as runs of one color on a 32×32 grid: [{ x, y, w, fill }]. Layers: the building (outlined), the
 * object (outlined, so it never melts into the niche), then the front (counter, step, stairs).
 */
export function placeRuns(qid, action, sphere, ring) {
  const key = `${qid}.${action.key}|${sphere}|${ring}`;
  if (cache.has(key)) return cache.get(key);
  const [back, front, ox, oy] = FRAMES[Math.max(1, Math.min(3, ring || 1))];
  const pal = palette(sphere);
  const P = { ...pal, n: mix(pal[2], '#140e0a', 0.74), w: '#7a5536' };
  const layers = [];
  layers.push({ rows: outlined(back()), pal: P, x: 0, y: 0 });
  const obj = objectFor(qid, action, sphere);
  layers.push({ rows: outlined(obj.px), pal: obj.pal ? { ...NEUTRALS, ...obj.pal } : P, x: ox, y: oy });
  const f = front(blank());
  layers.push({ rows: outlined(f), pal: P, x: 0, y: 0, frontOnly: true });
  // flatten top-down into one 32×32 grid of colors
  const grid = Array.from({ length: W }, () => Array(W).fill(null));
  for (const L of layers) {
    L.rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.') return;
      const X = x + L.x, Y = y + L.y;
      if (X < 0 || Y < 0 || X >= W || Y >= W) return;
      grid[Y][X] = L.pal[ch] || P[ch] || null;
    }));
  }
  const out = [];
  grid.forEach((r, y) => {
    let x = 0;
    while (x < W) { const c = r[x]; let w = 1; while (x + w < W && r[x + w] === c) w++; if (c) out.push({ x, y, w, fill: c }); x += w; }
  });
  cache.set(key, out);
  return out;
}

// ---------- the standing pad: a flat flagstone the minion stands on (16×5) ----------
export const PAD = [
  '...mmmmmmmmmm...',
  '.mllllllllllllm.',
  'mlllllllllllllldm'.slice(0, 16),
  '.dmmmmmmmmmmmmd.',
  '...dddddddddd...',
];
export const padRuns = (() => {
  const pal = { ...NEUTRALS };
  const out = [];
  PAD.forEach((r, y) => { let x = 0; while (x < r.length) { const ch = r[x]; let w = 1; while (r[x + w] === ch) w++; if (ch !== '.') out.push({ x, y, w, fill: pal[ch] }); x += w; } });
  return out;
})();
