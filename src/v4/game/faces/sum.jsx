// sum: Dune: Imperium / Lords of Waterdeep grammar. A space is one bold pixel icon for its verb (the action's own
// Sprite, bigger than today's), and under it ONE line, a symbol sum read left to right: what you pay, or where it
// comes from → what you get. The name lives only in the hover card (the Wheel's). Every action on every sphere is
// written in the fixed vocabulary below and nothing else; where a rule is too long, the sum carries its core and
// the hover carries the rest. (Registered as `sum`: ?spaces=sum, ?lab=faces&face=sum.)
//
// THE VOCABULARY (defined once, here; nothing else is ever drawn on a space)
//   3●       a resource: the number, then the resource's own shape in its color (coin, drop, square, leaf, gem,
//            bell, sun, hourglass, hex). "+3●" you gain it; "3●" alone, left of →, you pay it.
//   ◌  ⊛     any one color (a rainbow ring) · one of each color (a rainbow disc)
//   ☺        a follower (the pixel person)
//   ▢        a member card. Tinted = a member of that color. ▤ (three fanned cards) = the face-up row.
//   ☗        a rival (a dark hood). ☗☗ = every rival. ☗▢ = a rival's member.
//   ♟        your minion: solid = on the board, hollow = still to place
//   ▴ ▾      most / fewest, in front of what it qualifies: ▴☗ a rival ahead of you (richer, more minions, more
//            followers), ▴▢ your priciest member, ▾▢ the cheapest member, ▾◌ the color you hold least of
//   /        per                ×n   times               →   becomes (left: the cost or the source)
//   =        worked out from    ⇄    swap                ⧉   copy a space
//   ↻        an extra turn      ⛨    no one steals from you
//   tag      a buy, with its price written on it: −4, ½, free. A blank tag is one buy.
//   ▮▮▮      grows each round (this round's step filled)
//   all · any · or   the only words
//
// STATES  lit: full ink, a lamp edge round the icon · open: full ink · taken: 40%, the minion standing on the icon ·
//         fresh: taken, with a dotted ring in the mover's color · locked: the icon as a hatched pixel silhouette.
import { memo } from 'react';
import { Sprite, iconFor, spriteId, withOutline, Follower, FaceMinion, FaceText, quadrant } from './kit.jsx';
import { ResourceGlyph } from '../Glyphs.jsx';
import './sum.css';

const INK = '#2a1f17', INK2 = '#5f4e3d', CARD = '#f8f0dd', HOOD = '#4a3b2d', LAMP = '#ffcf6b', TAG = '#7a2f22', CREAM = '#fff6e4';
const INKS = { gold: '#c99327', red: '#b4533e', blue: '#4f7ea8', green: '#3d8c66', magenta: '#b2386c', purple: '#7d5ba6', silver: '#8794a2', yellow: '#c4a93a', white: '#e6dcc6' };
const RAINBOW = ['gold', 'red', 'magenta', 'purple', 'blue', 'green'];
const RES = new Set(Object.keys(INKS));

// ---------------------------------------------------------------------------------------------------------------
// The terms. A sum is a list of these; CUT marks where the optional tail starts (dropped when the line won't fit).
// ---------------------------------------------------------------------------------------------------------------
const R = (r, n = '', o = {}) => ({ k: 'res', r, n: String(n), ...o }); // r: a resource, 'any' or 'set'
const FOL = (n = '') => ({ k: 'fol', n: String(n) });
const MEM = (o = {}) => ({ k: 'mem', ...o }); // { tint, mod: 'low'|'high'|'new', rival, row }
const HOOD = (o = {}) => ({ k: 'hood', ...o }); // { all, mod: 'high' }
const MIN = (o = {}) => ({ k: 'min', ...o }); // { left }
const NUM = t => ({ k: 'num', t: String(t) });
const WORD = t => ({ k: 'word', t });
const TAGT = (t = '') => ({ k: 'tag', t });
const X = n => ({ k: 'x', t: `×${n}` });
const AGAIN = (n = '') => ({ k: 'again', n: String(n) });
const PER = { k: 'per' }, ARROW = { k: 'arrow' }, EQ = { k: 'eq' }, SWAP = { k: 'swap' }, COPY = { k: 'copy' }, SAFE = { k: 'safe' };
const DOT = { k: 'dot' }, CUT = { k: 'cut' }, GROWS = { k: 'grows', opt: true };
const plus = v => `+${v}`;

