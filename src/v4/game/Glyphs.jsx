// Small shapes for the Lamplit table. A resource is a flat dot in its color carrying a quiet inner mark (the visual
// language, plate 1b), so color is never the only cue; a seat is a hooded figure in its color carrying its sigil; followers are a mark that grows in
// clusters of 10 and 5. Every one says what it is on hover (title) and long-press (TouchTips).
import { useEffect } from 'react';
import { Follower } from '../art/Follower.jsx';
import { playerColor, seatSigil, seatEmoji } from '../format.js';
import { Leader, Minion } from '../art/Leader.jsx';
import Tick from './Tick.jsx';

// 16×16 outlines, one per resource; anything else is a disc.
const SHAPES = {
  gold: 'M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13Z',
  red: 'M8 1.5C10.5 5 13 7.6 13 10.2A5 5 0 0 1 3 10.2C3 7.6 5.5 5 8 1.5Z',
  blue: 'M3 3H13V13H3Z',
  green: 'M13.5 2.5C13.5 9 10 13.5 3 13.5C3 7 6.5 2.5 13.5 2.5Z',
  magenta: 'M8 1.5L14 6.5L8 14.5L2 6.5Z',
  silver: 'M8 1.8C11 1.8 12 4.5 12 7.5V10.5L13.6 12.6H2.4L4 10.5V7.5C4 4.5 5 1.8 8 1.8ZM6.6 13.4H9.4A1.4 1.4 0 0 1 6.6 13.4Z',
  yellow: 'M8 4.3a3.7 3.7 0 1 1 0 7.4a3.7 3.7 0 1 1 0-7.4ZM6.82 3.55L8.00 1.00L9.18 3.55ZM10.31 4.02L12.95 3.05L11.98 5.69ZM12.45 6.82L15.00 8.00L12.45 9.18ZM11.98 10.31L12.95 12.95L10.31 11.98ZM9.18 12.45L8.00 15.00L6.82 12.45ZM5.69 11.98L3.05 12.95L4.02 10.31ZM3.55 9.18L1.00 8.00L3.55 6.82ZM4.02 5.69L3.05 3.05L5.69 4.02Z', // a sun, never a star
  purple: 'M3.5 1.8H12.5V4.2L9.2 8L12.5 11.8V14.2H3.5V11.8L6.8 8L3.5 4.2Z',
  white: 'M8 1.5L13.6 4.75V11.25L8 14.5L2.4 11.25V4.75Z',
};
const NAMES = { gold: 'gold', red: 'red', blue: 'blue', green: 'green', magenta: 'magenta', silver: 'silver', yellow: 'yellow', purple: 'purple', white: 'white' };

// ---------- the resource dot (visual language, plate 1b): a flat disc in its color with a quiet darker edge ----------
// Color is never the only cue: each dot carries one quiet inner mark, drawn small enough to stay calm at 12px.
// gold solid · red a fine ring · blue a centre dot · green split by a line · yellow a cross · magenta a shaded half ·
// purple a bar · silver a small ring · white solid with a firm hairline edge (a cream dot on cream paper).
const DISC = 'M8 1.75a6.25 6.25 0 1 1 0 12.5a6.25 6.25 0 1 1 0-12.5Z';
const EDGE = 'rgba(30,18,8,.28)';
const MARK = 'rgba(30,18,8,.44)';
const DOT_MARKS = {
  red: <circle cx="8" cy="8" r="3.4" fill="none" stroke={MARK} strokeWidth="1.15" />,
  blue: <circle cx="8" cy="8" r="1.75" fill={MARK} />,
  green: <path d="M4.2 11.8L11.8 4.2" stroke={MARK} strokeWidth="1.15" strokeLinecap="round" />,
  yellow: <path d="M8 5.2V10.8M5.2 8H10.8" stroke={MARK} strokeWidth="1.15" strokeLinecap="round" />,
  magenta: <path d="M1.75 8a6.25 6.25 0 0 0 12.5 0Z" fill="rgba(30,18,8,.24)" />,
  purple: <path d="M5 8H11" stroke={MARK} strokeWidth="1.3" strokeLinecap="round" />,
  silver: <circle cx="8" cy="8" r="2" fill="none" stroke={MARK} strokeWidth="1.1" />,
};
// "any": the wheel in miniature, four quarters in the table's colors, each where its quadrant sits (--any-top… are
// the plate's gold/blue/green/red until the live table sets its own: useAnyDot below)
const ANY_WEDGES = [
  ['top', 'M8 8L3.58 3.58A6.25 6.25 0 0 1 12.42 3.58Z'],
  ['right', 'M8 8L12.42 3.58A6.25 6.25 0 0 1 12.42 12.42Z'],
  ['bottom', 'M8 8L12.42 12.42A6.25 6.25 0 0 1 3.58 12.42Z'],
  ['left', 'M8 8L3.58 12.42A6.25 6.25 0 0 1 3.58 3.58Z'],
];

