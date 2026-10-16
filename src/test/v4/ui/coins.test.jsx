// A resource is a plain dot in its color (Cory, 2026-10-15: "just simplify visual language everywhere"; this replaces
// meta round 2 #9's shapes-inside-coins). Every pip in text and every coin (setup picker, pay) is that dot, each says
// its name on hover or beside it, and the setup picker's labels are ink on its cream paper (≥ 4.5).
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, cleanup } from '@testing-library/react';
import { createGame } from '../../../engine/v4/index.js';
import { Pip, Rich } from '../../../v4/game/Rich.jsx';
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

describe('a resource is a plain dot, and always says its name', () => {
  it('a pip in text is the dot in its own color, titled', () => {
    const fills = new Map();
    for (const r of RESOURCES) {
      const { container } = render(<Pip color={r} n={2} />);
      const g = container.querySelector(`.pip svg.res-glyph[data-res-glyph="${r}"]`);
      expect(g, r).not.toBeNull();
      expect(container.querySelector('.pip').getAttribute('title')).toBe(`2 ${r}`);
      // white is a pearl: filled with its own gradient (defined in the same glyph), white at the centre, so on a card it
      // reads as a white thing, never as an empty ring (design pod, w3a A4 blocker); every other dot is its color
      if (r === 'white') {
        const fill = g.querySelector('path').getAttribute('fill');
        const id = (fill.match(/^url\(#(.+)\)$/) || [])[1];
        expect(id, 'white fills with a gradient').toBeTruthy();
        const grad = g.querySelector(`radialGradient[id="${id}"]`);
        expect(grad, 'the gradient lives in the glyph').not.toBeNull();
        expect(grad.querySelector('stop').getAttribute('stop-color')).toBe('#ffffff');
      } else expect(g.querySelector('path').getAttribute('fill')).toContain(`var(--${r})`);
      fills.set(r, g.querySelector('path').getAttribute('fill'));
      cleanup();
    }
    expect(new Set(fills.values()).size).toBe(RESOURCES.length);
    const { container } = render(<Rich text="+2 gold and +1 yellow" />);
    expect([...container.querySelectorAll('.pip svg')].map(s => s.dataset.resGlyph)).toEqual(['gold', 'yellow']);
  });

  it('the setup picker: a plain dot per resource with its name beside it, ink on cream', () => {
    const s = createGame({ seats: [{ name: 'Ana', kind: 'human' }, { name: 'Bo', kind: 'bot' }], seed: 3 });
    expect(s.pending.kind).toBe('setup');
    const { container } = render(<ChoicePrompt state={s} onPick={() => {}} busy={false} />);
    const tokens = [...container.querySelectorAll('.token[data-option]')];
    expect(tokens.length).toBeGreaterThan(0);
    for (const t of tokens) {
      const dot = t.querySelector('svg.res-glyph');
      expect(dot).not.toBeNull();
      expect(t.querySelector('.tk-name').textContent).toBe(dot.dataset.resGlyph);
    }
    expect(container.querySelector('.coin-big, [data-coin-mark]')).toBeNull();
    const css = readFileSync(`${process.cwd()}/src/v4/v4.css`, 'utf8');
    expect(css).toMatch(/\.app\.game\.lt \.lt-wheel > \.prompt\.choice \.token\{color:var\(--paper-ink\)\}/);
    expect(contrast(varOf('paper-ink'), varOf('paper'))).toBeGreaterThanOrEqual(4.5);
  });
});
