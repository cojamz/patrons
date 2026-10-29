// Portraits v3 (Cory, 2026-10-29: "these pixel arts still look pretty bad"): 48×48 members drawn with hue-shifted ramps,
// a sel-out outline and a dark doorway, ported from design/prototypes/art-v3/palette.py and render.py (change both
// together). Every color is computed from a few base hexes with the same OKLCH math. Keys and format: art-v3/FORMAT.md.
const SPHERES = { gold: '#e2962c', red: '#e0645a', magenta: '#d4508f', green: '#5fb37c', silver: '#a3b3c2',
  white: '#eef3f8', purple: '#9a62e6', yellow: '#d3dd48', blue: '#6aa6dc', colorless: '#8d9693' };
const SKINS = { palepink: '#f3d2c8', porcelain: '#f0d8c2', freckled: '#eec4a2', fair: '#e6b994', golden: '#d9aa6c', olive: '#c39c74',
  warmtan: '#c4834f', tan: '#a87452', coolbrown: '#8c5e4e', brown: '#80522f', deep: '#5e3a28', verydeep: '#402822' };
const HAIRS = { black: '#2e2630', darkbrown: '#4a3226', brown: '#6e4a30', auburn: '#8a3e26', ginger: '#c06a30',
  blonde: '#d8b060', ash: '#9a8e80', grey: '#a8a4a4', white: '#e4e0dc', blueblack: '#22263a' };
const MATERIALS = { gold: '#e0a83a', metal: '#a8acb4', linen: '#e2d8c4', charcoal: '#4a4650', wood: '#8a5a36' };
const ACCENTS = { red: '#c8423a', teal: '#3a9a94', orange: '#e07a32', navy: '#34487a', rose: '#d87890',
  ochre: '#c89a3a', violet: '#7a4ab0', green: '#4a8a4a' };
const INK = '#1c1424', EYEWHITE = '#e8e0d4', GLINT = '#fffbf0';
const SHADOW_HUE = 300, LIGHT_HUE = 95, SKIN_SHADOW_HUE = 22;

const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// Python's round() is banker's rounding; match it so both sides make the same hexes
const pyRound = v => { const f = Math.floor(v), d = v - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 === 0 ? f : f + 1); };
const rgb2hex = r => '#' + r.map(v => Math.max(0, Math.min(255, pyRound(v))).toString(16).padStart(2, '0')).join('');
const deg = Math.PI / 180;

function toOklch(h) {
  const [r, g, b] = hex2rgb(h).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return [L, Math.hypot(A, B), (((Math.atan2(B, A) / deg) % 360) + 360) % 360];
}
function lab2rgb(L, A, B) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
function fromOklch(L, C, h) {
  L = Math.max(0, Math.min(1, L));
  let rgb;
  for (let i = 0; i < 40; i++) { // pull chroma in until the color fits sRGB
    rgb = lab2rgb(L, C * Math.cos(h * deg), C * Math.sin(h * deg));
    if (rgb.every(v => v >= -0.0005 && v <= 1.0005)) break;
    C *= 0.93;
  }
  return rgb2hex(rgb.map(v => gam(Math.max(0, Math.min(1, v)))));
}
export const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((x, i) => x + (B[i] - x) * t)); };
const toward = (h, target, d) => { const s = (((target - h + 540) % 360) + 360) % 360 - 180; return h + Math.max(-d, Math.min(d, s)); };

function ramp(base, dl, baseI, darkShift = 14, lightShift = 8, darkChroma = 1, lightChroma = 0.82, shadowHue = null) {
  const [L0, C0, h0] = toOklch(base);
  return dl.map((d, i) => {
    const k = i - baseI;
    if (k === 0) return base;
    if (k < 0) {
      const tgt = shadowHue != null ? shadowHue : h0 >= 55 && h0 <= 135 ? 30 : SHADOW_HUE; // yellow/gold shadows go orange-brown
      return fromOklch(L0 + d, C0 * darkChroma ** -k, toward(h0, tgt, darkShift * -k));
    }
    return fromOklch(L0 + d, C0 * lightChroma ** k, toward(h0, LIGHT_HUE, lightShift * k));
  });
}
function sphereRamp(base) {
  const L0 = toOklch(base)[0];
  if (L0 > 0.84) { const room = Math.max(0, 0.99 - L0); return ramp(base, [-0.36, -0.18, 0, room * 0.5, room], 2, 17, 10, 1); }
  return ramp(base, [-0.30, -0.17, 0, 0.09, 0.17], 2, 14, 8, 1);
}
// light skin gets deeper shadows (so a brim's shadow reads), deep skin shallower (so faces never go black)
function skinRamp(base) {
  const L0 = toOklch(base)[0];
  if (L0 < 0.42) return ramp(base, [-0.08, -0.04, 0, 0.17], 2, 10, 6, 1.1, 1.3, SKIN_SHADOW_HUE);
  const dl = L0 > 0.78 ? [-0.33, -0.14, 0, 0.05] : L0 > 0.6 ? [-0.19, -0.09, 0, 0.065] : [-0.12, -0.06, 0, 0.12];
  return ramp(base, dl, 2, 10, 6, 1.1, 0.88, SKIN_SHADOW_HUE);
}
function hairRamp(base) {
  const L0 = toOklch(base)[0];
  return ramp(base, [L0 > 0.3 ? -0.16 : -0.08, L0 > 0.3 ? -0.08 : -0.04, 0, L0 < 0.45 ? 0.13 : 0.08], 2, 10);
}
const matRamp = base => ramp(base, [-0.24, -0.12, 0, 0.09], 2);
function outlineOf(darkest) { const [L, C, h] = toOklch(darkest); return fromOklch(Math.max(0.13, L * 0.62), C * 0.8, toward(h, SHADOW_HUE, 10)); }

