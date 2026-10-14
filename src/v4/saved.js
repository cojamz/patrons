// Reload-proofing. Local games save their state and setup on every change; online games remember the room and
// your player id so a reload rejoins your seat. Everything is wrapped: storage can be missing or full.
const LOCAL = 'patrons.v4.local';
const ONLINE = 'patrons.v4.online';

// Local games live in localStorage (resume from any later visit). Online seats live in sessionStorage: a reload of
// this tab rejoins, but a second tab is a second person, not a copy of you.
const store = k => (k === ONLINE ? globalThis.sessionStorage : globalThis.localStorage);
const read = k => { try { return JSON.parse(store(k).getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { if (v == null) store(k).removeItem(k); else store(k).setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

/** { config, state, undo, savedAt } or null. `undo` is the session's undo checkpoint, if any. Finished games aren't kept. */
export const loadLocal = () => { const v = read(LOCAL); return v && v.state && !v.state.over ? v : null; };
export const saveLocal = (config, state, undo = null) => write(LOCAL, state && !state.over ? { config, state, undo, savedAt: Date.now() } : null);
export const clearLocal = () => write(LOCAL, null);

/** { code, playerId, transport } or null. */
export const loadOnline = () => read(ONLINE);
export const saveOnline = v => write(ONLINE, v);
export const clearOnline = () => write(ONLINE, null);
