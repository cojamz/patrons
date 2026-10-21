// The table's type scale (design pod, 2026-10-15; art director's game-screen scale): every visible word is one of four
// sizes, 11 (small print), 14 (text), 18 (titles, names, totals) or 36 (the big number or name). The wheel's panel
// faces fit their own sizes to each panel (Wheel.jsx panelLayout, gated by spaces.mjs s7) and are left out, as are
// screen-reader-only words. Shop cards' printed costs and follower worth are left out too: Cory asked for them
// larger (2026-10-19, 16px footers; the follower card's big printed number), a card face like the wheel's. Run in the page: page.evaluate(TYPE_SCALE) → ["15px div.menu-list>button "How to play"", …].
export const TYPE_SCALE = () => {
  const ALLOWED = [11, 14, 18, 36];
  const vis = e => { for (let a = e; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false; } const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 && b.top < innerHeight && b.left < innerWidth && b.bottom > 0 && b.right > 0; };
  const cls = e => `${e.tagName.toLowerCase()}${e.getAttribute && e.getAttribute('class') ? '.' + e.getAttribute('class').trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const path = e => { const out = []; for (let a = e; a && a !== document.body && out.length < 3; a = a.parentElement) out.unshift(cls(a)); return out.join('>'); };
  const out = new Map();
  for (const e of document.querySelectorAll('body *')) {
    if (e instanceof SVGElement && e.tagName !== 'text') continue;
    const texts = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length || !vis(e)) continue;
    if (e.closest('[aria-hidden="true"], .wheel-paper, [data-spaces] .face, [data-intro], [data-recovery], script, style, option')) continue;
    if (e.closest('.lt-card .ft, .lt-rate .rt-trade')) continue;
    const r = e.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    const fs = Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
    if (ALLOWED.includes(fs)) continue;
    const k = `${fs}px ${path(e)}`;
    if (!out.has(k)) out.set(k, texts.map(t => t.textContent).join('').trim().slice(0, 30));
  }
  return [...out].map(([k, v]) => `${k} "${v}"`);
};
