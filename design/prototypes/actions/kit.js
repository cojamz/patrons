// Shared kit for the action-space mocks: palette, pixel sprites as crisp SVG, the real table (Gold, Red, Blue
// market, Green echo), the frozen game state, wheel geometry, the rim with inline leader emojis, and the laptop frame
// (the real build's screenshot with the old wheel cut out). Plain script for file:// pages: everything on window.AK.
(function () {
  const A = window.ART;
  const TABLE = '#101817';
  const mix = (a, b, t) => {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const X = p(a), Y = p(b);
    return '#' + X.map((v, i) => Math.round(v + (Y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  function palette(sphere) {
    const base = A.SPHERES[sphere] || (/^#[0-9a-f]{6}$/i.test(sphere || '') ? sphere : A.SPHERES.colorless);
    return { ...A.NEUTRALS, 1: mix(base, TABLE, 0.48), 2: base, 3: mix(base, '#fff8ec', 0.5) };
  }
  function withOutline(px, ink = 'k') {
    const H = px.length, W = px[0].length;
    const filled = (x, y) => y >= 0 && y < H && x >= 0 && x < W && px[y][x] !== '.' && px[y][x] !== 'k';
    return px.map((row, y) => [...row].map((ch, x) => (ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? ink : ch)).join(''));
  }
  /** Pixel grid → SVG (one rect per run). pal maps chars to fills; fills may be null (skip). */
  function gridSVG(px, pal, size, { outline = true, cls = '', style = '', title = '' } = {}) {
    const g = outline ? withOutline(px) : px;
    const W = g[0].length, H = g.length;
    let s = '';
    g.forEach((r, y) => {
      let x = 0;
      while (x < r.length) {
        const ch = r[x]; let w = 1;
        while (r[x + w] === ch) w++;
        const f = ch !== '.' && ch !== ' ' ? pal[ch] : null;
        if (f) s += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${f}"/>`;
        x += w;
      }
    });
    const h = size * H / W;
    return `<svg class="px ${cls}" viewBox="0 0 ${W} ${H}" width="${size}" height="${h}" shape-rendering="crispEdges" style="${style}" aria-hidden="true">${title ? `<title>${title}</title>` : ''}${s}</svg>`;
  }
  const actionIcon = (id, sphere, size = 24, opts = {}) => {
    const i = A.ACTIONS[id];
    return gridSVG(i.px, i.palette ? { ...A.NEUTRALS, ...i.palette } : palette(sphere), size, opts);
  };
  const emoji = (id, size = 16, opts = {}) => {
    const e = A.EMOJI[id];
    return gridSVG(e.px, { ...A.NEUTRALS, ...e.palette }, size, opts);
  };

  // ---------- resource shapes (the app's own: src/v4/game/Glyphs.jsx) ----------
  const SHAPES = {
    gold: 'M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13Z',
    red: 'M8 1.5C10.5 5 13 7.6 13 10.2A5 5 0 0 1 3 10.2C3 7.6 5.5 5 8 1.5Z',
    blue: 'M3 3H13V13H3Z',
    green: 'M13.5 2.5C13.5 9 10 13.5 3 13.5C3 7 6.5 2.5 13.5 2.5Z',
  };
  const INK = { gold: '#c99327', red: '#b4533e', blue: '#4f7ea8', green: '#3d8c66' };
  /** A resource as its shape in its color (flat, like the build's chips). */
  function res(r, size = 16, { stroke = '#2a1f17', sw = 1.1, opacity = 1, fill = null } = {}) {
    return `<svg class="res" viewBox="0 0 16 16" width="${size}" height="${size}" style="opacity:${opacity}" aria-hidden="true"><path d="${SHAPES[r]}" fill="${fill || INK[r]}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>${r === 'gold' && !fill ? '<path d="M8 4.2a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6Z" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1"/>' : ''}</svg>`;
  }

  // ---------- the table ----------
  // Quadrant order is the build's default seating: q0 bottom, q1 left, q2 top, q3 right.
  // name: what the space shows; was: today's name; proposal: true when the name is from action-names-calibration.md.
  const Q = [
    { id: 'gold', res: 'gold', name: 'Gold', rule: 'Most gold', actions: [
      { key: 'jv', ring: 1, name: 'Kickback', was: 'Joint Venture', proposal: true, icon: 'joint-venture', text: '+3 gold, and +1 gold to a player you choose.', short: '+3 gold · gift 1' },
      { key: 'rush', ring: 1, name: 'Golden Years', was: 'Rush', proposal: true, icon: 'gold.rush', text: '+2 gold per round number (2 / 4 / 6).', short: '+2 gold' },
      { key: 'discount', ring: 1, name: 'Intro Offer', was: 'Discount', proposal: true, icon: 'gold.discount', text: 'Your next member costs 4 less, off any part of its cost.', short: '−4 cost' },
      { key: 'steal', ring: 2, name: 'Collect Debts', was: 'Steal', proposal: true, icon: 'gold.steal', text: 'Take up to 3 gold from rivals, split however you like.', short: 'steal 3 gold' },
      { key: 'windfall', ring: 2, name: 'Tithe', was: 'Windfall', proposal: true, icon: 'gold.windfall', text: '+1 gold per member you have.', short: '+1 gold/member' },
      { key: 'strike', ring: 3, name: 'Double Down', was: 'Strike', proposal: true, icon: 'strike', text: 'Double your gold.', short: 'double gold' },
    ] },
    { id: 'red', res: 'red', name: 'Red', rule: 'Most members', actions: [
      { key: 'scout', ring: 1, name: 'Turn Away', was: 'Scout', proposal: true, icon: 'red.scout', text: '+2 red, and put a face-up member at the bottom of the pile.', short: '+2 red · bury 1' },
      { key: 'turnout', ring: 1, name: 'Bandwagon', was: 'Turnout', proposal: true, icon: 'red.turnout', text: '+1 red per member recruited this round, by anyone.', short: '+1 red/recruit' },
      { key: 'hire', ring: 1, name: 'Open Door', was: 'Hire', proposal: true, icon: 'red.hire', text: 'Recruit the cheapest face-up member, free.', short: 'cheapest, free' },
      { key: 'hireup', ring: 2, name: 'Open House', was: 'Hire Up', proposal: true, icon: 'red.hireup', text: '+2 red, and recruit the cheapest face-up member, free.', short: '+2 red · cheapest' },
      { key: 'trade', ring: 2, name: 'Swap Sides', was: 'Trade', proposal: true, icon: 'red.trade', text: 'Swap one of your members for another player’s costing no more than yours +2.', short: 'swap a member' },
      { key: 'take', ring: 3, name: 'Hand-pick', was: 'Take', proposal: true, icon: 'red.take', text: 'Take any face-up member, free.', short: 'any member, free' },
    ] },
    { id: 'blue', res: 'blue', name: 'Blue', rule: 'Most badged members', actions: [
      { key: 'bargain', ring: 1, name: 'Bargain', icon: 'market.bargain', text: '+2 blue, then you may recruit a face-up member now, in any colors.', short: '+2 blue · recruit' },
      { key: 'restock', ring: 1, name: 'Restock', icon: 'market.restock', text: '+2 blue, and sweep the face-up row: a fresh row of members comes out.', short: '+2 blue · new row' },
      { key: 'showroom', ring: 1, name: 'Showroom', icon: 'market.showroom', text: '+1 blue per badged face-up member.', short: '+1 blue/badged' },
      { key: 'clearance', ring: 2, name: 'Clearance', icon: 'market.clearance', text: 'As your buy this turn: a face-up member for half its cost (rounded down), in any colors.', short: 'half-price buy' },
      { key: 'pricecheck', ring: 2, name: 'Price Check', icon: 'market.pricecheck', text: 'Gain blue equal to half the cost of your priciest member.', short: 'blue = ½ priciest' },
      { key: 'spree', ring: 3, name: 'Spree', icon: 'market.spree', text: 'This turn you buy 3 times.', short: 'buy 3 times' },
    ] },
    { id: 'green', res: 'green', name: 'Green', rule: 'Most green', actions: [
      { key: 'hum', ring: 1, name: 'Hum', icon: 'echo.hum', text: '+3 green.', short: '+3 green' },
      { key: 'chant', ring: 1, name: 'Chant', icon: 'echo.chant', text: '+2 green per round number (2 / 4 / 6).', short: '+2 green' },
      { key: 'echo', ring: 1, name: 'Echo', icon: 'echo.echo', text: 'Copy a space a rival took since your last turn.', short: 'copy a rival' },
      { key: 'encore', ring: 2, name: 'Encore', icon: 'echo.encore', text: 'Copy any space taken this round.', short: 'copy any' },
      { key: 'refrain', ring: 2, name: 'Refrain', icon: 'echo.refrain', text: '+2 green, and copy one of your spaces from this round.', short: '+2 green · copy yours' },
      { key: 'eternity', ring: 3, name: 'Eternity', icon: 'echo.eternity', text: 'Copy every space you took this round.', short: 'copy all yours' },
    ] },
  ];
  Q.forEach((q, qi) => q.actions.forEach(a => { a.q = qi; a.qid = q.id; a.res = q.res; a.id = `${q.id}.${a.key}`; }));
  const action = id => Q.flatMap(q => q.actions).find(a => a.id === id);

  // ---------- the frozen moment: round I, three rivals have placed, your turn ----------
  // Seats: 0 You (cat, bottom left), 1 P2 (robot, top left), 2 P3 (frog, top right), 3 P4 (ghost, bottom right).
  // Starting picks: You 2 green; P2 2 gold; P3 1 gold 1 red; P4 1 gold 1 red. Then P2 Restock, P3 Golden Years, P4 Chant.
  const SEATS = [
    { name: 'You', emoji: 'cat', res: { gold: 0, red: 0, blue: 0, green: 2 } },
    { name: 'P2', emoji: 'robot', res: { gold: 2, red: 0, blue: 2, green: 0 } },
    { name: 'P3', emoji: 'frog', res: { gold: 3, red: 1, blue: 0, green: 0 } },
    { name: 'P4', emoji: 'ghost', res: { gold: 1, red: 1, blue: 0, green: 2 } },
  ];
  const STATE = {
    round: 1,
    taken: { 'blue.restock': 1, 'gold.rush': 2, 'green.chant': 3 },
    newest: 'green.chant',
    // contest leaders, from the resources above: gold P3 (3); green a tie You & P4 (2 each); members and badged: nobody
    leaders: { gold: [2], red: [], blue: [], green: [0, 3] },
  };

  // ---------- wheel geometry (the build's: src/v4/game/Wheel.jsx) ----------
  // units: the wheel is radius 200; on the laptop frame it is 209px across the radius, centred at (634, 312.5).
  const RING = { 1: { r0: 128, r1: 180, r: 151, n: 3 }, 2: { r0: 82, r1: 128, r: 104, n: 2 }, 3: { r0: 36, r1: 82, r: 58, n: 1 } };
  const RIM = { r0: 180, r1: 200, r: 190 };
  const qCenter = q => 180 + q * 90;
  const polar = (a, r) => { const t = (a - 90) * Math.PI / 180; return [r * Math.cos(t), r * Math.sin(t)]; };
  function arc(a0, a1, r0, r1) {
    const [x0, y0] = polar(a0, r1), [x1, y1] = polar(a1, r1), [x2, y2] = polar(a1, r0), [x3, y3] = polar(a0, r0);
    return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3}Z`;
  }
  /** Each space's angle and centre (units, relative to the wheel centre). ringR overrides ring radii. */
  function spaces(ringR = null, spans = null) {
    const out = [];
    Q.forEach((q, qi) => q.actions.forEach(a => {
      const t = a.ring, R = RING[t];
      const idx = q.actions.filter(x => x.ring === t && q.actions.indexOf(x) < q.actions.indexOf(a)).length;
      const span = spans ? spans[t] || 0 : t === 1 ? 66 : t === 2 ? 40 : 0;
      const c = qCenter(qi);
      const ang = R.n === 1 ? c : (c + span / 2) - idx * (span / (R.n - 1));
      const r = ringR ? ringR[t] : R.r;
      out.push({ a, q: qi, ring: t, ang, xy: polar(ang, r) });
    }));
    return out;
  }

  /** The rim: each quadrant's band, its rule and prize, and the leaders' emojis inline on the same arc (Cory). */
  function rim(scale, { fill = q => INK[q.res], opacity = 0.88, textFill = 'rgba(255,249,236,.96)', font = 11, gap = 6, emojiPx = 16, r0 = RIM.r0, r1 = RIM.r1, extra = '' } = {}) {
    // returns { svg (in units, for the paper layer), html (absolutely placed emoji spans, in px), measure: fn }
    let svg = '', defs = '';
    const r = (r0 + r1) / 2;
    Q.forEach((q, qi) => {
      const c = qCenter(qi), a0 = c - 45, a1 = c + 45;
      svg += `<path d="${arc(a0, a1, r0, r1)}" fill="${fill(q)}" fill-opacity="${opacity}"/>`;
    });
    return { svg, r };
  }
  const roman = n => ['', 'I', 'II', 'III'][n];

  window.AK = { A, mix, palette, withOutline, gridSVG, actionIcon, emoji, res, SHAPES, INK, Q, action, SEATS, STATE, RING, RIM, qCenter, polar, arc, spaces, rim, roman };
})();
