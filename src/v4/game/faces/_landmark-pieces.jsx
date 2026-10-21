// Landmark face: what you get, drawn as pieces that float above the place (never words). One vocabulary:
//   res      a resource glyph with its count            [3 ●]
//   fol      followers                                 [2 ♙]
//   card     a member card (badge: 0 free, −4, ½, ×3, any)
//   hood     a rival
//   minion   one of your minions (hollow: still to place)
//   per      a glyph stacked on a unit: "1 ● each member / minion / rival / follower / color"
//   swap     two things with ⇄ between them
//   mirror   a copy, badged with whose space it copies
//   to       the tiny → connector; or: a slash
// The complicated actions use at most two pieces and one connector; the full rule lives in the hover card.
import { ResourceGlyph } from '../Glyphs.jsx';
import { Follower } from '../../art/Follower.jsx';
import { Minion } from '../../art/Leader.jsx';

const INK = 'var(--paper-ink, #2a1f17)';
const CREAM = '#f6eedb';
const ROBE = '#857c72';

// ---------- which pieces each space shows (by "<sphere>.<key>"); r is the round (1–3) ----------
const res = (r, n) => ({ t: 'res', r, n });
const per = (r, n, unit) => ({ t: 'per', r, n, unit });
const TO = { t: 'to' };
const OR = { t: 'or' };
const card = badge => ({ t: 'card', badge });
const HOOD = { t: 'hood' };
const PIECES = {
  'gold.jv': () => [res('gold', 3), { t: 'give', r: 'gold', n: 1 }],
  'gold.rush': r => [res('gold', 2 * r)],
  'gold.discount': () => [card('−4')],
  'gold.steal': () => [HOOD, TO, res('gold', 3)],
  'gold.windfall': () => [per('gold', 1, 'card')],
  'gold.strike': () => [{ t: 'times', r: 'gold', k: '×2' }],
  'red.evenswap': () => [res('red', 1), { t: 'swap', a: 'card', b: 'card' }],
  'red.turnout': r => [res('red', r + 1)],
  'red.hire': () => [card('0')],
  'red.hireup': () => [card('≤+2'), { t: 'swap', a: 'card', b: 'card' }],
  'red.trade': () => [card('≤−2'), { t: 'swap', a: 'card', b: 'card' }],
  'red.take': () => [card('any')],
  'blue.a1': () => [res('blue', 3)],
  'blue.a2': () => [res('blue', 2), res('red', 1)],
  'blue.a3': () => [res('blue', 2), res('green', 1)],
  'blue.a4': () => [res('blue', 5)],
  'blue.a5': () => [res('blue', 4), res('gold', 1)],
  'blue.a6': () => [res('blue', 8)],
  'green.a1': () => [res('green', 3)],
  'green.a2': () => [res('green', 2), res('gold', 1)],
  'green.a3': () => [res('green', 2), res('blue', 1)],
  'green.a4': () => [res('green', 5)],
  'green.a5': () => [res('green', 4), res('red', 1)],
  'green.a6': () => [res('green', 8)],
  'purple.hourly': r => [res('purple', 3 + r)],
  'purple.catchup': () => [res('purple', 1), per('purple', 1, 'hood')],
  'purple.windup': () => [per('purple', 1, 'minion')],
  'purple.planahead': (r, a) => [per('purple', numIn(a, /\+(\d+) purple per minion/, 2), 'hollow')],
  'purple.rushhour': () => [per('purple', 1, 'minion')],
  'purple.rally': () => [{ t: 'turns', n: 2, own: true }], // your own next 2 minions, now (not extra turns)
  'silver.toast': r => [res('silver', 3 * r), { t: 'others', r: 'silver', n: 1 }],
  'silver.gift': () => [res('silver', 2), res('any', 2)],
  'silver.alms': () => [res('silver', 4), { t: 'give', r: 'any', n: 2 }],
  'silver.tongue': () => [res('silver', 4), { t: 'swap', a: 'silver', b: 'any' }],
  'silver.tide': () => [HOOD, TO, res('silver', '½')],
  'silver.jubilee': () => [res('silver', 2), TO, { t: 'fol', n: 1 }],
  'yellow.harvest': () => [per('yellow', 1, 'color')],
  'yellow.bloom': () => [{ t: 'lowest' }],
  'yellow.transmute': () => [{ t: 'swap', a: 'any', b: 'any', n: 3 }, res('yellow', 1)],
  'yellow.prism': () => [res('yellow', 3), TO, { t: 'each', n: 1 }],
  'yellow.gather': () => [per('any', 1, 'card')],
  'yellow.flourish': () => [{ t: 'set' }, TO, { t: 'each', n: 1 }],
  // Blue's Oct 20 rework: churn the shop, peek at the pile, buy twice, bury, Spree (lab face)
  'market.bargain': r => [res('blue', r + 1), { t: 'row' }, TO, card('×3')],
  'market.restock': () => [{ t: 'row' }, TO, per('blue', 1, 'card')],
  'market.showroom': () => [res('blue', 1), card('top')],
  'market.clearance': () => [res('blue', 1), card('×2')],
  'market.pricecheck': () => [card(null), TO, res('blue', '½')],
  'market.spree': () => [res('blue', 3), card('×3')],
  'thieves.pickpocket': r => [HOOD, TO, res('any', r), { t: 'fol', n: r }],
  'thieves.tipoff': () => [HOOD, TO, per('any', 1, 'minion')],
  'thieves.hideout': r => [HOOD, TO, res('any', r), { t: 'shield' }],
  'thieves.rob': () => [HOOD, TO, res('any', '½')],
  'thieves.ransom': () => [{ t: 'hoodcard' }, TO, { t: 'ransom' }],
  'thieves.heist': () => [HOOD, TO, card(null)],
  'trading.haggle': () => [res('white', 2), per('white', 1, 'ahead')],
  'trading.buylow': () => [per('white', 3, 'fol')], // 3 white on each follower: +1 follower per 3 white held
  'trading.pawn': r => [{ t: 'fol', n: r }, OR, res('white', 2 * r)],
  'trading.sellhigh': () => [{ t: 'fol', n: 2 }, TO, res('white', 6)],
  'trading.dividend': () => [per('white', 1, 'fol')],
  'trading.boom': () => [{ t: 'all', r: 'any' }, TO, { t: 'fol', n: null }],
  'echo.chant': r => [res('green', r + 1)],
  'echo.echo': () => [{ t: 'mirror', of: 'any' }, res('green', 1)],
  'echo.encore': () => [{ t: 'mirror', of: 'hood' }, res('green', 1)],
  'echo.refrain': () => [{ t: 'mirror', of: 'mine' }, res('green', 1)],
  'echo.eternity': () => [{ t: 'mirror', of: 'all' }, res('green', 1)],
};
function numIn(a, re, dflt) { const m = String(a && a.text || '').match(re); return m ? Number(m[1]) : dflt; }

