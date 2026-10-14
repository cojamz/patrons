// Cults cult leaders: one robed, hooded figure per player, 32×32 (bigger than 24×24 members and 16×16 minions).
// The robe takes the seat's muted accent colour; a gold medallion on the chest carries the player's emoji
// (its 8×8 emblem from emojis.js, drawn 1:1, never a shrunk minion). Also the follower mark (10×10), the smallest
// figure, so every size in "leader 32 > member 24 > minion 16 > follower 10" lives in one place.
// Keys in LEADER:
//   .  transparent   k  ink (the renderer adds the 1px outer outline)
//   1 2 3  accent shade / base / highlight (the seat colour)
//   d  hood shadow   o  eye glow   g y G  gold base / light / shade   m  medallion ground (the emblem sits on it)
// The medallion fills the 12×12 box at x 10–21, y 17–28 (PANEL, the same box as src/v4/art/figures.js
// LEADER_PANEL), and the emblem goes 1:1 at x 12–19, y 19–26 (EMBLEM).
// Needs emojis.js loaded first. Classic script (works from file:// and in node): sets globalThis.CultLeaders.
(function (g) {
  const M = g.CultMinions || (typeof require === 'function' ? require('./emojis.js') : null);
  const TABLE = '#1d1611';
  const BASE = { k: M.INK, d: '#1a120e', o: '#ffd978', g: '#d9a63a', y: '#f6d77e', G: '#8f6516', m: '#20160f' };
  // Muted seat colours: robes stay quieter than the emoji on the chest. Never pure white (a white hooded robe reads wrong).
  const SEAT_ACCENTS = {
    plum: '#86587e', slate: '#5e7a8c', clay: '#a8644a', moss: '#6e7d4a', teal: '#4c8077', rose: '#a45a64',
  };
  const PANEL = { x: 10, y: 17, size: 12 };
  const EMBLEM = { x: 12, y: 19, size: 8 };

  const LEADER = [
    '................................',
    '..............3321..............',
    '............33332221............',
    '...........3333322221...........',
    '..........332111111221..........',
    '..........331dddddd121..........',
    '.........331dddddddd121.........',
    '.........321dddddddd121.........',
    '.........321dooddood121.........',
    '.........321dddddddd121.........',
    '.........321dddddddd121.........',
    '.........3221dddddd1221.........',
    '........3222211111122221........',
    '.......3222g22222222g2221.......',
    '......31111g11111111g11111......',
    '.....3222222g222222g2222221.....',
    '.....3221222g222222g2221221.....',
    '....32221222yyyyyyyy22212221....',
    '....3222122ymmmmmmmmy2212221....',
    '....322212ymmmmmmmmmmg212221....',
    '....322212ymmmmmmmmmmg212221....',
    '....322212ymmmmmmmmmmg212221....',
    '....322212ymmmmmmmmmmG212221....',
    '....322212ymmmmmmmmmmG212221....',
    '....322212gmmmmmmmmmmG212221....',
    '....322212gmmmmmmmmmmG212221....',
    '....322212gmmmmmmmmmmG212221....',
    '....ygggg22GmmmmmmmmG22ygggg....',
    '....32222222GGGGGGGG22222221....',
    '...32222222222222222222222221...',
    '...11111111111111111111111111...',
    '................................',
  ];

  // Follower mark: a tiny cream person, the unit of score. 10×10 with the same outline rule.
  const FOLLOWER = [
    '..........',
    '....ww....',
    '...wwwc...',
    '...wwwc...',
    '....cc....',
    '..wwwwwc..',
    '.wwwwwwwc.',
    '.wwwwwwwc.',
    '.cccccccc.',
    '..........',
  ];
  const FOLLOWER_PAL = { k: M.INK, w: '#f6eedb', c: '#cbbd9c' };

  function mix(a, b, t) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function accentPalette(accent) {
    const base = SEAT_ACCENTS[accent] || (/^#[0-9a-f]{6}$/i.test(accent || '') ? accent : SEAT_ACCENTS.slate);
    return { ...BASE, 1: mix(base, TABLE, 0.45), 2: base, 3: mix(base, '#f6eedb', 0.38) };
  }

  function validate() {
    const errs = [];
    const keys = new Set(['.', ...Object.keys(BASE), '1', '2', '3']);
    if (LEADER.length !== 32) errs.push(`leader: ${LEADER.length} rows, want 32`);
    LEADER.forEach((row, y) => {
      if (row.length !== 32) errs.push(`leader row ${y}: ${row.length} chars, want 32`);
      [...row].forEach((ch, x) => { if (!keys.has(ch)) errs.push(`leader row ${y} col ${x}: unknown key "${ch}"`); });
    });
    const edge = LEADER[0] + LEADER[31] + LEADER.map(r => r[0] + r[31]).join('');
    if (/[^.k]/.test(edge)) errs.push('leader: fill touches the border');
    for (let y = EMBLEM.y; y < EMBLEM.y + 8; y++) for (let x = EMBLEM.x; x < EMBLEM.x + 8; x++)
      if (LEADER[y][x] !== 'm') errs.push(`leader: emblem cell ${x},${y} is "${LEADER[y][x]}", want medallion ground m`);
    if (FOLLOWER.length !== 10 || FOLLOWER.some(r => r.length !== 10)) errs.push('follower: want 10×10');
    if (/[^.k]/.test(FOLLOWER[0] + FOLLOWER[9] + FOLLOWER.map(r => r[0] + r[9]).join(''))) errs.push('follower: fill touches the border');
    return errs.concat(M.validateAll());
  }

  const svgOpen = (w, size, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${label}"><title>${label}</title>`;

  // leaderSVG('santa', 'plum', 64): the robe in the seat accent (a SEAT_ACCENTS name or #hex), the emoji on the medallion.
  function leaderSVG(emojiId, accent = 'slate', size = 32) {
    const m = emojiId ? M.byId(emojiId) : null;
    const label = m ? `${m.name}'s cult leader` : 'Cult leader';
    const body = M.rects(M.withOutline(LEADER), accentPalette(accent));
    const em = m ? M.rects(m.em, M.palette(m), EMBLEM.x, EMBLEM.y) : '';
    return `${svgOpen(32, size, label)}${body}${em}</svg>`;
  }
  function followerSVG(size = 10) {
    return `${svgOpen(10, size, 'Follower')}${M.rects(M.withOutline(FOLLOWER), FOLLOWER_PAL)}</svg>`;
  }

  const api = { LEADER, FOLLOWER, PANEL, EMBLEM, SEAT_ACCENTS, accentPalette, validate, leaderSVG, followerSVG };
  g.CultLeaders = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
