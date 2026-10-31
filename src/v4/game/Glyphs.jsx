// Small shapes for the Lamplit table. The visual language (plate 1b; Cory 2026-10-15: "just simplify visual language
// everywhere"): two symbols only. A resource is a plain flat dot in its color ("any" is the dot split into the table's
// four colors), and a follower is Cory's pixel person; everything else is a plain word. A seat is a hooded figure in its
// color carrying its sigil. Every one says what it is on hover (title) and long-press (TouchTips).
import { useEffect, useId } from 'react';
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
// A table of 2 or 3 spheres (one per player, Cory 2026-10-15) splits the dot in halves or thirds, each where its
// quadrant sits (quadrant k at 180 + k·360/n degrees, 0 = top, clockwise), filled by --any-q0… (useAnyDot)
let anyCount = 4;
/** How many parts the "any" dot has on this table (2, 3 or 4): for the CSS dots that draw it without an SVG (GiftCard). */
export const anyParts = () => anyCount;
const dotAt = a => { const t = (a * Math.PI) / 180; return `${(8 + 6.25 * Math.sin(t)).toFixed(2)} ${(8 - 6.25 * Math.cos(t)).toFixed(2)}`; };
const anyWedges = n => Array.from({ length: n }, (_, k) => {
  const a0 = 180 + (k * 360) / n - 180 / n, a1 = a0 + 360 / n;
  return [k, `M8 8L${dotAt(a0)}A6.25 6.25 0 0 1 ${dotAt(a1)}Z`, `M8 8L${dotAt(a0)}`];
});

/** One resource as a plain dot in its color; r="any" is the split dot. decorative: no title / role (inside something
 *  that already says it). */
export function ResourceGlyph({ r, size = 16, n = null, decorative = false }) {
  const name = r === 'any' ? 'any resource' : NAMES[r] || r;
  const label = n == null ? name : `${n} ${name}`;
  // white is a pearl (design pod, w3a A4 blocker): a white disc lightly shaded toward its edge, so on cream paper it reads
  // as a white thing, never as an empty ring or a zero; every other dot is flat. Its own gradient id (useId): a shared id
  // would break wherever the first copy sits hidden.
  const pearl = `pearl${useId().replace(/:/g, '')}`;
  const fill = r === 'white' ? `url(#${pearl})` : `var(--q-${r}, var(--${r}))`;
  return (
    <svg className={`res-glyph${r === 'any' ? ' any' : ''}`} data-res-glyph={r} viewBox="0 0 16 16" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined}
      style={{ color: r === 'any' ? undefined : r === 'white' ? 'var(--white, #e6dcc6)' : `var(--q-${r}, var(--${r}))` }}>
      {decorative ? null : <title>{label}</title>}
      {r === 'white' && <defs><radialGradient id={pearl} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cdc5b6" /></radialGradient></defs>}
      {r === 'any'
        ? (anyCount === 4 ? ANY_WEDGES.map(([k, d]) => <path key={k} d={d} fill={`var(--any-${k})`} />)
          : anyWedges(anyCount).map(([k, d]) => <path key={k} d={d} fill={`var(--any-q${k})`} />))
        : <path d={DISC} fill={fill} />}
      {/* "any": a hairline cross keeps its four colors apart at 10px (it read as one magenta blob, w3a A4) */}
      {r === 'any' && <path className="any-cross" d={anyCount === 4 ? 'M3.58 3.58L12.42 12.42M12.42 3.58L3.58 12.42' : anyWedges(anyCount).map(w => w[2]).join('')} stroke="rgba(30,18,8,.5)" strokeWidth=".8" fill="none" />}
      <circle className="res-ring" cx="8" cy="8" r="5.75" fill="none" stroke={r === 'white' ? 'rgba(30,18,8,.45)' : r === 'silver' ? 'rgba(30,18,8,.55)' : 'rgba(30,18,8,.28)'} strokeWidth={r === 'silver' ? 1.3 : 1} />
    </svg>
  );
}

/** The live table's colors in the "any" dot: quadrant q sits at 180 + 90q degrees on the wheel (0 = top, clockwise),
 *  so q0 is the bottom, q1 the left, q2 the top, q3 the right. Pass resource colors in quadrant order. */
export function anyDotVars(colors) {
  if (colors && (colors.length === 2 || colors.length === 3)) return Object.fromEntries(colors.map((c, k) => [`--any-q${k}`, `var(--${c})`]));
  if (!colors || colors.length !== 4) return null;
  const [bottom, left, top, right] = colors.map(c => `var(--${c})`);
  return { '--any-top': top, '--any-right': right, '--any-bottom': bottom, '--any-left': left };
}
/** Puts the table's colors on the page (hover cards and dialogs live outside the board), and takes them off after. */
export function useAnyDot(colors) {
  const key = (colors || []).join(',');
  // how many parts the dot has, set as the table renders (before any dot in it draws); a table changes between games only
  anyCount = colors && colors.length >= 2 && colors.length <= 3 ? colors.length : 4;
  useEffect(() => {
    const vars = anyDotVars(key ? key.split(',') : null);
    if (!vars || typeof document === 'undefined') return undefined;
    const st = document.documentElement.style;
    for (const [k, v] of Object.entries(vars)) st.setProperty(k, v);
    return () => { for (const k of Object.keys(vars)) st.removeProperty(k); };
  }, [key]);
}