const PERSON_KEYS = [['ABCD', 'EFGH'], ['IJKL', 'MNOP'], ['QRST', 'UVWX']];
const MAT_KEYS = { gold: 'abcd', metal: 'efgh', linen: 'ijkl', charcoal: 'mnop', wood: 'qrst', accent: 'uvwx' };
const baseOf = sphere => SPHERES[sphere] || (/^#[0-9a-f]{6}$/i.test(sphere || '') ? sphere : SPHERES.colorless);

function palette(icon, sphere) {
  const ramps = [['12345', sphereRamp(baseOf(sphere || icon.sphere))]];
  const people = icon.people?.length ? icon.people : [{ skin: 'fair', hair: 'brown' }];
  PERSON_KEYS.forEach(([sk, hk], n) => { const p = people[Math.min(n, people.length - 1)]; ramps.push([sk, skinRamp(SKINS[p.skin])], [hk, hairRamp(HAIRS[p.hair])]); });
  for (const [m, keys] of Object.entries(MAT_KEYS)) ramps.push([keys, matRamp(m === 'accent' ? ACCENTS[icon.accent || 'red'] : MATERIALS[m])]);
  const col = {}, lit = {}, shade = {};
  const o = outlineOf(ramps[0][1][0]); // one shadow-side outline per portrait, from the sphere's darkest step
  for (const [keys, colors] of ramps) [...keys].forEach((k, i) => { col[k] = colors[i]; lit[k] = colors[0]; shade[k] = o; });
  Object.assign(col, { y: EYEWHITE, z: INK, '!': GLINT });
  for (const k of 'yz!') { lit[k] = INK; shade[k] = o; }
  return { col, lit, shade };
}
function panel(sphere) {
  let [, C, h] = toOklch(baseOf(sphere));
  h = toward(h, h >= 55 && h <= 135 ? 30 : SHADOW_HUE, 25);
  const c = Math.min(C, 0.06) * 0.55;
  return { frame: fromOklch(0.16, c * 0.8, h), lip: fromOklch(0.34, c * 1.1, h), back: fromOklch(0.235, c, h), lit: fromOklch(0.275, c, h) };
}

const N = 48;
const FILM = { ':': ['ffffff', 0.14], '^': ['1c1424', 0.42], '"': ['ffffff', 0.85] }; // see-through: film, shade rim, lit rim
const ARCH = (() => { // the doorway: the canvas less a 1px margin, round-topped
  const m = [], cx = 24, cy = 23.5, r = 22.6;
  for (let y = 0; y < N; y++) { m.push(Array(N).fill(false)); for (let x = 1; x < N - 1; x++) { if (y < 1) continue; const px = x + 0.5, py = y + 0.5; m[y][x] = !(py < cy && (px - cx) ** 2 + (py - cy) ** 2 > r * r); } }
  return m;
})();

/** 48×48 hex colors (null = transparent): sel-out outline and figure, and the doorway if asked (members have none:
 * the card or seat behind them is the backdrop). Same as render.py grid(). */
export function portrait3Grid(icon, sphere, door = false) {
  const { col, lit, shade } = palette(icon, sphere), pn = panel(sphere || icon.sphere), px = icon.px;
  const g = Array.from({ length: N }, () => Array(N).fill(null));
  const inArch = (x, y) => x >= 0 && x < N && y >= 0 && y < N && ARCH[y][x];
  if (door) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!ARCH[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, -1]].some(([a, b]) => !inArch(x + a, y + b))) { g[y][x] = pn.frame; continue; }
    const inner = [[2, 0], [-2, 0], [0, -2]].some(([a, b]) => x + a >= 0 && x + a < N && y + b >= 0 && y + b < N && !ARCH[y + b][x + a]);
    if (inner && x > 24) { g[y][x] = pn.lip; continue; } // the right jamb catches the light from the left
    g[y][x] = x + 0.6 * y < 24 ? pn.lit : pn.back;
  }
  const at = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? px[y][x] : '.');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = px[y][x];
    if (FILM[k] != null) { g[y][x] = `#${FILM[k][0]}${pyRound(FILM[k][1] * 255).toString(16).padStart(2, '0')}`; continue; } // a color at an alpha, never outlined
    if (k !== '.') { g[y][x] = col[k]; continue; }
    // sel-out: the shape's lit side (this pixel left of or above it) takes its darkest step, the shadow side a deeper tone
    for (const [a, b, litSide] of [[1, 0, true], [0, 1, true], [-1, 0, false], [0, -1, false]]) {
      const n = at(x + a, y + b);
      if (n !== '.' && n !== '!' && FILM[n] == null) { g[y][x] = litSide ? lit[n] : shade[n]; if (!litSide) break; }
    }
  }
  return g;
}

const cache = new Map();
/** One run per horizontal stretch of one color: [{ x, y, w, fill }]. */
export function portrait3Runs(icon, sphere) {
  const k = `${icon.id}|${sphere}`;
  let out = cache.get(k);
  if (out) return out;
  const g = portrait3Grid(icon, sphere);
  out = [];
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) { const f = g[y][x]; let w = 1; while (x + w < N && g[y][x + w] === f) w++; if (f) out.push({ x, y, w, fill: f }); x += w; }
  }
  cache.set(k, out);
  return out;
}