// ---------------------------------------------------------------------------------------------------------------
// THE MAPPING, by action id. n(i, d) is the i-th number printed in the action's text (so a balance tweak to the
// text flows through), d when the text has none. r is the current round (1–3).
// ---------------------------------------------------------------------------------------------------------------
const SUMS = {
  // gold: coins
  'gold.jv': ({ n }) => [R('gold', plus(n(0, 3))), DOT, HOOD(), R('gold', plus(n(1, 1)))], //   +3● · ☗+1●   (a gift to a player you pick)
  'gold.rush': ({ n, r }) => [R('gold', plus(n(0, 2) * r)), GROWS], //                            +4● ▮▮▯
  'gold.discount': ({ n }) => [TAGT(`−${n(0, 4)}`), MEM()], //                                    [−4] ▢        (your next member)
  'gold.steal': ({ n }) => [HOOD(), ARROW, R('gold', n(0, 3))], //                                ☗ → 3●        (split as you like)
  'gold.windfall': ({ n }) => [R('gold', plus(n(0, 1))), PER, MEM()], //                          +1● / ▢
  'gold.strike': () => [R('gold'), X(2)], //                                                       ● ×2
  // red: members change hands
  'red.evenswap': ({ n }) => [R('red', plus(n(0, 1))), DOT, MEM(), SWAP, MEM({ rival: true })], // +1♦ · ▢ ⇄ ☗▢  (equal cost: hover)
  'red.turnout': ({ n }) => [R('red', plus(n(0, 1))), PER, MEM({ mod: 'new' })], //               +1♦ / ▢✦      (recruited this round, by anyone)
  'red.hire': () => [MEM({ mod: 'low' }), TAGT('free')], //                                        ▾▢ [free]
  'red.hireup': ({ a, n }) => (/cheapest/i.test(a.text)
    ? [R('red', plus(n(0, 2))), DOT, MEM({ mod: 'low' }), TAGT('free')] //                           +2♦ · ▾▢ [free]
    : [MEM(), TAGT(`≤${n(0, 4)} free`)]), //                                                          ▢ [≤4 free]   (if the text caps the cost)
  'red.trade': () => [MEM(), SWAP, MEM({ rival: true })], //                                       ▢ ⇄ ☗▢        (up to +2 cost: hover)
  'red.take': () => [MEM(), TAGT('free')], //                                                      ▢ [free]      (any face-up member)
  // purple: tempo
  'purple.hourly': ({ n, r }) => [R('purple', plus(n(r - 1, 3 + r))), GROWS], //                   +5⧗ ▮▮▯
  'purple.catchup': ({ n }) => [R('purple', plus(n(0, 1))), NUM(plus(n(1, 2))), PER, HOOD({ mod: 'high' })], // +1⧗ +2/▴☗
  'purple.windup': ({ n }) => [R('purple', plus(n(0, 1))), PER, MIN()], //                         +1⧗ / ♟       (on the board)
  'purple.planahead': ({ n }) => [R('purple', plus(n(0, 2))), PER, MIN({ left: true })], //         +2⧗ / ♙       (still to place)
  'purple.overtime': ({ n }) => [R('purple', n(0, 8)), ARROW, AGAIN(n(1, 2))], //                   8⧗ → 2↻      (else +3⧗: hover)
  'purple.rally': () => [WORD('all'), R('purple'), ARROW, AGAIN(), PER, R('purple', 4)], //        all⧗ → ↻/4⧗  (+1, cap: hover)
  // silver: generous gains that spill on everyone
  'silver.toast': ({ n, r }) => [R('silver', plus(n(0, 3) * r)), GROWS, DOT, HOOD({ all: true }), R('silver', '+1')], // +6🔔 · ☗☗+1🔔
  'silver.gift': () => [R('silver', '+2'), R('any', '+2'), CUT, DOT, HOOD({ all: true }), R('any', '+1')], //  +2🔔 +2◌ · ☗☗+1◌
  'silver.alms': ({ n }) => [R('silver', plus(n(0, 4))), DOT, HOOD(), R('any', plus(n(1, 2)))], //   +4🔔 · ☗+2◌
  'silver.tongue': ({ n }) => [R('silver', plus(n(0, 4))), DOT, R('silver'), SWAP, R('any'), CUT, DOT, HOOD({ all: true }), R('silver', '+1')],
  'silver.tide': () => [R('silver', '+'), EQ, NUM('½'), HOOD({ mod: 'high' }), CUT, DOT, HOOD({ all: true }), R('silver', '+1')], // +🔔 = ½▴☗
  'silver.jubilee': ({ n }) => [FOL(plus(n(0, 1))), PER, R('silver', n(1, 2)), CUT, DOT, HOOD({ all: true }), R('silver', '+2')], // +1☺/2🔔
  // yellow: colors
  'yellow.harvest': () => [R('yellow', '+1'), NUM('+1'), PER, R('any')], //                         +1☀ +1/◌      (per other color you hold)
  'yellow.bloom': () => [R('any', '+1', { mod: 'low' })], //                                       +1 ▾◌         (ties: all of them)
  'yellow.transmute': ({ n }) => [R('any', n(0, 3)), SWAP, R('any'), DOT, R('yellow', '+1')], //   3◌ ⇄ ◌ · +1☀
  'yellow.prism': () => [R('set', '+1'), PER, R('yellow', 3)], //                                   +1⊛ / 3☀
  'yellow.gather': () => [R('any', '+1'), PER, MEM()], //                                          +1◌ / ▢       (each brings its own color)
  'yellow.flourish': () => [R('set', '+1'), PER, R('set')], //                                     +1⊛ / ⊛
  // market (blue): the face-up row
  'market.bargain': ({ n }) => [R('blue', plus(n(0, 2))), DOT, R('any'), ARROW, MEM()], //         +2■ · ◌ → ▢   (recruit now, any colors)
  'market.restock': ({ n }) => [R('blue', plus(n(0, 2))), DOT, SWAP, MEM({ row: true })], //       +2■ · ⇄▤
  'market.showroom': ({ a }) => (/badged/i.test(a.text)
    ? [R('blue', '+1'), PER, MEM({ mod: 'high' })]
    : [R('blue', '+1'), NUM('+1'), PER, MEM({ tint: 'blue' })]), //                                +1■ +1/▢(blue, face-up)
  'market.clearance': () => [TAGT('½'), MEM()], //                                                 [½] ▢
  'market.pricecheck': () => [R('blue', '+'), EQ, NUM('½'), MEM({ mod: 'high' })], //              +■ = ½▴▢
  'market.spree': ({ n }) => [TAGT(), X(n(0, 3))], //                                              [ ] ×3
  // thieves (magenta): take
  'thieves.pickpocket': ({ r }) => [HOOD(), ARROW, R('magenta', r + 1), GROWS], //                 ☗ → 3◆ ▮▮▯
  'thieves.tipoff': () => [R('magenta', '+1'), PER, HOOD({ mod: 'high' })], //                     +1◆ / ▴☗      (each richer player)
  'thieves.hideout': () => [HOOD(), ARROW, R('magenta', 1), DOT, SAFE], //                         ☗ → 1◆ · ⛨
  'thieves.rob': ({ n }) => [HOOD({ all: true }), ARROW, R('magenta', n(0, 3))], //                ☗☗ → 3◆      (at least 1 from each)
  'thieves.ransom': () => [MEM({ rival: true }), ARROW, R('magenta'), WORD('or'), MEM()], //       ☗▢ → ◆ or ▢   (cost cap, their choice: hover)
  'thieves.heist': () => [MEM({ rival: true }), ARROW, MEM()], //                                  ☗▢ → ▢        (they recruit one back: hover)
  // trading (white): followers
  'trading.haggle': ({ n }) => [R('white', plus(n(0, 2))), NUM(plus(n(1, 1))), PER, HOOD({ mod: 'high' })], // +2⬡ +1/▴☗
  'trading.buylow': ({ n, r }) => [R('any', n(0, 2) * r), ARROW, FOL(n(0, 2) * r), GROWS], //       2◌ → 2☺
  'trading.pawn': ({ r }) => [FOL(plus(r)), WORD('or'), R('white', plus(2 * r))], //               +1☺ or +2⬡
  'trading.sellhigh': ({ n }) => [FOL(n(0, 2)), ARROW, R('white', n(0, 2) * n(1, 3))], //            2☺ → 6⬡
  'trading.dividend': () => [R('white', '+1'), PER, FOL()], //                                     +1⬡ / ☺
  'trading.boom': () => [WORD('all'), R('any'), ARROW, FOL()], //                                  all◌ → ☺      (keep white if you like)
  // echo (green): copies
  'echo.hum': ({ n }) => [R('green', plus(n(0, 3)))], //                                           +3🍃
  'echo.chant': ({ n, r }) => [R('green', plus(n(0, 2) * r)), GROWS], //                           +4🍃 ▮▮▯
  'echo.echo': () => [COPY, HOOD()], //                                                            ⧉☗            (since your last turn)
  'echo.encore': () => [COPY, WORD('any')], //                                                     ⧉ any         (this round)
  'echo.refrain': ({ n }) => [R('green', plus(n(0, 2))), DOT, COPY, MIN()], //                     +2🍃 · ⧉♟
  'echo.eternity': () => [COPY, WORD('all'), MIN()], //                                            ⧉ all ♟
};

