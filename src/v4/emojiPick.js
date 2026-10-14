// Who wears which emoji (Cory, 2026-10-14): each player picks one of the 20 pixel emojis, one per table. Bots and
// anyone who hasn't picked get a random free one, so nobody is ever blocked. People outrank bots: a bot gives its
// emoji up to a person who wants it and takes another. Pure functions, shared by local setup and online rooms.
import { emojiIds } from './art/emojis.js';

/** The emoji ids nobody in `taken` holds, in picker order. */
export function freeEmojis(taken = [], ids = emojiIds()) {
  const held = new Set(taken.filter(Boolean));
  return ids.filter(id => !held.has(id));
}

/** A random emoji id nobody in `taken` holds (rand returns [0, 1)), or null when every one is taken. */
export function randomFreeEmoji(taken = [], rand = Math.random, ids = emojiIds()) {
  const free = freeEmojis(taken, ids);
  return free.length ? free[Math.min(free.length - 1, Math.floor(rand() * free.length))] : null;
}

/**
 * Every seat ends up with an emoji and no two share one. People keep their pick, the lower seat winning a clash;
 * bots keep theirs unless a person holds it; everyone else gets a random free one. Seats of kind 'empty' are left
 * as they are. Returns new seat objects in the same order.
 * @param {{ kind?: string, emoji?: string }[]} seats
 */
export function settleEmojis(seats, rand = Math.random) {
  const out = seats.map(s => ({ ...s }));
  const held = new Set();
  const keep = s => { if (s.emoji && !held.has(s.emoji)) held.add(s.emoji); else delete s.emoji; };
  out.forEach(s => { if (s.kind !== 'empty' && s.kind !== 'bot') keep(s); });
  out.forEach(s => { if (s.kind === 'bot') keep(s); });
  out.forEach(s => {
    if (s.kind === 'empty' || s.emoji) return;
    const e = randomFreeEmoji([...held], rand);
    if (e) { s.emoji = e; held.add(e); }
  });
  return out;
}

/**
 * Seat `i` takes emoji `id` (a person's pick). A bot holding it takes a random free one instead; a person holding
 * it keeps it (the pick is refused: returns null). Returns the new seats.
 */
export function takeEmoji(seats, i, id, rand = Math.random) {
  const other = seats.findIndex((s, k) => k !== i && s.kind !== 'empty' && s.emoji === id);
  if (other >= 0 && seats[other].kind !== 'bot') return null;
  const out = seats.map((s, k) => (k === i ? { ...s, emoji: id } : { ...s }));
  if (other >= 0) out[other].emoji = randomFreeEmoji(out.filter(s => s.kind !== 'empty').map(s => s.emoji), rand) || undefined;
  return out;
}

const KEY = 'patrons.emoji';
/** The emoji this browser picked last (offered first next time), or ''. */
export const lastEmoji = () => { try { const v = localStorage.getItem(KEY) || ''; return emojiIds().includes(v) ? v : ''; } catch { return ''; } };
export const rememberEmoji = id => { try { if (id) localStorage.setItem(KEY, id); } catch { /* private mode */ } };
