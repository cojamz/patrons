// In-page check: no text is cut off. Every visible element that holds text directly is checked:
//  - a box (block, flex, grid, inline-block…) whose content is wider than the box (scrollWidth > clientWidth), and
//  - any text element that sticks out sideways past its nearest ancestor that clips (overflow hidden/clip).
// Scroll containers (overflow auto/scroll) are not clipping: their content is reachable by scrolling.
// Exempt: [data-clip-ok] (an intentional one-line summary whose full text is one tap away, e.g. the log ticker),
// aria-hidden parts, and moving ghosts (.flight, .worker-flight, .floater).
// Usage: const cut = await page.evaluate(TEXT_CLIP);  // -> ["tag.class \"text…\" (why)", …]
export const TEXT_CLIP = () => {
  const out = [];
  const seen = new Set();
  const cls = e => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''}`;
  const visible = e => {
    for (let a = e; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  const els = document.querySelectorAll('body *');
  for (const e of els) {
    if (e instanceof SVGElement) continue;
    if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    if (e.closest('[aria-hidden="true"], [data-clip-ok], .flight, .worker-flight, .floater, script, style')) continue;
    if (!visible(e)) continue;
    const s = getComputedStyle(e);
    const txt = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 36);
    const tag = `${cls(e)} "${txt}"`;
    if (s.display !== 'inline' && !/(auto|scroll)/.test(s.overflowX) && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1) {
      if (!seen.has(tag)) { seen.add(tag); out.push(`${tag} is ${e.scrollWidth - e.clientWidth}px wider than its box`); }
      continue;
    }
    const b = e.getBoundingClientRect();
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (/(auto|scroll)/.test(as.overflowX)) break; // reachable by scrolling
      if (/(hidden|clip)/.test(as.overflowX)) {
        const c = a.getBoundingClientRect();
        if (b.left < c.left - 1 || b.right > c.right + 1) { if (!seen.has(tag)) { seen.add(tag); out.push(`${tag} is cut by ${cls(a)}`); } }
        break;
      }
    }
  }
  return out;
};