/** Plain gains ("+2 blue, +1 red."), for the stand-in spheres and anything else that's only that. */
function plainGains(text) {
  const t = String(text || '').trim();
  const parts = [...t.matchAll(/\+(\d+)\s+([a-z]+)/g)];
  if (!parts.length || !parts.every(m => RES.has(m[2]))) return null;
  if (t.replace(/\+(\d+)\s+([a-z]+)/g, '').replace(/[\s,.]|and/g, '') !== '') return null;
  return parts.map(m => R(m[2], `+${m[1]}`));
}

/** The sum for an action (null when it can't be written: the face then prints the shortest text). */
export function sumOf(q, action, round = 1) {
  const r = Math.max(1, Math.min(3, round || 1));
  const nums = (String(action.text || '').match(/\d+/g) || []).map(Number);
  const n = (i, d) => (Number.isFinite(nums[i]) ? nums[i] : d);
  const f = SUMS[`${q}.${action.key}`];
  return f ? f({ n, r, a: action }) : plainGains(action.text);
}

// ---------------------------------------------------------------------------------------------------------------
// Drawing. U = a glyph's height and F = a number's size, both in board units (12px+ on screen via px).
// Every term has a width (in units) and draws with its left edge at x, centred on y = 0.
// ---------------------------------------------------------------------------------------------------------------
const CW = { '+': 0.56, '−': 0.56, '-': 0.4, '=': 0.56, '×': 0.52, '½': 0.82, '≤': 0.56, '/': 0.4, ' ': 0.24, a: 0.5, l: 0.26, n: 0.54, y: 0.47, o: 0.53, r: 0.37, f: 0.31, e: 0.5 };
const textW = (s, F) => [...String(s)].reduce((w, c) => w + (CW[c] ?? 0.54), 0) * F;
const GAP = 0.16; // between terms, in U

