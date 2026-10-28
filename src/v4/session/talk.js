// Table talk: the quick lines and typed words players throw at each other (Cory, 2026-10-28 playtest: "there needs to be
// ability to emote or a chat to shittalk"). Never part of the game state: nothing here can change a move.
import { createEmitter } from './emitter.js';

export const TALK_MAX = 80; // a bubble, not a letter
export const TALK_KEEP = 200; // what a table remembers for the log
export const TALK_GAP_MS = 700; // one line at a time per player
// (Claude's fill-ins, not yet approved: Cory asked for more than six)
export const QUICK_LINES = [
  'Blessings', 'Thanks', 'Well played', 'Oops',
  'Heretic!', 'The end is near', 'Repent!', 'Mine now',
  'Not my minion!', 'Nice try', 'Bow down', 'Pray for me',
];

/** Squeezes spaces and trims to TALK_MAX; '' when there's nothing to say. */
export function cleanTalk(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, TALK_MAX);
}

/** The talk a session keeps: every line in order, and who wants to hear the next. */
export function createTalkLog() {
  const list = [];
  const seen = new Set();
  const subs = createEmitter();
  return {
    get list() { return list; },
    add(entry) {
      if (!entry || seen.has(entry.id)) return;
      seen.add(entry.id);
      list.push(entry);
      if (list.length > TALK_KEEP) list.splice(0, list.length - TALK_KEEP);
      subs.emit(entry);
    },
    on: fn => subs.on(fn),
    clear: () => subs.clear(),
  };
}
