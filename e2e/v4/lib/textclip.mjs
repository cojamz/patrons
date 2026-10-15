// In-page check: no text is cut off or spills out of its box. For every visible element that holds text directly,
// the text itself is measured (a Range over its text nodes, so ellipsis and line clamps don't hide it) and must fit
// sideways inside:
//  - its own box, or for inline text the nearest box around it (the chip, the button, the card), and
//  - every ancestor that clips (overflow hidden/clip) up to the nearest scroll container, and the screen.
// Scroll containers (overflow-x auto/scroll) are fine: their content is reachable by scrolling.
// Exempt: [data-clip-ok] (an intentional one-line summary whose full text is one tap away, e.g. the log ticker),
// aria-hidden parts, screen-reader-only text (a 1px box or clip-path inset(50%), shown on focus), and moving ghosts
// (.flight, .worker-flight, .floater). The wheel's panel faces are aria-hidden (the space's label says it for screen
// readers) but are read by sight, so their text is checked, and must stay inside its panel (design pod, 2026-10-15).
// Usage: const cut = await page.evaluate(TEXT_CLIP);  // -> ['span.c1 "Most workers…" spills out of div.contest by 12px', …]
export const TEXT_CLIP = () => {
  const out = [];
  const seen = new Set();
  const cls = e => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''}`;
  const visible = e => {
    for (let a = e; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    return true;
  };
  const vw = document.documentElement.clientWidth;
  for (const e of document.querySelectorAll('body *')) {
    if (e instanceof SVGElement) continue;
    const texts = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length) continue;
    const face = e.closest('.slot .face');
    if (e.closest('[data-clip-ok], .flight, .worker-flight, .floater, script, style, option')) continue;
    if (!face && e.closest('[aria-hidden="true"]')) continue;
    if (face && face.closest('[aria-hidden="true"]:not(.face)')) continue;
    if (!visible(e)) continue;
    // screen-reader-only (visually hidden until focused): a 1px box, or clipped to nothing
    const srOnly = (() => { for (let a = e; a && a !== document.body; a = a.parentElement) { const st = getComputedStyle(a); const b = a.getBoundingClientRect(); if (/inset\(50%\)/.test(st.clipPath) || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(st.clip) || (b.width <= 1 && b.height <= 1 && st.overflow === 'hidden')) return true; } return false; })();
    if (srOnly) continue;
    let L = Infinity, R = -Infinity;
    for (const t of texts) {
      const r = document.createRange();
      r.selectNodeContents(t);
      for (const q of r.getClientRects()) if (q.width > 0) { L = Math.min(L, q.left); R = Math.max(R, q.right); }
    }
    if (!(R > L)) continue;
    const txt = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 36);
    const tag = `${cls(e)} "${txt}"`;
    const fail = why => { if (!seen.has(tag)) { seen.add(tag); out.push(`${tag} ${why}`); } };
    // the box the text belongs to: itself, or the nearest non-inline ancestor
    let box = e;
    while (box && box !== document.body && getComputedStyle(box).display === 'inline') box = box.parentElement;
    let scrolled = false;
    for (let a = box; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (/(auto|scroll)/.test(s.overflowX)) { scrolled = true; break; }
      const c = a.getBoundingClientRect();
      const pad = a === box ? (parseFloat(s.borderLeftWidth) || 0) : 0;
      const padR = a === box ? (parseFloat(s.borderRightWidth) || 0) : 0;
      if (a === box && (L < c.left + pad - 1 || R > c.right - padR + 1)) { fail(`spills out of its box ${cls(a)} by ${Math.round(Math.max(c.left + pad - L, R - c.right + padR))}px`); break; }
      if (a !== box && /(hidden|clip)/.test(s.overflowX) && (L < c.left - 1 || R > c.right + 1)) { fail(`is cut by ${cls(a)} by ${Math.round(Math.max(c.left - L, R - c.right))}px`); break; }
      // a wheel panel's words stay on its paper
      if (a !== box && a.matches('.slot') && (L < c.left - 1 || R > c.right + 1)) { fail(`runs off its panel ${a.dataset.slot || ''} by ${Math.round(Math.max(c.left - L, R - c.right))}px`); break; }
    }
    if (!scrolled && !seen.has(tag) && (L < -1 || R > vw + 1)) {
      // off screen sideways is only fine inside something that scrolls sideways
      const fixed = (() => { for (let a = e; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false; })();
      if (fixed || document.documentElement.scrollWidth <= vw) fail(`runs off the screen by ${Math.round(Math.max(-L, R - vw))}px`);
    }
  }
  return out;
};
