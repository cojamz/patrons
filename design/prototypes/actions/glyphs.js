// Option 1's picture language: what you get, drawn as the game's own objects (resource chips in their shapes,
// member cards, rivals' hoods, price tags), big enough to count without reading. Every glyph is an inline SVG sized
// in px from a base unit u (the chip size of that ring).
(function () {
  const { SHAPES, INK, mix } = AK;
  const INKC = '#2a1f17', CARD = '#f8f0dd', HOOD = '#5f4e3d', YOU = '#d9a441';
  let uid = 0;
  const svg = (w, h, body, vb = `0 0 ${w} ${h}`, cls = '') => `<svg class="g ${cls}" viewBox="${vb}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;

  /** A resource chip: its shape, lit from the top, with a thickness under it. n prints a numeral on it. */
  function tok(r, u, n = null, ghost = false) {
    const id = `t${uid++}`;
    const base = INK[r], top = mix(base, '#ffffff', 0.28), deep = mix(base, '#000000', 0.45);
    const body = ghost
      ? `<path d="${SHAPES[r]}" fill="none" stroke="${INKC}" stroke-width="1" stroke-dasharray="1.6 1.2" opacity=".55"/>`
      : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${base}"/></linearGradient></defs>
         <path d="${SHAPES[r]}" transform="translate(0 1.3)" fill="${deep}"/>
         <path d="${SHAPES[r]}" fill="url(#${id})" stroke="${INKC}" stroke-width="1" stroke-linejoin="round"/>
         ${r === 'gold' ? '<path d="M8 4.2a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6Z" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' : ''}
         ${n != null ? `<text x="8" y="${r === 'red' ? 10.9 : 8.6}" text-anchor="middle" dominant-baseline="central" font-family="Alegreya Sans" font-weight="800" font-size="${n > 9 ? 7.5 : 9}" fill="#fff8ea" stroke="${INKC}" stroke-width="1.6" paint-order="stroke">${n}</text>` : ''}`;
    return svg(u, u * 17.3 / 16, body, '0 0 16 17.3', 'tok');
  }
  /** n chips of a resource, fanned like a short stack; four or more become one big chip with the count on it. */
  function chips(r, n, u, ghost = false) {
    if (n >= 4) return `<span class="chips big">${tok(r, u * 1.3, n, ghost)}</span>`;
    return `<span class="chips">${Array.from({ length: n }, () => tok(r, u, null, ghost)).join('')}</span>`;
  }
  /** A member, as a small card with a figure on it. mark: '◆' badged, '+' newly recruited, '★' your priciest. */
  function card(u, { back = false, mark = null, rival = false, raised = false } = {}) {
    const w = 12, h = 16;
    let b = `<rect x="1.2" y="${raised ? 0.6 : 1.2}" width="${w - 2.4}" height="${h - 2.4}" rx="1.8" fill="${back ? '#6b4f38' : CARD}" stroke="${INKC}" stroke-width="1"/>`;
    if (back) b += `<path d="M3.4 4.2h5.2M3.4 7.2h5.2M3.4 10.2h5.2" stroke="#a07a55" stroke-width=".9"/>`;
    else b += `<circle cx="6" cy="6.4" r="1.9" fill="${rival ? HOOD : '#9a8466'}"/><path d="M2.8 13.2c0-2.6 1.4-4 3.2-4s3.2 1.4 3.2 4z" fill="${rival ? HOOD : '#9a8466'}"/>`;
    if (mark === '◆') b += `<path d="M9.6 1.2l2.2 2.4-2.2 2.4-2.2-2.4z" fill="${INK.blue}" stroke="${INKC}" stroke-width=".7"/>`;
    if (mark === '+') b += `<circle cx="10" cy="3" r="2.6" fill="${YOU}" stroke="${INKC}" stroke-width=".7"/><path d="M10 1.6v2.8M8.6 3h2.8" stroke="${INKC}" stroke-width=".9"/>`;
    if (mark === '★') b += `<path d="M10 .6l.8 1.7 1.8.2-1.3 1.2.4 1.8-1.7-.9-1.7.9.4-1.8-1.3-1.2 1.8-.2z" fill="${YOU}" stroke="${INKC}" stroke-width=".6"/>`;
    return svg(u * 0.78, u * 1.04, b, `0 0 ${w} ${h}`, 'card');
  }
  /** A price tag with a few characters on it ("−4", "½", "free"). */
  function tag(text, u) {
    const w = text.length > 2 ? 2.15 * u : 1.45 * u, h = 0.82 * u;
    const body = `<path d="M${h * 0.42} 0.6H${w - 1.4}a.8.8 0 0 1 .8.8V${h - 1.4}a.8.8 0 0 1-.8.8H${h * 0.42}L0.8 ${h / 2}Z" fill="#7a2f22" stroke="${INKC}" stroke-width="1"/>
      <circle cx="${h * 0.42}" cy="${h / 2}" r="1.3" fill="#f4ebd7"/>
      <text x="${(w + h * 0.5) / 2 + 0.4}" y="${h / 2 + 0.4}" text-anchor="middle" dominant-baseline="central" font-family="Alegreya Sans" font-weight="800" font-size="${u * 0.62}" fill="#fff6e4">${text}</text>`;
    return svg(w, h, body, `0 0 ${w} ${h}`, 'tag');
  }
  /** A cult's hood: a rival (dark) or yours (lamp gold). */
  function hood(u, you = false) {
    const f = you ? YOU : HOOD;
    const b = `<path d="M8 1.2C4.6 1.2 2.6 4.4 2.6 8.2V14.6H13.4V8.2C13.4 4.4 11.4 1.2 8 1.2Z" fill="${f}" stroke="${INKC}" stroke-width="1"/><path d="M8 5C6.1 5 5.2 6.6 5.2 8.6V11.4H10.8V8.6C10.8 6.6 9.9 5 8 5Z" fill="#1c1410"/><rect x="6.2" y="8.2" width="1.2" height="1" fill="#ffd978"/><rect x="8.6" y="8.2" width="1.2" height="1" fill="#ffd978"/>`;
    return svg(u * 0.9, u * 0.9, b, '0 0 16 16', 'hood');
  }
  /** A short arrow (→, ←, ↓) or a swap (⇄) or a sweep (↻), in ink. */
  function arrow(kind, u) {
    const s = `stroke="${INKC}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    const P = {
      right: `<path d="M2 8H13M9.5 4.5L13 8L9.5 11.5" ${s}/>`,
      left: `<path d="M14 8H3M6.5 4.5L3 8L6.5 11.5" ${s}/>`,
      down: `<path d="M8 2V13M4.5 9.5L8 13L11.5 9.5" ${s}/>`,
      take: `<path d="M13 4C9 2.5 4 4 3.5 9.5M1 7L3.5 10L6 7.2" ${s}/>`,
      swap: `<path d="M2.5 5.5H13M10 2.5L13 5.5L10 8.5M13.5 10.5H3M6 7.5L3 10.5L6 13.5" ${s}/>`,
      sweep: `<path d="M12.6 5.4A5.4 5.4 0 1 0 13.3 9.6M13.6 2.4V5.8H10.2" ${s}/>`,
    };
    return svg(u * 0.7, u * 0.7, P[kind], '0 0 16 16', 'arr');
  }
  /** Copy: a space and its echo (a solid tray in front of a dashed one). */
  function copy(u, n = 1) {
    const one = (dx, dy) => `<rect x="${1.5 + dx}" y="${1.5 + dy}" width="9" height="8" rx="2" fill="none" stroke="${INKC}" stroke-width="1" stroke-dasharray="1.8 1.3"/><rect x="${5.5 + dx}" y="${6 + dy}" width="9" height="8" rx="2" fill="${mix(INK.green, '#ffffff', 0.35)}" stroke="${INKC}" stroke-width="1.1"/><path d="M${8 + dx} ${10 + dy}h4M${10 + dx} ${8 + dy}v4" stroke="${INKC}" stroke-width="1" opacity="0"/>`;
    return svg(u * 1.0, u * 1.0, one(0, 0), '0 0 16 16', 'copy') + (n > 1 ? svg(u * 1.0, u * 1.0, one(0, 0), '0 0 16 16', 'copy') : '');
  }
  /** "Grows by round": three stacks rising, this round's filled. */
  function grows(u, now = 1, r = null) {
    let b = '';
    const f = r ? INK[r] : INKC;
    [3, 6, 9].forEach((h, i) => { b += `<rect x="${1 + i * 5}" y="${11 - h}" width="3.6" height="${h}" rx=".8" fill="${i < now ? f : 'none'}" stroke="${INKC}" stroke-width=".9" stroke-dasharray="${i < now ? 'none' : '1.4 1'}" opacity="${i < now ? 1 : .75}"/>`; });
    return svg(u * 0.95, u * 0.62, b, '0 0 16 11.6', 'grows');
  }
  const word = (t, cls = '') => `<span class="w ${cls}">${t}</span>`;

  /** What each space gives, as objects. Lines stack top to bottom; the first line is the main yield. */
  function bounty(a, u, ghost = false) {
    const c = (r, n) => chips(r, n, u, ghost), s = u * 0.82;
    const L = (...xs) => `<span class="ln">${xs.join('')}</span>`;
    const small = (...xs) => `<span class="ln sm">${xs.join('')}</span>`;
    switch (a.id) {
      case 'gold.jv': return L(c('gold', 3)) + small(tok('gold', s * 0.8), arrow('right', s), hood(s));
      case 'gold.rush': return L(c('gold', 2)) + small(grows(s, 1, 'gold'));
      case 'gold.discount': return L(card(u * 1.25), tag('−4', u));
      case 'gold.steal': return L(c('gold', 3)) + small(hood(s), arrow('take', s));
      case 'gold.windfall': return L(tok('gold', u), word('/', 'per'), card(u * 1.1));
      case 'gold.strike': return L(word('×2', 'big'), c('gold', 1));
      case 'red.scout': return L(c('red', 2)) + small(card(s * 1.1, { back: true }), arrow('down', s));
      case 'red.turnout': return L(tok('red', u), word('/', 'per'), card(u * 1.1, { mark: '+' }));
      case 'red.hire': return L(card(u * 1.25), tag('free', u * 0.82));
      case 'red.hireup': return L(c('red', 2)) + small(card(s * 1.1), tag('free', s * 0.82));
      case 'red.trade': return L(card(u * 1.1), arrow('swap', u), card(u * 1.1, { rival: true }));
      case 'red.take': return L(card(u, { raised: true }), card(u * 1.1, { mark: '★' }), tag('free', u * 0.82));
      case 'blue.bargain': return L(c('blue', 2)) + small(card(s * 1.1, { mark: '+' }));
      case 'blue.restock': return L(c('blue', 2)) + small(card(s), card(s), card(s), arrow('sweep', s));
      case 'blue.showroom': return L(tok('blue', u), word('/', 'per'), card(u * 1.1, { mark: '◆' }));
      case 'blue.clearance': return L(card(u * 1.25), tag('½', u));
      case 'blue.pricecheck': return L(tok('blue', u), word('=', 'per'), word('½', 'big'), card(u * 1.1, { mark: '★' }));
      case 'blue.spree': return L(word('×3', 'big'), card(u * 1.1, { mark: '+' }));
      case 'green.hum': return L(c('green', 3));
      case 'green.chant': return L(c('green', 2)) + small(grows(s, 1, 'green'));
      case 'green.echo': return L(hood(u), copy(u));
      case 'green.encore': return L(copy(u), word('any', 'qual'));
      case 'green.refrain': return L(c('green', 2)) + small(copy(s), hood(s, true));
      case 'green.eternity': return L(copy(u), copy(u), hood(u * 0.9, true));
    }
    return '';
  }
  window.G1 = { tok, chips, card, tag, hood, arrow, copy, grows, bounty };
})();
