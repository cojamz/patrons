// The token face's art (see token.jsx): a pixel rasterizer for the cardboard token itself, the small pixel marks
// that sit on its symbol strip, and each action's strip (at most 3 symbols, Dune: Imperium's icon line).
// Not a face (a .js file): the registry only loads ./*.jsx.

// ---------- the token body: a disc on a grid of CELL board units (about 2 screen px on the laptop wheel) ----------
export const CELL = 1.5;
/** Cells across per ring: I 30 (45 units), II 34 (51), III 38 (57). Ring I fits its 52-unit band; II and III touch. */
export const RING_G = { 1: 30, 2: 34, 3: 38 };
export const radiusOf = ring => (RING_G[ring] * CELL) / 2;

// the layers from the outside in, by depth in cells: [until, key] (key 'rim' and 'gild' are shaded by the light)
const LAYERS = {
  1: [[1, 'k'], [4, 'rim'], [5, 'k2'], [99, 'field']],
  2: [[1, 'k'], [3, 'rim'], [4, 'cr'], [5.4, 'rim'], [6.4, 'k2'], [99, 'field']],
  3: [[1, 'k'], [3.4, 'gild'], [4.4, 'k'], [6.4, 'rim'], [7.4, 'k2'], [99, 'field']],
};
const LOCKED = { k: 'k', k2: 'b1', cr: 'b3', field: 'b0', rim: 'b2', gild: 'b2' };

const pathCache = new Map();
/**
 * The token as one SVG path per palette key, centred on 0,0 in board units: { key: d }. variant: 'face' (printed),
 * 'lit' (the lamp catches the upper-left edge), 'locked' (the blank cardboard back). Two rows of cardboard edge
 * hang below the disc: the token's thickness.
 */
export function tokenPaths(ring, variant = 'face') {
  const ck = `${ring}|${variant}`;
  if (pathCache.has(ck)) return pathCache.get(ck);
  const G = RING_G[ring], R = G / 2, layers = LAYERS[ring];
  const rows = [];
  for (let y = 0; y < G + 2; y++) {
    const row = [];
    for (let x = 0; x < G; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R, d = Math.hypot(dx, dy);
      let key = null;
      if (d <= R) {
        const t = R - d;
        const nx = dx / (d || 1), ny = dy / (d || 1);
        const light = -(nx + ny) / Math.SQRT2; // 1 = facing the lamp (upper left), -1 = away
        const [, layer] = layers.find(([until]) => t < until);
        if (variant === 'locked') key = LOCKED[layer] === 'b2' ? (light > 0.45 ? 'b3' : light < -0.45 ? 'b1' : 'b2') : LOCKED[layer];
        else if (layer === 'rim') key = light > 0.42 ? 'q3' : light < -0.42 ? 'q1' : 'q2';
        else if (layer === 'gild') {
          const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const rivet = Math.abs(((deg + 15) % 30) - 15) < 3.2 && t > 1.6 && t < 2.9;
          key = rivet ? 'G4' : light > 0.42 ? 'G3' : light < -0.42 ? 'G1' : 'G2';
        } else if (layer === 'field') {
          // a shallow dish: lighter on the upper left just inside the rim, a shade on the lower right
          const inner = layers[layers.length - 2][0];
          key = t < inner + 2.2 && light > 0.55 ? 'p0' : t < inner + 2.6 && light < -0.35 ? 'p2' : 'p';
        } else key = layer;
        if (variant === 'lit' && layer === 'k' && t < 1 && light > -0.35) key = 'L';
        if (variant === 'lit' && layer === 'rim' && light > 0.62 && t < layers[0][0] + 1) key = 'qL';
      } else if (dy > 0 && (Math.hypot(dx, dy - 1) <= R || Math.hypot(dx, dy - 2) <= R)) {
        key = Math.hypot(dx, dy - 1) <= R ? 'e' : 'e2';
      }
      row.push(key);
    }
    rows.push(row);
  }
  const out = {};
  const x0 = -R * CELL, y0 = -R * CELL;
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const k = row[x];
      let w = 1;
      while (row[x + w] === k) w++;
      if (k) out[k] = (out[k] || '') + `M${(x0 + x * CELL).toFixed(2)} ${(y0 + y * CELL).toFixed(2)}h${(w * CELL).toFixed(2)}v${CELL}h${(-w * CELL).toFixed(2)}z`;
      x += w;
    }
  });
  pathCache.set(ck, out);
  return out;
}
/** Paint order: the edge first, then the face. */
export const PAINT = ['e2', 'e', 'k', 'L', 'k2', 'cr', 'q1', 'q2', 'q3', 'qL', 'G1', 'G2', 'G3', 'G4', 'p', 'p0', 'p2', 'b0', 'b1', 'b2', 'b3'];

