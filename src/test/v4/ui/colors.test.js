// Player colors never read as resources: each is ΔE ≥ 30 (CIE76, Lab D65) from all nine resource colors in v4.css,
// ≥ 30 from each other, and readable on the table and on dark wood (contrast ≥ 4.5). Seat sigils carry identity too.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLAYER_COLORS, SEAT_SIGILS } from '../../../v4/format.js';

// the colors on screen: v4.css's :root, overridden by the Lamplit theme (lamp.css) where it sets them
const rootOf = file => { try { const css = readFileSync(`${process.cwd()}/src/v4/${file}`, 'utf8'); return css.slice(css.indexOf(':root{'), css.indexOf('}', css.indexOf(':root{'))); } catch { return ''; } };
const ROOTS = [rootOf('lamp.css'), rootOf('v4.css')];
const varOf = name => { for (const root of ROOTS) { const m = root.match(new RegExp(`--${name}:(#[0-9a-fA-F]{6})`)); if (m) return m[1]; } return undefined; };
const WALNUT = '#1d1611'; // the Lamplit Table's wood (design/prototypes/vision/vision.css)
const RESOURCES = ['gold', 'red', 'blue', 'green', 'magenta', 'yellow', 'purple', 'silver', 'white'];

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab(h) {
  const [r, g, b] = hex(h).map(lin);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const lum = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe('resource colors', () => {
  it('keeps yellow warm and readable, distinct from green and amber gold', () => {
    const yellow = varOf('yellow');
    const [r, g, b] = hex(yellow);
    // Warm lemon has more red than green; equal channels drift toward the lime-looking old rim.
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b * 2);
    expect(dE(yellow, varOf('green'))).toBeGreaterThan(50);
    expect(dE(yellow, varOf('gold'))).toBeGreaterThan(25);
    expect(contrast(yellow, WALNUT)).toBeGreaterThan(10);
    expect(contrast(yellow, '#2b2018')).toBeGreaterThan(10);
  });
});

describe('player colors', () => {
  it('stay clear of every resource color, of each other, and read on the table', () => {
    const res = RESOURCES.map(r => [r, varOf(r)]);
    for (const [r, h] of res) expect(h, `--${r} in v4.css`).toMatch(/^#/);
    for (const p of PLAYER_COLORS) {
      for (const [r, h] of res) expect(dE(p, h), `${p} vs ${r} ${h}`).toBeGreaterThanOrEqual(30);
      for (const t of [WALNUT, '#271d16']) expect(contrast(p, t), `${p} on ${t}`).toBeGreaterThanOrEqual(4.5);
    }
    PLAYER_COLORS.forEach((a, i) => PLAYER_COLORS.slice(i + 1).forEach(b => expect(dE(a, b), `${a} vs ${b}`).toBeGreaterThanOrEqual(30)));
    // and a distinct sigil per seat, so color is never the only cue
    expect(new Set(SEAT_SIGILS).size).toBe(6);
  });
});
