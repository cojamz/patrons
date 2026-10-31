// Reload-proofing. Local games save their state and setup on every change; online games remember the room and
// your player id so a reload rejoins your seat. Everything is wrapped: storage can be missing or full.
import { stateProblem, gameRecord, CONTENT_HASH } from './session/record.js';
import { createTabLease, OWNER_CHANNEL } from './session/owner.js';

const LOCAL = 'patrons.v4.local';
const ONLINE = 'patrons.v4.online';
// A save this build can't resume, set aside so its game record can still be copied (see loadLocal).
const STALE = 'patrons.v4.stale';
// The last finished local game, kept after its results have been on screen so a reload (or home's "Last game's
// results") shows them again; dropped when a new local game starts.
const LAST = 'patrons.v4.last';

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
  flushLocalSave(); // a save still waiting for idle time lands first: a read always sees the latest move
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
  // This exact release changes only Snap Up/Night Owl descriptions in the engine sources.
  // Preserve local games from its immediate predecessor; never extend this to other rule hashes.
  if (CONTENT_HASH === '22q53nl0l4m.3601c69be7' && v.state.build?.content === '22q53nl0l4m.4cc3239e30') {
    v = { ...v, state: { ...v.state, build: { ...v.state.build, content: CONTENT_HASH } } };
  }
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
  flushLocalSave();
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
// ---------- one tab owns the local game (session/owner.js) ----------
let lease = null;
/** This page's claim on the local game (created on first use: BroadcastChannel, with the storage event as fallback). */
export function localLease() {
  if (lease) return lease;
  let channel = null;
  try { if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(OWNER_CHANNEL); } catch { channel = null; }
  try { channel?.unref?.(); } catch { /* Node (tests) only: an open channel must not keep the process alive */ }
  lease = createTabLease({ storage: globalThis.localStorage, channel, events: typeof window !== 'undefined' ? window : null });
  return lease;
}
/** This tab takes the local game: any other tab holding it stops and says so. Call before reading the save to resume it. */
export const claimLocal = () => {
  // a save waiting from before another tab took the game is stale: it never lands over that tab's moves
  if (ownsLocal()) flushLocalSave(); else dropLocalSave();
  return localLease().claim();
};
/** May this tab write the local game? False once another tab has claimed it. */
export const ownsLocal = () => { try { return localLease().owns(); } catch { return true; } };
/** fn() runs when another tab takes the game from this one. Returns an unsubscribe. */
export const onLocalLost = fn => localLease().onLost(fn);
/** The game here is done (results on screen): stop holding it. */
export const releaseLocal = () => localLease().release();

/**
 * Saves the game, unless another tab owns it (a stale tab must never overwrite the owner's save). `hold` is the
 * session's round-end hold ({ moves } while the round summary is waiting to be dismissed), so a reload reopens it.
 * Returns whether it wrote.
 */
export const saveLocal = (config, state, undo = null, hold = null) => {
  if (!state || !ownsLocal()) return false;
  write(LOCAL, { config, state, undo, ...(hold ? { hold } : {}), savedAt: Date.now() });
  return true;
};
/**
 * The save off the input path (perf, 2026-10-15): writing the whole game to localStorage inside every click cost the
 * click's frame. Each change asks for a save; only the latest is written, in idle time (requestIdleCallback, at most
 * SAVE_IDLE_MS later; a timer where there is none). The guarantees hold: leaving the page (pagehide, or the tab hidden)
 * writes it at once, a read (loadLocal) writes it first, clearing or finishing drops it, and the write itself goes
 * through saveLocal, so a tab that has lost the game by then never overwrites the owner's save.
 */
export const SAVE_IDLE_MS = 400;
let pendingSave = null, saveTimer = null, saveIdle = null, flushHooked = false;
const cancelSave = () => {
  if (saveIdle != null && typeof cancelIdleCallback === 'function') cancelIdleCallback(saveIdle);
  clearTimeout(saveTimer);
  saveIdle = null; saveTimer = null;
};
/** Writes the waiting save now, if any. Returns whether it wrote. */
export function flushLocalSave() {
  cancelSave();
  const v = pendingSave;
  pendingSave = null;
  return v ? saveLocal(v.config, v.state, v.undo, v.hold) : false;
}
/** Drops the waiting save, unwritten. */
export const dropLocalSave = () => { cancelSave(); pendingSave = null; };
/** Saves the game soon (see above): the latest call wins. */
export function saveLocalSoon(config, state, undo = null, hold = null) {
  if (!state) return;
  pendingSave = { config, state, undo, hold };
  if (!flushHooked && typeof addEventListener === 'function') {
    flushHooked = true;
    addEventListener('pagehide', flushLocalSave);
    addEventListener('visibilitychange', () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushLocalSave(); });
  }
  if (saveIdle != null || saveTimer != null) return;
  if (typeof requestIdleCallback === 'function') saveIdle = requestIdleCallback(() => { saveIdle = null; flushLocalSave(); }, { timeout: SAVE_IDLE_MS });
  else saveTimer = setTimeout(() => { saveTimer = null; flushLocalSave(); }, 0);
}
/** Starting over or leaving: forget the saved game and its round-start snapshot (only the owning tab may). */
export const clearLocal = () => { if (!ownsLocal()) return; dropLocalSave(); write(LOCAL, null); write(ROUND_START, null); };
/**
 * The results screen has rendered: the game is done, nothing left to resume. Given the finished state, it's kept as
 * the last game (results and record) until a new game starts.
 */
export const finishLocal = (config = null, state = null) => {
  if (!ownsLocal()) return;
  dropLocalSave(); // a save still waiting must not bring the finished game back as a "resume"
  if (state && state.over && Array.isArray(state.players)) write(LAST, { config, state, finishedAt: Date.now() });
  clearLocal();
};
/** The last finished game, { config, state, finishedAt }, or null (none, or saved by other rules content). */
export const loadLast = () => {
  const v = read(LAST);
  if (!v || !v.state || !v.state.over || !Array.isArray(v.state.players)) return null;
  return stateProblem(v.state) ? null : v;
};
/** A new local game has started: the last game's results are no longer offered. */
export const clearLast = () => write(LAST, null);

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
/** The room this device sat in most recently, if within `ms` (default 3 h): its code, else ''. */
export const lastRoomCode = (ms = 3 * 3600e3) => {
  const [best] = Object.entries(rooms()).filter(([, v]) => v && Date.now() - (v.at || 0) < ms).sort((a, b) => b[1].at - a[1].at);
  return best ? best[0] : '';
};
/** Player ids this device used in room `code` (most recent last); [] if none. */
export const roomIds = code => {
  const v = rooms()[String(code || '').toUpperCase()];
  return v && Date.now() - (v.at || 0) < ROOM_TTL && Array.isArray(v.ids) ? [...v.ids] : [];
};
