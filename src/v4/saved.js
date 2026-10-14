// Reload-proofing. Local games save their state and setup on every change; online games remember the room and
// your player id so a reload rejoins your seat. Everything is wrapped: storage can be missing or full.
const LOCAL = 'patrons.v4.local';
const ONLINE = 'patrons.v4.online';

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
  if (v && v.state && v.state.players) return v;
  const rs = read(ROUND_START);
  if (rs && rs.state && rs.state.players && !rs.state.over) return { config: null, state: rs.state, undo: null, savedAt: null, fromRoundStart: true };
  return null;
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