function Num({ x, t, F, fill = INK, weight = 800, anchor = 'start', italic = false }) {
  return (
    <text x={x} y={F * 0.05} className="sum-n" fontSize={F} fontWeight={weight} fill={fill} textAnchor={anchor}
      fontStyle={italic ? 'italic' : undefined} dominantBaseline="central">{t}</text>
  );
}

/** One of a resource's shapes, or the rainbow ring (any) / disc (set). */
function Res({ r, x, U }) {
  if (r === 'any' || r === 'set') {
    const c = U / 2, R0 = U * 0.46, Ri = r === 'any' ? U * 0.22 : 0;
    const seg = RAINBOW.map((col, i) => {
      const a0 = (i / 6) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / 6) * 2 * Math.PI - Math.PI / 2;
      const p = (a, rr) => `${(c + rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`;
      const d = Ri
        ? `M${p(a0, R0)}A${R0},${R0} 0 0 1 ${p(a1, R0)}L${p(a1, Ri)}A${Ri},${Ri} 0 0 0 ${p(a0, Ri)}Z`
        : `M${c},0L${p(a0, R0)}A${R0},${R0} 0 0 1 ${p(a1, R0)}Z`;
      return <path key={i} d={d} fill={INKS[col]} />;
    });
    return (
      <g transform={`translate(${x} 0)`}>
        {seg}
        <circle cx={c} cy={0} r={R0} fill="none" stroke={INK} strokeWidth={U * 0.07} />
        {Ri ? <circle cx={c} cy={0} r={Ri} fill="none" stroke={INK} strokeWidth={U * 0.07} /> : null}
      </g>
    );
  }
  return <g transform={`translate(${x} ${-U / 2})`}><ResourceGlyph r={r} size={U} decorative /></g>;
}

/** ▴ / ▾: most / fewest, a small ink chevron. */
function Mod({ x, U, up }) {
  const w = U * 0.42, h = U * 0.34, y0 = up ? h / 2 : -h / 2, y1 = -y0;
  return <path d={`M${x},${y0}L${x + w / 2},${y1}L${x + w},${y0}Z`} fill={INK} />;
}

