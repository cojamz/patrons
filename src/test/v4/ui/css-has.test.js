// Guard (perf, 2026-10-15): a `:has()` whose subject is a page-level element (body, html, the app, the table root) makes
// the browser re-style the whole page, about 5,000 elements, on DOM changes all over the table: 18 whole-page
// recalculations in one stretch of rival steps at 4× CPU, up to 223ms each (design/eval/perf/turn-wait.md). Such a rule
// becomes a data attribute that the component it looks for sets while it's mounted (src/v4/game/bodyFlag.js).
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '../../../v4');
const cssFiles = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? cssFiles(p) : f.endsWith('.css') ? [p] : []; });
// a page-level compound: body, html, the app wrapper on its own, or anything naming the table (.lt, .game)
const pageLevel = compound => /^(body|html)(?![\w-])/.test(compound) || /\.(lt|game)(?![\w-])/.test(compound) || /^\.app$/.test(compound);
// known and allowed: the setup screen's wrapper (a small page, never the table)
const ALLOWED = new Set(['.app.narrow']);

/** Every `:has(` in a stylesheet with the compound selector it hangs on. */
function hasSubjects(css) {
  const out = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(text))) {
    for (const sel of m[1].split(',')) {
      const s = sel.trim();
      let i = s.indexOf(':has(');
      while (i >= 0) {
        // the compound right before `:has(`: back to the last combinator or space outside parentheses
        let j = i, depth = 0;
        while (j > 0) {
          const c = s[j - 1];
          if (c === ')') depth++;
          else if (c === '(') depth--;
          else if (depth === 0 && /[\s>+~]/.test(c)) break;
          j--;
        }
        out.push({ selector: s, subject: s.slice(j, i).replace(/:has\(.*$/, '') });
        i = s.indexOf(':has(', i + 5);
      }
    }
  }
  return out;
}

describe('stylesheets', () => {
  it('no :has() hangs on a page-level element (body, html, the app, the table root)', () => {
    const bad = [];
    for (const f of cssFiles(ROOT)) {
      for (const { selector, subject } of hasSubjects(readFileSync(f, 'utf8'))) {
        if (pageLevel(subject) && !ALLOWED.has(subject)) bad.push(`${f.replace(ROOT, 'src/v4')}: ${selector}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('the scanner sees the patterns it guards against', () => {
    const subs = hasSubjects('body:has(.x) .p{z-index:1} .app.game.lt:has(> .turn-card) > .s{a:b} .card:has(.y){c:d}').map(x => x.subject);
    expect(subs).toEqual(['body', '.app.game.lt', '.card']);
    expect(subs.map(pageLevel)).toEqual([true, true, false]);
  });
});
