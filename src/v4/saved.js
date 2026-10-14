// Reload-proofing. Local games save their state and setup on every change; online games remember the room and
// your player id so a reload rejoins your seat. Everything is wrapped: storage can be missing or full.
import { stateProblem, gameRecord } from './session/record.js';

const LOCAL = 'patrons.v4.local';
const ONLINE = 'patrons.v4.online';
// A save this build can't resume, set aside so its game record can still be copied (see loadLocal).
const STALE = 'patrons.v4.stale';

// Local games live in localStorage (resume from any later visit). Online seats live in sessionStorage: a reload of
// this tab rejoins, but a second tab is a second person, not a copy of you.
const store = k => (k === ONLINE ? globalThis.sessionStorage : globalThis.localStorage);
const read = k => { try { return JSON.parse(store(k).getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { if (v == null) store(k).removeItem(k); else store(k).setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

// The table at the start of the current round, kept by the game screen (round-card baseline). It doubles as the
// fallback Resume if the main save is ever missing.
export const ROUND_START = 'patrons.v4.roundStart';

/**
 * { config, state, undo, savedAt } or null. `undo` is the session's undo checkpoint, if any.
 * A finished game stays saved until its results have been on screen (finishLocal), so a reload in the last
 * moments of a game (bots still shopping, the final scoring) reopens it. With no save, the round-start
 * snapshot is offered instead ({ fromRoundStart: true }).
 */
export const loadLocal = () => {
  const v = read(LOCAL);
  if (v && v.state && v.state.players) return usable(v);
  const rs = read(ROUND_START);
  if (rs && rs.state && rs.state.players && !rs.state.over) return usable({ config: null, state: rs.state, undo: null, savedAt: null, fromRoundStart: true });
  return null;
};
// Saves outlive the code that made them (every deploy can change cards). A save from other rules content, or one the
// engine can't read, is never returned (so never auto-resumed into a crash): it's set aside under STALE and the home
// screen says "saved on an older version: start fresh" (Recovery.jsx), with its game record still copyable.
function usable(v) {
  const problem = stateProblem(v.state); // never throws: engine calls inside are wrapped
  if (!problem) return v;
  setAside(v, problem.kind, problem.message);
  return null;
}
function setAside(v, reason, message) {
  write(STALE, { state: v.state, config: v.config ?? null, savedAt: v.savedAt ?? null, reason, message, at: Date.now(), seen: reason === 'crash' });
  write(LOCAL, null);
  write(ROUND_START, null);
}
/** The error screen's "Start a new game": set the current save aside (record kept) so nothing resumes into the crash. */
export const setAsideLocal = (message = '') => {
  const v = read(LOCAL) || read(ROUND_START);
  if (v && v.state && v.state.players) setAside(v, 'crash', message); else clearLocal();
};
/** The save set aside, or null: { state, config, savedAt, reason: 'version'|'broken'|'crash', message, at, seen }. */
export const staleSave = () => { const v = read(STALE); return v && v.state ? v : null; };
/** The player has seen the "older version" notice. */
export const markStaleSeen = () => { const v = read(STALE); if (v) write(STALE, { ...v, seen: true }); };
/** The set-aside game as a record: its moves (if it kept them) plus the saved snapshot. */
export const staleRecord = () => {
  const v = staleSave();
  return v ? gameRecord(v.state, { state: v.state, setAside: { reason: v.reason, message: v.message, at: v.at, savedAt: v.savedAt } }) : null;
};
export const saveLocal = (config, state, undo = null) => { if (state) write(LOCAL, { config, state, undo, savedAt: Date.now() }); };
/** Starting over or leaving: forget the saved game and its round-start snapshot. */
export const clearLocal = () => { write(LOCAL, null); write(ROUND_START, null); };
/** The results screen has rendered: the game is done, nothing left to resume. */
export const finishLocal = clearLocal;

/** { code, playerId, transport } or null. */
export const loadOnline = () => read(ONLINE);
export const saveOnline = v => write(ONLINE, v);
export const clearOnline = () => write(ONLINE, null);

// Rooms this device has sat in: { [code]: { ids: [playerId…], at } }, in localStorage (sessionStorage dies with the tab).
// A reopened invite link or a closed-then-reopened tab passes these ids to joinRoom (knownIds) and gets the seat back.
// Several ids per room: two tabs of one browser are two people (tests, a shared laptop). Kept 12 h, at most 12 rooms.
const ROOMS = 'patrons.v4.rooms';
const ROOM_TTL = 12 * 3600e3;
const rooms = () => { const v = read(ROOMS); return v && typeof v === 'object' ? v : {}; };
export const rememberRoom = (code, playerId) => {
  if (!code || !playerId) return;
  const all = rooms();
  const cur = all[code] || { ids: [] };
  all[code] = { ids: [...cur.ids.filter(id => id !== playerId), playerId].slice(-4), at: Date.now() };
  const keep = Object.entries(all).filter(([, v]) => v && Date.now() - (v.at || 0) < ROOM_TTL).sort((a, b) => b[1].at - a[1].at).slice(0, 12);
  write(ROOMS, Object.fromEntries(keep));
};
/** Player ids this device used in room `code` (most recent last); [] if none. */
export const roomIds = code => {
  const v = rooms()[String(code || '').toUpperCase()];
  return v && Date.now() - (v.at || 0) < ROOM_TTL && Array.isArray(v.ids) ? [...v.ids] : [];
};