/** A member card (12×16 grid): cream card, a hooded figure in its tint. */
function Card({ x, U, tint = null, dx = 0, dy = 0, rot = 0 }) {
  const s = U / 16;
  const fig = tint ? INKS[tint] || tint : INK2;
  return (
    <g transform={`translate(${x + dx} ${-U / 2 + dy}) rotate(${rot} ${6 * s} ${8 * s}) scale(${s})`}>
      <rect x="0.7" y="0.7" width="10.6" height="14.6" rx="1.8" fill={tint ? mixLight(fig) : CARD} stroke={INK} strokeWidth="1.25" />
      <path d="M6 3.2C4.3 3.2 3.4 4.6 3.4 6.4V8H8.6V6.4C8.6 4.6 7.7 3.2 6 3.2Z" fill={fig} />
      <path d="M2.4 13.6C2.4 10.6 3.9 9 6 9S9.6 10.6 9.6 13.6Z" fill={fig} />
    </g>
  );
}
const mixLight = hex => {
  const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${p.map(v => Math.round(v + (248 - v) * 0.72)).join(',')})`;
};

/** A rival: a dark hood with two lamp-lit eyes (16×16 grid). */
function Hood({ x, U, light = false }) {
  const s = U / 16;
  return (
    <g transform={`translate(${x} ${-U / 2}) scale(${s})`}>
      <path d="M8 1C4.4 1 2.4 4.3 2.4 8.3V15H13.6V8.3C13.6 4.3 11.6 1 8 1Z" fill={light ? '#7a6550' : HOOD} stroke={INK} strokeWidth="1.2" />
      <path d="M8 5C6 5 5.1 6.7 5.1 8.7V11.6H10.9V8.7C10.9 6.7 10 5 8 5Z" fill="#160f0b" />
      <rect x="6.1" y="8.3" width="1.4" height="1.2" fill="#ffd978" /><rect x="8.5" y="8.3" width="1.4" height="1.2" fill="#ffd978" />
    </g>
  );
}

/** Your minion (a plain ink figure; hollow = still to place). */
function Mini({ x, U, left }) {
  const s = U / 16;
  return (
    <g transform={`translate(${x} ${-U / 2}) scale(${s})`}>
      <path d="M6.5 1.2C4.6 1.2 3.4 2.8 3.4 4.8V6.6H9.6V4.8C9.6 2.8 8.4 1.2 6.5 1.2ZM1.6 15C1.6 10.4 3.4 7.6 6.5 7.6S11.4 10.4 11.4 15Z"
        fill={left ? 'none' : INK2} stroke={INK} strokeWidth={left ? 1.3 : 1} strokeDasharray={left ? '1.8 1.4' : undefined} strokeLinejoin="round" />
    </g>
  );
}

const sw = U => U * 0.115; // the stroke of the line marks (arrow, swap, per, copy…)
function Arrow({ x, U }) {
  const w = U * 0.8, h = U * 0.26;
  return <path d={`M${x + U * 0.06},0H${x + w}M${x + w - h},${-h}L${x + w},0L${x + w - h},${h}`} fill="none" stroke={INK} strokeWidth={sw(U)} strokeLinecap="round" strokeLinejoin="round" />;
}
function Swap({ x, U }) {
  const w = U * 0.86, y = U * 0.2, h = U * 0.2;
  return (
    <path d={`M${x + U * 0.06},${-y}H${x + w}M${x + w - h},${-y - h}L${x + w},${-y}M${x + w},${y}H${x + U * 0.06}M${x + U * 0.06 + h},${y + h}L${x + U * 0.06},${y}`}
      fill="none" stroke={INK} strokeWidth={sw(U)} strokeLinecap="round" strokeLinejoin="round" />
  );
}
function Per({ x, U }) {
  return <path d={`M${x + U * 0.1},${U * 0.44}L${x + U * 0.36},${-U * 0.44}`} stroke={INK} strokeWidth={sw(U)} strokeLinecap="round" />;
}
function Copy({ x, U }) {
  const a = U * 0.62, r = U * 0.12;
  return (
    <g>
      <rect x={x + U * 0.04} y={-U * 0.48} width={a} height={a} rx={r} fill="none" stroke={INK} strokeWidth={U * 0.08} strokeDasharray={`${U * 0.14} ${U * 0.09}`} />
      <rect x={x + U * 0.34} y={-U * 0.16} width={a} height={a} rx={r} fill={CARD} stroke={INK} strokeWidth={sw(U)} />
    </g>
  );
}
function Again({ x, U }) {
  const c = x + U / 2, R0 = U * 0.36;
  return (
    <g fill="none" stroke={INK} strokeWidth={sw(U)} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${c + R0 * 0.94},${-R0 * 0.34}A${R0},${R0} 0 1 0 ${c + R0 * 0.62},${R0 * 0.78}`} />
      <path d={`M${c + R0 * 0.48},${-R0 * 0.52}L${c + R0 * 0.98},${-R0 * 0.3}L${c + R0 * 1.12},${-R0 * 0.86}`} />
    </g>
  );
}
function Safe({ x, U }) {
  const s = U / 16;
  return (
    <g transform={`translate(${x} ${-U / 2}) scale(${s})`}>
      <path d="M7 1L12.6 3V7.6C12.6 11 10.4 13.6 7 15C3.6 13.6 1.4 11 1.4 7.6V3Z" fill="#cfd6dd" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.4 8L6.4 10L9.8 5.8" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}
function Grows({ x, U, r }) {
  const w = U * 0.17, g = U * 0.07;
  return (
    <g>{[0.38, 0.66, 0.94].map((h, i) => (
      <rect key={i} x={x + i * (w + g)} y={U * 0.47 - U * h} width={w} height={U * h} rx={U * 0.03}
        fill={i < r ? INK2 : 'none'} stroke={INK2} strokeWidth={U * 0.06} opacity={i < r ? 1 : 0.7} />
    ))}</g>
  );
}
function Tag({ x, U, F, t }) {
  const h = Math.max(U * 1.12, F * 1.22), notch = h * 0.42, w = t ? notch + textW(t, F) + F * 0.42 : h * 1.15;
  return (
    <g>
      <path d={`M${x + notch},${-h / 2}H${x + w - h * 0.12}Q${x + w},${-h / 2} ${x + w},${-h / 2 + h * 0.12}V${h / 2 - h * 0.12}Q${x + w},${h / 2} ${x + w - h * 0.12},${h / 2}H${x + notch}L${x},0Z`}
        fill={TAG} stroke={INK} strokeWidth={U * 0.07} strokeLinejoin="round" />
      <circle cx={x + notch * 0.62} cy={0} r={h * 0.1} fill={CREAM} />
      {t ? <Num x={x + notch + F * 0.1} t={t} F={F} fill={CREAM} /> : null}
    </g>
  );
}

/** Width of a term, in units. */
function widthOf(t, U, F) {
  const num = s => (s ? textW(s, F) + U * 0.06 : 0);
  switch (t.k) {
    case 'res': return num(t.n) + (t.mod ? U * 0.5 : 0) + U;
    case 'fol': return num(t.n) + U * 0.86;
    case 'mem': return (t.mod === 'low' || t.mod === 'high' ? U * 0.5 : 0) + (t.rival ? U * 0.72 : 0) + (t.row ? U * 1.3 : U * 0.75) + (t.mod === 'new' ? U * 0.3 : 0);
    case 'hood': return (t.mod ? U * 0.5 : 0) + (t.all ? U * 1.4 : U * 0.95);
    case 'min': return U * 0.82;
    case 'num': return textW(t.t, F);
    case 'word': return textW(t.t, F) + U * 0.1;
    case 'x': return textW(t.t, F);
    case 'eq': return textW('=', F);
    case 'per': return U * 0.46;
    case 'arrow': return U * 0.86;
    case 'swap': return U * 0.92;
    case 'copy': return U * 1.0;
    case 'again': return num(t.n) + U * 0.98;
    case 'safe': return U * 0.84;
    case 'grows': return U * 0.66;
    case 'dot': return U * 0.36;
    case 'tag': { const h = Math.max(U * 1.12, F * 1.22); return t.t ? h * 0.42 + textW(t.t, F) + F * 0.42 : h * 1.15; }
    default: return 0;
  }
}

/** Draw one term with its left edge at x. */
function drawTerm(t, x, U, F, r, key) {
  const num = (s, at) => (s ? <Num x={at} t={s} F={F} /> : null);
  const nw = s => (s ? textW(s, F) + U * 0.06 : 0);
  switch (t.k) {
    case 'res': {
      const m = t.mod ? U * 0.5 : 0;
      return <g key={key}>{num(t.n, x)}{t.mod ? <Mod x={x + nw(t.n) + U * 0.02} U={U} up={t.mod === 'high'} /> : null}<Res r={t.r} x={x + nw(t.n) + m} U={U} /></g>;
    }
    case 'fol': return (
      <g key={key}>{num(t.n, x)}<g transform={`translate(${x + nw(t.n) - U * 0.07} ${-U / 2})`}><Follower size={U} /></g></g>
    );
    case 'mem': {
      let at = x;
      const parts = [];
      if (t.mod === 'low' || t.mod === 'high') { parts.push(<Mod key="m" x={at} U={U} up={t.mod === 'high'} />); at += U * 0.5; }
      if (t.rival) { parts.push(<Hood key="h" x={at - U * 0.06} U={U * 0.9} />); at += U * 0.72; }
      if (t.row) {
        parts.push(<Card key="c0" x={at} U={U * 0.86} rot={-14} dy={U * 0.1} />, <Card key="c1" x={at + U * 0.28} U={U * 0.86} dy={U * 0.04} />, <Card key="c2" x={at + U * 0.56} U={U * 0.86} rot={14} dy={U * 0.1} />);
      } else parts.push(<Card key="c" x={at} U={U} tint={t.tint} />);
      if (t.mod === 'new') {
        const cx = at + U * 0.82, cy = -U * 0.36, a = U * 0.2;
        parts.push(<path key="n" d={`M${cx},${cy - a}L${cx + a * 0.3},${cy - a * 0.3}L${cx + a},${cy}L${cx + a * 0.3},${cy + a * 0.3}L${cx},${cy + a}L${cx - a * 0.3},${cy + a * 0.3}L${cx - a},${cy}L${cx - a * 0.3},${cy - a * 0.3}Z`} fill={LAMP} stroke={INK} strokeWidth={U * 0.06} />);
      }
      return <g key={key}>{parts}</g>;
    }
    case 'hood': {
      const m = t.mod ? U * 0.5 : 0;
      return (
        <g key={key}>
          {t.mod ? <Mod x={x} U={U} up /> : null}
          {t.all ? <><Hood x={x + m + U * 0.45} U={U * 0.9} light /><Hood x={x + m} U={U * 0.95} /></> : <Hood x={x + m} U={U * 0.95} />}
        </g>
      );
    }
    case 'min': return <Mini key={key} x={x} U={U} left={t.left} />;
    case 'num': return <Num key={key} x={x} t={t.t} F={F} />;
    case 'word': return <Num key={key} x={x + U * 0.05} t={t.t} F={F} fill={INK2} weight={700} italic />;
    case 'x': return <Num key={key} x={x} t={t.t} F={F} />;
    case 'eq': return <Num key={key} x={x} t="=" F={F} />;
    case 'per': return <Per key={key} x={x} U={U} />;
    case 'arrow': return <Arrow key={key} x={x} U={U} />;
    case 'swap': return <Swap key={key} x={x} U={U} />;
    case 'copy': return <Copy key={key} x={x} U={U} />;
    case 'again': return <g key={key}>{num(t.n, x)}<Again x={x + nw(t.n)} U={U} /></g>;
    case 'safe': return <Safe key={key} x={x} U={U} />;
    case 'grows': return <Grows key={key} x={x} U={U} r={r} />;
    case 'dot': return <circle key={key} cx={x + U * 0.18} cy={0} r={U * 0.08} fill={INK2} />;
    case 'tag': return <Tag key={key} x={x} U={U} F={F} t={t.t} />;
    default: return null;
  }
}

/** Lay a sum out on one line no wider than maxW: drop the optional tail, then the grows marks, then shrink to the floor. */
function layout(terms, maxW, U, F, minScale) {
  const measure = list => list.reduce((w, t, i) => w + widthOf(t, U, F) + (i ? U * GAP : 0), 0);
  const cut = terms.findIndex(t => t.k === 'cut');
  const full = terms.filter(t => t.k !== 'cut');
  const tries = [full];
  if (cut >= 0) tries.push(terms.slice(0, cut));
  tries.push(tries[tries.length - 1].filter(t => !t.opt));
  for (const list of tries) { const w = measure(list); if (w <= maxW) return { list, w, k: 1 }; }
  const list = tries[tries.length - 1], w = measure(list);
  return { list, w, k: Math.max(minScale, maxW / w) };
}

/** The sum line, centred on (0, y). */
function SumLine({ terms, y, U, F, maxW, minScale, r }) {
  const { list, w, k } = layout(terms, maxW, U, F, minScale);
  let x = -w / 2;
  const out = list.map((t, i) => {
    if (i) x += U * GAP;
    const el = drawTerm(t, x, U, F, r, i);
    x += widthOf(t, U, F);
    return el;
  });
  return <g className="sum-line" transform={`translate(0 ${y}) scale(${k})`}>{out}</g>;
}

// ---------------------------------------------------------------------------------------------------------------
// The icon: the action's pixel Sprite, bigger; hatched when locked; a lamp edge when lit.
// ---------------------------------------------------------------------------------------------------------------
const hatchCache = new Map();
/** The icon as a hatched pixel silhouette: its outline in ink, its body every third diagonal. */
function hatchRects(id) {
  const { icon } = iconFor(id, 'action');
  if (hatchCache.has(icon.id)) return hatchCache.get(icon.id);
  const out = [];
  withOutline(icon.px).forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    if (ch === 'k') out.push({ x, y, o: 1 });
    else if ((x + y) % 3 === 0) out.push({ x, y, o: 0 });
  }));
  hatchCache.set(icon.id, out);
  return out;
}
const Hatched = memo(function Hatched({ id, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" className="sum-hatch">
      {hatchRects(id).map((p, k) => <rect key={k} x={p.x} y={p.y} width="1" height="1" fill={p.o ? 'rgba(42,31,23,.5)' : 'rgba(42,31,23,.3)'} />)}
    </svg>
  );
});