/** The pieces for a space, or null when it isn't mapped (the face then falls back to the pip text). */
export function piecesFor(q, action, round) {
  const fn = PIECES[`${q}.${action.key}`];
  return fn ? fn(Math.max(1, Math.min(3, round || 1)), action) : null;
}

// ---------- drawing: every piece is P board units tall; widths come back so the row can be centred ----------
const RAINBOW = ['gold', 'red', 'blue', 'green'];
function AnyRing({ s }) {
  // any resource: a ring of four arcs in four inks
  const r = s * 0.36, c = s / 2, sw = s * 0.2;
  const arcs = RAINBOW.map((k, i) => {
    const a0 = (i * 90 - 90 + 6) * Math.PI / 180, a1 = ((i + 1) * 90 - 90 - 6) * Math.PI / 180;
    return <path key={k} d={`M${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`} stroke={`var(--${k})`} strokeWidth={sw} fill="none" strokeLinecap="butt" />;
  });
  return <g><circle cx={c} cy={c} r={r} fill="none" stroke={INK} strokeWidth={sw + s * 0.12} />{arcs}</g>;
}
function Glyph({ r, s }) {
  if (r === 'any') return <AnyRing s={s} />;
  return <svg width={s} height={s} style={{ width: s, height: s, overflow: 'visible' }} viewBox="0 0 16 16" overflow="visible"><ResourceGlyph r={r} size={16} decorative /></svg>;
}
function CardG({ s, badge = null, tint = null, hood = false }) {
  // a member: a cream card with a hooded figure, its sphere stripe on top when tinted
  const w = s * 0.74, h = s, x = (s - w) / 2;
  return (
    <g>
      <rect x={x} y={0} width={w} height={h} rx={s * 0.1} fill={CREAM} stroke={INK} strokeWidth={s * 0.08} />
      {tint && <rect x={x + s * 0.06} y={s * 0.06} width={w - s * 0.12} height={s * 0.16} fill={tint} />}
      <path d={`M${s / 2} ${h * 0.24}c${-s * 0.15} 0 ${-s * 0.2} ${s * 0.12} ${-s * 0.2} ${s * 0.25}v${s * 0.06}h${s * 0.4}v${-s * 0.06}c0 ${-s * 0.13} ${-s * 0.05} ${-s * 0.25} ${-s * 0.2} ${-s * 0.25}z`} fill={hood ? '#3c4946' : ROBE} />
      <path d={`M${s * 0.27} ${h * 0.86}c0 ${-s * 0.2} ${s * 0.1} ${-s * 0.3} ${s * 0.23} ${-s * 0.3}s${s * 0.23} ${s * 0.1} ${s * 0.23} ${s * 0.3}z`} fill={hood ? '#3c4946' : ROBE} />
      {badge != null && <Badge s={s} text={badge} x={s * 0.84} y={s * 0.82} />}
    </g>
  );
}
function Badge({ s, text, x, y }) {
  if (text === 'any') return <g transform={`translate(${x - s * 0.3} ${y - s * 0.3})`}><circle cx={s * 0.3} cy={s * 0.3} r={s * 0.3} fill={CREAM} stroke={INK} strokeWidth={s * 0.06} /><g transform={`translate(${s * 0.04} ${s * 0.04})`}><AnyRing s={s * 0.52} /></g></g>;
  if (text === 'top') return <g transform={`translate(${x} ${y})`}><circle r={s * 0.3} fill="var(--gold)" stroke={INK} strokeWidth={s * 0.06} /><path d={`M${-s * 0.15} ${s * 0.07}L0 ${-s * 0.13}L${s * 0.15} ${s * 0.07}`} fill="none" stroke={INK} strokeWidth={s * 0.09} /></g>;
  // the badge's mark is 12px or more on screen (s is 18px): a gold tag over the card's corner
  const long = String(text).length > 1;
  const hh = s * 0.76, ww = long ? s * 1.14 : hh;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-ww / 2} y={-hh / 2} width={ww} height={hh} rx={hh / 2} fill="var(--gold)" stroke={INK} strokeWidth={s * 0.07} />
      <text x={0} y={s * 0.03} fontSize={s * 0.68} fontWeight="800" textAnchor="middle" dominantBaseline="central" fill={INK} fontFamily="var(--sans)">{text}</text>
    </g>
  );
}
function HoodG({ s, n = 1 }) {
  // a rival: a dark hood with two glints, never a player's emoji
  const one = dx => (
    <g key={dx} transform={`translate(${dx} 0)`}>
      <path d={`M${s / 2} ${s * 0.04}C${s * 0.2} ${s * 0.04} ${s * 0.1} ${s * 0.32} ${s * 0.1} ${s * 0.6}V${s * 0.96}H${s * 0.9}V${s * 0.6}C${s * 0.9} ${s * 0.32} ${s * 0.8} ${s * 0.04} ${s / 2} ${s * 0.04}Z`} fill="#3c4946" stroke={INK} strokeWidth={s * 0.07} />
      <path d={`M${s * 0.3} ${s * 0.4}H${s * 0.7}V${s * 0.6}H${s * 0.3}Z`} fill="#141c1b" />
      <rect x={s * 0.36} y={s * 0.46} width={s * 0.08} height={s * 0.08} fill={CREAM} /><rect x={s * 0.56} y={s * 0.46} width={s * 0.08} height={s * 0.08} fill={CREAM} />
    </g>
  );
  return <g>{n > 1 ? [one(s * 0.32), one(0)] : one(0)}</g>;
}
function MirrorG({ s }) {
  // a hand mirror: an oval glass with a glint, a frame, a handle
  return (
    <g>
      <rect x={s * 0.44} y={s * 0.62} width={s * 0.14} height={s * 0.36} rx={s * 0.05} fill="#7a5536" stroke={INK} strokeWidth={s * 0.06} />
      <ellipse cx={s * 0.51} cy={s * 0.36} rx={s * 0.34} ry={s * 0.34} fill="var(--gold)" stroke={INK} strokeWidth={s * 0.07} />
      <ellipse cx={s * 0.51} cy={s * 0.36} rx={s * 0.24} ry={s * 0.24} fill="#cfe3ef" />
      <path d={`M${s * 0.38} ${s * 0.3}L${s * 0.5} ${s * 0.18}M${s * 0.4} ${s * 0.42}L${s * 0.6} ${s * 0.22}`} stroke="#fff" strokeWidth={s * 0.07} strokeLinecap="round" />
    </g>
  );
}
function ShieldG({ s }) {
  return <path d={`M${s / 2} ${s * 0.04}L${s * 0.88} ${s * 0.18}V${s * 0.5}C${s * 0.88} ${s * 0.74} ${s * 0.7} ${s * 0.88} ${s / 2} ${s * 0.98}C${s * 0.3} ${s * 0.88} ${s * 0.12} ${s * 0.74} ${s * 0.12} ${s * 0.5}V${s * 0.18}Z`} fill="var(--magenta)" stroke={INK} strokeWidth={s * 0.08} />;
}
function MinionG({ s, hollow = false }) {
  return <g opacity={hollow ? 0.55 : 1}><svg width={s} height={s} style={{ width: s, height: s }} viewBox="0 0 16 16"><Minion color={ROBE} size={16} /></svg>{hollow && <rect x={s * 0.08} y={s * 0.08} width={s * 0.84} height={s * 0.84} fill="none" stroke={INK} strokeWidth={s * 0.07} strokeDasharray={`${s * 0.12} ${s * 0.1}`} />}</g>;
}
function FolG({ s }) { return <svg width={s} height={s} viewBox="0 0 10 10" overflow="visible" style={{ color: CREAM, width: s, height: s, overflow: 'visible' }}><Follower size={10} /></svg>; }
function Num({ s, n, x, w }) {
  return <text x={x + w / 2} y={s * 0.54} fontSize={s * 0.92} fontWeight="800" textAnchor="middle" dominantBaseline="central" fill={INK} stroke={CREAM} strokeWidth={s * 0.2} paintOrder="stroke" fontFamily="var(--sans)" className="lm-num">{n}</text>;
}
const numW = (s, n) => (n == null ? 0 : s * (0.12 + 0.5 * String(n).length));