/** One resource as a flat dot in its color with its quiet mark; r="any" is the split dot. decorative: no title / role
 *  (inside something that already says it). */
export function ResourceGlyph({ r, size = 16, n = null, decorative = false }) {
  const name = r === 'any' ? 'any resource' : NAMES[r] || r;
  const label = n == null ? name : `${n} ${name}`;
  return (
    <svg className={`res-glyph${r === 'any' ? ' any' : ''}`} data-res-glyph={r} viewBox="0 0 16 16" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined}>
      {decorative ? null : <title>{label}</title>}
      {r === 'any'
        ? ANY_WEDGES.map(([k, d]) => <path key={k} d={d} fill={`var(--any-${k})`} />)
        : <path d={DISC} fill={`var(--q-${r}, var(--${r}))`} />}
      {DOT_MARKS[r] || null}
      <circle cx="8" cy="8" r={r === 'white' ? 5.65 : 5.75} fill="none" stroke={r === 'white' ? 'rgba(30,18,8,.6)' : EDGE} strokeWidth={r === 'white' ? 1.2 : 1} />
    </svg>
  );
}

// ---------- the marks (plate 1b's closed alphabet): every one on a 16-unit grid, strokes 2 units, round ends ----------
// member (a card with a person) · minion (the worker) · rival (a hood) · becomes (→) · swap (⇄, same stroke) ·
// extra turn (↻). The follower stays Cory's pixel person (art/Follower.jsx); per (/) and times (×) are typed.
const ST = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const MARKS = {
  member: <><rect x="3" y="1.5" width="10" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="6.2" r="1.9" fill="currentColor" /><path d="M5 12C5 10 6.3 9 8 9C9.7 9 11 10 11 12Z" fill="currentColor" /></>,
  minion: <path fill="currentColor" d="M8 1A2.9 2.9 0 0 1 10.6 5.2C12.6 5.6 14.6 6.3 14.6 7.9C14.6 9 13.6 9.4 12 9.6L13.6 13.6C13.9 14.4 13.5 15 12.7 15H9.8L8 12.2L6.2 15H3.3C2.5 15 2.1 14.4 2.4 13.6L4 9.6C2.4 9.4 1.4 9 1.4 7.9C1.4 6.3 3.4 5.6 5.4 5.2A2.9 2.9 0 0 1 8 1Z" />,
  rival: <path fillRule="evenodd" fill="currentColor" d="M8 1C11.7 1 13.4 4.4 13.4 8.6L14.4 15H1.6L2.6 8.6C2.6 4.4 4.3 1 8 1ZM8 5.4C6.5 5.4 5.6 6.8 5.6 8.6C5.6 10.4 6.5 11.6 8 11.6C9.5 11.6 10.4 10.4 10.4 8.6C10.4 6.8 9.5 5.4 8 5.4Z" />,
  arrow: <path d="M2 8H13M9 4L13 8L9 12" {...ST} />,
  swap: <path d="M2.5 5H13M10.5 2.5L13 5L10.5 7.5M13.5 11H3M5.5 8.5L3 11L5.5 13.5" {...ST} strokeWidth="1.8" />,
  turn: <><path d="M13 8A5 5 0 1 1 10.5 3.67" {...ST} /><path d="M8.6 1.6L11.4 3.4L9.6 6.2" {...ST} /></>,
};
const MARK_SAY = { member: 'member', minion: 'minion', rival: 'a rival', arrow: 'becomes', swap: 'swap', turn: 'an extra turn' };
/** One mark of the alphabet, .8em of the type it sits in (class mk); it says what it is on hover. */
export function Mark({ k, title = null, className = '' }) {
  const say = title || MARK_SAY[k] || k;
  return (
    <svg className={`mk mk-${k}${className ? ` ${className}` : ''}`} data-mark={k} viewBox="0 0 16 16" width="16" height="16" role="img" aria-label={say}>
      <title>{say}</title>{MARKS[k] || null}
    </svg>
  );
}
/** per (/) and times (×): typed in the numeral face, quieter than the numbers around them. */
export function Op({ t, title = null }) {
  const say = title || (t === '/' ? 'per' : t === '×' ? 'times' : t);
  return <span className="op" data-op={t} title={say}>{t}</span>;
}