/** The icon's size in board units: the largest multiple of 12 screen px that fits the ring (24–48px). */
const ICON_ROOM = { 1: 30, 2: 28, 3: 38 };
function iconUnits(ring, px) {
  const p = Math.max(24, Math.min(48, Math.floor(ICON_ROOM[ring] / px / 12) * 12));
  return p * px;
}
const LINE_W = { 1: 84, 2: 76, 3: 84 }; // the widest a sum may run, in units (the gap to the next space)

export default function Sum({ q, action, ring, round, status, minions = [], name, effect, px = 0.77 }) {
  const Q = quadrant(q);
  const ids = [`${q}.${action.key}`, spriteId(action.name)];
  const drawn = iconFor(ids, 'action').drawn;
  const terms = sumOf(q, action, round);
  const U = 13 * px, F = 13 * px; // glyphs and numbers: 13px on screen (12px is the floor)
  const I = iconUnits(ring, px);
  const lineH = U * 1.25, gap = 2 * px;
  const H = I + gap + lineH;
  const top = -H / 2 - 1;
  const iconCy = top + I / 2, lineY = top + I + gap + lineH / 2;
  const taken = status === 'taken' || status === 'fresh';
  const locked = status === 'locked';
  const lit = status === 'lit';
  const uid = `${q}-${action.key}`;
  const mover = minions.find(m => m.fresh);
  const icon = locked
    ? <Hatched id={ids} size={I} />
    : drawn
      ? <Sprite id={ids} kind="action" sphere={Q.resource} size={I} />
      : <ResourceGlyph r={Q.resource} size={I} decorative />;
  const mSize = Math.max(18 * px, I * 0.62);
  return (
    <g className={`sum-face ${status}`} data-sum={`${q}.${action.key}`}>
      {lit && (
        <defs>
          <filter id={`sumLamp-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={1.3 * px} result="d" />
            <feFlood floodColor={LAMP} result="c" />
            <feComposite in="c" in2="d" operator="in" result="edge" />
            <feGaussianBlur in="edge" stdDeviation={2.2 * px} result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      )}
      {lit && <ellipse className="sum-pool" cx="0" cy={iconCy + I * 0.08} rx={I * 0.78} ry={I * 0.62} fill={`url(#sumPool-${uid})`} />}
      {lit && (
        <defs>
          <radialGradient id={`sumPool-${uid}`}><stop offset="0" stopColor="rgba(255,214,140,.55)" /><stop offset="1" stopColor="rgba(255,214,140,0)" /></radialGradient>
        </defs>
      )}
      <g opacity={taken ? 0.4 : 1}>
        <g transform={`translate(${-I / 2} ${top})`} filter={lit ? `url(#sumLamp-${uid})` : undefined}>{icon}</g>
        <g opacity={locked ? 0.42 : 1}>
          {terms
            ? <SumLine terms={terms} y={lineY} U={U} F={F} maxW={LINE_W[ring]} minScale={12 / 13} r={Math.max(1, Math.min(3, round || 1))} />
            : <FaceText text={effect || name} px={px} font={13} w={LINE_W[ring]} h={lineH} y={lineY} />}
        </g>
      </g>
      {status === 'fresh' && (
        <circle cx="0" cy={iconCy} r={I * 0.66} fill="none" stroke={mover ? mover.color : '#8f7f66'} strokeWidth={1.8 * px} strokeDasharray={`${2.2 * px} ${2.6 * px}`} strokeLinecap="round" />
      )}
      {minions.map((m, k) => (
        <FaceMinion key={m.pid} m={m} x={(k - (minions.length - 1) / 2) * mSize * 0.62} y={top + I * 0.98} size={mSize} />
      ))}
    </g>
  );
}

Sum.box = { 1: [60, 56], 2: [50, 48], 3: [56, 58] };