/** A follower: the pixel person mark (art/Follower.jsx), never a star. */
/**
 * A member: a smooth head and shoulders (Cory, 2026-10-29: "a red head and shoulders symbol for red member, and make it a
 * mix of the colors in the game (like the wildcard token is) of the same symbol for any member"). r: a resource color, or
 * none for any member, split like the "any" dot in the table's colors: head halves and body halves, no line between
 * (Cory: "head and body apart… you dont need that thick line"). Kept apart from the follower's dark pixel person.
 */
const BUST = 'M8 1.2a3.3 3.3 0 1 1 0 6.6a3.3 3.3 0 1 1 0-6.6ZM1.6 15.2C1.6 11.2 4.2 8.8 8 8.8S14.4 11.2 14.4 15.2Z';
const BUST_PARTS = {
  2: [['M0 0H8V16H0Z', '--any-q0'], ['M8 0H16V16H8Z', '--any-q1']],
  3: [['M0 0H16V8.3H0Z', '--any-q0'], ['M0 8.3H8V16H0Z', '--any-q1'], ['M8 8.3H16V16H8Z', '--any-q2']],
  4: [['M0 0H8V8.3H0Z', '--any-top'], ['M8 0H16V8.3H8Z', '--any-right'], ['M0 8.3H8V16H0Z', '--any-left'], ['M8 8.3H16V16H8Z', '--any-bottom']],
};
// off a table (the members page, the rules), a split of four 2.0 colors
const BUST_FALLBACK = { '--any-top': 'var(--red)', '--any-right': 'var(--blue)', '--any-left': 'var(--green)', '--any-bottom': 'var(--purple)', '--any-q0': 'var(--red)', '--any-q1': 'var(--blue)', '--any-q2': 'var(--green)' };
export function MemberGlyph({ r = null, size = 16, n = null, decorative = false }) {
  const clip = `bust${useId().replace(/:/g, '')}`;
  const name = r ? `${NAMES[r] || r} member` : 'member';
  const label = n == null ? name : `${n} ${name}${n === 1 ? '' : 's'}`;
  return (
    <svg className={`member-glyph${r ? '' : ' any'}`} data-member-glyph={r || 'any'} viewBox="0 0 16 16" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined}>
      {decorative ? null : <title>{label}</title>}
      {r
        ? <path d={BUST} fill={r === 'white' ? 'var(--white, #e6dcc6)' : `var(--q-${r}, var(--${r}))`} />
        : <><defs><clipPath id={clip}><path d={BUST} /></clipPath></defs>
          <g clipPath={`url(#${clip})`}>{BUST_PARTS[anyCount].map(([d, v]) => <path key={v} d={d} fill={`var(${v}, ${BUST_FALLBACK[v]})`} />)}</g></>}
      <path d={BUST} fill="none" stroke={r === 'white' || r === 'silver' ? 'rgba(30,18,8,.7)' : 'rgba(30,18,8,.55)'} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

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

/** Cory's easter egg (2026-10-15): a player named Max gets a leader 20% taller (taller, not bigger); Pants too (2026-10-18) */
const TALL = new Set(['max', 'pants']);
export const isMax = (state, id) => TALL.has((state?.players?.[id]?.name || '').trim().toLowerCase());
/** A seat's cult leader (32px): the robed figure in the seat's accent color with the player's emoji (or sigil). */
export function SeatFigure({ id, state = null, size = 32, title = null, dim = false, face = false }) {
  return (
    <span className={`seat-fig${dim ? ' dim' : ''}`} data-seat={id} title={title || undefined} style={{ width: size, height: size }}>
      {/* every seat shows the robed leader (Cory, 2026-10-15; face is ignored) */}
      <Leader color={playerColor(id)} emoji={seatEmoji(state, id)} sigil={seatSigil(id)} size={size} tall={isMax(state, id)} />
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
export function LeaderRing({ state, id, size = 32, minion = 16, compact = false, orbit = true, face = false }) {
  const p = state.players[id];
  // orbit false: the leader alone (the chairs stand their minions in a column beside the total, CultSeat)
  const n = orbit ? Math.max(0, p.left || 0) : 0;
  if (!orbit) minion = 0;
  const W = compact ? size + minion * 1.6 : size + minion * 2.2;
  const H = compact ? Math.max(size, orbit ? 44 : size) : size + minion * 1.6;
  const cx = W / 2, cy = H / 2 + (compact ? 0 : minion * 0.15);
  const R = size / 2 + minion * (compact ? 0.42 : 0.62);
  // spread over the arc above and beside the leader, widening as more are left
  const span = Math.min(300, 70 + n * 38);
  const at = k => {
    const a = (n === 1 ? 0 : -span / 2 + (span * k) / (n - 1)) * (Math.PI / 180);
    return { left: cx + R * Math.sin(a) - minion / 2, top: cy - R * Math.cos(a) - minion / 2 };
  };
  const name = p.name;
  const left = Math.max(0, p.left || 0);
  const label = `${name}'s leader${left ? ` and ${left} minion${left === 1 ? '' : 's'} still to place` : ', every minion placed'}`;
  return (
    <span className={`lt-ring${compact ? ' compact' : ''}`} style={{ width: W, height: H }} data-hint={label} aria-label={label} role="img" data-leader-ring={id} data-left={left}>
      <span className="lead" data-leader={id} style={{ left: cx - size / 2, top: cy - size / 2 }}>
        {/* every seat shows the robed leader (Cory, 2026-10-15: "every block should show a robed leader") */}
        <Leader color={playerColor(id)} emoji={seatEmoji(state, id)} sigil={seatSigil(id)} size={size} tall={isMax(state, id)} />
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