// ---------- pixel marks for the strip: 7 rows tall, 2 screen px a cell (14px) ----------
// c cream · k ink · h hood · d dark hood · y lamp · g gilt · q the quadrant's ink · G R B N four pip colours
const MARK = {
  m: ['cccccc', 'cckkcc', 'cckkcc', 'cccccc', 'ckkkkc', 'ckkkkc', 'cccccc'], // a member: a card with a bust on it
  mr: ['hhhhhh', 'hhkkhh', 'hhkkhh', 'hhhhhh', 'hkkkkh', 'hkkkkh', 'hhhhhh'], // a rival's member: the same card in shadow
  mlow: ['cccccc...', 'cckkcc...', 'cckkcc...', 'cccccc...', 'ckkkkcyyy', 'ckkkkc.y.', 'cccccc...'], // the cheapest
  mup: ['cccccc.y.', 'cckkccyyy', 'cckkcc...', 'cccccc...', 'ckkkkc...', 'ckkkkc...', 'cccccc...'], // the priciest
  mnew: ['cccccc.y.', 'cckkccyyy', 'cckkcc.y.', 'cccccc...', 'ckkkkc...', 'ckkkkc...', 'cccccc...'], // one more recruit
  r: ['...h...', '..hhh..', '.hhhhh.', 'hhkkkhh', 'hkckckh', 'hkkkkkh', 'hhhhhhh'], // a rival: a pointed hood, two glints
  rup: ['...h...y.', '..hhh.yyy', '.hhhhh...', 'hhkkkhh..', 'hkckckh..', 'hkkkkkh..', 'hhhhhhh..'], // a rival ahead of you
  rtop: ['.g.g.g.', '.ggggg.', '.hhhhh.', 'hhkkkhh', 'hkckckh', 'hkkkkkh', 'hhhhhhh'], // the richest rival (crowned)
  w: ['..ccc..', '..ccc..', 'ccccccc', '.ccccc.', '..ccc..', '.cc.cc.', '.cc.cc.'], // your minion
  wo: ['..hhh..', '..hhh..', 'hhhhhhh', '.hhhhh.', '..hhh..', '.hh.hh.', '.hh.hh.'], // a minion still to place
  copy: ['ccccc..', 'c...c..', 'c.ccccc', 'c.c...c', 'ccc...c', '..c...c', '..ccccc'],
  swap: ['....c..', 'cccccc.', '....c..', '.......', '..c....', '.cccccc', '..c....'],
  turn: ['..ccc.c', '.c...cc', 'c...ccc', 'c......', 'c.....c', '.c...c.', '..ccc..'], // one more turn
  shield: ['ccccccc', 'cqqqqqc', 'cqqqqqc', 'cqqqqqc', '.cqqqc.', '..cqc..', '...c...'],
  row: ['ccc.ccc.ccc', 'ckc.ckc.ckc', 'kkk.kkk.kkk', 'ckc.ckc.ckc', 'ccc.ccc.ccc', '...........', 'yyyyyyyyyyy'], // a fresh row
  each: ['GGG.RRR', 'GGG.RRR', 'GGG.RRR', '.......', 'BBB.NNN', 'BBB.NNN', 'BBB.NNN'], // one of each colour
  set: ['ccccccc', 'cGG.RRc', 'cGG.RRc', 'c.....c', 'cBB.NNc', 'cBB.NNc', 'ccccccc'], // a full set
  low: ['cc......', 'cc......', 'cc.cc...', 'cc.cc...', 'cc.cc.yy', 'cc.cc.yy', 'cc.cc.yy'], // the colour you have fewest of
  any: ['..GRR..', '.GGRRR.', 'GGGRRRR', 'GGG.RRR', 'NNNBBBB', '.NNBBB.', '..NBB..'], // any colour
  space: ['..ccc..', '.c...c.', 'c.....c', 'c..y..c', 'c.....c', '.c...c.', '..ccc..'], // any space
};
const stack = (a, b, at) => a.map((row, y) => { const s = row.padEnd(at + b[y].length, '.').split(''); [...b[y]].forEach((ch, x) => { if (ch !== '.') s[at + x] = ch; }); return s.join(''); });
const darken = g => g.map(r => r.replace(/h/g, 'd').replace(/c/g, 'h'));
MARK.rr = stack(darken(MARK.r).map(r => '...' + r), MARK.r, 0); // rivals: two hoods, one behind
MARK.ws = stack(stack(MARK.wo.map(r => '......' + r), MARK.wo.map(r => '...' + r), 0), MARK.w, 0); // every minion of yours
MARK.anys = stack(stack(MARK.any.map(r => '......' + r), MARK.any.map(r => '...' + r), 0), MARK.any, 0); // all of it

