// Small shapes for the Lamplit table. The visual language (plate 1b; Cory 2026-10-15: "just simplify visual language
// everywhere"): two symbols only. A resource is a plain flat dot in its color ("any" is the dot split into the table's
// four colors), and a follower is Cory's pixel person; everything else is a plain word. A seat is a hooded figure in its
// color carrying its sigil. Every one says what it is on hover (title) and long-press (TouchTips).
import { useEffect } from 'react';
import { Follower } from '../art/Follower.jsx';
import { playerColor, seatSigil, seatEmoji } from '../format.js';
import { Leader, Minion } from '../art/Leader.jsx';
import Tick from './Tick.jsx';

const NAMES = { gold: 'gold', red: 'red', blue: 'blue', green: 'green', magenta: 'magenta', silver: 'silver', yellow: 'yellow', purple: 'purple', white: 'white' };

// ---------- the resource dot: a flat disc in its color with a quiet darker edge; the cream dot (white) a firm hairline ----------
const DISC = 'M8 1.75a6.25 6.25 0 1 1 0 12.5a6.25 6.25 0 1 1 0-12.5Z';
// "any": the wheel in miniature, four quarters in the table's colors, each where its quadrant sits (--any-top… are
// the plate's gold/blue/green/red until the live table sets its own: useAnyDot below)
const ANY_WEDGES = [
  ['top', 'M8 8L3.58 3.58A6.25 6.25 0 0 1 12.42 3.58Z'],
  ['right', 'M8 8L12.42 3.58A6.25 6.25 0 0 1 12.42 12.42Z'],
  ['bottom', 'M8 8L12.42 12.42A6.25 6.25 0 0 1 3.58 12.42Z'],
  ['left', 'M8 8L3.58 12.42A6.25 6.25 0 0 1 3.58 3.58Z'],
];

/** One resource as a plain dot in its color; r="any" is the split dot. decorative: no title / role (inside something
 *  that already says it). */
export function ResourceGlyph({ r, size = 16, n = null, decorative = false }) {
  const name = r === 'any' ? 'any resource' : NAMES[r] || r;
  const label = n == null ? name : `${n} ${name}`;
  return (
    <svg className={`res-glyph${r === 'any' ? ' any' : ''}`} data-res-glyph={r} viewBox="0 0 16 16" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined}>
      {decorative ? null : <title>{label}</title>}
      {r === 'any'
        ? ANY_WEDGES.map(([k, d]) => <path key={k} d={d} fill={`var(--any-${k})`} />)
        : <path d={DISC} fill={`var(--q-${r}, var(--${r}))`} />}
      <circle cx="8" cy="8" r={r === 'white' ? 5.65 : 5.75} fill="none" stroke={r === 'white' ? 'rgba(30,18,8,.55)' : 'rgba(30,18,8,.28)'} strokeWidth={r === 'white' ? 1.2 : 1} />
    </svg>
  );
}

// ---------- words, not marks (Cory, 2026-10-15: simplify) ----------
// The one drawn mark left besides the dot and the follower: the arrow of a follower buy ("2● → 1👤"). Every other mark
// a caller asks for prints as its plain word, so an old @m / ⇄ / ↻ anywhere reads "member", "swap", "extra turn".
const ARROW = <path d="M2 8H13M9 4L13 8L9 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
export const MARK_WORD = { member: 'member', minion: 'minion', rival: 'rival', swap: 'swap', turn: 'extra turn', arrow: 'for' };
/** The follower buy's arrow (k="arrow", .8em of its type); any other k prints its plain word. */
export function Mark({ k, title = null, className = '' }) {
  if (k !== 'arrow') return <span className={`mk-word${className ? ` ${className}` : ''}`}>{MARK_WORD[k] || k}</span>;
  const say = title || 'becomes';
  return (
    <svg className={`mk mk-arrow${className ? ` ${className}` : ''}`} data-mark="arrow" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label={say}>
      <title>{say}</title>{ARROW}
    </svg>
  );
}
/** "/" prints as the word "per"; anything else (a "·" between clauses) as itself, quiet. */
export function Op({ t }) {
  return <span className="op" data-op={t}>{t === '/' ? ' per ' : t}</span>;
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