/** One piece as [width, element] at piece size s (board units), its top-left at 0,0. */
function draw(p, s) {
  const G = s * 0.08;
  switch (p.t) {
    case 'res': {
      const nw = numW(s, p.n);
      return [nw + s, <g>{p.n != null && <Num s={s} n={p.n} x={0} w={nw} />}<g transform={`translate(${nw} 0)`}><Glyph r={p.r} s={s} /></g></g>];
    }
    case 'fol': {
      const nw = numW(s, p.n);
      return [nw + s, <g>{p.n != null && <Num s={s} n={p.n} x={0} w={nw} />}<g transform={`translate(${nw} 0)`}><FolG s={s} /></g></g>];
    }
    case 'card': return [s * 1.0, <CardG s={s} badge={p.badge} />];
    case 'hood': return [s, <HoodG s={s} />];
    case 'hoodcard': return [s * 1.2, <g><CardG s={s} hood /><g transform={`translate(${s * 0.5} ${s * 0.42}) scale(.55)`}><HoodG s={s} /></g></g>];
    case 'to': return [s * 0.62, <path d={`M${s * 0.06} ${s / 2}H${s * 0.52}M${s * 0.34} ${s * 0.3}L${s * 0.54} ${s / 2}L${s * 0.34} ${s * 0.7}`} stroke={INK} strokeWidth={s * 0.11} fill="none" strokeLinecap="round" strokeLinejoin="round" />];
    case 'or': return [s * 0.5, <path d={`M${s * 0.38} ${s * 0.1}L${s * 0.12} ${s * 0.9}`} stroke={INK} strokeWidth={s * 0.1} strokeLinecap="round" />];
    case 'times': {
      const kw = s * 0.95;
      return [kw + s, <g><Num s={s} n={p.k} x={0} w={kw} /><g transform={`translate(${kw} 0)`}><Glyph r={p.r} s={s} /></g></g>];
    }
    case 'per': {
      // the unit full size, the glyph riding on its shoulder: "n ● on each unit"
      const nw = p.n > 1 ? numW(s, p.n) : 0;
      const unit = {
        card: <CardG s={s} />, newcard: <CardG s={s} badge="+" />, bluecard: <CardG s={s} tint="var(--blue)" />, hood: <HoodG s={s} />, richer: <HoodG s={s} n={2} />, ahead: <HoodG s={s} n={2} />,
        minion: <MinionG s={s} />, hollow: <MinionG s={s} hollow />, fol: <FolG s={s} />, color: <AnyRing s={s} />,
      }[p.unit];
      const uw = p.unit === 'richer' || p.unit === 'ahead' ? s * 1.32 : s;
      const g = s * 0.72;
      return [nw + uw + g * 0.55, (
        <g>
          {nw > 0 && <Num s={s} n={p.n} x={0} w={nw} />}
          <g transform={`translate(${nw + g * 0.55} 0)`}>{unit}</g>
          <g transform={`translate(${nw} ${-s * 0.18})`}><Glyph r={p.r} s={g} /></g>
          {p.unit === 'ahead' && <path d={`M${nw + g * 0.55 + uw - s * 0.1} ${s * 0.1}l${s * 0.14} ${-s * 0.2}l${s * 0.14} ${s * 0.2}`} stroke={INK} strokeWidth={s * 0.09} fill="none" />}
        </g>
      )];
    }
    case 'give': {
      // a gift: → a rival, the glyph in their hands
      const g = s * 0.72;
      const nw = p.n > 1 ? numW(s * 0.8, p.n) : 0;
      return [s * 0.55 + nw + s + g * 0.3, (
        <g>
          {draw(TO, s * 0.9)[1]}
          {nw > 0 && <g transform={`translate(${s * 0.55} ${s * 0.1})`}><Num s={s * 0.8} n={p.n} x={0} w={nw} /></g>}
          <g transform={`translate(${s * 0.55 + nw} 0)`}><HoodG s={s} /></g>
          <g transform={`translate(${s * 0.55 + nw + s * 0.55} ${s * 0.42})`}><Glyph r={p.r} s={g} /></g>
        </g>
      )];
    }
    case 'others': {
      // everyone else +n: two rivals, the glyph in front
      const g = s * 0.72;
      return [s * 1.32 + g * 0.4, <g><HoodG s={s} n={2} /><g transform={`translate(${s * 0.9} ${s * 0.42})`}><Glyph r={p.r} s={g} /></g></g>];
    }
    case 'swap': {
      const unit = k => (k === 'card' ? <CardG s={s} /> : k === 'hoodcard' ? <g><CardG s={s} hood /></g> : <Glyph r={k} s={s} />);
      const aw = s * 0.62;
      const nw = p.n ? numW(s, `${p.n}`) : 0;
      return [nw + s + aw + s, (
        <g>
          {nw > 0 && <Num s={s} n={p.n} x={0} w={nw} />}
          <g transform={`translate(${nw} 0)`}>{unit(p.a)}</g>
          <g transform={`translate(${nw + s} 0)`} stroke={INK} strokeWidth={s * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${aw * 0.1} ${s * 0.34}H${aw * 0.86}M${aw * 0.62} ${s * 0.18}L${aw * 0.88} ${s * 0.34}L${aw * 0.62} ${s * 0.5}`} />
            <path d={`M${aw * 0.9} ${s * 0.68}H${aw * 0.14}M${aw * 0.38} ${s * 0.52}L${aw * 0.12} ${s * 0.68}L${aw * 0.38} ${s * 0.84}`} />
          </g>
          <g transform={`translate(${nw + s + aw} 0)`}>{unit(p.b)}{p.b === 'hoodcard' && <g transform={`translate(${s * 0.5} ${s * 0.42}) scale(.55)`}><HoodG s={s} /></g>}</g>
        </g>
      )];
    }
    case 'mirror': {
      const badge = {
        hood: <HoodG s={s * 0.62} />, any: <AnyRing s={s * 0.62} />, mine: <MinionG s={s * 0.62} />,
        all: <g><MinionG s={s * 0.62} /><g transform={`translate(${s * 0.24} 0)`}><MinionG s={s * 0.62} /></g></g>,
      }[p.of];
      return [s * (p.of === 'all' ? 1.5 : 1.3), <g><MirrorG s={s} /><g transform={`translate(${s * 0.62} ${s * 0.4})`}>{badge}</g></g>];
    }
    case 'turns': {
      // extra turns: minions with a plus (one more placement each); own: your next minions, still to place, now (no plus)
      const nw = p.n != null ? numW(s, p.n) : 0;
      if (p.own) return [nw + s * 1.0, <g>{nw > 0 && <Num s={s} n={p.n} x={0} w={nw} />}<g transform={`translate(${nw} 0)`}><MinionG s={s} hollow /></g></g>];
      return [nw + s * 1.1, <g>{nw > 0 && <Num s={s} n={p.n} x={0} w={nw} />}<g transform={`translate(${nw} 0)`}><MinionG s={s} /></g><g transform={`translate(${nw + s * 0.62} ${-s * 0.1})`}><circle cx={s * 0.22} cy={s * 0.22} r={s * 0.22} fill="var(--purple)" stroke={INK} strokeWidth={s * 0.06} /><path d={`M${s * 0.22} ${s * 0.1}V${s * 0.34}M${s * 0.1} ${s * 0.22}H${s * 0.34}`} stroke={CREAM} strokeWidth={s * 0.08} /></g></g>];
    }
    case 'all': {
      // everything of a kind: a fanned stack of three
      const g = s * 0.86;
      return [s * 1.3, <g>{[0, 1, 2].map(i => <g key={i} transform={`translate(${i * s * 0.22} ${(2 - i) * s * 0.07})`}><Glyph r={p.r} s={g} /></g>)}</g>];
    }
    case 'each': {
      // one of each color: four small glyphs in a square, with the count
      const g = s * 0.52;
      const nw = p.n > 1 ? numW(s, p.n) : 0;
      return [nw + s * 1.06, <g>{nw > 0 && <Num s={s} n={p.n} x={0} w={nw} />}{RAINBOW.map((k, i) => <g key={k} transform={`translate(${nw + (i % 2) * g} ${Math.floor(i / 2) * g})`}><Glyph r={k} s={g} /></g>)}</g>];
    }
    case 'set': {
      // a full set: four glyphs in a row, bracketed
      const g = s * 0.5;
      return [s * 1.12, <g><rect x={0} y={s * 0.02} width={s * 1.1} height={s * 0.96} rx={s * 0.16} fill={CREAM} stroke={INK} strokeWidth={s * 0.07} />{RAINBOW.map((k, i) => <g key={k} transform={`translate(${s * 0.05 + (i % 2) * g} ${s * 0.02 + Math.floor(i / 2) * g * 0.95})`}><Glyph r={k} s={g} /></g>)}</g>];
    }
    case 'lowest': {
      // top up the lowest: three bars, the short one gets a +1
      return [s * 1.3, (
        <g stroke={INK} strokeWidth={s * 0.07}>
          <rect x={0} y={s * 0.2} width={s * 0.3} height={s * 0.78} fill="var(--gold)" />
          <rect x={s * 0.34} y={s * 0.38} width={s * 0.3} height={s * 0.6} fill="var(--blue)" />
          <rect x={s * 0.68} y={s * 0.72} width={s * 0.3} height={s * 0.26} fill="var(--green)" />
          <rect x={s * 0.68} y={s * 0.42} width={s * 0.3} height={s * 0.26} fill="var(--green)" strokeDasharray={`${s * 0.08} ${s * 0.06}`} opacity=".9" />
          <path d={`M${s * 1.12} ${s * 0.32}V${s * 0.62}M${s * 0.97} ${s * 0.47}H${s * 1.27}`} strokeWidth={s * 0.1} />
        </g>
      )];
    }
    case 'row': {
      // a fresh row: three cards with a turning arrow
      return [s * 1.5, (
        <g>
          {[0, 1, 2].map(i => <g key={i} transform={`translate(${i * s * 0.28} 0) scale(.9)`}><CardG s={s} /></g>)}
          <g transform={`translate(${s * 0.95} ${s * 0.45})`}><circle cx={s * 0.26} cy={s * 0.26} r={s * 0.27} fill="var(--blue)" stroke={INK} strokeWidth={s * 0.06} /><path d={`M${s * 0.4} ${s * 0.13}A${s * 0.15} ${s * 0.15} 0 1 0 ${s * 0.42} ${s * 0.33}`} fill="none" stroke={CREAM} strokeWidth={s * 0.07} /></g>
        </g>
      )];
    }
    case 'shield': return [s * 0.9, <g transform={`scale(.9)`}><ShieldG s={s} /></g>];
    case 'ransom': {
      // their original-color payment or their member
      const g = s * 0.8;
      return [g + s * 0.46 + s * 0.8, <g><g transform={`translate(0 ${s * 0.1})`}><Glyph r="any" s={g} /></g>{draw(OR, s * 0.9)[1] && <g transform={`translate(${g} 0)`}>{draw(OR, s)[1]}</g>}<g transform={`translate(${g + s * 0.46} ${s * 0.1}) scale(.8)`}><CardG s={s} /></g></g>];
    }
    default: return [0, null];
  }
}

/** A row of pieces, centred on x = 0, its top at y = 0. s is one piece's height in board units. */
export function PieceRow({ pieces, s }) {
  const gap = s * 0.14;
  const drawn = pieces.map(p => draw(p, s));
  const W = drawn.reduce((t, [w]) => t + w, 0) + gap * Math.max(0, drawn.length - 1);
  let x = -W / 2;
  return (
    <g className="lm-pieces">
      {drawn.map(([w, el], k) => { const at = x; x += w + gap; return <g key={k} transform={`translate(${at} 0)`}>{el}</g>; })}
    </g>
  );
}
export const rowWidth = (pieces, s) => pieces.map(p => draw(p, s)[0]).reduce((t, w) => t + w, 0) + s * 0.14 * Math.max(0, pieces.length - 1);
