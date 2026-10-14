// "Gold or yellow?" (meta round 2, #9): a resource is never told by color alone. Every pip in text is the resource's
// own shape in its color; every coin (setup picker, pay) carries that shape inside, in ink that reads on the coin
// (contrast ≥ 3, the non-text minimum); and the setup picker's labels are ink on its cream paper (≥ 4.5).
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createGame } from '../../../engine/v4/index.js';
import { Pip, Rich } from '../../../v4/game/Rich.jsx';
import { CoinMark, markInk } from '../../../v4/game/Glyphs.jsx';
import { ChoicePrompt } from '../../../v4/game/parts.jsx';

afterEach(cleanup);
const RESOURCES = ['gold', 'red', 'blue', 'green', 'magenta', 'yellow', 'purple', 'silver', 'white'];
const rootOf = file => { const css = readFileSync(`${process.cwd()}/src/v4/${file}`, 'utf8'); return css.slice(css.indexOf(':root{'), css.indexOf('}', css.indexOf(':root{'))); };
const ROOTS = [rootOf('lamp.css'), rootOf('v4.css')];
const varOf = name => { for (const root of ROOTS) { const m = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`)); if (m) return m[1]; } return undefined; };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe('resources are never color alone', () => {
  it('a pip in text is the resource shape (gold and yellow differ), titled', () => {
    const shapes = new Map();
    for (const r of RESOURCES) {
      const { container } = render(<Pip color={r} n={2} />);
      const g = container.querySelector(`.pip svg.res-glyph[data-res-glyph="${r}"]`);
      expect(g, r).not.toBeNull();
      expect(container.querySelector('.pip').getAttribute('title')).toBe(`2 ${r}`);
      shapes.set(r, g.innerHTML);
      cleanup();
    }
    expect(shapes.get('gold')).not.toBe(shapes.get('yellow'));
    expect(new Set(shapes.values()).size).toBe(RESOURCES.length);
    const { container } = render(<Rich text="+2 gold and +1 yellow" />);
    expect([...container.querySelectorAll('.pip svg')].map(s => s.dataset.resGlyph)).toEqual(['gold', 'yellow']);
  });

  it('every coin mark is its own shape, and reads on its coin', () => {
    const marks = RESOURCES.map(r => renderToStaticMarkup(<CoinMark r={r} />).replace(/data-coin-mark="\w+"/, ''));
    expect(new Set(marks).size).toBe(RESOURCES.length);
    for (const r of RESOURCES) {
      const coin = varOf(r);
      expect(coin, `--${r}`).toMatch(/^#/);
      expect(contrast(markInk(r), coin), `${r} mark on ${coin}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('the setup picker: each coin shows its mark, and the labels are ink on cream', () => {
    const s = createGame({ seats: [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }], seed: 3 });
    expect(s.pending.kind).toBe('setup');
    const { container } = render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />);
    const coins = [...container.querySelectorAll('.coin-big')];
    expect(coins.length).toBeGreaterThan(0);
    for (const c of coins) expect(c.querySelector('[data-coin-mark]')).not.toBeNull();
    const css = readFileSync(`${process.cwd()}/src/v4/v4.css`, 'utf8');
    expect(css).toMatch(/\.app\.game\.lt \.lt-wheel > \.prompt\.choice \.token\{color:var\(--paper-ink\)\}/);
    expect(contrast(varOf('paper-ink'), varOf('paper'))).toBeGreaterThanOrEqual(4.5);
  });
});