/** The live table's colors in the "any" dot: quadrant q sits at 180 + 90q degrees on the wheel (0 = top, clockwise),
 *  so q0 is the bottom, q1 the left, q2 the top, q3 the right. Pass resource colors in quadrant order. */
export function anyDotVars(colors) {
  if (!colors || colors.length !== 4) return null;
  const [bottom, left, top, right] = colors.map(c => `var(--${c})`);
  return { '--any-top': top, '--any-right': right, '--any-bottom': bottom, '--any-left': left };
}
/** Puts the table's colors on the page (hover cards and dialogs live outside the board), and takes them off after. */
export function useAnyDot(colors) {
  const key = (colors || []).join(',');
  useEffect(() => {
    const vars = anyDotVars(key ? key.split(',') : null);
    if (!vars || typeof document === 'undefined') return undefined;
    const st = document.documentElement.style;
    for (const [k, v] of Object.entries(vars)) st.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) st.removeProperty(k); };
  }, [key]);
}

// ---------- coins: a disc in the resource's color with its glyph inside (setup picker, pay) ----------
// Gold and yellow are close in hue, so a coin never relies on color: the mark inside is the resource's own shape
// (gold a ring, yellow a sun), in ink that stands out on that coin (dark on the light coins, cream on the dark ones).
const LIGHT_COINS = new Set(['gold', 'yellow', 'silver', 'white']);
export const COIN_INK = { dark: '#2a1f17', light: '#f6eedb' };
export const markInk = r => (LIGHT_COINS.has(r) ? COIN_INK.dark : COIN_INK.light);
export function CoinMark({ r, size = 16 }) {
  const ink = markInk(r);
  let shape;
  if (r === 'gold') shape = <circle cx="8" cy="8" r="4.4" fill="none" stroke={ink} strokeWidth="2.4" />;
  else if (r === 'yellow') {
    shape = (
      <g>
        <circle cx="8" cy="8" r="3.1" fill={ink} />
        <path d="M8 .9V3.1M8 12.9V15.1M.9 8H3.1M12.9 8H15.1M3 3L4.6 4.6M11.4 11.4L13 13M3 13L4.6 11.4M11.4 4.6L13 3" stroke={ink} strokeWidth="1.9" strokeLinecap="round" fill="none" />
      </g>
    );
  } else shape = <path d={SHAPES[r] || SHAPES.gold} fill={ink} />;
  return <svg className="coin-mark" data-coin-mark={r} viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">{shape}</svg>;
}

/** A follower: the pixel person mark (art/Follower.jsx), never a star. */
export function FollowerGlyph({ size = 12, title = 'followers' }) { return <Follower size={size} title={title} />; }

/**
 * Followers as a mark that grows: a big disc per 10, a mid disc per 5, a dot per 1 (n up to ~40 stays compact),
 * with the number beside it. title says how it adds up.
 */
export function FollowerMark({ n, size = 6, label = true }) {
  const tens = Math.floor(n / 10), fives = Math.floor((n % 10) / 5), ones = n % 5;
  const title = `${n} follower${n === 1 ? '' : 's'}${n >= 5 ? ` (${[tens && `${tens}×10`, fives && '5', ones && `${ones}×1`].filter(Boolean).join(' + ')})` : ''}`;
  return (
    <span className="fol-mark" title={title} aria-label={title} role="img" data-followers={n}>
      {label && <b className="num"><Tick value={n} className="num" float={false} /></b>}
      <span className="dots" aria-hidden="true">
        {Array.from({ length: tens }, (_, k) => <i key={`t${k}`} className="d10" style={{ width: size * 2, height: size * 2 }} />)}
        {Array.from({ length: fives }, (_, k) => <i key={`f${k}`} className="d5" style={{ width: size * 1.5, height: size * 1.5 }} />)}
        {Array.from({ length: ones }, (_, k) => <i key={`o${k}`} className="d1" style={{ width: size, height: size }} />)}
      </span>
    </span>
  );
}

