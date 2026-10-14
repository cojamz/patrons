// Small shapes for the Lamplit table. A resource is a shape AND a color (coin, drop, gem…), so color is never
// the only cue; a seat is a hooded figure in its color carrying its sigil; followers are a mark that grows in
// clusters of 10 and 5. Every one says what it is on hover (title) and long-press (TouchTips).
import { Sprite } from '../art/Sprite.jsx';
import { Follower } from '../art/Follower.jsx';
import { playerColor, seatSigil, seatEmoji } from '../format.js';
import { Leader, Minion } from '../art/Leader.jsx';

// 16×16 outlines, one per resource; anything else is a disc.
const SHAPES = {
  gold: 'M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13Z',
  red: 'M8 1.5C10.5 5 13 7.6 13 10.2A5 5 0 0 1 3 10.2C3 7.6 5.5 5 8 1.5Z',
  blue: 'M3 3H13V13H3Z',
  green: 'M13.5 2.5C13.5 9 10 13.5 3 13.5C3 7 6.5 2.5 13.5 2.5Z',
  magenta: 'M8 1.5L14 6.5L8 14.5L2 6.5Z',
  silver: 'M8 1.8C11 1.8 12 4.5 12 7.5V10.5L13.6 12.6H2.4L4 10.5V7.5C4 4.5 5 1.8 8 1.8ZM6.6 13.4H9.4A1.4 1.4 0 0 1 6.6 13.4Z',
  yellow: 'M8 1.2L9.9 5.9L14.8 6.2L11 9.4L12.2 14.3L8 11.6L3.8 14.3L5 9.4L1.2 6.2L6.1 5.9Z',
  purple: 'M3.5 1.8H12.5V4.2L9.2 8L12.5 11.8V14.2H3.5V11.8L6.8 8L3.5 4.2Z',
  white: 'M8 1.5L13.6 4.75V11.25L8 14.5L2.4 11.25V4.75Z',
};
const NAMES = { gold: 'gold', red: 'red', blue: 'blue', green: 'green', magenta: 'magenta', silver: 'silver', yellow: 'yellow', purple: 'purple', white: 'white' };

/** One resource as its shape in its color. */
export function ResourceGlyph({ r, size = 16, n = null }) {
  const label = n == null ? NAMES[r] || r : `${n} ${NAMES[r] || r}`;
  return (
    <svg className="res-glyph" viewBox="0 0 16 16" width={size} height={size} role="img" aria-label={label}>
      <title>{label}</title>
      <path d={SHAPES[r] || SHAPES.gold} fill={`var(--q-${r}, var(--${r}))`} stroke="var(--paper-ink, #1c1410)" strokeWidth="1.1" strokeLinejoin="round" />
      {r === 'gold' && <path d="M8 4.2a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6Z" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="1" />}
    </svg>
  );
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
      {label && <b className="num">{n}</b>}
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
