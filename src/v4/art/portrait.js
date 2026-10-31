// Portraits (Cory, 2026-10-28: the Launderer is the model): 32×32 head-and-shoulders members in their color's doorway,
// and 32×32 artifacts. Palette keys and colors match design/prototypes/art-v2/kit.py (change both together): digits
// 1–4 are the sphere's ramp, b/c/i its doorway, S/s/t/a and H/h/j the member's own skin and hair (from its id), the
// rest are fixed. The outline is drawn here, one pixel around each shape in that shape's own deep tone.
import { SPHERES, SKIN, HAIR } from './index.js';

const TABLE = '#191310';
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a, b, t) => '#' + hx(a).map((x, i) => Math.round(x + (hx(b)[i] - x) * t).toString(16).padStart(2, '0')).join('');
const FIXED = {
  K: '#1a1420', w: '#ffffff', W: '#f4ecd8', V: '#c9b79a', L: '#ece6da', M: '#b4aea6', N: '#6c6670', D: '#2c3448',
  G: '#ffe08a', g: '#c98a1c', R: '#c4533f', r: '#8a3428', q: '#e98a6e', U: '#4a80b8', u: '#2f5a85', E: '#5fa36f', e: '#3a6e48',
  P: '#8a5cc8', p: '#5a3a8a', O: '#9a6a3e', o: '#5e3e22', Y: '#f2d24a', x: '#e0645a', y: '#6aa6dc', z: '#5fb37c', n: '#e2962c',
};
const DARK = {
  ...Object.fromEntries([...'KwWVLMNDiYxyzn'].map(k => [k, '#141018'])), G: '#3a2008', g: '#3a2008', R: '#3a120c', r: '#3a120c', q: '#3a120c',
  U: '#0e1c2c', u: '#0e1c2c', E: '#0e2416', e: '#0e2416', P: '#1e1030', p: '#1e1030', O: '#24140a', o: '#24140a',
};
const hashId = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** A portrait's colors and outline colors for one sphere (a resource name or a #hex) and member id. */
export function portraitPalette(sphere, id) {
  const base = SPHERES[sphere] || (/^#[0-9a-f]{6}$/i.test(sphere || '') ? sphere : SPHERES.colorless);
  const h = hashId(id), skin = SKIN[h % SKIN.length], hair = HAIR[(h >>> 3) % HAIR.length];
  const p = {
    ...FIXED, 1: mix(base, '#1e1020', 0.62), 2: mix(base, '#3a1830', 0.36), 3: base, 4: mix(base, '#fff4e0', 0.45),
    b: mix(base, TABLE, 0.8), c: mix(base, TABLE, 0.6),
    S: skin, s: mix(skin, '#7a3a2a', 0.18), t: mix(skin, '#5a2418', 0.4), a: mix(skin, '#e05a5a', 0.35),
    H: mix(hair, '#000000', 0.35), h: hair, j: mix(hair, '#ffffff', 0.3),
  };
  p.i = mix(p.b, '#ffffff', 0.1);
  const dark = { ...DARK };
  for (const k of '1234') dark[k] = mix(p[1], '#000000', 0.45);
  for (const k of 'bci') dark[k] = mix(p.b, '#000000', 0.5);
  for (const k of 'Ssta') dark[k] = mix(p.t, '#000000', 0.5);
  for (const k of 'Hhj') dark[k] = mix(p.H, '#000000', 0.5);
  return { p, dark };
}

const cache = new Map();
/** One run per horizontal stretch of one color: [{ x, y, w, fill }], outline included. */
export function portraitRuns(icon, sphere) {
  const k = `${icon.id}|${sphere}`;
  let out = cache.get(k);
  if (out) return out;
  const { p, dark } = portraitPalette(sphere, icon.id);
  // no doorway behind a member (Cory, 2026-10-28: "the backgrounds look like hair in too many cases"): a stepped glow
  // in their color instead, three rings fading out past the outline
  const member = icon.kind === 'member';
  const px = member ? icon.px.map(r => r.replace(/[bc]/g, '.')) : icon.px, n = px.length;
  const at = (x, y) => (y >= 0 && y < n && x >= 0 && x < n ? px[y][x] : '.');
  const glow = member ? auraOf(px, p[4]) : null;
  out = [];
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      const fill = colorAt(x, y);
      let w = 1;
      while (x + w < n && colorAt(x + w, y) === fill) w++;
      if (fill) out.push({ x, y, w, fill });
      x += w;
    }
  }
  function colorAt(x, y) {
    const ch = at(x, y);
    if (ch !== '.') return p[ch] || null;
    for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { const c = at(a, b); if (c !== '.') return dark[c] || '#141018'; }
    return glow ? glow[y * n + x] : null;
  }
  cache.set(k, out);
  return out;
}

const AURA = [[1.5, 'a6'], [2.5, '66'], [3.6, '2e']]; // distance past the shape, opacity
function auraOf(px, color) {
  const n = px.length, out = Array(n * n).fill(null), filled = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (px[y][x] !== '.') filled.push([x, y]);
  const R = Math.ceil(AURA[AURA.length - 1][0]);
  const near = new Float32Array(n * n).fill(99);
  for (const [fx, fy] of filled) {
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = fx + dx, y = fy + dy;
      if (x < 0 || y < 0 || x >= n || y >= n) continue;
      const d = Math.hypot(dx, dy);
      if (d < near[y * n + x]) near[y * n + x] = d;
    }
  }
  for (let k = 0; k < n * n; k++) {
    const d = near[k];
    if (d <= 1) continue; // the shape or its outline
    const ring = AURA.find(([r]) => d <= r);
    if (ring) out[k] = color + ring[1];
  }
  return out;
}