export const MARK_FILL = {
  c: '#f3e6c8', k: '#1d1611', h: '#b3a592', d: '#6a5e54', y: '#ffd27a', g: '#e9b949',
  q: 'var(--tkc)', G: 'var(--gold)', R: 'var(--red)', B: 'var(--blue)', N: 'var(--green)',
};
const markCache = new Map();
/** A mark as { w, paths: { key: d } } in cells (1 cell = 2 screen px once drawn). */
export function markPaths(name) {
  if (markCache.has(name)) return markCache.get(name);
  const grid = MARK[name];
  if (!grid) return null;
  const out = {};
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const k = row[x];
      let w = 1;
      while (row[x + w] === k) w++;
      if (k !== '.') out[k] = (out[k] || '') + `M${x} ${y}h${w}v1h${-w}z`;
      x += w;
    }
  });
  const m = { w: Math.max(...grid.map(r => r.length)), h: grid.length, paths: out };
  markCache.set(name, m);
  return m;
}
export const isMark = name => !!MARK[name];

// ---------- the strips: what each space does, as symbols ----------
// A strip is a list of symbols (at most 3); a symbol is a list of atoms. An atom is a number ('3', '×2', '½'), a
// joiner ('→' to, '/' per, '|' or), a resource ('gold'), 'f' (followers), 'tag:<text>' (a price tag: 'tag:0' free,
// 'tag:−4' a discount, 'tag:½'), or a mark above. A function gets the round.
const S = {
  gold: {
    jv: [['3', 'gold'], ['1', 'gold', '→', 'r']],
    rush: r => [[`${2 * r}`, 'gold']],
    discount: [['m', 'tag:−4']],
    steal: [['rr', '→', '3', 'gold']],
    windfall: [['1', 'gold', '/', 'm']],
    strike: [['×2', 'gold']],
  },
  red: {
    evenswap: [['1', 'red'], ['m', 'swap', 'mr']],
    turnout: [['1', 'red', '/', 'mnew']],
    hire: [['mlow', 'tag:0']],
    hireup: [['2', 'red'], ['mlow', 'tag:0']],
    trade: [['m', 'swap', 'mr'], ['tag:+2']],
    take: [['m', 'tag:0']],
  },
  purple: {
    hourly: r => [[`${3 + r}`, 'purple']],
    catchup: [['1', 'purple'], ['1', '/', 'rup']],
    windup: [['1', 'purple', '/', 'w']],
    planahead: [['1', 'purple', '/', 'wo']],
    rushhour: [['1', 'purple', '/', '2', 'w']],
    rally: [['2', 'wo']], // your next 2 minions, now (not extra turns)
  },
  silver: {
    toast: r => [[`${3 * r}`, 'silver'], ['rr', '+1']],
    gift: [['2', 'silver'], ['2', 'any'], ['rr', '+1']],
    alms: [['4', 'silver'], ['2', 'any', '→', 'r']],
    tongue: [['4', 'silver'], ['silver', 'swap', 'any']],
    tide: [['½', 'rtop', 'silver']],
    jubilee: [['f', '/', '2', 'silver'], ['rr', '+2']],
  },
  yellow: {
    harvest: [['1', 'yellow'], ['1', '/', 'each']],
    bloom: [['1', 'low']],
    transmute: [['3', 'swap'], ['1', 'yellow']],
    prism: [['each', '/', '3', 'yellow']],
    gather: [['1', 'any', '/', 'm']],
    flourish: [['each', '/', 'set']],
  },
  market: {
    bargain: [['2', 'blue'], ['mnew']],
    restock: [['2', 'blue'], ['row']],
    showroom: [['1', 'blue'], ['1', '/', 'm:blue']],
    clearance: [['m', 'tag:½']],
    pricecheck: [['blue', '=', '½', 'mup']],
    spree: [['×3', 'tag:']],
  },
  thieves: {
    pickpocket: r => [['rr', '→', `${r + 1}`, 'magenta']],
    tipoff: [['1', 'magenta', '/', 'rup']],
    hideout: [['r', '→', '1', 'magenta'], ['shield']],
    rob: [['rr', '→', '3', 'magenta']],
    ransom: [['mr', 'tag:≤6', '→', 'magenta']],
    heist: [['mr', '→', 'm']],
  },
  trading: {
    haggle: [['2', 'white'], ['1', '/', 'rup']],
    buylow: [['1', 'f', '/', '3', 'white']],
    pawn: r => [[`${r}`, 'f', '|', `${2 * r}`, 'white']],
    sellhigh: [['2', 'f', '→', '6', 'white']],
    dividend: [['1', 'white', '/', 'f']],
    boom: [['anys', '→', 'f']],
  },
  echo: {
    hum: [['3', 'green']],
    chant: r => [[`${2 * r}`, 'green']],
    echo: [['copy', 'r']],
    encore: [['copy', 'space']],
    refrain: [['2', 'green'], ['copy', 'w']],
    eternity: [['copy', 'ws']],
  },
};