/** A seat's cult leader (32px): the robed figure in the seat's accent color with the player's emoji (or sigil). */
export function SeatFigure({ id, state = null, size = 32, title = null, dim = false }) {
  return (
    <span className={`seat-fig${dim ? ' dim' : ''}`} data-seat={id} title={title || undefined} style={{ width: size, height: size }}>
      <Leader color={playerColor(id)} emoji={seatEmoji(state, id)} sigil={seatSigil(id)} size={size} />
    </span>
  );
}
/** A minion (16px): one of a seat's workers. */
export function SeatMinion({ id, size = 16, dim = false, title = null }) {
  return <span className={`seat-min${dim ? ' dim' : ''}`} data-seat={id} title={title || undefined}><Minion color={playerColor(id)} size={size} /></span>;
}

/**
 * A leader with its unplaced minions floating around it (Cory, 2026-10-14): how many are left is seen, not read.
 * Each minion bobs slowly by one pixel on its own period and phase, so the ring never moves in step.
 * The leader is the anchor a placed minion flies from (data-leader={id}); each floating minion is data-minion.
 * size: the leader (32); minion: each minion (16). compact packs the ring tighter.
 */
export function LeaderRing({ state, id, size = 32, minion = 16, compact = false }) {
  const p = state.players[id];
  const n = Math.max(0, p.left || 0);
  const W = compact ? size + minion * 1.6 : size + minion * 2.2;
  const H = compact ? Math.max(size, 44) : size + minion * 1.6;
  const cx = W / 2, cy = H / 2 + (compact ? 0 : minion * 0.15);
  const R = size / 2 + minion * (compact ? 0.42 : 0.62);
  // spread over the arc above and beside the leader, widening as more are left
  const span = Math.min(300, 70 + n * 38);
  const at = k => {
    const a = (n === 1 ? 0 : -span / 2 + (span * k) / (n - 1)) * (Math.PI / 180);
    return { left: cx + R * Math.sin(a) - minion / 2, top: cy - R * Math.cos(a) - minion / 2 };
  };
  const name = p.name;
  const label = `${name}'s leader${n ? ` and ${n} minion${n === 1 ? '' : 's'} still to place` : ', every minion placed'}`;
  return (
    <span className={`lt-ring${compact ? ' compact' : ''}`} style={{ width: W, height: H }} title={label} aria-label={label} role="img" data-leader-ring={id} data-left={n}>
      <span className="lead" data-leader={id} style={{ left: cx - size / 2, top: cy - size / 2 }}>
        <Leader color={playerColor(id)} emoji={seatEmoji(state, id)} sigil={seatSigil(id)} size={size} />
      </span>
      {Array.from({ length: n }, (_, k) => {
        // its own slow period and phase (golden-ratio spread), so no two bob together
        const f = ((id * 3 + k) * 0.618034) % 1;
        return (
          <span key={k} className="orbit" data-minion={id} data-k={k}
            style={{ ...at(k), width: minion, height: minion, animationDuration: `${(3.6 + f * 1.6).toFixed(2)}s`, animationDelay: `${(-f * 5).toFixed(2)}s` }}>
            <Minion color={playerColor(id)} emoji={seatEmoji(state, id)} size={minion} />
          </span>
        );
      })}
    </span>
  );
}

/** A player, as players see them: their emoji (a minion) and their name. No shapes, no color-only dots. */
export function Who({ state, id, name = null, size = 16, meId = null }) {
  const p = state.players[id];
  if (name == null && id === meId) name = 'You';
  return (
    <span className="who-tag" data-who={id}>
      <Minion color={playerColor(id)} emoji={seatEmoji(state, id)} size={size} title={`${p.name}'s emoji`} />
      <span className="who-name">{name ?? p.name}</span>
    </span>
  );
}
