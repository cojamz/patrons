// Shared kit for the language plates: the glyph alphabet, sprite helpers and small DOM helpers.
// Classic script; load after ../pixel-art/{icons,icons-gold-red-guests,icons-blue-white-green-purple,emojis,leaders}.js
(function (g) {
  // The alphabet. Every glyph is drawn on a 16-unit grid; strokes are 2 units with round ends.
  const SYMBOLS = `
    <symbol id="dot" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.25" fill="var(--c)"/><circle cx="8" cy="8" r="5.75" fill="none" stroke="rgba(30,18,8,.28)" stroke-width="1"/></symbol>
    <symbol id="any" viewBox="0 0 16 16">
      <path d="M8 8 L3.58 3.58 A6.25 6.25 0 0 1 12.42 3.58 Z" fill="var(--gold)"/>
      <path d="M8 8 L12.42 3.58 A6.25 6.25 0 0 1 12.42 12.42 Z" fill="var(--blue)"/>
      <path d="M8 8 L12.42 12.42 A6.25 6.25 0 0 1 3.58 12.42 Z" fill="var(--green)"/>
      <path d="M8 8 L3.58 12.42 A6.25 6.25 0 0 1 3.58 3.58 Z" fill="var(--red)"/>
      <circle cx="8" cy="8" r="5.75" fill="none" stroke="rgba(30,18,8,.28)" stroke-width="1"/></symbol>
    <symbol id="fol" viewBox="0 0 16 16"><circle cx="8" cy="4.4" r="3" fill="currentColor"/><path d="M2.4 15.2 C2.4 10.6 4.9 8.6 8 8.6 C11.1 8.6 13.6 10.6 13.6 15.2 Z" fill="currentColor"/></symbol>
    <symbol id="mem" viewBox="0 0 16 16"><rect x="3" y="1.5" width="10" height="13" rx="2" fill="none" stroke="var(--c,currentColor)" stroke-width="2"/><circle cx="8" cy="6.2" r="1.9" fill="var(--c,currentColor)"/><path d="M5 12 C5 10 6.3 9 8 9 C9.7 9 11 10 11 12 Z" fill="var(--c,currentColor)"/></symbol>
    <symbol id="min" viewBox="0 0 16 16"><path fill="currentColor" d="M8 1 A2.9 2.9 0 0 1 10.6 5.2 C12.6 5.6 14.6 6.3 14.6 7.9 C14.6 9 13.6 9.4 12 9.6 L13.6 13.6 C13.9 14.4 13.5 15 12.7 15 H9.8 L8 12.2 L6.2 15 H3.3 C2.5 15 2.1 14.4 2.4 13.6 L4 9.6 C2.4 9.4 1.4 9 1.4 7.9 C1.4 6.3 3.4 5.6 5.4 5.2 A2.9 2.9 0 0 1 8 1 Z"/></symbol>
    <symbol id="riv" viewBox="0 0 16 16"><path fill-rule="evenodd" fill="currentColor" d="M8 1 C11.7 1 13.4 4.4 13.4 8.6 L14.4 15 H1.6 L2.6 8.6 C2.6 4.4 4.3 1 8 1 Z M8 5.4 C6.5 5.4 5.6 6.8 5.6 8.6 C5.6 10.4 6.5 11.6 8 11.6 C9.5 11.6 10.4 10.4 10.4 8.6 C10.4 6.8 9.5 5.4 8 5.4 Z"/></symbol>
    <symbol id="arr" viewBox="0 0 16 16"><path d="M2 8 H13 M9 4 L13 8 L9 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="turn" viewBox="0 0 16 16"><path d="M13 8 A5 5 0 1 1 10.5 3.67" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8.6 1.6 L11.4 3.4 L9.6 6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>`;
  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sprite.setAttribute('width', 0); sprite.setAttribute('height', 0); sprite.style.position = 'absolute';
  sprite.innerHTML = `<defs>${SYMBOLS}</defs>`;
  document.addEventListener('DOMContentLoaded', () => document.body.prepend(sprite));

  const COL = { gold: 'var(--gold)', red: 'var(--red)', blue: 'var(--blue)', green: 'var(--green)' };
  const gl = (id, c) => `<svg class="g" style="${c ? `--c:${COL[c] || c}` : ''}"><use href="#${id}"/></svg>`;
  const memberIcon = id => Object.values(g.CultIconBatches || {}).flat().find(i => i.id === id);
  const K = {
    COL, g: gl,
    dot: c => gl('dot', c),
    n: t => `<span class="n">${t}</span>`,
    op: t => `<span class="op">${t}</span>`,
    sp: '<span class="gap"></span>',
    portrait(id, size) { const i = memberIcon(id); return g.CultIcons.toSVG({ ...i, px: i.px || i.rows }, size, { title: false }).replace('<svg ', '<svg class="px" '); },
    minion: (id, size) => g.CultMinions.toSVG(id, size, { title: false }).replace('<svg ', '<svg class="px" '),
    leader: (id, accent, size) => g.CultLeaders.leaderSVG(id, accent, size).replace('<svg ', '<svg class="px" '),
    el(html, style, cls, parent) { const d = document.createElement('div'); if (cls) d.className = cls; d.style.cssText = style || ''; d.innerHTML = html; (parent || document.getElementById('ui')).appendChild(d); return d; },
    svg(tag, attrs, parent) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || document.getElementById('board')).appendChild(e); return e; },
  };
  g.Kit = K;
})(window);