export const RES = new Set(['gold', 'red', 'blue', 'green', 'magenta', 'silver', 'yellow', 'purple', 'white']);
/** The pips-first effect text ('+2 blue · @m free') read into a strip, for spaces without a drawn strip. */
export function parseEffect(text) {
  return String(text || '').split(/\s*·\s*|,\s*/).filter(Boolean).slice(0, 3).map(part => {
    const atoms = [];
    for (const raw of part.replace(/\//g, ' / ').split(/\s+/).filter(Boolean)) {
      const w = raw.replace(/^\+(?=\d)/, '');
      if (w === '@m') atoms.push('m');
      else if (w === '@r') atoms.push('r');
      else if (w === '@f' || /^followers?$/.test(w)) atoms.push('f');
      else if (RES.has(w) || w === 'any') atoms.push(w);
      else if (/^[\d½×→/=≤+−-]/.test(w)) atoms.push(w);
      else if (w === 'free') atoms.push('tag:0');
      // other words stay off the token: the name and the full text are in the hover
    }
    return atoms;
  }).filter(a => a.length);
}

/** The strip for a space: its drawn symbols, else the effect text read as symbols. */
export function stripFor(q, action, round = 1, effect = '') {
  const v = S[q] && S[q][action.key];
  const s = typeof v === 'function' ? v(Math.max(1, Math.min(3, round))) : v;
  if (s) return s;
  // a plain gain ('+2 blue, +1 red.'): one symbol per resource
  const gains = [...String(action.text || '').matchAll(/\+(\d+) ([a-z]+)/g)].filter(m => RES.has(m[2]));
  if (gains.length && /^(\+\d+ [a-z]+,? ?)+\.?$/.test(String(action.text).trim())) return gains.slice(0, 3).map(m => [m[1], m[2]]);
  return parseEffect(effect);
}
