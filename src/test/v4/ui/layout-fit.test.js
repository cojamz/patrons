// The laptop and large-screen fits (lane 8, 2026-10-21), read from the stylesheet: the browser gates (e2e/v4/layout.mjs,
// hotseat.mjs) measure them on screen; this keeps the rules from being dropped by a later edit.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../../../v4/game/layout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** The body of the first @media block whose query contains `q`, holding `needle`. */
function media(q, needle) {
  let i = 0;
  for (;;) {
    i = css.indexOf('@media', i);
    if (i < 0) return '';
    const open = css.indexOf('{', i);
    let depth = 1, j = open + 1;
    while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const head = css.slice(i, open), body = css.slice(open + 1, j - 1);
    if (head.includes(q) && body.includes(needle)) return body;
    i = j;
  }
}

describe('laptop fits', () => {
  it('narrow laptops: the chairs run the full height, beside the shop strip', () => {
    const body = media('(max-width:1199px)', 'grid-template-areas');
    expect(body).toMatch(/grid-template-areas:\s*"seats prompt side"\s*"seats wheel side"\s*"seats wheel side"\s*"seats shop shop"/);
  });
  it('short wide laptops: the story starts close under tighter chairs and still yields to the turn card', () => {
    const body = media('(max-height:799px)', '--col-top');
    expect(body).toMatch(/\.lt-seat\{padding-top:4px;padding-bottom:4px\}/);
    expect(body).toMatch(/\[data-turn-card\] > \.lt-since\{max-height:calc\([^}]*var\(--turn-h/);
  });
});

describe('large screens', () => {
  it('from 1600×880 the side columns, prompt, chairs, story, turn card and shop zoom by one step with the grid', () => {
    const body = media('(min-width:1600px)', 'zoom');
    for (const region of ['.lt-prompt', '.lt-snake', '.lt-seat', '.lt-since', '.lt-shop', '.turn-card']) expect(body).toContain(`.app.game.lt > ${region}`);
    expect(body).toMatch(/zoom:var\(--gz\)/);
    expect(body).toMatch(/--col-l:calc\(320px \* var\(--gz\)\)/);
    expect(body).toMatch(/grid-template-rows:calc\(72px \* var\(--gz\)\)/);
  });
  it('the wheel never zooms (it already scales with its region)', () => {
    expect(css).not.toMatch(/\.lt-wheel[^{]*\{[^}]*zoom:/);
  });
});
