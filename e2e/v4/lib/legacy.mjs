// In-page check: the visual language has two drawn marks, the resource dot and the follower (grammar.md, Cory
// 2026-10-15: "why are there still symbols here. just simplify visual language everywhere"); everything else is a
// word. This finds what came back (design pod, 2026-10-15):
//  - a retired mark component (svg[data-mark] other than the follower buy's arrow), or a picture on a wheel panel;
//  - a resource glyph that isn't the plain dot (any shape other than the disc or the four-quarter "any" dot);
//  - a retired symbol typed into visible text (◆ ◍ ◐ ⛤ ▯ ↻ ⇄ ☺ ★ ✓ ✔ ↶ ⬡ ⬢ ♦), panels included;
//  - a dot standing for something that isn't a resource: a player's color dot in the since-strip or a card's owner line;
//  - a browser tooltip (title) on something that has its own hover card (it sat on top of the card, saying it twice).
// Usage: const bad = await page.evaluate(LEGACY);  // -> ['text "✓ Kickback" in span.tick', …]
export const LEGACY = () => {
  const out = [];
  const vis = e => { for (let a = e; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const cls = e => `${e.tagName.toLowerCase()}${e.getAttribute && e.getAttribute('class') ? '.' + e.getAttribute('class').trim().split(/\s+/)[0] : ''}`;
  for (const e of document.querySelectorAll('svg[data-mark]:not([data-mark="arrow"])')) if (vis(e)) out.push(`retired mark "${e.dataset.mark}" in ${cls(e.parentElement)}`);
  for (const e of document.querySelectorAll('[data-spaces="panels"] .slot .face .ico')) if (vis(e)) out.push(`a picture on panel ${e.closest('.slot').dataset.slot}`);
  for (const e of document.querySelectorAll('svg.res-glyph')) {
    if (!vis(e)) continue;
    // (a white pearl's gradient <defs> and the "any" dot's hairline cross are part of the plain dot, not a shape)
    const shapes = [...e.children].filter(c => c.tagName !== 'title' && c.tagName !== 'defs' && !(c.getAttribute('class') || '').includes('any-cross'));
    const ok = shapes.every(c => c.tagName === 'path' || c.tagName === 'circle') && shapes.filter(c => c.tagName === 'path').length <= 4;
    if (!ok) out.push(`resource glyph "${e.dataset.resGlyph}" is not the plain dot (${shapes.map(c => c.tagName).join(',')})`);
  }
  const SYM = /[◆◍◐⛤▯↻⇄☺★✓✔↶⬡⬢♦]/u;
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('script, style, textarea, [data-legacy-ok]')) continue;
    const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
    if (!SYM.test(t) || !vis(e)) continue;
    out.push(`text "${t.trim().slice(0, 30)}" in ${cls(e)}`);
  }
  for (const e of document.querySelectorAll('.lt-since .dot, .mc .owner > i')) if (vis(e)) out.push(`a color-only player dot in ${cls(e.parentElement)}`);
  for (const e of document.querySelectorAll('[data-region="shop"] .card[title], .cs-head[title], [data-leader-ring][title], .rim-hit > title')) out.push(`a browser tooltip on ${cls(e.tagName === 'title' ? e.parentElement : e)} (it has its own hover card)`);
  return [...new Set(out)];
};
